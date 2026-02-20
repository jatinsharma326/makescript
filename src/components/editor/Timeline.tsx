'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SubtitleSegment, TrimPoint } from '../../lib/types';

interface TimelineProps {
    duration: number;
    subtitles: SubtitleSegment[];
    trimPoints: TrimPoint;
    currentTime?: number;
    onSeek?: (time: number) => void;
    selectedSegmentId?: string | null;
    onSelectSegment?: (id: string | null) => void;
    onSplitSegment?: (id: string, splitTime: number) => void;
    onDeleteOverlay?: (id: string) => void;
    isPlaying?: boolean;
    onPlayPause?: () => void;
    onSkip?: (delta: number) => void;
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

const OVERLAY_LABELS: Record<string, string> = {
    'visual-illustration': 'Illustration',
    'emoji-reaction': 'Emoji',
    'lower-third': 'Lower Third',
    'highlight-box': 'Highlight',
    'animated-subtitles': 'Subtitles',
    'scene-transition': 'Transition',
    'glowing-particles': 'Particles',
    'kinetic-text': 'Kinetic',
    'zoom-effect': 'Zoom',
};

const Timeline: React.FC<TimelineProps> = ({
    duration,
    subtitles,
    trimPoints,
    currentTime = 0,
    onSeek,
    selectedSegmentId,
    onSelectSegment,
    onSplitSegment,
    onDeleteOverlay,
    isPlaying = false,
    onPlayPause,
    onSkip,
}) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredSegId, setHoveredSegId] = useState<string | null>(null);
    const [tooltipInfo, setTooltipInfo] = useState<{ x: number; time: number } | null>(null);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        const ms = Math.floor((s % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    const formatTimeShort = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimeFromMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!timelineRef.current) return 0;
        const rect = timelineRef.current.getBoundingClientRect();
        const scrollLeft = timelineRef.current.scrollLeft;
        const totalWidth = timelineRef.current.scrollWidth;
        const x = e.clientX - rect.left + scrollLeft;
        const percent = Math.max(0, Math.min(1, x / totalWidth));
        return percent * duration;
    }, [duration]);

    const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!onSeek) return;
        const time = getTimeFromMouse(e);
        onSeek(time);
    }, [onSeek, getTimeFromMouse]);

    // Draggable playhead
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        if (onSeek) onSeek(getTimeFromMouse(e));
    }, [onSeek, getTimeFromMouse]);

    useEffect(() => {
        if (!isDragging) return;
        const handleMove = (e: MouseEvent) => {
            if (onSeek) onSeek(getTimeFromMouse(e));
        };
        const handleUp = () => setIsDragging(false);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isDragging, onSeek, getTimeFromMouse]);

    // Mouse hover tooltip
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) return;
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = getTimeFromMouse(e);
        setTooltipInfo({ x, time });
    }, [isDragging, getTimeFromMouse]);

    const handleMouseLeave = () => setTooltipInfo(null);

    // Split at playhead
    const handleSplit = useCallback(() => {
        if (!onSplitSegment) return;
        const seg = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
        if (seg && currentTime > seg.startTime + 0.1 && currentTime < seg.endTime - 0.1) {
            onSplitSegment(seg.id, currentTime);
        }
    }, [onSplitSegment, subtitles, currentTime]);

    // Zoom controls
    const zoomIn = () => setZoom(prev => Math.min(prev * 1.5, 8));
    const zoomOut = () => setZoom(prev => Math.max(prev / 1.5, 1));
    const zoomFit = () => setZoom(1);

    // Auto-scroll to keep playhead visible
    useEffect(() => {
        if (!timelineRef.current || zoom <= 1) return;
        const container = timelineRef.current;
        const playheadPos = (currentTime / duration) * container.scrollWidth;
        const viewLeft = container.scrollLeft;
        const viewRight = viewLeft + container.clientWidth;
        if (playheadPos < viewLeft + 40 || playheadPos > viewRight - 40) {
            container.scrollLeft = playheadPos - container.clientWidth / 2;
        }
    }, [currentTime, duration, zoom]);

    const overlaySegments = subtitles.filter(s => s.overlay);

    // Time markers
    const markerInterval = zoom > 4 ? 1 : zoom > 2 ? 2 : zoom > 1.5 ? 5 : 10;
    const markerCount = Math.ceil(duration / markerInterval);
    const markers = Array.from({ length: markerCount + 1 }, (_, i) => i * markerInterval).filter(t => t <= duration);

    // Can we split at current playhead?
    const canSplit = subtitles.some(s => currentTime > s.startTime + 0.1 && currentTime < s.endTime - 0.1);

    return (
        <div className="border-t border-border/40 select-none" style={{ background: 'rgba(12, 12, 16, 0.9)' }}>
            {/* ── Toolbar ── */}
            <div className="h-9 flex items-center justify-between px-3 border-b border-white/[0.04]">
                {/* Left: Playback controls */}
                <div className="flex items-center gap-0.5">
                    {/* Skip back */}
                    <button
                        onClick={() => onSkip?.(-5)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                        title="Skip back 5s"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="19 20 9 12 19 4" />
                            <line x1="5" y1="19" x2="5" y2="5" />
                        </svg>
                    </button>

                    {/* Play/Pause */}
                    <button
                        onClick={onPlayPause}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21" />
                            </svg>
                        )}
                    </button>

                    {/* Skip forward */}
                    <button
                        onClick={() => onSkip?.(5)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                        title="Skip forward 5s"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 4 15 12 5 20" />
                            <line x1="19" y1="5" x2="19" y2="19" />
                        </svg>
                    </button>

                    <span className="w-px h-4 bg-white/[0.06] mx-1.5" />

                    {/* Current time display */}
                    <span className="text-[11px] font-mono tabular-nums text-white/50 min-w-[60px]">
                        {formatTimeShort(currentTime)}
                    </span>
                </div>

                {/* Center: Edit tools */}
                <div className="flex items-center gap-0.5">
                    {/* Split */}
                    <button
                        onClick={handleSplit}
                        disabled={!canSplit}
                        className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${canSplit
                            ? 'text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300'
                            : 'text-white/15 cursor-not-allowed'
                            }`}
                        title="Split segment at playhead (S)"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="2" x2="12" y2="22" />
                            <polyline points="8 6 4 2 4 10" />
                            <polyline points="16 6 20 2 20 10" />
                            <polyline points="8 18 4 22 4 14" />
                            <polyline points="16 18 20 22 20 14" />
                        </svg>
                        Split
                    </button>

                    {/* Delete overlay */}
                    <button
                        onClick={() => selectedSegmentId && onDeleteOverlay?.(selectedSegmentId)}
                        disabled={!selectedSegmentId || !subtitles.find(s => s.id === selectedSegmentId)?.overlay}
                        className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${selectedSegmentId && subtitles.find(s => s.id === selectedSegmentId)?.overlay
                            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                            : 'text-white/15 cursor-not-allowed'
                            }`}
                        title="Remove overlay from selected segment"
                    >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Remove FX
                    </button>
                </div>

                {/* Right: Zoom controls */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={zoomOut}
                        disabled={zoom <= 1}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${zoom > 1 ? 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]' : 'text-white/15 cursor-not-allowed'}`}
                        title="Zoom out"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                    </button>
                    <button
                        onClick={zoomFit}
                        className="h-6 px-2 rounded text-[9px] font-bold font-mono text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                        title="Fit to view"
                    >
                        {zoom > 1 ? `${zoom.toFixed(1)}x` : 'FIT'}
                    </button>
                    <button
                        onClick={zoomIn}
                        disabled={zoom >= 8}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${zoom < 8 ? 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]' : 'text-white/15 cursor-not-allowed'}`}
                        title="Zoom in"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="11" y1="8" x2="11" y2="14" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Timeline Track ── */}
            <div className="px-2 py-1.5">
                {/* Time ruler */}
                <div
                    ref={timelineRef}
                    className="relative rounded-md cursor-crosshair overflow-x-auto overflow-y-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.02)',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.08) transparent',
                    }}
                    onClick={handleTimelineClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <div style={{ width: `${100 * zoom}%`, minWidth: '100%' }}>
                        {/* Time markers */}
                        <div className="relative h-5 border-b border-white/[0.04]">
                            {markers.map((time, i) => (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 flex flex-col items-center"
                                    style={{ left: `${(time / duration) * 100}%` }}
                                >
                                    <div className="w-px h-2 bg-white/10" />
                                    <span className="text-[8px] font-mono text-white/20 mt-px">
                                        {formatTimeShort(time)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Overlay segments lane */}
                        <div className="relative h-9 border-b border-white/[0.03]">
                            {/* Trim regions */}
                            {trimPoints.inPoint > 0 && (
                                <div className="absolute top-0 bottom-0 z-5"
                                    style={{
                                        left: 0,
                                        width: `${(trimPoints.inPoint / duration) * 100}%`,
                                        background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.04), rgba(239,68,68,0.04) 2px, transparent 2px, transparent 6px)',
                                        borderRight: '1px solid rgba(239,68,68,0.3)',
                                    }}
                                />
                            )}
                            {trimPoints.outPoint < duration && (
                                <div className="absolute top-0 bottom-0 z-5"
                                    style={{
                                        left: `${(trimPoints.outPoint / duration) * 100}%`,
                                        right: 0,
                                        background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.04), rgba(239,68,68,0.04) 2px, transparent 2px, transparent 6px)',
                                        borderLeft: '1px solid rgba(239,68,68,0.3)',
                                    }}
                                />
                            )}

                            {/* Overlay blocks */}
                            {overlaySegments.map((seg) => {
                                const left = (seg.startTime / duration) * 100;
                                const width = ((seg.endTime - seg.startTime) / duration) * 100;
                                const color = OVERLAY_COLORS[seg.overlay!.type] || '#6366f1';
                                const isSelected = selectedSegmentId === seg.id;
                                const isHovered = hoveredSegId === seg.id;
                                const label = OVERLAY_LABELS[seg.overlay!.type] || seg.overlay!.type;

                                return (
                                    <div
                                        key={seg.id}
                                        className={`absolute top-1 bottom-1 rounded-[4px] flex items-center overflow-hidden cursor-pointer transition-all duration-150 ${isSelected ? 'z-20 ring-1 ring-white/60' : 'z-10'}`}
                                        style={{
                                            left: `${left}%`,
                                            width: `${Math.max(0.8, width)}%`,
                                            background: isSelected
                                                ? `linear-gradient(135deg, ${color}60, ${color}35)`
                                                : isHovered
                                                    ? `linear-gradient(135deg, ${color}45, ${color}25)`
                                                    : `linear-gradient(135deg, ${color}35, ${color}18)`,
                                            borderLeft: `2px solid ${color}${isSelected ? '' : '90'}`,
                                            boxShadow: isSelected ? `0 0 12px ${color}40, inset 0 0 20px ${color}10` : 'none',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectSegment?.(isSelected ? null : seg.id);
                                        }}
                                        onMouseEnter={() => setHoveredSegId(seg.id)}
                                        onMouseLeave={() => setHoveredSegId(null)}
                                        title={`${label}: "${seg.text.substring(0, 40)}${seg.text.length > 40 ? '…' : ''}"`}
                                    >
                                        {width > 3 && (
                                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 truncate" style={{ color: `${color}cc` }}>
                                                {label}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Subtitle waveform lane */}
                        <div className="relative h-5">
                            {subtitles.map((seg) => {
                                const left = (seg.startTime / duration) * 100;
                                const width = ((seg.endTime - seg.startTime) / duration) * 100;
                                const isSelected = selectedSegmentId === seg.id;
                                const hasOverlay = !!seg.overlay;

                                return (
                                    <div
                                        key={`sub-${seg.id}`}
                                        className={`absolute top-1 bottom-1 rounded-sm cursor-pointer transition-all ${isSelected ? 'ring-1 ring-white/30 z-10' : ''}`}
                                        style={{
                                            left: `${left}%`,
                                            width: `${Math.max(0.3, width)}%`,
                                            background: isSelected
                                                ? 'rgba(255,255,255,0.15)'
                                                : hasOverlay
                                                    ? 'rgba(255,255,255,0.06)'
                                                    : 'rgba(255,255,255,0.03)',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectSegment?.(isSelected ? null : seg.id);
                                        }}
                                        title={seg.text.substring(0, 50)}
                                    />
                                );
                            })}
                        </div>

                        {/* Playhead */}
                        <div
                            className="absolute top-0 bottom-0 z-30 pointer-events-none"
                            style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
                        >
                            {/* Playhead line */}
                            <div className="w-px h-full" style={{
                                background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))',
                                boxShadow: '0 0 6px rgba(255,255,255,0.3)',
                            }} />
                            {/* Playhead triangle */}
                            <div className="absolute -top-0 -translate-x-[5px]" style={{
                                width: 0,
                                height: 0,
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderTop: '6px solid #fff',
                                filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.4))',
                            }} />
                        </div>

                        {/* Hover time tooltip */}
                        {tooltipInfo && !isDragging && (
                            <div
                                className="absolute top-0 z-40 pointer-events-none"
                                style={{ left: `${(tooltipInfo.time / duration) * 100}%` }}
                            >
                                <div className="absolute -top-6 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono text-white/70 whitespace-nowrap"
                                    style={{ background: 'rgba(30,30,40,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {formatTime(tooltipInfo.time)}
                                </div>
                                <div className="w-px h-full bg-white/10" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Legend ── */}
            <div className="flex items-center gap-3 px-3 pb-1.5 flex-wrap">
                {Object.entries(OVERLAY_COLORS).map(([type, color]) => {
                    const count = overlaySegments.filter(s => s.overlay?.type === type).length;
                    if (count === 0) return null;
                    return (
                        <div key={type} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                            <span className="text-[8px] text-white/25">{OVERLAY_LABELS[type] || type} ({count})</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Timeline;
