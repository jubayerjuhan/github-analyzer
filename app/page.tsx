'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseGitHubUsername } from '@/lib/utils';
import { Github, Search, AlertCircle, Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [profileUrl, setProfileUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const exampleProfiles = [
    'vitalik',
    'bkrem',
    'austintgriffith',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const username = parseGitHubUsername(profileUrl);
    if (!username) {
      setError('Invalid GitHub URL. Please enter a valid GitHub profile link or username.');
      return;
    }

    setLoading(true);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Github className="h-12 w-12 mr-3 text-slate-800" />
            <h1 className="text-5xl font-bold text-slate-900">GoodHive</h1>
          </div>
          <h2 className="text-2xl text-slate-700 mb-4">GitHub Talent Analyzer</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Generate professional hiring reports for Web3 developers. Analyze GitHub profiles to assess engineering quality, Web3 expertise, and code patterns.
          </p>
        </div>

        {/* Main Card */}
        <Card className="max-w-3xl mx-auto shadow-lg">
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
                <Button type="submit" disabled={loading} className="min-w-[120px]">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Web3 Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Detects Solidity, Hardhat, Foundry, ethers.js, wagmi, and other Web3 technologies across repositories.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Code Quality Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Evaluates testing practices, CI/CD, documentation, TypeScript usage, and maintainability signals.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Preparation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Generates customized interview questions and take-home task ideas based on the candidate's work.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Note */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <p className="text-xs text-slate-500">
            Privacy: This tool only analyzes public GitHub data. No personal data is stored. Reports are cached temporarily for performance.
          </p>
        </div>
      </div>
    </div>
  );
}
