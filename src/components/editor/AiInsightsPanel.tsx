'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SubtitleSegment } from '@/lib/types';
import {
    VideoAnalysisResult,
    SentimentResult,
    EngagementScore,
    SmartCutPoint,
    ThumbnailCandidate,
    MoodProfile,
    analyzeFullVideo,
    getAnalysisSummary,
} from '@/lib/aiAnalysis';
import { cn } from '@/lib/utils';
import {
    Sparkles,
    TrendingUp,
    Scissors,
    Image,
    Music,
    Palette,
    Zap,
    Target,
    Eye,
    AlertCircle,
    CheckCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Play,
    X,
} from 'lucide-react';

interface AiInsightsPanelProps {
    subtitles: SubtitleSegment[];
    onSeekToTime?: (time: number) => void;
    onSelectSegment?: (segmentId: string) => void;
    onApplySmartCuts?: (cutSegmentIds: string[]) => void;
    isGenerating?: boolean;
}

// Sentiment color mapping
const SENTIMENT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    'positive': { bg: 'bg-green-500/10', text: 'text-green-400', icon: '💚' },
    'excited': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: '⚡' },
    'serious': { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: '🎯' },
    'humorous': { bg: 'bg-pink-500/10', text: 'text-pink-400', icon: '😂' },
    'negative': { bg: 'bg-red-500/10', text: 'text-red-400', icon: '⚠️' },
    'neutral': { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: '📊' },
};

// Mood color mapping
const MOOD_COLORS: Record<MoodProfile['primary'], string> = {
    'energetic': '#FF6B6B',
    'calm': '#74B9FF',
    'dramatic': '#E74C3C',
    'informative': '#3498DB',
    'entertaining': '#F39C12',
    'emotional': '#8E7CC3',
};

