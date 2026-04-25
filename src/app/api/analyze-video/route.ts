import { NextRequest, NextResponse } from 'next/server';
import { analyzeFullVideo, getAnalysisSummary, type VideoAnalysisResult } from '@/lib/aiAnalysis';
import type { SubtitleSegment } from '@/lib/types';

interface AnalyzeRequest {
    subtitles: SubtitleSegment[];
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as AnalyzeRequest;
        const { subtitles } = body;

        if (!subtitles || subtitles.length === 0) {
            return NextResponse.json({
                error: 'No subtitles provided for analysis',
                result: null
            }, { status: 400 });
        }

        console.log('[AI Analysis] Analyzing video with', subtitles.length, 'segments');

        // Perform comprehensive AI analysis
        const result = analyzeFullVideo(subtitles);
        const summary = getAnalysisSummary(result);

        console.log('[AI Analysis] Analysis complete:');
        console.log(`  - Overall Sentiment: ${result.overallSentiment}`);
        console.log(`  - Average Engagement: ${Math.round(result.averageEngagement)}%`);
        console.log(`  - Peak Moments: ${result.peakMoments.length}`);
        console.log(`  - Suggested Cuts: ${result.suggestedCuts.length}`);
        console.log(`  - Mood: ${result.moodProfile.primary}`);

        return NextResponse.json({
            success: true,
            result,
            summary,
        });

    } catch (error) {
        console.error('[AI Analysis] Error:', error);
        return NextResponse.json({
            error: 'Analysis failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}