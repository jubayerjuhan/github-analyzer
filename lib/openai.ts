import OpenAI from 'openai';
import { getEnv } from './env';
import { HiringReport, AnalysisPayload } from './types';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const env = getEnv();
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

const HIRING_REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    profile: {
      type: 'object',
      additionalProperties: false,
      properties: {
        username: { type: 'string' },
        displayName: { type: 'string' },
        headline: { type: 'string' },
        quickSummary: { type: 'string' },
      },
      required: ['username', 'displayName', 'headline', 'quickSummary'],
    },
    scores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        overall: { type: 'number', minimum: 0, maximum: 100 },
        engineering: { type: 'number', minimum: 0, maximum: 100 },
        web3: { type: 'number', minimum: 0, maximum: 100 },
        consistency: { type: 'number', minimum: 0, maximum: 100 },
        maintainability: { type: 'number', minimum: 0, maximum: 100 },
        risk: { type: 'number', minimum: 0, maximum: 100 },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
      },
      required: [
        'overall',
        'engineering',
        'web3',
        'consistency',
        'maintainability',
        'risk',
        'confidence',
      ],
    },
    web3Assessment: {
      type: 'object',
      additionalProperties: false,
      properties: {
        web3RepoCount: { type: 'number' },
        keyStacks: { type: 'array', items: { type: 'string' } },
        notableWeb3Repos: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              reason: { type: 'string' },
              stack: { type: 'array', items: { type: 'string' } },
              evidence: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'reason', 'stack', 'evidence'],
          },
        },
      },
      required: ['web3RepoCount', 'keyStacks', 'notableWeb3Repos'],
    },
    engineeringAssessment: {
      type: 'object',
      additionalProperties: false,
      properties: {
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        codeQualitySignals: { type: 'array', items: { type: 'string' } },
        testingAndCI: {
          type: 'object',
          additionalProperties: false,
          properties: {
            testsPresent: {
              type: 'string',
              enum: ['strong', 'some', 'none', 'unknown'],
            },
            ciPresent: {
              type: 'string',
              enum: ['strong', 'some', 'none', 'unknown'],
            },
            notes: { type: 'array', items: { type: 'string' } },
          },
          required: ['testsPresent', 'ciPresent', 'notes'],
        },
      },
      required: ['strengths', 'weaknesses', 'codeQualitySignals', 'testingAndCI'],
    },
    repoInsights: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          importance: { type: 'string', enum: ['high', 'medium', 'low'] },
          summary: { type: 'string' },
          signals: { type: 'array', items: { type: 'string' } },
          redFlags: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'importance', 'summary', 'signals', 'redFlags'],
      },
    },
    hiringRecommendation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        verdict: {
          type: 'string',
          enum: ['STRONG_YES', 'YES', 'MAYBE', 'NO'],
        },
        rationale: { type: 'array', items: { type: 'string' } },
        roleFit: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              role: {
                type: 'string',
                enum: [
                  'Web3 Frontend',
                  'Solidity',
                  'Full-stack Web3',
                  'Backend',
                  'DevOps',
                  'Generalist',
                ],
              },
              fitScore: { type: 'number', minimum: 0, maximum: 100 },
              notes: { type: 'array', items: { type: 'string' } },
            },
            required: ['role', 'fitScore', 'notes'],
          },
        },
      },
      required: ['verdict', 'rationale', 'roleFit'],
    },
    interviewPlan: {
      type: 'object',
      additionalProperties: false,
      properties: {
        focusAreas: { type: 'array', items: { type: 'string' } },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              category: { type: 'string' },
              question: { type: 'string' },
              whyThisQuestion: { type: 'string' },
              expectedGoodAnswerSignals: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: [
              'category',
              'question',
              'whyThisQuestion',
              'expectedGoodAnswerSignals',
            ],
          },
        },
        takeHomeTaskIdeas: { type: 'array', items: { type: 'string' } },
      },
      required: ['focusAreas', 'questions', 'takeHomeTaskIdeas'],
    },
    dueDiligence: {
      type: 'object',
      additionalProperties: false,
      properties: {
        thingsToVerify: { type: 'array', items: { type: 'string' } },
        missingInfo: { type: 'array', items: { type: 'string' } },
      },
      required: ['thingsToVerify', 'missingInfo'],
    },
  },
  required: [
    'profile',
    'scores',
    'web3Assessment',
    'engineeringAssessment',
    'repoInsights',
    'hiringRecommendation',
    'interviewPlan',
    'dueDiligence',
  ],
};

