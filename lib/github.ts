import { getEnv } from './env';
import {
  GitHubProfile,
  GitHubRepo,
  RepoContent,
  GitHubSummary,
  Web3Detection,
} from './types';
import {
  calculateRecencyScore,
  calculateConsistencyScore,
  calculateAvgRepoAge,
} from './utils';

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubAPIRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  topics: string[];
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  default_branch: string;
  license: { spdx_id: string } | null;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  size: number;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  is_template: boolean;
  visibility: string;
}

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public rateLimitRemaining?: number
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

async function githubFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const env = getEnv();
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${GITHUB_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
    next: { revalidate: 600 }, // Cache for 10 minutes
  });

  const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');

  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubAPIError('User or resource not found', 404);
    }
    if (response.status === 403) {
      throw new GitHubAPIError(
        'Rate limit exceeded or forbidden',
        403,
        rateLimitRemaining ? parseInt(rateLimitRemaining) : 0
      );
    }
    throw new GitHubAPIError(
      `GitHub API error: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export async function fetchGitHubProfile(
  username: string
): Promise<GitHubProfile> {
  const data = await githubFetch<any>(`/users/${username}`);

  return {
    login: data.login,
    name: data.name,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
    bio: data.bio,
    company: data.company,
    location: data.location,
    blog: data.blog,
    email: data.email,
    followers: data.followers,
    following: data.following,
    publicRepos: data.public_repos,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function fetchGitHubRepos(
  username: string,
  maxRepos: number = 30
): Promise<GitHubRepo[]> {
  const perPage = Math.min(maxRepos, 100);
  const data = await githubFetch<GitHubAPIRepo[]>(
    `/users/${username}/repos?sort=updated&direction=desc&per_page=${perPage}`
  );

  const repos: GitHubRepo[] = [];

  for (const repo of data) {
    // Fetch language breakdown
    let languages: Record<string, number> = {};
    try {
      languages = await githubFetch<Record<string, number>>(
        `/repos/${repo.full_name}/languages`
      );
    } catch (error) {
      console.warn(`Failed to fetch languages for ${repo.full_name}`);
    }

    repos.push({
      name: repo.name,
      fullName: repo.full_name,
      htmlUrl: repo.html_url,
      description: repo.description,
      topics: repo.topics || [],
      language: repo.language,
      languages,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      watchersCount: repo.watchers_count,
      openIssuesCount: repo.open_issues_count,
      defaultBranch: repo.default_branch,
      license: repo.license?.spdx_id || null,
      pushedAt: repo.pushed_at,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      size: repo.size,
      archived: repo.archived,
      disabled: repo.disabled,
      fork: repo.fork,
      hasIssues: repo.has_issues,
      hasProjects: repo.has_projects,
      hasWiki: repo.has_wiki,
      hasPages: repo.has_pages,
      isTemplate: repo.is_template,
      visibility: repo.visibility,
    });
  }

  // Sort by stars and recent activity
  return repos
    .sort((a, b) => {
      const scoreA = a.stargazersCount * 2 + (a.fork ? 0 : 5);
      const scoreB = b.stargazersCount * 2 + (b.fork ? 0 : 5);
      return scoreB - scoreA;
    })
    .slice(0, maxRepos);
}

async function fetchFileContent(
  fullName: string,
  path: string,
  branch: string
): Promise<string | null> {
  try {
    const data = await githubFetch<any>(
      `/repos/${fullName}/contents/${path}?ref=${branch}`
    );

    if (data.content && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
  } catch (error) {
    // File doesn't exist
  }
  return null;
}

async function checkPathExists(
  fullName: string,
  path: string,
  branch: string
): Promise<boolean> {
  try {
    await githubFetch<any>(`/repos/${fullName}/contents/${path}?ref=${branch}`);
    return true;
  } catch (error) {
    return false;
  }
}

export async function fetchRepoContent(
  repo: GitHubRepo
): Promise<RepoContent> {
  const { fullName, defaultBranch } = repo;

  // Fetch README
  let readme: string | null = null;
  for (const filename of ['README.md', 'README.MD', 'readme.md', 'README']) {
    readme = await fetchFileContent(fullName, filename, defaultBranch);
    if (readme) break;
  }

  // Fetch package.json
  const packageJsonContent = await fetchFileContent(
    fullName,
    'package.json',
    defaultBranch
  );
  let packageJson: any = null;
  if (packageJsonContent) {
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch (error) {
      console.warn(`Failed to parse package.json for ${fullName}`);
    }
  }

  // Check for test directories/files
  const hasTests =
    (await checkPathExists(fullName, 'test', defaultBranch)) ||
    (await checkPathExists(fullName, 'tests', defaultBranch)) ||
    (await checkPathExists(fullName, '__tests__', defaultBranch)) ||
    (await checkPathExists(fullName, 'spec', defaultBranch));

  // Check for CI
  const hasCI =
    (await checkPathExists(fullName, '.github/workflows', defaultBranch)) ||
    (await checkPathExists(fullName, '.gitlab-ci.yml', defaultBranch)) ||
    (await checkPathExists(fullName, '.travis.yml', defaultBranch)) ||
    (await checkPathExists(fullName, '.circleci', defaultBranch));

  // Check for lint config
  const hasLintConfig =
    (await checkPathExists(fullName, '.eslintrc.js', defaultBranch)) ||
    (await checkPathExists(fullName, '.eslintrc.json', defaultBranch)) ||
    (await checkPathExists(fullName, '.prettierrc', defaultBranch)) ||
    (await checkPathExists(fullName, 'biome.json', defaultBranch)) ||
    (packageJson?.devDependencies?.eslint !== undefined) ||
    (packageJson?.devDependencies?.prettier !== undefined);

  // Check for Solidity contracts
  const hasSolidityContracts =
    (await checkPathExists(fullName, 'contracts', defaultBranch)) ||
    (await checkPathExists(fullName, 'src', defaultBranch));

  // Detect web3 frameworks
  const web3Frameworks: string[] = [];

  // Check package.json dependencies
  if (packageJson) {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const web3Deps = [
      'hardhat',
      'ethers',
      'web3',
      'wagmi',
      'viem',
      '@openzeppelin/contracts',
      '@thegraph/graph-cli',
      '@solana/web3.js',
      '@project-serum/anchor',
      'near-api-js',
      '@polkadot/api',
      'truffle',
    ];

    for (const dep of web3Deps) {
      if (allDeps[dep]) {
        web3Frameworks.push(dep);
      }
    }
  }

  // Check for framework config files
  const configFiles = [
    { name: 'hardhat.config.js', framework: 'hardhat' },
    { name: 'hardhat.config.ts', framework: 'hardhat' },
    { name: 'foundry.toml', framework: 'foundry' },
    { name: 'truffle-config.js', framework: 'truffle' },
    { name: 'brownie-config.yaml', framework: 'brownie' },
    { name: 'Anchor.toml', framework: 'anchor' },
  ];

  for (const { name, framework } of configFiles) {
    if (await checkPathExists(fullName, name, defaultBranch)) {
      if (!web3Frameworks.includes(framework)) {
        web3Frameworks.push(framework);
      }
    }
  }

  return {
    readme,
    packageJson,
    hasTests,
    hasCI,
    hasLintConfig,
    hasSolidityContracts,
    web3Frameworks,
  };
}

export function detectWeb3(
  repo: GitHubRepo,
  content: RepoContent | null
): Web3Detection {
  const evidence: string[] = [];
  const detectedStacks: string[] = [];

  // Topic-based detection
  const web3Topics = [
    'web3',
    'blockchain',
    'solidity',
    'ethereum',
    'evm',
    'smart-contract',
    'smart-contracts',
    'defi',
    'nft',
    'nfts',
    'wagmi',
    'viem',
    'hardhat',
    'foundry',
    'truffle',
    'thegraph',
    'subgraph',
    'solana',
    'anchor',
    'near',
    'cosmos',
    'substrate',
    'polkadot',
    'web3js',
    'ethers',
    'dapp',
    'dapps',
    'dao',
  ];

  const matchedTopics = repo.topics.filter((topic) =>
    web3Topics.includes(topic.toLowerCase())
  );

  if (matchedTopics.length > 0) {
    evidence.push(`Topics: ${matchedTopics.join(', ')}`);
    detectedStacks.push(...matchedTopics);
  }

  // Content-based detection
  if (content) {
    if (content.web3Frameworks.length > 0) {
      evidence.push(`Frameworks: ${content.web3Frameworks.join(', ')}`);
      detectedStacks.push(...content.web3Frameworks);
    }

    if (content.hasSolidityContracts && repo.language === 'Solidity') {
      evidence.push('Solidity contracts detected');
      detectedStacks.push('solidity');
    }

    // README analysis
    if (content.readme) {
      const readmeLower = content.readme.toLowerCase();
      const web3Keywords = [
        'ethereum',
        'smart contract',
        'blockchain',
        'web3',
        'defi',
        'nft',
        'token',
        'solidity',
        'hardhat',
        'foundry',
        'metamask',
        'wallet',
        'onchain',
        'on-chain',
      ];

      const matchedKeywords = web3Keywords.filter((keyword) =>
        readmeLower.includes(keyword)
      );

      if (matchedKeywords.length > 2) {
        evidence.push(`README contains: ${matchedKeywords.slice(0, 3).join(', ')}`);
      }
    }
  }

  // Language-based detection
  if (repo.language === 'Solidity') {
    evidence.push('Primary language: Solidity');
    detectedStacks.push('solidity');
  }

  const isWeb3 = evidence.length > 0;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (evidence.length >= 3) {
    confidence = 'high';
  } else if (evidence.length >= 2) {
    confidence = 'medium';
  }

  return {
    isWeb3,
    detectedStacks: [...new Set(detectedStacks)],
    confidence,
    evidence,
  };
}

export async function fetchGitHubSummary(
  username: string
): Promise<GitHubSummary> {
  const profile = await fetchGitHubProfile(username);
  const repos = await fetchGitHubRepos(username, 30);

  // Fetch content for top repos (limit to 8 to save rate limits)
  const repoContents = new Map<string, RepoContent>();
  const topRepos = repos
    .filter((r) => !r.fork && !r.archived)
    .slice(0, 8);

  for (const repo of topRepos) {
    try {
      const content = await fetchRepoContent(repo);
      repoContents.set(repo.name, content);
    } catch (error) {
      console.warn(`Failed to fetch content for ${repo.name}`);
    }
  }

  // Web3 detection
  const detectedRepos: Array<{ name: string; detection: Web3Detection }> = [];
  let web3RepoCount = 0;

  for (const repo of repos) {
    const content = repoContents.get(repo.name) || null;
    const detection = detectWeb3(repo, content);

    if (detection.isWeb3) {
      web3RepoCount++;
      detectedRepos.push({ name: repo.name, detection });
    }
  }

  const web3Ratio = repos.length > 0 ? web3RepoCount / repos.length : 0;

  // Activity signals
  const recencyScore = calculateRecencyScore(repos);
  const consistencyScore = calculateConsistencyScore(repos);
  const totalStars = repos.reduce((sum, r) => sum + r.stargazersCount, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forksCount, 0);
  const avgRepoAge = calculateAvgRepoAge(repos);

  return {
    profile,
    repos,
    repoContents,
    web3Stats: {
      web3RepoCount,
      web3Ratio,
      detectedRepos,
    },
    activitySignals: {
      recencyScore,
      consistencyScore,
      totalStars,
      totalForks,
      avgRepoAge,
    },
  };
}
