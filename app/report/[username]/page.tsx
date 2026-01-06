'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HiringReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Download,
  Github,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCode,
  Target,
  MessageSquare,
  TrendingUp,
  Award,
  AlertCircle,
} from 'lucide-react';
import { getScoreColor, getScoreBgColor } from '@/lib/utils';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [report, setReport] = useState<HiringReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;

    const fetchReport = async () => {
      setLoading(true);
      setError('');

      try {
        // Try to fetch latest analysis from database first
        let response = await fetch(`/api/analysis/latest/${username}`);

        // If no analysis exists, trigger new analysis
        if (response.status === 404) {
          response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profileUrl: username }),
          });
        }

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Failed to load report');
          setLoading(false);
          return;
        }

        setReport(data.report);
      } catch (err) {
        setError('Failed to load report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [username]);

  const downloadMarkdown = () => {
    if (!report) return;

    const markdown = generateMarkdownReport(report, username);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goodhive-report-${username}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <ReportSkeleton />;
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="container mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Report not found'}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/')} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button onClick={() => router.push('/')} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
          <Button onClick={downloadMarkdown} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center">
                  <Github className="h-10 w-10 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-3xl mb-1">
                    {report.profile.displayName || report.profile.username}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    @{report.profile.username}
                  </CardDescription>
                  <p className="text-sm text-slate-700 mt-2">{report.profile.headline}</p>
                </div>
              </div>
              <VerdictBadge verdict={report.hiringRecommendation.verdict} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{report.profile.quickSummary}</p>
          </CardContent>
        </Card>

        {/* Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <ScoreCard title="Overall" score={report.scores.overall} icon={Award} />
          <ScoreCard title="Engineering" score={report.scores.engineering} icon={FileCode} />
          <ScoreCard title="Web3" score={report.scores.web3} icon={Target} />
          <ScoreCard title="Risk" score={report.scores.risk} icon={AlertTriangle} isRisk />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <SmallScoreCard title="Consistency" score={report.scores.consistency} />
          <SmallScoreCard title="Maintainability" score={report.scores.maintainability} />
          <SmallScoreCard title="Confidence" score={report.scores.confidence} />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="web3">Web3 Analysis</TabsTrigger>
            <TabsTrigger value="repos">Repositories</TabsTrigger>
            <TabsTrigger value="interview">Interview Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <EngineeringAssessment assessment={report.engineeringAssessment} />
            <HiringRecommendation recommendation={report.hiringRecommendation} />
          </TabsContent>

          <TabsContent value="web3" className="space-y-6">
            <Web3Assessment assessment={report.web3Assessment} />
          </TabsContent>

          <TabsContent value="repos" className="space-y-6">
            <RepoInsights insights={report.repoInsights} />
          </TabsContent>

          <TabsContent value="interview" className="space-y-6">
            <InterviewPlan plan={report.interviewPlan} />
            <DueDiligence dueDiligence={report.dueDiligence} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const config = {
    STRONG_YES: { label: 'Strong Yes', color: 'bg-green-500 text-white', icon: CheckCircle2 },
    YES: { label: 'Yes', color: 'bg-blue-500 text-white', icon: CheckCircle2 },
    MAYBE: { label: 'Maybe', color: 'bg-yellow-500 text-white', icon: AlertCircle },
    NO: { label: 'No', color: 'bg-red-500 text-white', icon: XCircle },
  }[verdict] || { label: verdict, color: 'bg-gray-500 text-white', icon: AlertCircle };

  const Icon = config.icon;

  return (
    <Badge className={`${config.color} text-lg px-4 py-2`}>
      <Icon className="mr-2 h-5 w-5" />
      {config.label}
    </Badge>
  );
}

function ScoreCard({
  title,
  score,
  icon: Icon,
  isRisk = false,
}: {
  title: string;
  score: number;
  icon: any;
  isRisk?: boolean;
}) {
  const displayScore = isRisk ? 100 - score : score;
  const colorClass = getScoreColor(displayScore);
  const bgClass = getScoreBgColor(displayScore);

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4" />
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`text-4xl font-bold ${colorClass}`}>{score}</div>
        <Progress value={score} className="mt-2 h-2" />
      </CardContent>
    </Card>
  );
}

function SmallScoreCard({ title, score }: { title: string; score: number }) {
  const colorClass = getScoreColor(score);

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-1 font-medium">{title}</div>
        <div className={`text-2xl font-bold ${colorClass}`}>{score}</div>
        <Progress value={score} className="mt-2 h-2" />
      </CardContent>
    </Card>
  );
}

function EngineeringAssessment({ assessment }: { assessment: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {assessment.strengths.map((strength: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span className="text-sm">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Weaknesses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {assessment.weaknesses.map((weakness: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span className="text-sm">{weakness}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Code Quality Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <ul className="space-y-2">
                {assessment.codeQualitySignals.map((signal: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600">→</span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{assessment.testingAndCI.testsPresent}</Badge>
                  <span className="text-sm font-medium">Tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{assessment.testingAndCI.ciPresent}</Badge>
                  <span className="text-sm font-medium">CI/CD</span>
                </div>
              </div>
              {assessment.testingAndCI.notes.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {assessment.testingAndCI.notes.map((note: string, idx: number) => (
                    <p key={idx}>• {note}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HiringRecommendation({ recommendation }: { recommendation: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hiring Recommendation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">Rationale</h4>
          <ul className="space-y-2">
            {recommendation.rationale.map((reason: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 mt-1">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-4">Role Fit Assessment</h4>
          <div className="space-y-4">
            {recommendation.roleFit.map((role: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{role.role}</span>
                  <span className={`font-bold ${getScoreColor(role.fitScore)}`}>
                    {role.fitScore}%
                  </span>
                </div>
                <Progress value={role.fitScore} />
                {role.notes.length > 0 && (
                  <ul className="pl-4 text-sm text-muted-foreground">
                    {role.notes.map((note: string, noteIdx: number) => (
                      <li key={noteIdx}>• {note}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Web3Assessment({ assessment }: { assessment: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Web3 Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Web3 Repositories</p>
              <p className="text-3xl font-bold text-blue-600">{assessment.web3RepoCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Key Stacks</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {assessment.keyStacks.map((stack: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {stack}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {assessment.notableWeb3Repos.map((repo: any, idx: number) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="text-lg">{repo.name}</CardTitle>
            <CardDescription>{repo.reason}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Stack</p>
              <div className="flex flex-wrap gap-2">
                {repo.stack.map((tech: string, techIdx: number) => (
                  <Badge key={techIdx} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Evidence</p>
              <ul className="space-y-1">
                {repo.evidence.map((ev: string, evIdx: number) => (
                  <li key={evIdx} className="text-sm text-muted-foreground">
                    • {ev}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RepoInsights({ insights }: { insights: any[] }) {
  return (
    <div className="space-y-4">
      {insights.map((insight, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{insight.name}</CardTitle>
              <Badge
                variant={
                  insight.importance === 'high'
                    ? 'default'
                    : insight.importance === 'medium'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {insight.importance}
              </Badge>
            </div>
            <CardDescription>{insight.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insight.signals.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Positive Signals</p>
                <ul className="space-y-1">
                  {insight.signals.map((signal: string, signalIdx: number) => (
                    <li key={signalIdx} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insight.redFlags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Red Flags</p>
                <ul className="space-y-1">
                  {insight.redFlags.map((flag: string, flagIdx: number) => (
                    <li key={flagIdx} className="text-sm flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InterviewPlan({ plan }: { plan: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Focus Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {plan.focusAreas.map((area: string, idx: number) => (
              <Badge key={idx} variant="secondary">
                {area}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Interview Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {plan.questions.map((q: any, idx: number) => (
            <div key={idx} className="space-y-2 pb-6 border-b last:border-b-0 last:pb-0">
              <Badge variant="outline">{q.category}</Badge>
              <p className="font-medium">{q.question}</p>
              <p className="text-sm text-muted-foreground italic">{q.whyThisQuestion}</p>
              <div className="pl-4 border-l-2 border-slate-200">
                <p className="text-sm font-medium mb-1">Good answer signals:</p>
                <ul className="text-sm space-y-1">
                  {q.expectedGoodAnswerSignals.map((signal: string, signalIdx: number) => (
                    <li key={signalIdx} className="text-muted-foreground">
                      • {signal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Take-Home Task Ideas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {plan.takeHomeTaskIdeas.map((task: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-sm">{task}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function DueDiligence({ dueDiligence }: { dueDiligence: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Due Diligence</CardTitle>
        <CardDescription>Additional verification steps recommended</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">Things to Verify</h4>
          <ul className="space-y-1">
            {dueDiligence.thingsToVerify.map((item: string, idx: number) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="text-blue-600">□</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        {dueDiligence.missingInfo.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Missing Information</h4>
            <ul className="space-y-1">
              {dueDiligence.missingInfo.map((item: string, idx: number) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-8 w-64 mt-4" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    </div>
  );
}

function generateMarkdownReport(report: HiringReport, username: string): string {
  let md = `# GoodHive Hiring Report: ${report.profile.displayName || username}\n\n`;
  md += `**Username:** @${report.profile.username}\n\n`;
  md += `**Headline:** ${report.profile.headline}\n\n`;
  md += `**Summary:** ${report.profile.quickSummary}\n\n`;
  md += `---\n\n`;

  md += `## Scores\n\n`;
  md += `- **Overall:** ${report.scores.overall}/100\n`;
  md += `- **Engineering:** ${report.scores.engineering}/100\n`;
  md += `- **Web3:** ${report.scores.web3}/100\n`;
  md += `- **Consistency:** ${report.scores.consistency}/100\n`;
  md += `- **Maintainability:** ${report.scores.maintainability}/100\n`;
  md += `- **Risk:** ${report.scores.risk}/100\n`;
  md += `- **Confidence:** ${report.scores.confidence}/100\n\n`;

  md += `## Hiring Recommendation: ${report.hiringRecommendation.verdict}\n\n`;
  report.hiringRecommendation.rationale.forEach((r) => {
    md += `- ${r}\n`;
  });
  md += `\n`;

  md += `## Web3 Assessment\n\n`;
  md += `**Web3 Repositories:** ${report.web3Assessment.web3RepoCount}\n\n`;
  md += `**Key Stacks:** ${report.web3Assessment.keyStacks.join(', ')}\n\n`;

  md += `## Engineering Assessment\n\n`;
  md += `### Strengths\n\n`;
  report.engineeringAssessment.strengths.forEach((s) => {
    md += `- ${s}\n`;
  });
  md += `\n### Weaknesses\n\n`;
  report.engineeringAssessment.weaknesses.forEach((w) => {
    md += `- ${w}\n`;
  });
  md += `\n`;

  md += `## Interview Plan\n\n`;
  report.interviewPlan.questions.forEach((q, idx) => {
    md += `### Question ${idx + 1} (${q.category})\n\n`;
    md += `**Q:** ${q.question}\n\n`;
    md += `**Why:** ${q.whyThisQuestion}\n\n`;
  });

  md += `\n---\n\nGenerated by GoodHive GitHub Talent Analyzer\n`;

  return md;
}
