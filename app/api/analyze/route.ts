import { NextRequest, NextResponse } from 'next/server';
import { parseGitHubUsername } from '@/lib/utils';
import { fetchGitHubSummary, detectWeb3 } from '@/lib/github';
import { generateHiringReport, buildAnalysisPayload } from '@/lib/openai';
import { reportCache, rateLimiter, getClientIdentifier } from '@/lib/cache';
import { validateEnv } from '@/lib/env';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    validateEnv();

    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = rateLimiter.check(clientId);

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetAt);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again after ${resetDate.toLocaleTimeString()}`,
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { profileUrl } = body;

    if (!profileUrl || typeof profileUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'profileUrl is required' },
        { status: 400 }
      );
    }

    // Extract username
    const username = parseGitHubUsername(profileUrl);
    if (!username) {
      return NextResponse.json(
        {
          error: 'Invalid GitHub URL',
          message: 'Could not extract username from the provided URL',
        },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `report:${username.toLowerCase()}`;
    const cachedReport = reportCache.get(cacheKey);

    if (cachedReport) {
      return NextResponse.json(
        {
          report: cachedReport,
          cached: true,
          username,
        },
        {
          headers: {
            'X-Cache': 'HIT',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          },
        }
      );
    }

    // Fetch GitHub data
    let githubSummary;
    try {
      githubSummary = await fetchGitHubSummary(username);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          {
            error: 'User not found',
            message: `GitHub user "${username}" does not exist`,
          },
          { status: 404 }
        );
      }

      if (error.statusCode === 403) {
        return NextResponse.json(
          {
            error: 'GitHub API rate limit',
            message:
              'GitHub API rate limit exceeded. Please try again later or use a different GitHub token.',
          },
          { status: 503 }
        );
      }

      throw error;
    }

    // Build analysis payload
    const repos = githubSummary.repos.map((repo) => ({
      repo,
      content: githubSummary.repoContents.get(repo.name) || null,
      web3Detection: detectWeb3(
        repo,
        githubSummary.repoContents.get(repo.name) || null
      ),
    }));

    const analysisPayload = buildAnalysisPayload({
      profile: githubSummary.profile,
      repos,
    });

    // Generate hiring report with OpenAI
    let report;
    try {
      report = await generateHiringReport(analysisPayload);
    } catch (error: any) {
      console.error('OpenAI error:', error);
      return NextResponse.json(
        {
          error: 'Analysis failed',
          message: 'Failed to generate hiring report. Please try again.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Cache the report
    reportCache.set(cacheKey, report);

    // Save to database
    let analysisId: string | undefined;
    try {
      const analysis = await prisma.analysis.create({
        data: {
          username: username.toLowerCase(),
          profileUrl,
          report: report as any,
          rawData: {
            profile: githubSummary.profile,
            repos: githubSummary.repos,
            activitySignals: githubSummary.activitySignals,
            web3Stats: githubSummary.web3Stats,
          } as any,
        },
      });
      analysisId = analysis.id;
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Continue even if database save fails
    }

    return NextResponse.json(
      {
        report,
        cached: false,
        username,
        analysisId,
        raw: {
          profileSummary: {
            username: githubSummary.profile.login,
            name: githubSummary.profile.name,
            bio: githubSummary.profile.bio,
            location: githubSummary.profile.location,
            publicRepos: githubSummary.profile.publicRepos,
            followers: githubSummary.profile.followers,
          },
          stats: githubSummary.activitySignals,
          web3Stats: githubSummary.web3Stats,
        },
      },
      {
        headers: {
          'X-Cache': 'MISS',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error: any) {
    console.error('API Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
