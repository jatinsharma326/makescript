'use client';

import React from 'react';
import { SubtitleSegment, TrimPoint } from '../../lib/types';

interface TimelineProps {
    duration: number;
    subtitles: SubtitleSegment[];
    trimPoints: TrimPoint;
    currentTime?: number;
    onSeek?: (time: number) => void;
    selectedSegmentId?: string | null;
}

// Color map for overlay types
const OVERLAY_COLORS: Record<string, string> = {
    'visual-illustration': '#6366f1',
    'emoji-reaction': '#f59e0b',
    'lower-third': '#ec4899',
    'highlight-box': '#f97316',
    'animated-subtitles': '#22d3ee',
    'scene-transition': '#8b5cf6',
    'glowing-particles': '#14b8a6',
    'kinetic-text': '#ef4444',
    'zoom-effect': '#0ea5e9',
};

const Timeline: React.FC<TimelineProps> = ({
    duration,
    subtitles,
    trimPoints,
    currentTime = 0,
    onSeek,
    selectedSegmentId,
}) => {
    const timelineRef = React.useRef<HTMLDivElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current || !onSeek) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onSeek(percent * duration);
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Group overlays by type for multi-lane display
    const overlaySegments = subtitles.filter(s => s.overlay);

    // Generate time markers
    const markerCount = Math.min(10, Math.max(4, Math.floor(duration / 5)));
    const markers = Array.from({ length: markerCount + 1 }, (_, i) => (i / markerCount) * duration);

    return (
        <div className="px-4 py-2 border-t border-border/40" style={{ background: 'rgba(12, 12, 16, 0.8)' }}>
            {/* Time markers */}
            <div className="relative h-3 mb-1">
                {markers.map((time, i) => (
                    <span
                        key={i}
                        className="absolute text-[8px] font-mono text-muted-foreground/25 -translate-x-1/2"
                        style={{ left: `${(time / duration) * 100}%` }}
                    >
                        {formatTime(time)}
                    </span>
                ))}
            </div>

            {/* Main timeline bar */}
            <div
                ref={timelineRef}
                className="relative h-8 rounded-md cursor-pointer group"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                onClick={handleClick}
            >
                {/* Trim regions (dimmed) */}
                {trimPoints.inPoint > 0 && (
                    <div className="absolute top-0 bottom-0 rounded-l-md z-10"
                        style={{
                            left: 0,
                            width: `${(trimPoints.inPoint / duration) * 100}%`,
                            background: 'rgba(239, 68, 68, 0.08)',
                            borderRight: '1.5px solid rgba(239, 68, 68, 0.35)',
                        }}
                    />
                )}
                {trimPoints.outPoint < duration && (
                    <div className="absolute top-0 bottom-0 rounded-r-md z-10"
                        style={{
                            left: `${(trimPoints.outPoint / duration) * 100}%`,
                            right: 0,
                            background: 'rgba(239, 68, 68, 0.08)',
                            borderLeft: '1.5px solid rgba(239, 68, 68, 0.35)',
                        }}
                    />
                )}

                {/* Overlay markers */}
                {overlaySegments.map((seg) => {
                    const left = (seg.startTime / duration) * 100;
                    const width = ((seg.endTime - seg.startTime) / duration) * 100;
                    const color = OVERLAY_COLORS[seg.overlay!.type] || '#6366f1';
                    const isSelected = selectedSegmentId === seg.id;

                    return (
                        <div
                            key={seg.id}
                            className={`absolute top-1 h-2.5 rounded-sm transition-all hover:h-3.5 hover:top-0.5 ${isSelected ? 'z-20 ring-1 ring-white' : 'z-10'}`}
                            style={{
                                left: `${left}%`,
                                width: `${Math.max(0.5, width)}%`,
                                background: `${color}50`,
                                border: isSelected ? `1px solid ${color}` : `1px solid ${color}70`,
                                boxShadow: isSelected ? `0 0 8px ${color}80` : 'none',
                            }}
                            title={`${seg.overlay!.type}: ${seg.text.substring(0, 30)}`}
                        />
                    );
                })}

                {/* Subtitle segment ticks (bottom lane) */}
                {subtitles.map((seg) => {
                    const left = (seg.startTime / duration) * 100;
                    const width = ((seg.endTime - seg.startTime) / duration) * 100;
                    const isSelected = selectedSegmentId === seg.id;

                    return (
                        <div
                            key={`sub-${seg.id}`}
                            className={`absolute bottom-1 h-1.5 rounded-sm transition-all ${isSelected ? 'bg-white/40' : 'bg-white/[0.06]'}`}
                            style={{
                                left: `${left}%`,
                                width: `${Math.max(0.3, width)}%`,
                            }}
                        />
                    );
                })}

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 z-20 pointer-events-none transition-all duration-75"
                    style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
                >
                    <div className="w-0.5 h-full bg-white/80" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.4)' }} />
                    <div className="absolute -top-1 -translate-x-[3px] w-2 h-2 rounded-full bg-white"
                        style={{ boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.01] transition-colors rounded-md" />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {Object.entries(OVERLAY_COLORS).map(([type, color]) => {
                    const count = overlaySegments.filter(s => s.overlay?.type === type).length;
                    if (count === 0) return null;
                    return (
                        <div key={type} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                            <span className="text-[8px] text-muted-foreground/30">{type.replace(/-/g, ' ')} ({count})</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Timeline;
