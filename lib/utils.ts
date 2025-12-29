import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseGitHubUsername(url: string): string | null {
  // Clean the input
  const cleaned = url.trim();

  // Direct username
  if (!cleaned.includes('/') && !cleaned.includes('.')) {
    return cleaned;
  }

  // Full URL patterns
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/?$/,
    /^github\.com\/([^\/]+)\/?$/,
    /^www\.github\.com\/([^\/]+)\/?$/,
    /^https?:\/\/www\.github\.com\/([^\/]+)\/?$/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function calculateRecencyScore(repos: Array<{ pushedAt: string }>): number {
  if (repos.length === 0) return 0;

  const now = Date.now();
  const scores = repos.map((repo) => {
    const pushedAt = new Date(repo.pushedAt).getTime();
    const daysSince = (now - pushedAt) / (1000 * 60 * 60 * 24);

    // Score decays over time
    if (daysSince < 30) return 100;
    if (daysSince < 90) return 80;
    if (daysSince < 180) return 60;
    if (daysSince < 365) return 40;
    if (daysSince < 730) return 20;
    return 10;
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function calculateConsistencyScore(repos: Array<{ updatedAt: string; createdAt: string }>): number {
  if (repos.length === 0) return 0;

  const updates = repos.map((repo) => new Date(repo.updatedAt).getTime());
  const sorted = updates.sort((a, b) => a - b);

  if (sorted.length < 2) return 50;

  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1]);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);

  // Lower standard deviation = more consistent
  const coefficientOfVariation = stdDev / avgGap;
  const score = Math.max(0, 100 - coefficientOfVariation * 50);

  return Math.round(score);
}

export function calculateAvgRepoAge(repos: Array<{ createdAt: string }>): number {
  if (repos.length === 0) return 0;

  const now = Date.now();
  const ages = repos.map((repo) => {
    const createdAt = new Date(repo.createdAt).getTime();
    return (now - createdAt) / (1000 * 60 * 60 * 24);
  });

  return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-blue-100';
  if (score >= 40) return 'bg-yellow-100';
  return 'bg-red-100';
}
