import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HiringReport } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        username: true,
        createdAt: true,
        report: true,
      },
    });

    const simplifiedAnalyses = analyses.map((analysis: typeof analyses[number]) => {
      const report = analysis.report as unknown as HiringReport;
      return {
        id: analysis.id,
        username: analysis.username,
        displayName: report.profile.displayName || report.profile.username,
        headline: report.profile.headline,
        verdict: report.hiringRecommendation.verdict,
        overallScore: report.scores.overall,
        web3Score: report.scores.web3,
        createdAt: analysis.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      analyses: simplifiedAnalyses,
      total: simplifiedAnalyses.length,
    });
  } catch (error: any) {
    console.error('History API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch history',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