export function AiInsightsPanel({
    subtitles,
    onSeekToTime,
    onSelectSegment,
    onApplySmartCuts,
    isGenerating = false,
}: AiInsightsPanelProps) {
    const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        overview: true,
        engagement: true,
        cuts: false,
        thumbnails: true,
        mood: true,
    });
    const [selectedCutIds, setSelectedCutIds] = useState<Set<string>>(new Set());

    // Run analysis when subtitles change
    const runAnalysis = useCallback(async () => {
        if (subtitles.length === 0) {
            setAnalysis(null);
            return;
        }

        setIsLoading(true);
        try {
            // Call the API endpoint
            const response = await fetch('/api/analyze-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subtitles }),
            });

            const data = await response.json();
            if (data.success && data.result) {
                setAnalysis(data.result);
            } else {
                // Fallback to local analysis if API fails
                const localResult = analyzeFullVideo(subtitles);
                setAnalysis(localResult);
            }
        } catch (error) {
            console.error('[AI Insights] Analysis failed:', error);
            // Fallback to local analysis
            const localResult = analyzeFullVideo(subtitles);
            setAnalysis(localResult);
        }
        setIsLoading(false);
    }, [subtitles]);

    // Auto-run analysis when subtitles change significantly
    useEffect(() => {
        if (subtitles.length > 0 && !analysis && !isLoading) {
            runAnalysis();
        }
    }, [subtitles.length, analysis, isLoading, runAnalysis]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleCutToggle = (segmentId: string) => {
        setSelectedCutIds(prev => {
            const next = new Set(prev);
            if (next.has(segmentId)) {
                next.delete(segmentId);
            } else {
                next.add(segmentId);
            }
            return next;
        });
    };

    const handleApplySelectedCuts = () => {
        if (onApplySmartCuts && selectedCutIds.size > 0) {
            onApplySmartCuts(Array.from(selectedCutIds));
            setSelectedCutIds(new Set());
        }
    };

    const handleThumbnailClick = (candidate: ThumbnailCandidate) => {
        if (onSeekToTime) {
            onSeekToTime(candidate.timestamp);
        }
    };

    const handlePeakMomentClick = (segment: SubtitleSegment) => {
        if (onSeekToTime) {
            onSeekToTime(segment.startTime);
        }
        if (onSelectSegment) {
            onSelectSegment(segment.id);
        }
    };

    if (subtitles.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Transcribe a video to unlock AI insights</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-3 space-y-3" style={{ background: 'var(--bg-card)' }}>
            {/* Header with Analyze Button */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold">AI Insights</span>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={isLoading || isGenerating}
                    className="h-7 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-violet-500/20"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Zap className="w-3 h-3" />
                            Reanalyze
                        </>
                    )}
                </button>
            </div>

            {isLoading && !analysis ? (
                <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400 mb-2" />
                    <p className="text-xs text-muted-foreground">Analyzing your video...</p>
                </div>
            ) : analysis ? (
                <>
                    {/* Overview Section */}
                    <Section
                        title="Video Overview"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        expanded={expandedSections.overview}
                        onToggle={() => toggleSection('overview')}
                    >
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {/* Sentiment Badge */}
                            <div className={cn('p-2 rounded-lg', SENTIMENT_COLORS[analysis.overallSentiment]?.bg)}>
                                <div className="text-xs font-medium" style={{ color: SENTIMENT_COLORS[analysis.overallSentiment]?.text }}>
                                    {SENTIMENT_COLORS[analysis.overallSentiment]?.icon} {analysis.overallSentiment}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Sentiment</div>
                            </div>

                            {/* Engagement Score */}
                            <div className="p-2 rounded-lg bg-violet-500/10">
                                <div className="text-xs font-medium text-violet-400">
                                    {Math.round(analysis.averageEngagement)}%
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Engagement</div>
                            </div>

                            {/* Peak Moments */}
                            <div className="p-2 rounded-lg bg-yellow-500/10">
                                <div className="text-xs font-medium text-yellow-400">
                                    {analysis.peakMoments.length}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Peak Moments</div>
                            </div>

                            {/* Hooks */}
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <div className="text-xs font-medium text-green-400">
                                    {analysis.hookSegments.length}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Hooks</div>
                            </div>
                        </div>
                    </Section>

                    {/* Mood & Music Section */}
                    <Section
                        title="Mood & Music"
                        icon={<Music className="w-3.5 h-3.5" />}
                        expanded={expandedSections.mood}
                        onToggle={() => toggleSection('mood')}
                    >
                        <div className="space-y-2">
                            {/* Mood Badge */}
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: MOOD_COLORS[analysis.moodProfile.primary] }}
                                />
                                <span className="text-xs font-medium capitalize">{analysis.moodProfile.primary}</span>
                                <span className="text-[10px] text-muted-foreground">
                                    ({analysis.moodProfile.energyLevel}/10 energy)
                                </span>
                            </div>

                            {/* Energy & Tempo */}
                            <div className="flex gap-2">
                                <div className="flex-1 p-2 rounded-lg bg-white/5">
                                    <div className="text-[10px] text-muted-foreground">Tempo</div>
                                    <div className="text-xs font-medium capitalize">{analysis.moodProfile.tempo}</div>
                                </div>
                                <div className="flex-1 p-2 rounded-lg bg-white/5">
                                    <div className="text-[10px] text-muted-foreground">Secondary</div>
                                    <div className="text-xs font-medium capitalize truncate">
                                        {analysis.moodProfile.secondary[0] || 'none'}
                                    </div>
                                </div>
                            </div>

                            {/* Recommended Music */}
                            <div className="p-2 rounded-lg bg-white/5">
                                <div className="text-[10px] text-muted-foreground mb-1">🎵 Recommended Music</div>
                                <div className="text-xs">
                                    {analysis.recommendedMusicGenre.slice(0, 3).join(', ')}
                                </div>
                            </div>

                            {/* Color Palette */}
                            <div className="p-2 rounded-lg bg-white/5">
                                <div className="text-[10px] text-muted-foreground mb-1">🎨 Color Palette</div>
                                <div className="flex gap-1">
                                    {analysis.moodProfile.colorPalette.slice(0, 5).map((color, i) => (
                                        <div
                                            key={i}
                                            className="w-4 h-4 rounded"
                                            style={{ background: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Peak Moments / Engagement Section */}
                    <Section
                        title="High Engagement Moments"
                        icon={<TrendingUp className="w-3.5 h-3.5" />}
                        expanded={expandedSections.engagement}
                        onToggle={() => toggleSection('engagement')}
                    >
                        <div className="space-y-1.5">
                            {analysis.peakMoments.length > 0 ? (
                                analysis.peakMoments.slice(0, 5).map((seg, i) => (
                                    <button
                                        key={seg.id}
                                        onClick={() => handlePeakMomentClick(seg)}
                                        className="w-full p-2 rounded-lg bg-white/5 hover:bg-violet-500/10 transition-all text-left group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Zap className="w-3 h-3 text-yellow-400" />
                                                <span className="text-xs font-medium truncate max-w-[150px]">
                                                    {seg.text.substring(0, 25)}...
                                                </span>
                                            </div>
                                            <Play className="w-3 h-3 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-xs text-muted-foreground text-center py-2">
                                    No high-engagement moments detected
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* Smart Cuts Section */}
                    <Section
                        title="Smart Cut Suggestions"
                        icon={<Scissors className="w-3.5 h-3.5" />}
                        expanded={expandedSections.cuts}
                        onToggle={() => toggleSection('cuts')}
                    >
                        <div className="space-y-1.5">
                            {analysis.suggestedCuts.length > 0 ? (
                                <>
                                    {analysis.suggestedCuts.slice(0, 6).map((cut) => (
                                        <div
                                            key={cut.segmentId}
                                            className={cn(
                                                'p-2 rounded-lg transition-all cursor-pointer',
                                                selectedCutIds.has(cut.segmentId)
                                                    ? 'bg-red-500/20 border border-red-500/30'
                                                    : 'bg-white/5 hover:bg-white/10'
                                            )}
                                            onClick={() => handleCutToggle(cut.segmentId)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px]">
                                                        {cut.type === 'filler' && '🗣️'}
                                                        {cut.type === 'pause' && '⏸️'}
                                                        {cut.type === 'breath' && '😮'}
                                                        {cut.type === 'transition' && '↔️'}
                                                        {cut.type === 'repetition' && '🔁'}
                                                    </span>
                                                    <span className="text-xs font-medium capitalize">{cut.type}</span>
                                                </div>
                                                <div className={cn(
                                                    'text-[10px] px-1.5 py-0.5 rounded',
                                                    cut.suggestedAction === 'cut' ? 'bg-red-500/20 text-red-400' :
                                                    cut.suggestedAction === 'trim' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-green-500/20 text-green-400'
                                                )}>
                                                    {cut.suggestedAction}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                                {cut.reason}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Apply Cuts Button */}
                                    {selectedCutIds.size > 0 && onApplySmartCuts && (
                                        <button
                                            onClick={handleApplySelectedCuts}
                                            className="w-full mt-2 h-8 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all"
                                            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' }}
                                        >
                                            <Scissors className="w-3 h-3" />
                                            Apply {selectedCutIds.size} Cuts
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                    <span className="text-xs text-green-400">No filler detected - great!</span>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* Thumbnail Candidates Section */}
                    <Section
                        title="Best Thumbnail Moments"
                        icon={<Image className="w-3.5 h-3.5" />}
                        expanded={expandedSections.thumbnails}
                        onToggle={() => toggleSection('thumbnails')}
                    >
                        <div className="space-y-1.5">
                            {analysis.thumbnailCandidates.length > 0 ? (
                                analysis.thumbnailCandidates.map((candidate, i) => (
                                    <button
                                        key={candidate.segmentId}
                                        onClick={() => handleThumbnailClick(candidate)}
                                        className="w-full p-2 rounded-lg bg-white/5 hover:bg-violet-500/10 transition-all text-left group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn(
                                                    'w-5 h-5 rounded flex items-center justify-center text-xs font-bold',
                                                    i === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-muted-foreground'
                                                )}>
                                                    {i + 1}
                                                </div>
                                                <span className="text-xs font-medium truncate max-w-[130px]">
                                                    {candidate.textOnScreen}
                                                </span>
                                            </div>
                                            <div className="text-xs font-medium text-violet-400">
                                                {Math.round(candidate.score)}%
                                            </div>
                                        </div>
                                        <div className="flex gap-1 mt-1">
                                            {candidate.reasons.slice(0, 2).map((reason, ri) => (
                                                <span key={ri} className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-muted-foreground truncate">
                                                    {reason}
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-xs text-muted-foreground text-center py-2">
                                    No strong thumbnail candidates found
                                </div>
                            )}
                        </div>
                    </Section>
                </>
            ) : null}
        </div>
    );
}

// Helper: Section wrapper with expand/collapse
function Section({
    title,
    icon,
    expanded,
    onToggle,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border/50 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-3 py-2 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
                <div className="flex items-center gap-2 text-muted-foreground">
                    {icon}
                    <span className="text-xs font-medium">{title}</span>
                </div>
                {expanded ? (
                    <ChevronUp className="w-3 h-3 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
            </button>
            {expanded && (
                <div className="px-3 py-2">
                    {children}
                </div>
            )}
        </div>
    );
}

// Helper: Format time
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default AiInsightsPanel;