function buildPrompt(payload: AnalysisPayload): string {
  return `You are a senior technical recruiter for GoodHive, a Web3 talent marketplace. Analyze the following GitHub profile data and generate a comprehensive hiring report.

PROFILE DATA:
${JSON.stringify(payload, null, 2)}

ANALYSIS INSTRUCTIONS:
1. You must ONLY use the provided GitHub data. Do not hallucinate or invent information.
2. If evidence is missing or insufficient, explicitly state "unknown" and reduce confidence scores.
3. Provide concrete evidence for all claims (cite topics, filenames, README content, package.json deps).
4. Assess Web3 relevance based on: topics, Solidity code, web3 frameworks (Hardhat, Foundry, ethers, wagmi, etc.), smart contract presence, DeFi/NFT projects.
5. Assess engineering quality based on: code structure, testing practices, CI/CD, documentation, TypeScript usage, linting, repo maintenance.
6. Identify red flags: low activity, plagiarized content, auto-generated repos, spam projects, abandoned repos.
7. Be professional and factual. Avoid defamatory language.
8. Tailor interview questions to the candidate's actual work and repos.

SCORING GUIDELINES:
- Overall: Holistic assessment (0-100)
- Engineering: Code quality, testing, structure (0-100)
- Web3: Web3 knowledge and experience (0-100)
- Consistency: Regular activity and contributions (0-100)
- Maintainability: Documentation, structure, best practices (0-100)
- Risk: Higher = more hiring risk due to red flags (0-100)
- Confidence: How confident you are in this evaluation (0-100)

WEB3 DETECTION:
- Count repos with blockchain/web3 technologies
- Identify key stacks: Hardhat, Foundry, Solidity, ethers, wagmi, Solana, etc.
- Note repos with smart contracts or DeFi/NFT focus

ROLE FIT SCORING:
- If there is NO evidence of a technology/skill for a role, the fitScore MUST be 0%
- Do not give "pity points" - be strict and evidence-based
- Examples:
  * No Solidity code = 0% for Solidity role
  * No Web3 technologies = 0% for Web3 roles
  * No CI/CD evidence = 0% for DevOps role
- Only give non-zero scores when there is actual evidence in the repos

HIRING VERDICT:
- STRONG_YES: Exceptional candidate, hire immediately
- YES: Strong candidate, proceed with interview
- MAYBE: Potential but needs verification
- NO: Not a good fit or insufficient signal

INTERVIEW QUESTIONS:
- Generate 6-10 specific, tailored interview questions based on the candidate's actual work
- Cover multiple categories: Technical Skills, Architecture/Design, Problem Solving, Web3 Knowledge (if applicable), Best Practices, Project Experience
- Questions should be directly related to technologies and projects found in their repos
- For each question, explain why it's important and what good answer signals to look for
- Make questions specific, not generic (e.g., "How did you implement X in your Y project?" not "Tell me about X")
- Include at least 2-3 questions that dig into their most impressive/relevant repositories

TAKE-HOME TASKS:
- Suggest 2-4 take-home task ideas that match the candidate's skill level and experience
- Tasks should be relevant to their demonstrated expertise
- Include a mix of difficulty levels if appropriate

Generate a structured hiring report following the exact schema provided.`;
}

export async function generateHiringReport(
  payload: AnalysisPayload
): Promise<HiringReport> {
  const client = getOpenAIClient();
  const env = getEnv();

  const prompt = buildPrompt(payload);

  try {
    const completion = await client.chat.completions.create({
      model: env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a technical recruiter specializing in Web3 and blockchain development. Generate structured hiring reports in valid JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'hiring_report',
          strict: true,
          schema: HIRING_REPORT_SCHEMA,
        },
      },
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const report = JSON.parse(content) as HiringReport;
    return report;
  } catch (error) {
    if (error instanceof Error) {
      console.error('OpenAI API Error:', error.message);
      throw new Error(`Failed to generate hiring report: ${error.message}`);
    }
    throw error;
  }
}

export function buildAnalysisPayload(payload: {
  profile: any;
  repos: Array<{ repo: any; content: any; web3Detection: any }>;
}): AnalysisPayload {
  const { profile, repos } = payload;

  let totalStars = 0;
  let totalForks = 0;
  const languageBreakdown: Record<string, number> = {};
  const topicsBreakdown: Record<string, number> = {};
  let web3RepoCount = 0;

  for (const { repo, web3Detection } of repos) {
    totalStars += repo.stargazersCount || 0;
    totalForks += repo.forksCount || 0;

    // Language breakdown
    if (repo.languages) {
      for (const [lang, bytes] of Object.entries(repo.languages)) {
        languageBreakdown[lang] = (languageBreakdown[lang] || 0) + (bytes as number);
      }
    }

    // Topics breakdown
    if (repo.topics) {
      for (const topic of repo.topics) {
        topicsBreakdown[topic] = (topicsBreakdown[topic] || 0) + 1;
      }
    }

    if (web3Detection?.isWeb3) {
      web3RepoCount++;
    }
  }

  const totalRepos = repos.length;
  const web3Ratio = totalRepos > 0 ? web3RepoCount / totalRepos : 0;

  // Calculate recency and consistency scores
  const repoPushDates = repos.map((r) => r.repo.pushedAt).filter(Boolean);
  const repoUpdateDates = repos.map((r) => ({
    updatedAt: r.repo.updatedAt,
    createdAt: r.repo.createdAt,
  }));

  const now = Date.now();
  let recencyScore = 0;
  if (repoPushDates.length > 0) {
    const avgDaysSinceLastPush =
      repoPushDates.reduce((sum, date) => {
        const daysSince = (now - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
        return sum + daysSince;
      }, 0) / repoPushDates.length;

    if (avgDaysSinceLastPush < 30) recencyScore = 100;
    else if (avgDaysSinceLastPush < 90) recencyScore = 80;
    else if (avgDaysSinceLastPush < 180) recencyScore = 60;
    else if (avgDaysSinceLastPush < 365) recencyScore = 40;
    else recencyScore = 20;
  }

  let consistencyScore = 50;
  if (repoUpdateDates.length > 1) {
    const updates = repoUpdateDates
      .map((r) => new Date(r.updatedAt).getTime())
      .sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < updates.length; i++) {
      gaps.push(updates[i] - updates[i - 1]);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance =
      gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgGap;
    consistencyScore = Math.max(0, Math.round(100 - cv * 50));
  }

  const avgRepoAge =
    repoUpdateDates.length > 0
      ? repoUpdateDates.reduce((sum, r) => {
          const age = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + age;
        }, 0) / repoUpdateDates.length
      : 0;

  return {
    profile,
    repos,
    aggregateStats: {
      totalStars,
      totalForks,
      totalRepos,
      languageBreakdown,
      topicsBreakdown,
      web3RepoCount,
      web3Ratio,
      recencyScore,
      consistencyScore,
      avgRepoAge: Math.round(avgRepoAge),
    },
  };
}
