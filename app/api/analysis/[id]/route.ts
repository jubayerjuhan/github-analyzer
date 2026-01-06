import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      report: analysis.report,
      username: analysis.username,
      profileUrl: analysis.profileUrl,
      createdAt: analysis.createdAt.toISOString(),
      analysisId: analysis.id,
    });
  } catch (error: any) {
    console.error('Analysis fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analysis',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
