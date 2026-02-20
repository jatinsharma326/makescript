'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { PlayerPreviewHandle } from '../../components/editor/PlayerPreview';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    OverlayType,
    OVERLAY_TEMPLATES,
    ProjectState,
    ProjectMeta,
    DEFAULT_FILTERS,
    EditorTab,
    TranscriptStatus,
    SubtitleSegment,
} from '../../lib/types';
import { transcribeVideo, generateMockTranscript } from '../../lib/transcribe';
import { suggestOverlaysWithAI, generateDynamicOverlays as autoSuggestOverlays } from '../../lib/ai';
import { AI_MODELS, DEFAULT_MODEL, TIERS, getModelsForTier, isModelAccessible, type ModelTier, type AIModel } from '../../lib/models';
import {
    saveProject,
    loadProject,
    deleteProject,
    deleteAllProjects,
    getProjectList,
    reconstructFile,
} from '../../lib/projectStorage';
import { useToast } from '../../components/ui/Toast';
import { useUndoRedo } from '../../lib/useUndoRedo';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import {
    Sun,
    Moon,
    Sparkles,
    Upload,
    Film,
    Download,
    Settings,
    FileText,
    ChevronLeft,
    Clock,
    Layers,
    Sliders,
    Trash2,
    Check,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { ProjectSidebar } from '../../components/dashboard/ProjectSidebar';
import { Dashboard } from '../../components/dashboard/Dashboard';

const ExportModal = dynamic(() => import('../../components/ui/ExportModal'), { ssr: false });
const ConfirmDialog = dynamic(() => import('../../components/ui/ConfirmDialog'), { ssr: false });
const KeyboardShortcutsModal = dynamic(() => import('../../components/ui/KeyboardShortcutsModal'), { ssr: false });

const EditorPanel = dynamic(() => import('../../components/editor/EditorPanel'), { ssr: false });
const Timeline = dynamic(() => import('../../components/editor/Timeline'), { ssr: false });
import { OverlayContextMenu } from '../../components/editor/OverlayContextMenu';

const TranscriptPanel = dynamic(() => import('../../components/editor/TranscriptPanel'), { ssr: false });

import PlayerPreview from '../../components/editor/PlayerPreview';

export default function EditorPage() {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [projectList, setProjectList] = useState<ProjectMeta[]>([]);
    const [state, setState] = useState<ProjectState>({
        projectId: null,
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
        filters: { ...DEFAULT_FILTERS },
        trimPoints: { inPoint: 0, outPoint: 30 },
        playbackSpeed: 1,
        textOverlays: [],
        activeEditorTab: 'filters',
        showEditorPanel: false,
        transcriptStatus: 'none',
    });

    const [showExportModal, setShowExportModal] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
    const [activePopup, setActivePopup] = useState<{ segmentId: string; top: number; left: number } | null>(null);
    const [processingStep, setProcessingStep] = useState<'idle' | 'uploading' | 'transcribing' | 'generating' | 'done'>('idle');
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
    const [userTier, setUserTier] = useState<ModelTier>('free');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const { toast } = useToast();
    const { pushSnapshot, undo, redo, pushToFuture, resetHistory } = useUndoRedo();

    // Refs
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stateRef = useRef(state);
    stateRef.current = state;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const newUploadInputRef = useRef<HTMLInputElement>(null);
    const playerPreviewRef = useRef<PlayerPreviewHandle>(null);

    // Current playback time (updated from PlayerPreview)
    const [currentTime, setCurrentTime] = useState(0);

    const handleSeek = useCallback((time: number) => {
        if (playerPreviewRef.current) {
            playerPreviewRef.current.seekTo(time);
            setCurrentTime(time);
        }
    }, []);

    // Playback state for timeline controls
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayPause = useCallback(() => {
        if (playerPreviewRef.current) {
            playerPreviewRef.current.toggle();
            setIsPlaying(playerPreviewRef.current.isPlaying());
        }
    }, []);

    const handleSkip = useCallback((delta: number) => {
        if (playerPreviewRef.current) {
            const newTime = Math.max(0, Math.min(state.videoDuration, currentTime + delta));
            playerPreviewRef.current.seekTo(newTime);
            setCurrentTime(newTime);
        }
    }, [currentTime, state.videoDuration]);

    const handleSplitSegment = useCallback((segId: string, splitTime: number) => {
        setState(prev => {
            const seg = prev.subtitles.find(s => s.id === segId);
            if (!seg) return prev;
            const firstHalf: SubtitleSegment = {
                ...seg,
                id: `${seg.id}_a`,
                endTime: splitTime,
                text: seg.text, // keep full text on first half
            };
            const secondHalf: SubtitleSegment = {
                id: `${seg.id}_b`,
                startTime: splitTime,
                endTime: seg.endTime,
                text: '', // empty second half
            };
            const newSubs = prev.subtitles.flatMap(s =>
                s.id === segId ? [firstHalf, secondHalf] : [s]
            );
            pushSnapshot({ subtitles: prev.subtitles });
            return { ...prev, subtitles: newSubs };
        });
        toast('Segment split at playhead', 'success');
    }, [pushSnapshot, toast]);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') {
            setTheme(saved);
            document.documentElement.setAttribute('data-theme', saved);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        setProjectList(getProjectList());
    }, []);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    // ===== Project Storage Helpers =====
    const saveCurrentProject = useCallback(async (st?: ProjectState) => {
        const s = st || stateRef.current;
        if (!s.projectId || !s.videoFile) return;
        try {
            const buffer = await s.videoFile.arrayBuffer();
            await saveProject({
                meta: {
                    id: s.projectId,
                    name: s.videoFile.name,
                    createdAt: Date.now(),
                    duration: s.videoDuration,
                    segmentCount: s.subtitles.length,
                    overlayCount: s.subtitles.filter(seg => seg.overlay).length,
                    transcriptStatus: s.transcriptStatus,
                },
                subtitles: s.subtitles,
                filters: s.filters,
                trimPoints: s.trimPoints,
                playbackSpeed: s.playbackSpeed,
                textOverlays: s.textOverlays,
                videoWidth: s.videoWidth,
                videoHeight: s.videoHeight,
                fps: s.fps,
                videoBuffer: buffer,
                videoType: s.videoFile.type,
                videoName: s.videoFile.name,
            });
            setProjectList(getProjectList());
        } catch (e) {
            console.error('Failed to save project:', e);
        }
    }, [setProjectList]);

    // Auto-save
    useEffect(() => {
        if (!state.projectId) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveCurrentProject(state);
        }, 2000);
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [
        state.subtitles,
        state.filters,
        state.trimPoints,
        state.playbackSpeed,
        state.textOverlays,
        state.projectId,
        saveCurrentProject
    ]);

    // Undo/Redo registration
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    const next = redo();
                    if (next) setState(prev => ({ ...prev, ...next }));
                } else {
                    const prev = undo();
                    if (prev) setState(curr => ({ ...curr, ...prev }));
                }
            }
            if (e.key === '/') {
                e.preventDefault();
                setShowShortcuts(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    // State updaters
    const updateState = (updates: Partial<ProjectState>) => {
        setState(prev => {
            const next = { ...prev, ...updates };
            // Snapshot for undo
            if (
                updates.subtitles !== undefined ||
                updates.trimPoints !== undefined ||
                updates.filters !== undefined ||
                updates.textOverlays !== undefined
            ) {
                pushSnapshot({
                    subtitles: next.subtitles,
                    filters: next.filters,
                    trimPoints: next.trimPoints,
                    textOverlays: next.textOverlays,
                    playbackSpeed: next.playbackSpeed
                });
            }
            return next;
        });
    };

    const handleUpload = useCallback(async (file: File) => {
        if (file.size > 2 * 1024 * 1024 * 1024) {
            toast('File size exceeds 2GB limit', 'error');
            return;
        }

        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.muted = true;
        video.preload = 'metadata';
        video.src = url;

        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(null);
            };
        });

        const duration = video.duration || 30;
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;

        // Clean up the probe video to prevent double audio playback
        video.pause();
        video.removeAttribute('src');
        video.load();

        const projectId = `proj_${Date.now()}`;

        setState((prev) => ({
            ...prev,
            projectId,
            videoSrc: url,
            videoFile: file,
            videoDuration: duration,
            trimPoints: { inPoint: 0, outPoint: duration },
            videoWidth: width,
            videoHeight: height,
            subtitles: [],
            selectedSegmentId: null,
            textOverlays: [],
            isTranscribing: true,
            isGenerating: false,
            transcriptStatus: 'transcribing'
        }));

        toast('Analyzing video and transcribing audio...', 'info');
        setProcessingStep('transcribing');

        try {
            const { subtitles: transcript, isReal, noAudio } = await transcribeVideo(file, duration);

            console.log('[Editor] Transcription result:', { isReal, noAudio, segmentCount: transcript.length });

            if (noAudio) {
                toast('No speech detected. Using mock transcript.', 'info');
                const mockSubs = generateMockTranscript(duration);
                console.log('[Editor] Generated mock subtitles:', mockSubs.length);
                updateState({
                    subtitles: mockSubs,
                    isTranscribing: false,
                    transcriptStatus: 'mock-no-audio'
                });
                return;
            }

            if (isReal && transcript.length > 0) {
                // Real transcription succeeded with segments
                console.log('[Editor] Real transcription succeeded with', transcript.length, 'segments');
                updateState({
                    subtitles: transcript,
                    isTranscribing: false,
                    transcriptStatus: 'real'
                });
                toast('Transcription complete! Generating motion graphics...', 'success');
            } else {
                // API failed or returned empty — fall back to mock transcript
                console.log('[Editor] Transcription API failed or empty, using mock fallback');
                const mockSubs = transcript.length > 0 ? transcript : generateMockTranscript(duration);
                const status = isReal ? 'real' : 'mock-error';
                console.log('[Editor] Fallback mock subtitles:', mockSubs.length);
                updateState({
                    subtitles: mockSubs,
                    isTranscribing: false,
                    transcriptStatus: status
                });
                toast(
                    transcript.length > 0
                        ? 'Transcription returned results. Generating motion graphics...'
                        : 'API unavailable — using mock transcript. Generating motion graphics...',
                    'warning'
                );
            }

        } catch (err) {
            console.error('[Editor] Transcription error:', err);
            // Fallback to mock transcript so user still gets subtitles
            const mockSubs = generateMockTranscript(duration);
            console.log('[Editor] Error fallback - generated mock subtitles:', mockSubs.length);
            updateState({
                subtitles: mockSubs,
                isTranscribing: false,
                transcriptStatus: 'mock-error'
            });
            toast('Transcription failed — using mock transcript. Generating motion graphics...', 'warning');
        }
    }, [saveCurrentProject, toast, updateState]); // Added updateState dependency implicitly via component scope

    const handleGenerateOverlays = async (currentSubtitles = state.subtitles) => {
        console.log('[handleGenerateOverlays] Called with', currentSubtitles.length, 'subtitles');
        console.log('[handleGenerateOverlays] Current state subtitles:', state.subtitles.length);
        console.log('[handleGenerateOverlays] isGenerating:', state.isGenerating);

        if (currentSubtitles.length === 0) {
            console.log('[handleGenerateOverlays] Skipping - no subtitles');
            return;
        }

        // Prevent duplicate concurrent calls
        if (state.isGenerating) {
            console.log('[handleGenerateOverlays] Already generating, skipping');
            return;
        }

        updateState({ isGenerating: true });
        setProcessingStep('generating');
        toast('Generating dynamic overlays...', 'info');

        try {
            console.log('[handleGenerateOverlays] Calling suggestOverlaysWithAI with model:', selectedModel);
            const newSubtitles = await suggestOverlaysWithAI(currentSubtitles, selectedModel);

            console.log('[handleGenerateOverlays] Result:', newSubtitles.length, 'segments');
            const overlaysCount = newSubtitles.filter(s => s.overlay).length;
            console.log('[handleGenerateOverlays] Segments with overlays:', overlaysCount);

            newSubtitles.forEach((s, i) => {
                if (s.overlay) {
                    console.log(`  [${i}] "${s.text.substring(0, 30)}..." -> ${s.overlay.type}:${s.overlay.props.scene}`);
                }
            });

            // Ensure at least some overlays are generated - force if none
            if (overlaysCount === 0 && newSubtitles.length > 0) {
                console.log('[handleGenerateOverlays] No overlays generated, forcing fallback...');
                const forced = autoSuggestOverlays(newSubtitles);
                const forcedCount = forced.filter(s => s.overlay).length;
                console.log('[handleGenerateOverlays] Forced overlays:', forcedCount);
                updateState({
                    subtitles: forced,
                    isGenerating: false,
                });
                toast('Added motion graphics to your video!', 'success');
                setProcessingStep('done');
                setTimeout(() => setProcessingStep('idle'), 2000);
            } else {
                updateState({
                    subtitles: newSubtitles,
                    isGenerating: false,
                });
                toast('AI overlays applied successfully!', 'success');
                setProcessingStep('done');
                setTimeout(() => setProcessingStep('idle'), 2000);
            }
        } catch (e) {
            console.error('[handleGenerateOverlays] Error:', e);
            // Fallback — use local rule-based overlay suggestions
            const fallback = autoSuggestOverlays(currentSubtitles);
            const fallbackCount = fallback.filter(s => s.overlay).length;
            console.log('[handleGenerateOverlays] Fallback overlays:', fallbackCount);

            // Use whatever the local rules produced — don't force overlays on every segment
            updateState({
                subtitles: fallback,
                isGenerating: false,
            });
            toast(fallbackCount > 0
                ? `AI unavailable — added ${fallbackCount} overlays using local rules.`
                : 'AI unavailable — you can manually add overlays from the transcript panel.',
                'warning'
            );
            setProcessingStep('done');
            setTimeout(() => setProcessingStep('idle'), 2000);
        }
    };

    // Auto-trigger overlay generation when transcription completes
    // This avoids stale closure issues from calling handleGenerateOverlays inside handleUpload
    const hasTriggeredOverlays = useRef(false);
    useEffect(() => {
        // When transcription finishes and we have subtitles without any overlays yet
        if (
            !state.isTranscribing &&
            state.subtitles.length > 0 &&
            !state.isGenerating &&
            !hasTriggeredOverlays.current &&
            !state.subtitles.some(s => s.overlay) // No overlays assigned yet
        ) {
            console.log('[useEffect] Transcription done, auto-generating overlays for', state.subtitles.length, 'segments');
            hasTriggeredOverlays.current = true;
            handleGenerateOverlays(state.subtitles);
        }

        // Reset the trigger when a new video starts transcribing
        if (state.isTranscribing) {
            hasTriggeredOverlays.current = false;
        }
    }, [state.isTranscribing, state.subtitles, state.isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

    // ... handlers for timeline, layout etc ...
    const handleSegmentUpdate = (id: string, updates: any) => {
        const newSubs = state.subtitles.map(s => s.id === id ? { ...s, ...updates } : s);
        updateState({ subtitles: newSubs });
    };




    // Helper for formatting time
    const fmtTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${pad(minutes)}:${pad(remainingSeconds)}`;
    };

    const handleUndo = () => {
        const prev = undo();
        if (prev) setState(curr => ({ ...curr, ...prev }));
    };

    const handleRedo = () => {
        const next = redo();
        if (next) setState(prev => ({ ...prev, ...next }));
    };

    const handleAutoSuggest = () => {
        // Clear existing overlays first, then regenerate
        const cleanedSubtitles = state.subtitles.map(s => ({ ...s, overlay: undefined }));
        handleGenerateOverlays(cleanedSubtitles);
    };

    const handleSwitchProject = useCallback(async (projectId: string) => {
        try {
            const loaded = await loadProject(projectId);
            if (loaded) {
                const videoFile = await reconstructFile(loaded.videoBuffer, loaded.videoName, loaded.videoType);
                const videoSrc = URL.createObjectURL(videoFile);

                setState(prev => ({
                    ...prev,
                    projectId: loaded.meta.id,
                    videoSrc,
                    videoFile,
                    subtitles: loaded.subtitles,
                    filters: loaded.filters,
                    trimPoints: loaded.trimPoints,
                    playbackSpeed: loaded.playbackSpeed,
                    textOverlays: loaded.textOverlays,
                    videoDuration: loaded.meta.duration,
                    videoWidth: loaded.videoWidth,
                    videoHeight: loaded.videoHeight,
                    fps: loaded.fps,
                    transcriptStatus: loaded.meta.transcriptStatus,
                    selectedSegmentId: null,
                    isTranscribing: false,
                    isGenerating: false,
                }));
                resetHistory(); // Clear undo/redo history for new project
                toast(`"${loaded.meta.name}" loaded successfully.`, 'success');
            }
        } catch (e) {
            console.error('Failed to load project:', e);
            toast('Failed to load project.', 'error');
        }
    }, [toast, resetHistory]);

    const handleDeleteProject = useCallback(async (id: string) => {
        await deleteProject(id);
        setProjectList(getProjectList());
        if (state.projectId === id) {
            setState(prev => ({ ...prev, projectId: null, videoSrc: null, videoFile: null, subtitles: [], textOverlays: [], transcriptStatus: 'none' }));
        }
    }, [state.projectId]);

    const handleDeleteAllProjects = useCallback(async () => {
        await deleteAllProjects();
        setProjectList([]);
        setState(prev => ({ ...prev, projectId: null, videoSrc: null, videoFile: null, subtitles: [], textOverlays: [], transcriptStatus: 'none' }));
        toast('All projects deleted.', 'info');
    }, [toast]);

    const overlayCount = state.subtitles.filter(seg => seg.overlay).length;

    const applyOverlay = (segmentId: string, overlayType: OverlayType, props: any) => {
        const newSubtitles = state.subtitles.map(s =>
            s.id === segmentId ? { ...s, overlay: { type: overlayType, props } } : s
        );
        updateState({ subtitles: newSubtitles });
        setActivePopup(null);
        toast(`${overlayType} overlay added.`, 'success');
    };

    const handleClearOverlay = (segmentId: string) => {
        const newSubtitles = state.subtitles.map(s =>
            s.id === segmentId ? { ...s, overlay: undefined } : s
        );
        updateState({ subtitles: newSubtitles });
        setActivePopup(null);
        toast('Overlay removed.', 'info');
    };

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }} suppressHydrationWarning>
            {!mounted ? (
                <div className="flex-1 flex items-center justify-center"><div className="spinner w-8 h-8" /></div>
            ) : (
                <>
                    {/* ===== Header ===== */}
                    <header className="h-11 flex items-center justify-between px-3 border-b border-border z-20 shrink-0" style={{ background: 'var(--bg-card)', opacity: 0.95, backdropFilter: 'blur(16px)' }}>
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-black"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>M</div>
                            </Link>
                            {state.videoFile && (
                                <>
                                    <span className="w-px h-4 bg-border" />
                                    <span className="text-[12px] font-medium text-foreground/70 truncate max-w-[180px]">{state.videoFile.name}</span>
                                    <button
                                        onClick={() => {
                                            if (state.projectId) {
                                                handleDeleteProject(state.projectId);
                                                toast('Project deleted.', 'info');
                                            } else {
                                                setState(prev => ({ ...prev, projectId: null, videoSrc: null, videoFile: null, subtitles: [], textOverlays: [], transcriptStatus: 'none' }));
                                                toast('Video removed.', 'info');
                                            }
                                        }}
                                        className="h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/15 border border-red-500/20 transition-all"
                                        title="Delete video"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Center: Undo / Redo / AI */}
                        <div className="flex items-center gap-1">
                            <button onClick={handleUndo} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all" title="Undo (Ctrl+Z)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                            </button>
                            <button onClick={handleRedo} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all" title="Redo (Ctrl+Shift+Z)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                            </button>
                            {state.subtitles.length > 0 && (
                                <>
                                    <span className="w-px h-4 bg-border mx-1" />
                                    <button className="h-7 px-3 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all hover:bg-muted"
                                        style={{ color: '#a78bfa' }}
                                        onClick={handleAutoSuggest} disabled={state.isGenerating}>
                                        {state.isGenerating ? <><span className="spinner w-3 h-3" /> Generating…</> : <><Sparkles /> AI Suggest</>}
                                    </button>
                                    {/* Model Selector */}
                                    <div className="relative">
                                        <button
                                            className="h-7 px-2 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all hover:bg-muted border border-border/50"
                                            style={{ color: 'var(--text-secondary)' }}
                                            onClick={() => setShowModelPicker(!showModelPicker)}
                                            title="Select AI model"
                                        >
                                            <span className="max-w-[80px] truncate">{AI_MODELS.find(m => m.id === selectedModel)?.label || 'Model'}</span>
                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                                        </button>
                                        {showModelPicker && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                                                <div className="absolute top-full mt-1 right-0 z-50 w-72 rounded-lg border border-border overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
                                                    <div className="px-3 py-2 border-b border-border">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select AI Model</p>
                                                    </div>
                                                    <div className="max-h-80 overflow-y-auto py-1">
                                                        {(['free', 'creator', 'studio'] as ModelTier[]).map(tier => {
                                                            const tierModels = AI_MODELS.filter(m => m.tier === tier);
                                                            const tierInfo = TIERS[tier];
                                                            return (
                                                                <div key={tier}>
                                                                    <div className="px-3 py-1.5 flex items-center gap-2">
                                                                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: tierInfo.color }}>{tierInfo.name}</span>
                                                                        {tierInfo.price > 0 && <span className="text-[9px] text-muted-foreground">${tierInfo.price}/mo</span>}
                                                                    </div>
                                                                    {tierModels.map(model => {
                                                                        const accessible = isModelAccessible(model.id, userTier);
                                                                        const isSelected = selectedModel === model.id;
                                                                        return (
                                                                            <button
                                                                                key={model.id}
                                                                                className={`w-full px-3 py-1.5 flex items-center gap-2 text-left transition-all ${accessible ? 'hover:bg-white/[0.04] cursor-pointer' : 'opacity-40 cursor-not-allowed'} ${isSelected ? 'bg-indigo-500/10' : ''}`}
                                                                                onClick={() => {
                                                                                    if (accessible) {
                                                                                        setSelectedModel(model.id);
                                                                                        setShowModelPicker(false);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span className={`text-[11px] font-medium ${isSelected ? 'text-indigo-400' : 'text-foreground/80'}`}>{model.label}</span>
                                                                                        {model.badge && <span className="text-[8px] font-bold px-1 py-px rounded" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>{model.badge}</span>}
                                                                                    </div>
                                                                                    <span className="text-[9px] text-muted-foreground">{model.provider}</span>
                                                                                </div>
                                                                                {!accessible && <span className="text-[9px] text-muted-foreground">🔒</span>}
                                                                                {isSelected && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-1">
                            {overlayCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md mr-1" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
                                    {overlayCount} fx
                                </span>
                            )}
                            {state.videoSrc && (
                                <button
                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${state.showEditorPanel ? 'bg-indigo-500/15 text-indigo-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                    onClick={() => setState(prev => ({ ...prev, showEditorPanel: !prev.showEditorPanel }))}
                                    title="Editor panel"
                                >
                                    <Sliders />
                                </button>
                            )}
                            <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all" onClick={toggleTheme} title="Toggle theme" suppressHydrationWarning>
                                {mounted ? (theme === 'light' ? <Moon /> : <Sun />) : <Moon />}
                            </button>
                            <button className="h-7 px-3.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 text-white transition-all ml-1"
                                style={{ background: state.videoSrc ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'rgba(255,255,255,0.06)', color: state.videoSrc ? '#fff' : 'var(--text-secondary)' }}
                                onClick={() => state.videoSrc ? setShowExportModal(true) : toast('Upload a video first', 'warning')}
                                disabled={!state.videoSrc}>
                                <Download /> Export
                            </button>
                        </div>
                    </header>

                    {/* ===== Main ===== */}
                    <div className="flex-1 flex overflow-hidden">
                        <ProjectSidebar
                            projects={projectList}
                            activeProjectId={state.projectId}
                            onSelectProject={handleSwitchProject}
                            onNewProject={() => {
                                if (newUploadInputRef.current) {
                                    newUploadInputRef.current.value = '';
                                    newUploadInputRef.current.click();
                                }
                            }}
                            onDeleteProject={(id) => setConfirmDelete(id)}
                        />

                        {/* Hidden file input for new project uploads */}
                        <input
                            ref={newUploadInputRef}
                            type="file"
                            accept="video/*"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
                            className="hidden"
                        />

                        {/* Main Stage */}
                        <main className="flex-1 flex flex-col min-w-0 bg-background relative">
                            {!state.videoSrc ? (
                                <Dashboard
                                    projects={projectList}
                                    onNewProject={() => {
                                        if (newUploadInputRef.current) newUploadInputRef.current.click();
                                    }}
                                    onSelectProject={handleSwitchProject}
                                    onDeleteProject={handleDeleteProject}
                                    onDeleteAll={() => setConfirmDeleteAll(true)}
                                    onImport={() => {
                                        if (newUploadInputRef.current) newUploadInputRef.current.click();
                                    }}
                                    onFileDrop={handleUpload}
                                />
                            ) : (
                                <>
                                    {/* Split Layout: Transcript + Video */}
                                    <div className="flex-1 flex min-h-0 overflow-hidden">
                                        {/* Transcript Panel (left) */}
                                        <div className="shrink-0" style={{ width: '320px', minWidth: '260px' }}>
                                            <TranscriptPanel
                                                subtitles={state.subtitles}
                                                selectedSegmentId={state.selectedSegmentId}
                                                onSelectSegment={(id) => setState(prev => ({ ...prev, selectedSegmentId: id }))}
                                                onAddOverlay={applyOverlay}
                                                onRemoveOverlay={handleClearOverlay}
                                                onGenerateAI={() => handleGenerateOverlays()}
                                                onDeleteVideo={() => {
                                                    if (state.projectId) {
                                                        handleDeleteProject(state.projectId);
                                                    } else {
                                                        setState(prev => ({ ...prev, projectId: null, videoSrc: null, videoFile: null, subtitles: [], textOverlays: [], transcriptStatus: 'none' }));
                                                    }
                                                    toast('Video removed.', 'info');
                                                }}
                                                isGenerating={state.isGenerating}
                                                isTranscribing={state.isTranscribing}
                                                transcriptStatus={state.transcriptStatus}
                                            />
                                        </div>

                                        {/* Video Preview (right) */}
                                        <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                                            <div className="relative shadow-2xl bg-black flex flex-col" style={{
                                                width: '100%',
                                                maxWidth: state.videoWidth && state.videoHeight
                                                    ? `min(100%, calc((100vh - 300px) * ${state.videoWidth / state.videoHeight}))`
                                                    : '100%',
                                                aspectRatio: state.videoWidth && state.videoHeight ? `${state.videoWidth}/${state.videoHeight}` : '16/9',
                                            }}>
                                                <PlayerPreview ref={playerPreviewRef} videoSrc={state.videoSrc} subtitles={state.subtitles} fps={state.fps || 30}
                                                    durationInFrames={Math.ceil((state.videoDuration || 10) * (state.fps || 30))}
                                                    compositionWidth={state.videoWidth} compositionHeight={state.videoHeight}
                                                    filters={state.filters}
                                                    textOverlays={state.textOverlays}
                                                    playbackRate={state.playbackSpeed}
                                                    onTimeUpdate={setCurrentTime}
                                                    onPlayStateChange={setIsPlaying} />

                                                {/* Processing Overlay */}
                                                {(processingStep === 'transcribing' || processingStep === 'generating') && (
                                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                                                        <div className="flex flex-col items-center gap-5">
                                                            {/* Steps */}
                                                            <div className="flex items-center gap-2">
                                                                {[
                                                                    { key: 'transcribing', label: 'Transcribe' },
                                                                    { key: 'generating', label: 'Generate FX' },
                                                                    { key: 'done', label: 'Done' },
                                                                ].map((step, i) => {
                                                                    const stepOrder = ['transcribing', 'generating', 'done'];
                                                                    const currentIdx = stepOrder.indexOf(processingStep);
                                                                    const stepIdx = stepOrder.indexOf(step.key);
                                                                    const isCompleted = stepIdx < currentIdx;
                                                                    const isActive = stepIdx === currentIdx;
                                                                    return (
                                                                        <React.Fragment key={step.key}>
                                                                            {i > 0 && (
                                                                                <div className="w-8 h-px" style={{ background: isCompleted ? '#6366f1' : 'rgba(255,255,255,0.15)' }} />
                                                                            )}
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isCompleted ? 'bg-indigo-500 text-white' : isActive ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 step-active' : 'bg-white/5 text-white/30 border border-white/10'
                                                                                    }`}>
                                                                                    {isCompleted ? <Check className="w-3 h-3" /> : isActive ? <Loader2 className="w-3 h-3 animate-spin" /> : (i + 1)}
                                                                                </div>
                                                                                <span className={`text-[11px] font-medium ${isActive ? 'text-white' : isCompleted ? 'text-white/60' : 'text-white/25'}`}>{step.label}</span>
                                                                            </div>
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                            </div>
                                                            {/* Progress bar */}
                                                            <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden">
                                                                <div className="h-full processing-bar rounded-full" />
                                                            </div>
                                                            <p className="text-[11px] text-white/40 font-medium">
                                                                {processingStep === 'transcribing' ? 'Analyzing audio with Whisper...' : 'Selecting motion graphics for each segment...'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Done flash */}
                                                {processingStep === 'done' && (
                                                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', backdropFilter: 'blur(8px)' }}>
                                                            <Check className="w-4 h-4 text-emerald-400" />
                                                            <span className="text-[13px] font-semibold text-emerald-300">Ready!</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Area (Bottom of Stage) */}
                                    <Timeline
                                        duration={state.videoDuration}
                                        subtitles={state.subtitles}
                                        trimPoints={state.trimPoints}
                                        currentTime={currentTime}
                                        onSeek={handleSeek}
                                        selectedSegmentId={state.selectedSegmentId}
                                        onSelectSegment={(id) => setState(prev => ({ ...prev, selectedSegmentId: id }))}
                                        onSplitSegment={handleSplitSegment}
                                        onDeleteOverlay={handleClearOverlay}
                                        isPlaying={isPlaying}
                                        onPlayPause={handlePlayPause}
                                        onSkip={handleSkip}
                                    />

                                    {/* Status bar */}
                                    <div className="h-8 border-t border-border px-4 flex items-center justify-between text-[10px] text-muted-foreground/60 shrink-0" style={{ background: 'var(--bg-card)' }}>
                                        <div className="flex items-center gap-3 font-mono tabular-nums">
                                            <span>{fmtTime(currentTime)} / {fmtTime(state.videoDuration)}</span>
                                            <span className="text-border">|</span>
                                            <span>{state.playbackSpeed !== 1 ? `${state.playbackSpeed}x` : '1x'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 font-mono tabular-nums">
                                            <span>{state.videoWidth}x{state.videoHeight}</span>
                                            <span className="text-border">|</span>
                                            <span>{state.fps}fps</span>
                                            <span className="text-border">|</span>
                                            <button onClick={() => setShowShortcuts(true)} className="hover:text-muted-foreground transition-colors cursor-pointer font-sans font-medium text-muted-foreground/40">
                                                ?
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </main>

                        {/* Editor Panel (Right Sidebar) */}
                        {state.showEditorPanel && state.videoSrc && (
                            <EditorPanel
                                activeTab={state.activeEditorTab}
                                onTabChange={(tab: EditorTab) => setState(prev => ({ ...prev, activeEditorTab: tab }))}
                                filters={state.filters}
                                onFiltersChange={(filters) => setState(prev => ({ ...prev, filters }))}
                                trimPoints={state.trimPoints}
                                onTrimChange={(trimPoints) => setState(prev => ({ ...prev, trimPoints }))}
                                speed={state.playbackSpeed}
                                onSpeedChange={(playbackSpeed) => setState(prev => ({ ...prev, playbackSpeed }))}
                                textOverlays={state.textOverlays}
                                onTextOverlaysChange={(textOverlays) => setState(prev => ({ ...prev, textOverlays }))}
                                duration={state.videoDuration}
                                onClose={() => setState(prev => ({ ...prev, showEditorPanel: false }))}
                            />
                        )}
                    </div>

                    {/* Context menu */}
                    {activePopup && (() => {
                        const seg = state.subtitles.find((s) => s.id === activePopup.segmentId);
                        return (
                            <OverlayContextMenu key={activePopup.segmentId} segmentId={activePopup.segmentId}
                                segmentText={seg?.text || ''} existingOverlayType={seg?.overlay?.type}
                                existingProps={seg?.overlay?.props} onApply={(type, props) => applyOverlay(activePopup.segmentId, type, props)}
                                onApplyConfig={(config) => {
                                    const targetId = activePopup?.segmentId || state.selectedSegmentId;
                                    if (!targetId) return;
                                    pushSnapshot({ subtitles: state.subtitles });
                                    setState((prev) => ({ ...prev, subtitles: prev.subtitles.map((s) => s.id === targetId ? { ...s, overlay: config } : s) }));
                                    setActivePopup(null);
                                    toast('Overlay applied', 'success', 1500);
                                }}
                                onClear={() => handleClearOverlay(activePopup.segmentId)} onClose={() => setActivePopup(null)}
                                position={{ top: activePopup.top, left: activePopup.left }} />
                        );
                    })()}

                    {/* Export Modal */}
                    <ExportModal
                        isOpen={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        videoDuration={state.videoDuration}
                        videoWidth={state.videoWidth}
                        videoHeight={state.videoHeight}
                        videoFileName={state.videoFile?.name || 'video'}
                        videoSrc={state.videoSrc || ''}
                    />

                    {/* Keyboard Shortcuts Modal */}
                    <KeyboardShortcutsModal
                        isOpen={showShortcuts}
                        onClose={() => setShowShortcuts(false)}
                    />

                    {/* Delete Confirmation Dialog */}
                    <ConfirmDialog
                        isOpen={!!confirmDelete}
                        title="Delete Project"
                        message="This will permanently delete the project and its video. This action cannot be undone."
                        confirmLabel="Delete"
                        variant="danger"
                        onConfirm={() => {
                            if (confirmDelete) {
                                handleDeleteProject(confirmDelete);
                                toast('Project deleted', 'info');
                            }
                            setConfirmDelete(null);
                        }}
                        onCancel={() => setConfirmDelete(null)}
                    />

                    {/* Delete All Confirmation Dialog */}
                    <ConfirmDialog
                        isOpen={confirmDeleteAll}
                        title="Delete All Projects"
                        message={`This will permanently delete all ${projectList.length} project(s) and their videos. This action cannot be undone.`}
                        confirmLabel="Delete All"
                        variant="danger"
                        onConfirm={() => {
                            handleDeleteAllProjects();
                            setConfirmDeleteAll(false);
                        }}
                        onCancel={() => setConfirmDeleteAll(false)}
                    />
                </>
            )}
        </div>
    );
}
