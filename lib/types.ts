// Type definitions for the GitHub Talent Analyzer

export type TestingCILevel = "strong" | "some" | "none" | "unknown";

export type RepoImportance = "high" | "medium" | "low";

export type HiringVerdict = "STRONG_YES" | "YES" | "MAYBE" | "NO";

export type RoleFitType =
  | "Web3 Frontend"
  | "Solidity"
  | "Full-stack Web3"
  | "Backend"
  | "DevOps"
  | "Generalist";

export interface HiringReport {
  profile: {
    username: string;
    displayName?: string;
    headline: string;
    quickSummary: string;
  };
  scores: {
    overall: number; // 0-100
    engineering: number; // 0-100
    web3: number; // 0-100
    consistency: number; // 0-100
    maintainability: number; // 0-100
    risk: number; // 0-100 (higher = more risk)
    confidence: number; // 0-100 (how confident the evaluation is)
  };
  web3Assessment: {
    web3RepoCount: number;
    keyStacks: string[];
    notableWeb3Repos: Array<{
      name: string;
      reason: string;
      stack: string[];
      evidence: string[];
    }>;
  };
  engineeringAssessment: {
    strengths: string[];
    weaknesses: string[];
    codeQualitySignals: string[];
    testingAndCI: {
      testsPresent: TestingCILevel;
      ciPresent: TestingCILevel;
      notes: string[];
    };
  };
  repoInsights: Array<{
    name: string;
    importance: RepoImportance;
    summary: string;
    signals: string[];
    redFlags: string[];
  }>;
  hiringRecommendation: {
    verdict: HiringVerdict;
    rationale: string[];
    roleFit: Array<{
      role: RoleFitType;
      fitScore: number;
      notes: string[];
    }>;
  };
  interviewPlan: {
    focusAreas: string[];
    questions: Array<{
      category: string;
      question: string;
      whyThisQuestion: string;
      expectedGoodAnswerSignals: string[];
    }>;
    takeHomeTaskIdeas: string[];
  };
  dueDiligence: {
    thingsToVerify: string[];
    missingInfo: string[];
  };
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  htmlUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepo {
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  topics: string[];
  language: string | null;
  languages: Record<string, number>;
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  defaultBranch: string;
  license: string | null;
  pushedAt: string;
  createdAt: string;
  updatedAt: string;
  size: number;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  isTemplate: boolean;
  visibility: string;
}

export interface RepoContent {
  readme: string | null;
  packageJson: any | null;
  hasTests: boolean;
  hasCI: boolean;
  hasLintConfig: boolean;
  hasSolidityContracts: boolean;
  web3Frameworks: string[];
}

export interface Web3Detection {
  isWeb3: boolean;
  detectedStacks: string[];
  confidence: "high" | "medium" | "low";
  evidence: string[];
}

export interface GitHubSummary {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  repoContents: Map<string, RepoContent>;
  web3Stats: {
    web3RepoCount: number;
    web3Ratio: number;
    detectedRepos: Array<{
      name: string;
      detection: Web3Detection;
    }>;
  };
  activitySignals: {
    recencyScore: number;
    consistencyScore: number;
    totalStars: number;
    totalForks: number;
    avgRepoAge: number;
  };
}

export interface AnalysisPayload {
  profile: GitHubProfile;
  repos: Array<{
    repo: GitHubRepo;
    content: RepoContent | null;
    web3Detection: Web3Detection | null;
  }>;
  aggregateStats: {
    totalStars: number;
    totalForks: number;
    totalRepos: number;
    languageBreakdown: Record<string, number>;
    topicsBreakdown: Record<string, number>;
    web3RepoCount: number;
    web3Ratio: number;
    recencyScore: number;
    consistencyScore: number;
    avgRepoAge: number;
  };
}
