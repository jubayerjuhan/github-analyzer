'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { parseGitHubUsername } from '@/lib/utils';
import { Github, Search, AlertCircle, Sparkles, Clock, CheckCircle2, XCircle, AlertTriangle, Target, FileCode, MessageSquare } from 'lucide-react';

interface HistoryItem {
  id: string;
  username: string;
  displayName: string;
  headline: string;
  verdict: string;
  overallScore: number;
  web3Score: number;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [profileUrl, setProfileUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');

  const exampleProfiles = [
    'vitalik',
    'bkrem',
    'austintgriffith',
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.analyses || []);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const username = parseGitHubUsername(profileUrl);
    if (!username) {
      setError('Invalid GitHub URL. Please enter a valid GitHub profile link or username.');
      return;
    }

    setLoading(true);
    setLoadingMessage('Analyzing GitHub profile...');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'An error occurred while analyzing the profile');
        setLoading(false);
        return;
      }

      // Navigate to report page
      router.push(`/report/${username}`);
    } catch (err) {
      setError('Failed to analyze profile. Please try again.');
      setLoading(false);
    }
  };

  const handleExampleClick = (username: string) => {
    setProfileUrl(`https://github.com/${username}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Github className="h-14 w-14 mr-3 text-indigo-600" />
              <div className="absolute inset-0 h-14 w-14 mr-3 bg-indigo-400 blur-xl opacity-50"></div>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              GoodHive
            </h1>
          </div>
          <h2 className="text-3xl text-slate-700 mb-4 font-semibold">GitHub Talent Analyzer</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Generate professional hiring reports for Web3 developers. Analyze GitHub profiles to assess engineering quality, Web3 expertise, and code patterns.
          </p>
        </div>

        {/* Main Card */}
        <Card className="max-w-3xl mx-auto shadow-2xl border-0 backdrop-blur-sm bg-white/90 hover:shadow-3xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Analyze a GitHub Profile
            </CardTitle>
            <CardDescription>
              Enter a GitHub profile URL or username to generate a comprehensive hiring report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="https://github.com/username or just username"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[140px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading && (
                <div className="space-y-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl shadow-lg animate-fade-in">
                  {/* Animated spinner */}
                  <div className="flex justify-center">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 border-r-purple-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-2 border-4 border-transparent border-t-purple-500 border-r-indigo-500 rounded-full animate-spin-reverse"></div>
                    </div>
                  </div>

                  {/* Loading message */}
                  <div className="text-center">
                    <p className="text-base font-semibold text-indigo-900 mb-2 animate-pulse">
                      {loadingMessage}
                    </p>
                    <p className="text-xs text-indigo-600">
                      This may take 30-60 seconds
                    </p>
                  </div>

                  {/* Bouncing dots */}
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <p className="text-sm text-slate-600 mb-2">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {exampleProfiles.map((username) => (
                    <Button
                      key={username}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleClick(username)}
                      disabled={loading}
                    >
                      {username}
                    </Button>
                  ))}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-indigo-50/30">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-3 shadow-md">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">Web3 Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed">
                Detects Solidity, Hardhat, Foundry, ethers.js, wagmi, and other Web3 technologies across repositories.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-3 shadow-md">
                <FileCode className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">Code Quality Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed">
                Evaluates testing practices, CI/CD, documentation, TypeScript usage, and maintainability signals.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-pink-50/30">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-lg flex items-center justify-center mb-3 shadow-md">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">Interview Preparation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generates customized interview questions and take-home task ideas based on the candidate&apos;s work.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analyses History */}
        {!historyLoading && history.length > 0 && (
          <div className="max-w-5xl mx-auto mt-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <Clock className="h-8 w-8 text-indigo-600" />
                Recent Analyses
              </h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.slice(0, 12).map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-white/90 backdrop-blur-sm"
                  onClick={() => router.push(`/report/${item.username}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{item.displayName}</CardTitle>
                        <CardDescription className="text-sm">@{item.username}</CardDescription>
                      </div>
                      <VerdictBadge verdict={item.verdict} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600 line-clamp-2">{item.headline}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-slate-500">Overall: </span>
                        <span className="font-bold text-slate-900">{item.overallScore}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Web3: </span>
                        <span className="font-bold text-slate-900">{item.web3Score}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {historyLoading && (
          <div className="max-w-5xl mx-auto mt-16">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Recent Analyses</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Note */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <p className="text-xs text-slate-500">
            Privacy: This tool only analyzes public GitHub data. Analysis history is stored in your database.
          </p>
        </div>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const config: Record<string, { color: string; icon: any }> = {
    STRONG_YES: { color: 'bg-green-500', icon: CheckCircle2 },
    YES: { color: 'bg-blue-500', icon: CheckCircle2 },
    MAYBE: { color: 'bg-yellow-500', icon: AlertTriangle },
    NO: { color: 'bg-red-500', icon: XCircle },
  };

  const { color, icon: Icon } = config[verdict] || { color: 'bg-gray-500', icon: AlertCircle };

  return (
    <Badge className={`${color} text-white text-xs px-2 py-1`}>
      <Icon className="h-3 w-3" />
    </Badge>
  );
}
