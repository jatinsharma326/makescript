'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    SubtitleSegment,
    OverlayType,
    OVERLAY_TEMPLATES,
    ProjectState,
} from '../../lib/types';
import { generateMockTranscript, formatTime } from '../../lib/transcribe';
import { autoSuggestOverlays } from '../../lib/ai';

// Dynamic import of Player to avoid SSR issues with Remotion
const PlayerPreview = dynamic(() => import('../../components/editor/PlayerPreview'), {
    ssr: false,
    loading: () => (
        <div style={{
            width: '100%',
            aspectRatio: '16/9',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
        }}>
            Loading preview...
        </div>
    ),
});

export default function EditorPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [state, setState] = useState<ProjectState>({
        videoSrc: null,
        videoFile: null,
        subtitles: [],
        selectedSegmentId: null,
        isTranscribing: false,
        isGenerating: false,
        videoDuration: 30,
        fps: 30,
    });

    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') {
            setTheme(saved);
            document.documentElement.setAttribute('data-theme', saved);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
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
    const videoRef = useRef<HTMLVideoElement>(null);

    // Handle video upload
    const handleUpload = useCallback((file: File) => {
        if (!file.type.startsWith('video/')) {
            alert('Please upload a video file (MP4, WebM, etc.)');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            alert('File too large. Please upload a video under 50MB.');
            return;
        }

        const url = URL.createObjectURL(file);
        setState((prev) => ({ ...prev, videoSrc: url, videoFile: file }));

        // Get video duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            const duration = video.duration;
            setState((prev) => ({ ...prev, videoDuration: duration }));
            URL.revokeObjectURL(video.src);
        };
        video.src = url;
    }, []);

    // Handle drag and drop
    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleUpload(file);
        },
        [handleUpload]
    );

    // Generate transcript
    const handleTranscribe = useCallback(() => {
        setState((prev) => ({ ...prev, isTranscribing: true }));
        // Simulate transcription delay
        setTimeout(() => {
            const transcript = generateMockTranscript(state.videoDuration);
            setState((prev) => ({
                ...prev,
                subtitles: transcript,
                isTranscribing: false,
            }));
        }, 1500);
    }, [state.videoDuration]);

    // Auto-suggest overlays via AI
    const handleAutoSuggest = useCallback(() => {
        setState((prev) => ({ ...prev, isGenerating: true }));
        setTimeout(() => {
            setState((prev) => ({
                ...prev,
                subtitles: autoSuggestOverlays(prev.subtitles),
                isGenerating: false,
            }));
        }, 1000);
    }, []);

    // Apply overlay to selected segment
    const applyOverlay = useCallback(
        (type: OverlayType) => {
            if (!state.selectedSegmentId) return;
            const template = OVERLAY_TEMPLATES.find((t) => t.type === type);
            if (!template) return;

            setState((prev) => ({
                ...prev,
                subtitles: prev.subtitles.map((seg) =>
                    seg.id === prev.selectedSegmentId
                        ? { ...seg, overlay: { type, props: { ...template.defaultProps } } }
                        : seg
                ),
            }));
        },
        [state.selectedSegmentId]
    );

    // Remove overlay from segment
    const removeOverlay = useCallback((segId: string) => {
        setState((prev) => ({
            ...prev,
            subtitles: prev.subtitles.map((seg) =>
                seg.id === segId ? { ...seg, overlay: undefined } : seg
            ),
        }));
    }, []);

    // Select a segment
    const selectSegment = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            selectedSegmentId: prev.selectedSegmentId === id ? null : id,
        }));
    }, []);

    const selectedSegment = state.subtitles.find(
        (s) => s.id === state.selectedSegmentId
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top bar */}
            <header
                className="glass"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 24px',
                    borderBottom: '1px solid var(--border-color)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                }}
            >
                <Link
                    href="/"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                    }}
                >
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 800, boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' }}>M</div>
                    <span style={{ fontSize: '18px', fontWeight: 800 }}>
                        Make<span className="gradient-text">Script</span>
                    </span>
                </Link>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {state.subtitles.length > 0 && (
                        <button
                            className="btn-secondary"
                            onClick={handleAutoSuggest}
                            disabled={state.isGenerating}
                        >
                            {state.isGenerating ? (
                                <>
                                    <span className="spinner" /> Suggesting...
                                </>
                            ) : (
                                '🤖 AI Auto-Suggest'
                            )}
                        </button>
                    )}
                    <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                </div>
            </header>

            {/* Main editor layout */}
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden',
                }}
            >
                {/* Left: Video + Preview */}
                <div
                    style={{
                        flex: 2,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        overflowY: 'auto',
                    }}
                >
                    {/* Step 1: Upload */}
                    {!state.videoSrc ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                borderRadius: 'var(--radius-lg)',
                                border: '2px dashed var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '16px',
                                cursor: 'pointer',
                                background: 'var(--bg-card)',
                                transition: 'all 0.3s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.background = 'var(--accent-light)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.background = 'var(--bg-card)';
                            }}
                        >
                            <div
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'var(--accent-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '36px',
                                }}
                            >
                                📤
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
                                    Drop your video here
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    or click to browse • MP4, WebM • Max 50MB
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(file);
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            {/* Video preview with Remotion Player or native video */}
                            {state.subtitles.length > 0 ? (
                                <PlayerPreview
                                    videoSrc={state.videoSrc}
                                    subtitles={state.subtitles}
                                    durationInFrames={Math.ceil(state.videoDuration * state.fps)}
                                    fps={state.fps}
                                />
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <video
                                        ref={videoRef}
                                        src={state.videoSrc}
                                        controls
                                        style={{
                                            width: '100%',
                                            borderRadius: 'var(--radius)',
                                            background: '#000',
                                        }}
                                    />
                                </div>
                            )}

                            {/* Transcribe button */}
                            {state.subtitles.length === 0 && (
                                <button
                                    className="btn-primary"
                                    onClick={handleTranscribe}
                                    disabled={state.isTranscribing}
                                    style={{ alignSelf: 'center' }}
                                >
                                    {state.isTranscribing ? (
                                        <>
                                            <span className="spinner" /> Generating Transcript...
                                        </>
                                    ) : (
                                        '📝 Generate Transcript'
                                    )}
                                </button>
                            )}
                        </>
                    )}

                    {/* Instructions */}
                    {state.videoSrc && state.subtitles.length > 0 && (
                        <div
                            style={{
                                padding: '12px 16px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--accent-light)',
                                border: '1px solid var(--accent-primary)',
                                borderColor: 'rgba(37, 99, 235, 0.25)',
                                fontSize: '13px',
                                color: 'var(--accent-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            💡 Click any subtitle on the right → Pick a motion graphic to apply to that moment
                        </div>
                    )}
                </div>

                {/* Right: Subtitle Timeline + Overlay Picker */}
                {state.videoSrc && (
                    <div
                        style={{
                            flex: 1,
                            minWidth: '340px',
                            maxWidth: '420px',
                            borderLeft: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'var(--bg-secondary)',
                        }}
                    >
                        {/* Subtitle list */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '16px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '14px',
                                }}
                            >
                                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                                    📝 Subtitles
                                    {state.subtitles.length > 0 && (
                                        <span
                                            style={{
                                                marginLeft: '8px',
                                                fontSize: '12px',
                                                color: 'var(--text-secondary)',
                                                fontWeight: 400,
                                            }}
                                        >
                                            ({state.subtitles.length} segments)
                                        </span>
                                    )}
                                </h3>
                            </div>

                            {state.subtitles.length === 0 ? (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        color: 'var(--text-secondary)',
                                        padding: '40px 20px',
                                        fontSize: '14px',
                                    }}
                                >
                                    <p style={{ fontSize: '32px', marginBottom: '12px' }}>📝</p>
                                    <p>Click &quot;Generate Transcript&quot; to get started</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {state.subtitles.map((seg) => (
                                        <div
                                            key={seg.id}
                                            onClick={() => selectSegment(seg.id)}
                                            style={{
                                                padding: '12px',
                                                borderRadius: 'var(--radius-sm)',
                                                background:
                                                    state.selectedSegmentId === seg.id
                                                        ? 'var(--accent-light)'
                                                        : 'var(--bg-card)',
                                                border:
                                                    state.selectedSegmentId === seg.id
                                                        ? '1px solid var(--accent-primary)'
                                                        : '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (state.selectedSegmentId !== seg.id) {
                                                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (state.selectedSegmentId !== seg.id) {
                                                    e.currentTarget.style.background = 'var(--bg-card)';
                                                }
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '4px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '11px',
                                                        color: 'var(--accent-primary)',
                                                        fontWeight: 600,
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    {formatTime(seg.startTime)} — {formatTime(seg.endTime)}
                                                </span>
                                                {seg.overlay && (
                                                    <button
                                                        className="btn-ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeOverlay(seg.id);
                                                        }}
                                                        style={{ padding: '2px 6px', fontSize: '11px' }}
                                                        title="Remove overlay"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                            <p
                                                style={{
                                                    fontSize: '13px',
                                                    color: 'var(--text-primary)',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {seg.text}
                                            </p>
                                            {seg.overlay && (
                                                <div
                                                    style={{
                                                        marginTop: '6px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '3px 10px',
                                                        borderRadius: '12px',
                                                        background: 'var(--accent-light)',
                                                        fontSize: '11px',
                                                        color: 'var(--accent-primary)',
                                                    }}
                                                >
                                                    {OVERLAY_TEMPLATES.find((t) => t.type === seg.overlay?.type)?.icon}{' '}
                                                    {OVERLAY_TEMPLATES.find((t) => t.type === seg.overlay?.type)?.name}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Overlay picker - shown when a segment is selected */}
                        {selectedSegment && (
                            <div
                                style={{
                                    borderTop: '1px solid var(--border-color)',
                                    padding: '16px',
                                    background: 'var(--bg-card)',
                                }}
                            >
                                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                                    🎨 Add Motion Graphic
                                </h4>
                                <p
                                    style={{
                                        fontSize: '11px',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '12px',
                                    }}
                                >
                                    Applying to: &quot;{selectedSegment.text.substring(0, 40)}...&quot;
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {OVERLAY_TEMPLATES.map((template) => (
                                        <button
                                            key={template.type}
                                            onClick={() => applyOverlay(template.type)}
                                            style={{
                                                padding: '12px',
                                                borderRadius: 'var(--radius-sm)',
                                                border:
                                                    selectedSegment.overlay?.type === template.type
                                                        ? '1px solid var(--accent-primary)'
                                                        : '1px solid var(--border-color)',
                                                background:
                                                    selectedSegment.overlay?.type === template.type
                                                        ? 'var(--accent-light)'
                                                        : 'var(--bg-secondary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s',
                                                color: 'var(--text-primary)',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedSegment.overlay?.type !== template.type) {
                                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                                }
                                            }}
                                        >
                                            <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                                                {template.icon}
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: 600 }}>
                                                {template.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '10px',
                                                    color: 'var(--text-secondary)',
                                                    marginTop: '2px',
                                                }}
                                            >
                                                {template.description}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
