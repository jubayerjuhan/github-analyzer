import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findFirst({
      where: { username: username.toLowerCase() },
      orderBy: { createdAt: 'desc' },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'No analysis found for this username' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      report: analysis.report,
      username: analysis.username,
      profileUrl: analysis.profileUrl,
      createdAt: analysis.createdAt.toISOString(),
      analysisId: analysis.id,
      cached: true,
    });
  } catch (error: any) {
    console.error('Latest analysis fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch latest analysis',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
