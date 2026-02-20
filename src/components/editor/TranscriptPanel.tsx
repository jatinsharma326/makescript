'use client';

import React, { useRef, useEffect, useState } from 'react';
import { SubtitleSegment, OverlayType, OVERLAY_TEMPLATES, TranscriptStatus } from '../../lib/types';
import { FileText, Sparkles, Loader2, Volume2, X, Plus, Trash2 } from 'lucide-react';

interface TranscriptPanelProps {
    subtitles: SubtitleSegment[];
    selectedSegmentId: string | null;
    onSelectSegment: (id: string) => void;
    onAddOverlay: (segmentId: string, overlayType: OverlayType, props: Record<string, unknown>) => void;
    onRemoveOverlay: (segmentId: string) => void;
    onGenerateAI?: () => void;
    onDeleteVideo?: () => void;
    isGenerating?: boolean;
    isTranscribing: boolean;
    transcriptStatus: TranscriptStatus;
}

const OVERLAY_ICONS: Record<string, string> = {
    'visual-illustration': '🎨',
    'emoji-reaction': '🔥',
    'kinetic-text': '💫',
    'highlight-box': '🔲',
    'lower-third': '📛',
    'zoom-effect': '🔍',
    'scene-transition': '✨',
    'glowing-particles': '🌟',
    'image-card': '🖼️',
    'ai-generated-image': '🤖',
    'animated-subtitles': '💬',
};

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function TranscriptPanel({
    subtitles,
    selectedSegmentId,
    onSelectSegment,
    onAddOverlay,
    onRemoveOverlay,
    onGenerateAI,
    onDeleteVideo,
    isGenerating = false,
    isTranscribing,
    transcriptStatus,
}: TranscriptPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLDivElement>(null);
    const [popupSegmentId, setPopupSegmentId] = useState<string | null>(null);
    const [customText, setCustomText] = useState('');

    // Auto-scroll to selected segment
    useEffect(() => {
        if (selectedRef.current && scrollRef.current) {
            selectedRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [selectedSegmentId]);

    const overlayCount = subtitles.filter(s => s.overlay).length;

    const handleAddOverlay = (segmentId: string, template: typeof OVERLAY_TEMPLATES[0]) => {
        const props = { ...template.defaultProps };
        // If user typed custom text, use it as label/name
        if (customText.trim()) {
            if (template.type === 'kinetic-text') {
                props.text = customText.trim();
            } else if (template.type === 'lower-third') {
                props.name = customText.trim();
            } else if (template.type === 'highlight-box') {
                props.text = customText.trim();
            } else if (template.type === 'emoji-reaction') {
                // use custom text as emoji if it looks like one
                if (customText.trim().length <= 4) props.emoji = customText.trim();
            } else if (template.type === 'visual-illustration') {
                props.label = customText.trim();
                props.scene = customText.trim().toLowerCase().replace(/\s+/g, '-');
            } else {
                props.label = customText.trim();
            }
        }
        onAddOverlay(segmentId, template.type, props);
        setPopupSegmentId(null);
        setCustomText('');
    };

    return (
        <div className="flex flex-col h-full border-r border-border" style={{ background: 'var(--bg-card)' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="text-[13px] font-semibold text-foreground">Transcript</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {transcriptStatus !== 'none' && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${transcriptStatus === 'real'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : transcriptStatus === 'transcribing'
                                    ? 'bg-amber-500/15 text-amber-400'
                                    : 'bg-orange-500/15 text-orange-400'
                                }`}>
                                {transcriptStatus === 'real' ? '✓ Real' :
                                    transcriptStatus === 'transcribing' ? '⏳ Processing' :
                                        transcriptStatus === 'mock-no-audio' ? 'No Audio' :
                                            transcriptStatus === 'mock-error' ? 'Fallback' : 'Mock'}
                            </span>
                        )}
                        {onDeleteVideo && (
                            <button
                                onClick={onDeleteVideo}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Delete video"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{subtitles.length} segments</span>
                    {overlayCount > 0 && (
                        <>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-1" style={{ color: '#a78bfa' }}>
                                <Sparkles className="w-3 h-3" />
                                {overlayCount} effects
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            {subtitles.length > 0 && (
                <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
                    {onGenerateAI && (
                        <button
                            onClick={onGenerateAI}
                            disabled={isGenerating || isTranscribing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                                color: '#a78bfa',
                                border: '1px solid rgba(139,92,246,0.2)',
                            }}
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                            ) : (
                                <><Sparkles className="w-3 h-3" /> AI Generate Overlays</>
                            )}
                        </button>
                    )}
                    {overlayCount > 0 && (
                        <button
                            onClick={() => subtitles.forEach(s => { if (s.overlay) onRemoveOverlay(s.id); })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            style={{ border: '1px solid rgba(239,68,68,0.1)' }}
                        >
                            <Trash2 className="w-3 h-3" />
                            Clear All
                        </button>
                    )}
                </div>
            )}

            {/* Transcript Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
                {/* Transcribing State */}
                {isTranscribing && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        </div>
                        <div>
                            <p className="text-[12px] font-medium text-foreground/80">Transcribing audio...</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Using Whisper AI • This may take a minute
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isTranscribing && subtitles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                            <Volume2 className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            No transcript yet.<br />Upload a video to begin.
                        </p>
                    </div>
                )}

                {/* Segments List */}
                {subtitles.length > 0 && (
                    <div className="py-1">
                        {subtitles.map((segment) => {
                            const hasOverlay = !!segment.overlay;
                            const isSelected = segment.id === selectedSegmentId;
                            const overlayType = segment.overlay?.type;
                            const overlayIcon = overlayType ? OVERLAY_ICONS[overlayType] || '✦' : '';
                            const isPopupOpen = popupSegmentId === segment.id;

                            return (
                                <div key={segment.id} className="relative">
                                    <div
                                        ref={isSelected ? selectedRef : undefined}
                                        onClick={() => onSelectSegment(segment.id)}
                                        className={`group relative px-4 py-2.5 cursor-pointer transition-all duration-150 hover:bg-white/[0.03] ${isSelected ? 'bg-indigo-500/[0.08]' : ''
                                            }`}
                                        style={{
                                            borderLeft: hasOverlay
                                                ? '3px solid rgba(167, 139, 250, 0.7)'
                                                : '3px solid transparent',
                                        }}
                                    >
                                        {/* Timestamp + Overlay Badge + Actions Row */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-mono font-medium tabular-nums px-1.5 py-0.5 rounded"
                                                style={{
                                                    background: isSelected
                                                        ? 'rgba(99, 102, 241, 0.15)'
                                                        : 'rgba(255, 255, 255, 0.04)',
                                                    color: isSelected ? '#818cf8' : 'var(--text-secondary)',
                                                }}>
                                                {formatTimestamp(segment.startTime)}
                                            </span>

                                            {hasOverlay && (
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                                    style={{
                                                        background: 'rgba(167, 139, 250, 0.12)',
                                                        color: '#c4b5fd',
                                                    }}>
                                                    <span>{overlayIcon}</span>
                                                    <span className="max-w-[100px] truncate">
                                                        {segment.overlay?.props?.scene
                                                            ? String(segment.overlay.props.scene).replace(/-/g, ' ')
                                                            : overlayType?.replace(/-/g, ' ')}
                                                    </span>
                                                </span>
                                            )}

                                            {/* Spacer */}
                                            <div className="flex-1" />

                                            {/* Action buttons (visible on hover or when selected) */}
                                            <div className={`flex items-center gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                }`}>
                                                {!hasOverlay && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPopupSegmentId(isPopupOpen ? null : segment.id);
                                                            setCustomText('');
                                                        }}
                                                        className="w-5 h-5 rounded flex items-center justify-center text-indigo-400 hover:bg-indigo-500/15 transition-all"
                                                        title="Add motion graphic"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {hasOverlay && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveOverlay(segment.id);
                                                        }}
                                                        className="w-5 h-5 rounded flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                        title="Remove overlay"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {hasOverlay && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPopupSegmentId(isPopupOpen ? null : segment.id);
                                                            setCustomText('');
                                                        }}
                                                        className="w-5 h-5 rounded flex items-center justify-center text-indigo-400/70 hover:text-indigo-400 hover:bg-indigo-500/15 transition-all"
                                                        title="Change overlay"
                                                    >
                                                        <Sparkles className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Text Content */}
                                        <p className={`text-[12px] leading-relaxed ${hasOverlay ? 'text-foreground/90' : 'text-foreground/65'
                                            } ${isSelected ? 'text-foreground' : ''}`}>
                                            {segment.text}
                                        </p>

                                        {/* Selected indicator line */}
                                        {isSelected && (
                                            <div className="absolute right-0 top-2 bottom-2 w-[2px] rounded-full"
                                                style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
                                        )}
                                    </div>

                                    {/* ===== Add Overlay Popup ===== */}
                                    {isPopupOpen && (
                                        <div className="mx-3 mb-2 rounded-lg border border-border overflow-hidden"
                                            style={{ background: 'var(--bg-secondary)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
                                            onClick={(e) => e.stopPropagation()}>

                                            {/* Popup Header */}
                                            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                                                <span className="text-[11px] font-semibold text-foreground/80">
                                                    {hasOverlay ? 'Change' : 'Add'} Motion Graphic
                                                </span>
                                                <button
                                                    onClick={() => { setPopupSegmentId(null); setCustomText(''); }}
                                                    className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Custom Text Input */}
                                            <div className="px-3 pt-2 pb-1">
                                                <input
                                                    type="text"
                                                    value={customText}
                                                    onChange={(e) => setCustomText(e.target.value)}
                                                    placeholder="Custom label text (optional)"
                                                    className="w-full text-[11px] px-2.5 py-1.5 rounded-md border border-border bg-black/20 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                                />
                                            </div>

                                            {/* Overlay Type Grid */}
                                            <div className="grid grid-cols-2 gap-1.5 p-3">
                                                {OVERLAY_TEMPLATES.map((template) => (
                                                    <button
                                                        key={template.type}
                                                        onClick={() => handleAddOverlay(segment.id, template)}
                                                        className="flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-all hover:bg-white/[0.06] group/btn"
                                                        style={{
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                        }}
                                                    >
                                                        <span className="text-sm shrink-0">{template.icon}</span>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-semibold text-foreground/80 truncate group-hover/btn:text-foreground transition-colors">
                                                                {template.name}
                                                            </p>
                                                            <p className="text-[8px] text-muted-foreground/50 truncate">
                                                                {template.description}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer hint */}
            {subtitles.length > 0 && (
                <div className="px-4 py-2 border-t border-border shrink-0">
                    <p className="text-[9px] text-muted-foreground/50 text-center">
                        <span style={{ color: 'rgba(167, 139, 250, 0.5)' }}>━</span> highlighted = has motion graphic • hover for controls
                    </p>
                </div>
            )}
        </div>
    );
}

export default TranscriptPanel;
