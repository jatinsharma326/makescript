'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
} from '../../lib/types';
import { transcribeVideo, generateMockTranscript } from '../../lib/transcribe';
import { suggestOverlaysWithAI, generateDynamicOverlays as autoSuggestOverlays } from '../../lib/ai';
import {
    saveProject,
    loadProject,
    deleteProject,
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
    Sliders
} from 'lucide-react';
import { ProjectSidebar } from '../../components/dashboard/ProjectSidebar';
import { Dashboard } from '../../components/dashboard/Dashboard';

const ExportModal = dynamic(() => import('../../components/ui/ExportModal'), { ssr: false });
const ConfirmDialog = dynamic(() => import('../../components/ui/ConfirmDialog'), { ssr: false });
const KeyboardShortcutsModal = dynamic(() => import('../../components/ui/KeyboardShortcutsModal'), { ssr: false });

const EditorPanel = dynamic(() => import('../../components/editor/EditorPanel'), { ssr: false });
const Timeline = dynamic(() => import('../../components/editor/Timeline'), { ssr: false });
import { OverlayContextMenu } from '../../components/editor/OverlayContextMenu';

const PlayerPreview = dynamic(() => import('../../components/editor/PlayerPreview'), {
    ssr: false,
    loading: () => (
        <div className="w-full aspect-video rounded-xl flex items-center justify-center border border-border/40 bg-muted animate-pulse">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3" />
                <span className="text-xs text-muted-foreground font-medium">Loading preview...</span>
            </div>
        </div>
    ),
});

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
    const [activePopup, setActivePopup] = useState<{ segmentId: string; top: number; left: number } | null>(null);
    const { toast } = useToast();
    const { pushSnapshot, undo, redo, pushToFuture, resetHistory } = useUndoRedo();

    // Refs
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stateRef = useRef(state);
    stateRef.current = state;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const newUploadInputRef = useRef<HTMLInputElement>(null);

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
        video.src = url;

        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(null);
            };
        });

        const duration = video.duration || 30;
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;

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
            isTranscribing: true,
            transcriptStatus: 'transcribing'
        }));

        toast('Analyzing video and transcribing audio...', 'info');

        try {
            const { subtitles: transcript, isReal, noAudio } = await transcribeVideo(file, duration);

            if (noAudio) {
                toast('No speech detected. Using timeline only.', 'info');
                updateState({
                    subtitles: [],
                    isTranscribing: false,
                    transcriptStatus: 'mock-no-audio'
                });
                return;
            }

            const status = isReal ? 'real' : 'mock-error';
            updateState({
                subtitles: transcript,
                isTranscribing: false,
                transcriptStatus: status
            });

            toast(isReal ? 'Transcription complete!' : 'Using mock transcript (API unavailable)', isReal ? 'success' : 'warning');

            // Auto-generate overlays if transcript exists
            if (transcript.length > 0) {
                handleGenerateOverlays(transcript);
            }

        } catch (err) {
            console.error(err);
            toast('Detailed transcription failed. Using basic mode.', 'error');
            updateState({ isTranscribing: false, transcriptStatus: 'mock-error' });
        }
    }, [saveCurrentProject, toast]); // Added updateState dependency implicitly via component scope

    const handleGenerateOverlays = async (currentSubtitles = state.subtitles) => {
        if (state.isGenerating || currentSubtitles.length === 0) return;

        updateState({ isGenerating: true });
        toast('Generating dynamic overlays...', 'info');

        try {
            const newSubtitles = await suggestOverlaysWithAI(currentSubtitles);

            updateState({
                subtitles: newSubtitles,
                isGenerating: false,
            });
            toast('AI overlays applied successfully!', 'success');
        } catch (e) {
            console.error(e);
            // Fallback
            const fallback = autoSuggestOverlays(currentSubtitles);
            updateState({
                subtitles: fallback,
                isGenerating: false,
            });
            toast('AI unavailable, used basic rules instead.', 'warning');
        }
    };

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
        handleGenerateOverlays();
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

    const handleDeleteProject = useCallback((id: string) => {
        deleteProject(id);
        setProjectList(getProjectList());
        if (state.projectId === id) {
            setState(prev => ({ ...prev, projectId: null, videoSrc: null, videoFile: null, subtitles: [], textOverlays: [] }));
        }
    }, [state.projectId]);

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
                                    onImport={() => {
                                        if (newUploadInputRef.current) newUploadInputRef.current.click();
                                    }}
                                />
                            ) : (
                                <>
                                    {/* Viewport Area */}
                                    <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                                        <div className="relative shadow-2xl bg-black max-w-full max-h-full flex flex-col" style={{
                                            width: 'auto',
                                            height: 'auto',
                                            aspectRatio: state.videoWidth && state.videoHeight ? `${state.videoWidth}/${state.videoHeight}` : '16/9',
                                        }}>
                                            <PlayerPreview videoSrc={state.videoSrc} subtitles={state.subtitles} fps={30}
                                                durationInFrames={Math.ceil((state.videoDuration || 10) * 30)}
                                                compositionWidth={state.videoWidth} compositionHeight={state.videoHeight}
                                                filters={state.filters}
                                                textOverlays={state.textOverlays}
                                                playbackRate={state.playbackSpeed} />
                                        </div>
                                    </div>

                                    {/* Timeline Area (Bottom of Stage) */}
                                    <Timeline
                                        duration={state.videoDuration}
                                        subtitles={state.subtitles}
                                        trimPoints={state.trimPoints}
                                        currentTime={0}
                                        onSeek={() => { }}
                                        selectedSegmentId={state.selectedSegmentId}
                                    />

                                    {/* Status bar */}
                                    <div className="h-8 border-t border-border px-4 flex items-center justify-between text-[10px] text-muted-foreground/60 shrink-0" style={{ background: 'var(--bg-card)' }}>
                                        <div className="flex items-center gap-3 font-mono tabular-nums">
                                            <span>{fmtTime(0)} / {fmtTime(state.videoDuration)}</span>
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
                </>
            )}
        </div>
    );
}
