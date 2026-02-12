'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    OverlayType,
    OVERLAY_TEMPLATES,
    ProjectState,
} from '../../lib/types';
import { transcribeVideo } from '../../lib/transcribe';
import { suggestOverlaysWithAI, autoSuggestOverlays } from '../../lib/ai';
import { OverlayContextMenu } from '../../components/editor/OverlayContextMenu';

const PlayerPreview = dynamic(() => import('../../components/editor/PlayerPreview'), {
    ssr: false,
    loading: () => (
        <div className="w-full aspect-video rounded-xl flex items-center justify-center border border-border/40 animate-pulse" style={{ background: 'rgba(28, 28, 34, 0.5)' }}>
            <div className="text-center">
                <div className="spinner w-6 h-6 mx-auto mb-2" />
                <span className="text-xs text-muted-foreground">Loading preview…</span>
            </div>
        </div>
    ),
});

/* ===== SVG Icons ===== */
const Icons = {
    Sun: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
    Moon: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
    Sparkles: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>,
    Upload: () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30 group-hover:text-indigo-400/60 transition-colors duration-300"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>,
    Film: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/10"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>,
    Export: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    FileText: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
};

export default function EditorPage() {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [state, setState] = useState<ProjectState>({
        videoSrc: null,
        videoFile: null,
        subtitles: [],
        selectedSegmentId: null,
        isTranscribing: false,
        isGenerating: false,
        videoDuration: 30,
        videoWidth: 1920,
        videoHeight: 1080,
        fps: 30,
    });

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') {
            setTheme(saved);
            document.documentElement.setAttribute('data-theme', saved);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = useCallback((file: File) => {
        if (!file.type.startsWith('video/')) { alert('Please upload a video file (MP4, WebM, etc.)'); return; }
        if (file.size > 50 * 1024 * 1024) { alert('File too large. Max 50MB.'); return; }

        const url = URL.createObjectURL(file);
        setState((prev) => ({ ...prev, videoSrc: url, videoFile: file }));

        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = async () => {
            const duration = video.duration;
            const width = video.videoWidth || 1920;
            const height = video.videoHeight || 1080;
            setState((prev) => ({ ...prev, videoDuration: duration, videoWidth: width, videoHeight: height, isTranscribing: true }));
            try {
                const { subtitles: transcript, isReal } = await transcribeVideo(file, duration);
                setState((prev) => ({ ...prev, subtitles: transcript, isTranscribing: false }));
                if (isReal) console.log('✅ Real transcription completed');
                else console.warn('Using mock transcript');
                if (transcript.length > 0) {
                    setState((prev) => ({ ...prev, isGenerating: true }));
                    try {
                        const withOverlays = await suggestOverlaysWithAI(transcript);
                        setState((prev) => ({ ...prev, subtitles: withOverlays, isGenerating: false }));
                    } catch {
                        setState((prev) => ({ ...prev, subtitles: autoSuggestOverlays(prev.subtitles), isGenerating: false }));
                    }
                }
            } catch (err) {
                console.error('Auto-transcription failed:', err);
                setState((prev) => ({ ...prev, isTranscribing: false }));
            }
        };
        video.src = url;
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); }, [handleUpload]);

    const handleAutoSuggest = useCallback(async () => {
        setState((prev) => ({ ...prev, isGenerating: true }));
        try {
            const withOverlays = await suggestOverlaysWithAI(state.subtitles.map((s) => ({ ...s, overlay: undefined })));
            setState((prev) => ({ ...prev, subtitles: withOverlays, isGenerating: false }));
        } catch {
            setState((prev) => ({ ...prev, subtitles: autoSuggestOverlays(prev.subtitles), isGenerating: false }));
        }
    }, [state.subtitles]);

    const [activePopup, setActivePopup] = useState<{ segmentId: string; top: number; left: number } | null>(null);

    const applyOverlay = useCallback((type: OverlayType, customProps?: Record<string, unknown>) => {
        const targetId = activePopup?.segmentId || state.selectedSegmentId;
        if (!targetId) return;
        const template = OVERLAY_TEMPLATES.find((t) => t.type === type);
        const props = customProps || (template ? { ...template.defaultProps } : {});
        setState((prev) => ({ ...prev, subtitles: prev.subtitles.map((seg) => seg.id === targetId ? { ...seg, overlay: { type, props } } : seg) }));
    }, [state.selectedSegmentId, activePopup]);

    const handleClearOverlay = useCallback(() => {
        const targetId = activePopup?.segmentId || state.selectedSegmentId;
        if (!targetId) return;
        setState((prev) => ({ ...prev, subtitles: prev.subtitles.map((seg) => seg.id === targetId ? { ...seg, overlay: undefined } : seg) }));
        setActivePopup(null);
    }, [state.selectedSegmentId, activePopup]);

    const selectSegment = useCallback((id: string) => {
        setState((prev) => ({ ...prev, selectedSegmentId: prev.selectedSegmentId === id ? null : id }));
    }, []);

    const overlayCount = state.subtitles.filter(s => s.overlay).length;

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }} suppressHydrationWarning>
            {!mounted ? (
                <div className="flex-1 flex items-center justify-center"><div className="spinner w-8 h-8" /></div>
            ) : (
                <>
                    {/* ===== Header ===== */}
                    <header className="h-12 flex items-center justify-between px-4 border-b border-border z-20 shrink-0 glass">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>M</div>
                            <span className="text-sm font-bold tracking-tight">
                                Make<span className="gradient-text">Script</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-1.5">
                            {overlayCount > 0 && (
                                <span className="badge text-[10px] py-0.5 px-2.5 mr-1" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                                    {overlayCount} overlay{overlayCount > 1 ? 's' : ''}
                                </span>
                            )}
                            {state.subtitles.length > 0 && (
                                <button className="btn-secondary py-1 px-3 text-[11px] rounded-lg gap-1.5 h-7" onClick={handleAutoSuggest} disabled={state.isGenerating}>
                                    {state.isGenerating ? <><span className="spinner w-3 h-3" /> Suggesting…</> : <><Icons.Sparkles /> AI Suggest</>}
                                </button>
                            )}
                            <span className="w-px h-5 bg-border mx-0.5" />
                            <button className="btn-ghost p-1.5 rounded-md" onClick={toggleTheme} title="Toggle theme" suppressHydrationWarning>
                                {mounted ? (theme === 'light' ? <Icons.Moon /> : <Icons.Sun />) : <Icons.Moon />}
                            </button>
                            <button className="btn-primary py-1 px-3 text-[11px] rounded-lg gap-1.5 h-7">
                                <Icons.Export /> Export
                            </button>
                        </div>
                    </header>

                    {/* ===== Main ===== */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar */}
                        <aside className="w-[340px] flex flex-col border-r border-border z-10 shrink-0" style={{ background: 'rgba(18, 18, 22, 0.6)', backdropFilter: 'blur(12px)' }}>
                            <div className="px-4 py-3.5 border-b border-border/60">
                                <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Icons.FileText />
                                        <h2 className="font-semibold text-xs">Transcript</h2>
                                    </div>
                                    {state.subtitles.length > 0 && (
                                        <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                            {state.subtitles.length} segments
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground/60">Click segments to add overlays</p>
                            </div>

                            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar">
                                {state.subtitles.length === 0 && !state.videoFile ? (
                                    <div className="flex flex-col items-center justify-center h-full p-5">
                                        <input ref={fileInputRef} type="file" accept="video/*"
                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} className="hidden" />
                                        <div onClick={() => fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                                            className="w-full border border-dashed border-border/60 hover:border-indigo-500/30 rounded-xl p-8 transition-all duration-500 cursor-pointer group text-center"
                                            style={{ background: 'rgba(99, 102, 241, 0.02)' }}>
                                            <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-500"><Icons.Upload /></div>
                                            <div className="text-sm font-semibold mb-1">Upload a Video</div>
                                            <div className="text-[11px] text-muted-foreground/50">MP4, WebM — max 50 MB</div>
                                            <div className="mt-4 text-[9px] text-muted-foreground/30 uppercase tracking-widest font-medium">or drag & drop</div>
                                        </div>
                                    </div>
                                ) : state.subtitles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                                        <div className="spinner w-6 h-6 opacity-60" />
                                        <div className="text-center">
                                            <div className="text-xs font-semibold mb-1">
                                                {state.isTranscribing ? 'Transcribing…' : state.isGenerating ? 'Generating overlays…' : 'Processing…'}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground/50">Whisper AI speech-to-text</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5 pb-8">
                                        {state.subtitles.map((seg) => {
                                            const hasOverlay = !!seg.overlay;
                                            const isSelected = state.selectedSegmentId === seg.id;
                                            return (
                                                <div key={seg.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); selectSegment(seg.id);
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setActivePopup({ segmentId: seg.id, top: rect.bottom + 8, left: rect.left });
                                                    }}
                                                    className={`group relative px-3 py-2.5 rounded-lg text-[12px] leading-relaxed cursor-pointer transition-all duration-200 border ${hasOverlay
                                                            ? 'border-amber-500/15 hover:border-amber-500/25'
                                                            : isSelected
                                                                ? 'border-indigo-500/25 ring-1 ring-indigo-500/10'
                                                                : 'border-transparent hover:border-border/40'
                                                        }`}
                                                    style={{
                                                        background: hasOverlay ? 'rgba(245, 158, 11, 0.04)' : isSelected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                                    }}>
                                                    <span className="text-foreground/80">{seg.text}</span>
                                                    {hasOverlay && (
                                                        <span className="absolute right-2 top-2 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                                                            style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                                            {seg.overlay?.type.split('-').map(w => w[0]).join('')}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* Stage */}
                        <main className="flex-1 flex flex-col min-w-0">
                            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative grid-bg">
                                {state.videoSrc ? (
                                    <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.5), 0 0 120px rgba(99, 102, 241, 0.05)' }}>
                                        <PlayerPreview videoSrc={state.videoSrc} subtitles={state.subtitles} fps={30}
                                            durationInFrames={Math.ceil((state.videoDuration || 10) * 30)}
                                            compositionWidth={state.videoWidth} compositionHeight={state.videoHeight} />
                                    </div>
                                ) : (
                                    <div className="text-center p-16 rounded-2xl max-w-sm" style={{ background: 'rgba(28, 28, 34, 0.3)', border: '1px dashed rgba(255,255,255,0.06)' }}>
                                        <div className="flex justify-center mb-3"><Icons.Film /></div>
                                        <p className="text-xs font-medium text-muted-foreground/60 mb-0.5">No video loaded</p>
                                        <p className="text-[11px] text-muted-foreground/30">Upload from the sidebar to begin</p>
                                    </div>
                                )}
                            </div>

                            {/* Status bar */}
                            <div className="h-10 border-t border-border px-5 flex items-center justify-between text-[10px] text-muted-foreground/50 shrink-0 glass">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono">00:00 / {state.videoDuration.toFixed(1)}s</span>
                                    <span className="w-px h-3 bg-border" />
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34, 197, 94, 0.4)' }} />
                                        Ready
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span>{state.fps} fps</span>
                                    <span className="w-px h-3 bg-border" />
                                    <span>{state.videoWidth}×{state.videoHeight}</span>
                                </div>
                            </div>
                        </main>
                    </div>

                    {/* Context menu */}
                    {activePopup && (() => {
                        const seg = state.subtitles.find((s) => s.id === activePopup.segmentId);
                        return (
                            <OverlayContextMenu key={activePopup.segmentId} segmentId={activePopup.segmentId}
                                segmentText={seg?.text || ''} existingOverlayType={seg?.overlay?.type}
                                existingProps={seg?.overlay?.props} onApply={applyOverlay}
                                onApplyConfig={(config) => {
                                    const targetId = activePopup?.segmentId || state.selectedSegmentId;
                                    if (!targetId) return;
                                    setState((prev) => ({ ...prev, subtitles: prev.subtitles.map((s) => s.id === targetId ? { ...s, overlay: config } : s) }));
                                    setActivePopup(null);
                                }}
                                onClear={handleClearOverlay} onClose={() => setActivePopup(null)}
                                position={{ top: activePopup.top, left: activePopup.left }} />
                        );
                    })()}
                </>
            )}
        </div>
    );
}
