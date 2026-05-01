'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    EditingPlan,
} from '../../lib/types';
import { transcribeVideo, generateMockTranscript } from '../../lib/transcribe';
import { suggestOverlaysWithAI, requestAgentEditPlan, applyEditingPlan } from '../../lib/ai';
import { analyzeFullVideo } from '../../lib/aiAnalysis';
import { AI_MODELS, DEFAULT_MODEL, TIERS, getModelsForTier, isModelAccessible, type ModelTier, type AIModel } from '../../lib/models';
import {
    saveProject,
    loadProject,
    deleteProject,
    deleteAllProjects,
    getProjectList,
    reconstructFile,
    setCurrentUser,
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
import { useAuth } from '../../lib/AuthContext';
import { canCreateProject, incrementUsage, getUsageDisplay, clearLegacyUsage } from '../../lib/usage';
import dynamic2 from 'next/dynamic';
const OnboardingModal = dynamic2(() => import('../../components/ui/OnboardingModal'), { ssr: false });

const ExportModal = dynamic(() => import('../../components/ui/ExportModal'), { ssr: false });
const ConfirmDialog = dynamic(() => import('../../components/ui/ConfirmDialog'), { ssr: false });
const KeyboardShortcutsModal = dynamic(() => import('../../components/ui/KeyboardShortcutsModal'), { ssr: false });
const AiMetaModal = dynamic(() => import('../../components/ui/AiMetaModal'), { ssr: false });

const EditorPanel = dynamic(() => import('../../components/editor/EditorPanel'), { ssr: false });
const Timeline = dynamic(() => import('../../components/editor/Timeline'), { ssr: false });
import { OverlayContextMenu } from '../../components/editor/OverlayContextMenu';

const TranscriptPanel = dynamic(() => import('../../components/editor/TranscriptPanel'), { ssr: false });

import PlayerPreview from '../../components/editor/PlayerPreview';

export default function EditorPage() {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [projectList, setProjectList] = useState<ProjectMeta[]>([]);
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    
    // Set current user for storage isolation - ensures each user's projects are separate
    useEffect(() => {
        if (user?.id) {
            setCurrentUser(user.id);
            console.log('[Editor] Set storage user ID:', user.id);
            // Clear any legacy global usage counter so it doesn't leak into this user's limit
            clearLegacyUsage();
        } else {
            setCurrentUser(null);
            console.log('[Editor] cleared storage user ID (no user)');
        }
    }, [user?.id]);
    const [showOnboarding, setShowOnboarding] = useState(false);
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
    const [showAiMeta, setShowAiMeta] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
    const [activePopup, setActivePopup] = useState<{ segmentId: string; top: number; left: number } | null>(null);
    const [processingStep, setProcessingStep] = useState<'idle' | 'uploading' | 'transcribing' | 'generating' | 'done'>('idle');
    const [agenticResult, setAgenticResult] = useState<{
        segmentsRemoved: number;
        segmentsSpedUp: number;
        overlaysAdded: number;
        effectsAdded: number;
        transitionsAdded: number;
        originalDuration: number;
        newDuration: number;
    } | null>(null);
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
    const [userTier, setUserTier] = useState<ModelTier>('free');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [genLogs, setGenLogs] = useState<{ time: string; msg: string }[]>([]);
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
        // Check onboarding
        try { if (!localStorage.getItem('makescript-onboarded')) setShowOnboarding(true); } catch { }
    }, []);

    // Auth gate
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

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
        // Usage limit check — uses the user's plan from Supabase profile
        if (!canCreateProject(user?.plan, user?.id)) {
            toast('Monthly video limit reached. Upgrade your plan for more.', 'error');
            return;
        }

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
        incrementUsage(user?.id); // Track usage per user

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

    const addLog = useCallback((msg: string) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setGenLogs(prev => [...prev, { time, msg }]);
    }, []);

    const logOverlaySummary = (subtitles: SubtitleSegment[]) => {
        const images = subtitles.filter(s => s.overlay?.type === 'ai-generated-image');
        const kinetic = subtitles.filter(s => s.overlay?.type === 'kinetic-text');
        const gifs = subtitles.filter(s => s.overlay?.type === 'gif-reaction');
        const illustrations = subtitles.filter(s => s.overlay?.type === 'visual-illustration');
        const emojis = subtitles.filter(s => s.overlay?.type === 'emoji-reaction');
        const effects = subtitles.filter(s => s.effect);
        const transitions = subtitles.filter(s => s.transition);

        if (images.length > 0) addLog(`${images.length} AI images (load when video plays)`);
        if (kinetic.length > 0) addLog(`${kinetic.length} kinetic text overlays`);
        if (illustrations.length > 0) addLog(`${illustrations.length} animated illustrations`);
        if (gifs.length > 0) addLog(`${gifs.length} GIF reactions`);
        if (emojis.length > 0) addLog(`${emojis.length} emoji reactions`);
        if (effects.length > 0) addLog(`${effects.length} video effects`);
        if (transitions.length > 0) addLog(`${transitions.length} transitions`);
        addLog('Done!');
    };

    const preGenerateAIImages = async (subs: SubtitleSegment[]): Promise<SubtitleSegment[]> => {
        const imageSegs = subs.filter(
            s => s.overlay?.type === 'ai-generated-image' && s.overlay?.props?.imagePrompt
        );
        if (imageSegs.length === 0) return subs;

        addLog(`Pre-generating ${imageSegs.length} AI images via Ernie (batched)...`);

        const generateOne = async (seg: SubtitleSegment, i: number): Promise<{ id: string; imageUrl: string } | null> => {
            const prompt = String(seg.overlay!.props.imagePrompt).substring(0, 120);
            const seed = Number(seg.overlay!.props.seed) || (Date.now() + i) % 1000000;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 25000);
            try {
                const res = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, width: 768, height: 512, seed, steps: 8, guidanceScale: 1 }),
                    signal: controller.signal,
                });
                clearTimeout(timer);
                const data = await res.json();
                if (data.success && data.imageUrl) {
                    addLog(`Image ${i + 1}/${imageSegs.length} OK (${Math.round(data.imageUrl.length / 1024)}KB)`);
                    return { id: seg.id, imageUrl: data.imageUrl as string };
                }
                return null;
            } catch {
                clearTimeout(timer);
                return null;
            }
        };

        const urlMap = new Map<string, string>();
        const BATCH_SIZE = 3;

        for (let b = 0; b < imageSegs.length; b += BATCH_SIZE) {
            const batch = imageSegs.slice(b, b + BATCH_SIZE);
            addLog(`Batch ${Math.floor(b / BATCH_SIZE) + 1}/${Math.ceil(imageSegs.length / BATCH_SIZE)}: generating ${batch.length} images...`);

            const results = await Promise.allSettled(
                batch.map((seg, j) => generateOne(seg, b + j))
            );

            const failed: { seg: SubtitleSegment; idx: number }[] = [];
            for (let j = 0; j < results.length; j++) {
                const r = results[j];
                if (r.status === 'fulfilled' && r.value) {
                    urlMap.set(r.value.id, r.value.imageUrl);
                } else {
                    failed.push({ seg: batch[j], idx: b + j });
                }
            }

            if (failed.length > 0) {
                addLog(`Retrying ${failed.length} failed image(s)...`);
                const retryResults = await Promise.allSettled(
                    failed.map(({ seg, idx }) => generateOne(seg, idx))
                );
                for (const r of retryResults) {
                    if (r.status === 'fulfilled' && r.value) {
                        urlMap.set(r.value.id, r.value.imageUrl);
                    }
                }
            }
        }

        const failedCount = imageSegs.length - urlMap.size;
        addLog(`Pre-generated ${urlMap.size}/${imageSegs.length} images${failedCount > 0 ? ` (${failedCount} removed)` : ''}`);

        return subs.map(s => {
            if (s.overlay?.type === 'ai-generated-image' && s.overlay?.props?.imagePrompt) {
                const newUrl = urlMap.get(s.id);
                if (newUrl) {
                    return { ...s, overlay: { ...s.overlay, props: { ...s.overlay.props, imageUrl: newUrl } } };
                }
                addLog(`Keeping Pollinations URL for ${s.id} (will load lazily)`);
                return s;
            }
            return s;
        });
    };

    const preGenerateMotionSVGs = async (subs: SubtitleSegment[]): Promise<SubtitleSegment[]> => {
        const motionSegs = subs.filter(
            s => s.overlay?.type === 'ai-motion-graphic' && !s.overlay?.props?.svgContent
        );
        if (motionSegs.length === 0) return subs;

        addLog(`Pre-generating ${motionSegs.length} motion SVGs...`);

        const results = await Promise.allSettled(
            motionSegs.slice(0, 5).map(async (seg) => {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 50000);
                try {
                    const res = await fetch('/api/generate-motion-svg', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text: seg.text,
                            mood: 'energetic',
                            topic: String(seg.overlay!.props.topic || 'general'),
                            color: String(seg.overlay!.props.color || '#6366f1'),
                            label: String(seg.overlay!.props.label || ''),
                        }),
                        signal: controller.signal,
                    });
                    clearTimeout(timer);
                    const data = await res.json();
                    if (data.success && data.svgContent) {
                        addLog(`Motion SVG ready for ${seg.id}`);
                        return { id: seg.id, svgContent: data.svgContent as string };
                    }
                    return null;
                } catch {
                    clearTimeout(timer);
                    return null;
                }
            })
        );

        const svgMap = new Map<string, string>();
        for (const r of results) {
            if (r.status === 'fulfilled' && r.value) {
                svgMap.set(r.value.id, r.value.svgContent);
            }
        }

        addLog(`Motion SVGs generated: ${svgMap.size}/${motionSegs.length}`);

        return subs.map(seg => {
            if (svgMap.has(seg.id) && seg.overlay) {
                return { ...seg, overlay: { ...seg.overlay, props: { ...seg.overlay.props, svgContent: svgMap.get(seg.id) } } };
            }
            return seg;
        });
    };

    const handleGenerateOverlays = async (currentSubtitles = state.subtitles) => {
        console.log('[handleGenerateOverlays] Called with', currentSubtitles.length, 'subtitles');

        if (currentSubtitles.length === 0) {
            console.log('[handleGenerateOverlays] Skipping - no subtitles');
            return;
        }

        if (state.isGenerating) {
            console.log('[handleGenerateOverlays] Already generating, skipping');
            return;
        }

        updateState({ isGenerating: true });
        setProcessingStep('generating');
        setGenLogs([]);
        addLog(`Starting AI generation for ${currentSubtitles.length} segments...`);
        addLog(`Selected model: ${selectedModel}`);

        let analysis;
        try {
            analysis = analyzeFullVideo(currentSubtitles);
            addLog(`Video analysis: mood=${analysis.moodProfile.primary}, energy=${analysis.moodProfile.energyLevel}/10`);
        } catch (analysisErr) {
            addLog('Video analysis failed — continuing without it');
        }

        try {
            // ═══ STEP 1: Try agentic pipeline ═══
            addLog('Step 1: Requesting AI editing plan...');
            const plan = await requestAgentEditPlan(
                currentSubtitles,
                state.videoDuration,
                state.videoWidth,
                state.videoHeight,
                'auto',
                selectedModel,
                analysis,
                addLog,
            );

            if (plan && plan.segments && plan.segments.length > 0) {
                addLog(`AI plan received! Mood: ${plan.mood}, segments: ${plan.segments.length}`);

                const { subtitles: editedSubtitles, filters: planFilters } = applyEditingPlan(currentSubtitles, plan);

                const overlaysCount = editedSubtitles.filter(s => s.overlay).length;
                const effectsCount = editedSubtitles.filter(s => s.effect).length;
                const transitionsCount = editedSubtitles.filter(s => s.transition).length;
                const imageCount = editedSubtitles.filter(s => s.overlay?.type === 'ai-generated-image').length;
                const motionCount = editedSubtitles.filter(s => s.overlay?.type === 'ai-motion-graphic').length;

                addLog(`Applied: ${overlaysCount} overlays (${imageCount} AI images, ${motionCount} live motion), ${effectsCount} effects, ${transitionsCount} transitions`);

                let finalSubtitles = imageCount > 0
                    ? await preGenerateAIImages(editedSubtitles)
                    : editedSubtitles;

                const unfilledMotion = finalSubtitles.filter(s => s.overlay?.type === 'ai-motion-graphic' && !s.overlay?.props?.svgContent).length;
                if (unfilledMotion > 0) {
                    finalSubtitles = await preGenerateMotionSVGs(finalSubtitles);
                }

                updateState({
                    subtitles: finalSubtitles,
                    filters: { ...state.filters, ...planFilters },
                    isGenerating: false,
                    editingPlan: plan,
                });

                toast(
                    `AI Agent applied ${overlaysCount} overlays (${imageCount} AI images), ${effectsCount} effects, ${transitionsCount} transitions!`,
                    'success'
                );
                setProcessingStep('done');
                setTimeout(() => setProcessingStep('idle'), 2000);
                logOverlaySummary(finalSubtitles);
                return;
            }

            // ═══ STEP 2: Agent failed, try suggest-overlays ═══
            addLog('Step 1 failed — no plan returned. Trying Step 2...');
            addLog('Step 2: Requesting overlay suggestions...');

            const newSubtitles = await suggestOverlaysWithAI(currentSubtitles, selectedModel, analysis, addLog);
            const overlaysCount = newSubtitles.filter(s => s.overlay).length;

            if (overlaysCount > 0) {
                const imageCount = newSubtitles.filter(s => s.overlay?.type === 'ai-generated-image').length;
                const motionCount2 = newSubtitles.filter(s => s.overlay?.type === 'ai-motion-graphic').length;
                addLog(`Step 2 done: ${overlaysCount} overlays (${imageCount} AI images, ${motionCount2} live motion)`);
                let finalSubs = imageCount > 0
                    ? await preGenerateAIImages(newSubtitles)
                    : newSubtitles;
                const unfilledMotion2 = finalSubs.filter(s => s.overlay?.type === 'ai-motion-graphic' && !s.overlay?.props?.svgContent).length;
                if (unfilledMotion2 > 0) {
                    finalSubs = await preGenerateMotionSVGs(finalSubs);
                }
                updateState({ subtitles: finalSubs, isGenerating: false });
                toast(`AI overlays applied — ${overlaysCount} motion graphics (${imageCount} AI images, ${motionCount2} live motion)!`, 'success');
                setProcessingStep('done');
                setTimeout(() => setProcessingStep('idle'), 2000);
                logOverlaySummary(finalSubs);
                return;
            }

            addLog('ERROR: All AI pipelines returned nothing. Check API keys.');
            updateState({ isGenerating: false });
            toast('AI could not generate overlays — check the generation log below for details.', 'error');
            setProcessingStep('done');
            setTimeout(() => setProcessingStep('idle'), 2000);

        } catch (e) {
            addLog(`ERROR: ${e instanceof Error ? e.message : 'Unknown error'}`);
            updateState({ isGenerating: false });
            toast(`Generation failed — check the log below for details.`, 'error');
            setProcessingStep('done');
            setTimeout(() => setProcessingStep('idle'), 2000);
        }
    };

    // Auto-trigger overlay generation when transcription completes
    // This avoids stale closure issues from calling handleGenerateOverlays inside handleUpload
    const hasTriggeredOverlays = useRef(false);
    const lastProjectId = useRef<string | null>(null);
    
    useEffect(() => {
        // Reset trigger when project changes (new video uploaded or switched)
        if (state.projectId !== lastProjectId.current) {
            console.log('[useEffect] Project changed, resetting trigger. Old:', lastProjectId.current, 'New:', state.projectId);
            lastProjectId.current = state.projectId;
            hasTriggeredOverlays.current = false;
        }

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
    }, [state.isTranscribing, state.subtitles, state.isGenerating, state.projectId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const handleAgenticEdit = useCallback(async () => {
        if (state.isGenerating) {
            console.log('[handleAgenticEdit] Already generating, skipping');
            return;
        }
        if (state.subtitles.length === 0) {
            toast('No transcript available. Please wait for transcription to complete.', 'warning');
            return;
        }

        setState(prev => ({ ...prev, isGenerating: true }));
        setProcessingStep('generating');
        toast('🤖 AI Agent analyzing and editing your video...', 'info');

        try {
            const res = await fetch('/api/agentic-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subtitles: state.subtitles,
                    videoDuration: state.videoDuration,
                    options: {
                        editingStyle: 'auto',
                        aggressiveness: 'moderate',
                    },
                }),
            });

            const data = await res.json();

            if (data.ok && data.result) {
                const result = data.result;
                console.log('[handleAgenticEdit] Agentic edit complete:', result);

                // Apply the edited subtitles, filters, and duration
                setState(prev => ({
                    ...prev,
                    subtitles: result.subtitles,
                    filters: {
                        ...prev.filters,
                        ...result.colorGrade,
                    },
                    videoDuration: result.newDuration,
                    trimPoints: {
                        inPoint: 0,
                        outPoint: result.newDuration,
                    },
                    isGenerating: false,
                }));

                setAgenticResult({
                    segmentsRemoved: result.segmentsRemoved,
                    segmentsSpedUp: result.segmentsSpedUp,
                    overlaysAdded: result.overlaysAdded,
                    effectsAdded: result.effectsAdded,
                    transitionsAdded: result.transitionsAdded,
                    originalDuration: result.originalDuration,
                    newDuration: result.newDuration,
                });

                toast(
                    `🎬 AI Agent edited your video! Removed ${result.segmentsRemoved} segments, added ${result.overlaysAdded} overlays.`,
                    'success'
                );
                setProcessingStep('done');
                setTimeout(() => setProcessingStep('idle'), 2000);
            } else {
                console.error('[handleAgenticEdit] API returned error:', data.error);
                toast('AI Agent edit failed. Please try again.', 'error');
                setState(prev => ({ ...prev, isGenerating: false }));
                setProcessingStep('idle');
            }
        } catch (e) {
            console.error('[handleAgenticEdit] Error:', e);
            toast('AI Agent edit failed. Please try again.', 'error');
            setState(prev => ({ ...prev, isGenerating: false }));
            setProcessingStep('idle');
        }
    }, [state.subtitles, state.videoDuration, state.isGenerating, toast]);

    const handleAutoSuggest = useCallback(async () => {
        console.log('[handleAutoSuggest] Starting with', state.subtitles.length, 'subtitles, model:', selectedModel);

        if (state.isGenerating) {
            console.log('[handleAutoSuggest] Already generating, skipping');
            return;
        }

        if (state.subtitles.length === 0) {
            toast('No transcript available. Please wait for transcription to complete.', 'warning');
            return;
        }

        setState(prev => ({ ...prev, isGenerating: true }));
        setProcessingStep('generating');
        setGenLogs([]);
        addLog(`Re-generating overlays for ${state.subtitles.length} segments...`);
        addLog(`Model: ${selectedModel}`);

        try {
            const cleanedSubtitles = state.subtitles.map(s => ({ ...s, overlay: undefined }));
            addLog('Requesting AI overlay suggestions...');

            const newSubtitles = await suggestOverlaysWithAI(cleanedSubtitles, selectedModel, undefined, addLog);
            const overlaysCount = newSubtitles.filter(s => s.overlay).length;
            const imageCount = newSubtitles.filter(s => s.overlay?.type === 'ai-generated-image').length;

            const finalSubs = imageCount > 0
                ? await preGenerateAIImages(newSubtitles)
                : newSubtitles;

            setState(prev => ({
                ...prev,
                subtitles: finalSubs,
                isGenerating: false,
            }));
            setProcessingStep('done');
            setTimeout(() => setProcessingStep('idle'), 2000);

            if (overlaysCount > 0) {
                addLog(`Done: ${overlaysCount} overlays (${imageCount} AI images)`);
                toast(`AI applied ${overlaysCount} overlays (${imageCount} AI images)!`, 'success');
                logOverlaySummary(finalSubs);
            } else {
                addLog('ERROR: No overlays returned. API keys may be rate-limited.');
                toast('AI returned no overlays — check the generation log for details.', 'error');
            }
        } catch (e) {
            addLog(`ERROR: ${e instanceof Error ? e.message : 'Unknown error'}`);
            setState(prev => ({ ...prev, isGenerating: false }));
            setProcessingStep('done');
            setTimeout(() => setProcessingStep('idle'), 2000);
            toast('Generation failed — check the log for details.', 'error');
        }
    }, [state.subtitles, state.isGenerating, selectedModel, toast]);

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
                            {user && (
                                <Link href="/settings" className="flex items-center gap-1.5 group" title="Settings">
                                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold" style={{ background: `linear-gradient(135deg, ${user.avatar || '#6366f1'}, ${user.avatar ? user.avatar + '88' : '#818cf8'})` }}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-[11px] text-foreground/50 hidden md:inline group-hover:text-foreground/70 transition-colors">{user.name.split(' ')[0]}</span>
                                </Link>
                            )}
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
                                <>
                                    <button
                                        className="w-7 h-7 rounded-md flex items-center justify-center transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
                                        onClick={() => setState(prev => ({ ...prev, showEditorPanel: !prev.showEditorPanel }))}
                                        title="Editor panel (Magic Tools)"
                                    >
                                        <Sliders />
                                    </button>
                                    <button
                                        type="button"
                                        className="h-7 px-3 rounded-md flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer"
                                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: '#fff', pointerEvents: 'auto' }}
                                        onClick={(e) => {
                                            console.log('[Magic Button] Clicked!');
                                            setState(prev => ({ ...prev, showEditorPanel: true }));
                                        }}
                                        title="Open Magic Tools"
                                    >
                                        <Sparkles className="w-3 h-3" /> Magic
                                    </button>
                                    {state.subtitles?.length > 0 && (
                                        <button
                                            type="button"
                                            className="h-7 px-3 rounded-md flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40"
                                            style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#fff' }}
                                            onClick={handleAgenticEdit}
                                            disabled={state.isGenerating}
                                            title="🤖 Auto Edit Video"
                                        >
                                            {state.isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            {state.isGenerating ? 'Editing...' : 'Auto Edit'}
                                        </button>
                                    )}
                                </>
                            )}
                            {state.videoSrc && (
                                <button
                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${state.subtitles?.length > 0 ? 'text-violet-400 hover:bg-violet-500/10' : 'text-muted-foreground/40 hover:bg-white/5'}`}
                                    onClick={() => state.subtitles?.length > 0 ? setShowAiMeta(true) : alert('Please click "Transcribe" first to use AI features!')}
                                    title="✨ AI Tools (Requires Transcription)"
                                >
                                    <Sparkles />
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
                                                            {processingStep === 'generating' && genLogs.length > 0 && (
                                                                <div className="mt-3 w-72 max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-black/60 p-2 text-left">
                                                                    {genLogs.map((log, i) => (
                                                                        <div key={i} className={`text-[10px] leading-relaxed font-mono ${log.msg.startsWith('ERROR') ? 'text-red-400' : log.msg.startsWith('Done') || log.msg.startsWith('All images') || log.msg.includes('plan received') ? 'text-emerald-400' : log.msg.startsWith('Image') ? 'text-blue-300' : 'text-white/50'}`}>
                                                                            <span className="text-white/20 mr-1">{log.time}</span>
                                                                            {log.msg}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
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

                                    {/* Generation Log */}
                                    {genLogs.length > 0 && processingStep !== 'generating' && (
                                        <div className="mx-3 mb-2 rounded-lg border border-white/10 bg-black/40 overflow-hidden">
                                            <button
                                                onClick={() => setGenLogs([])}
                                                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-white/40 hover:text-white/60 transition-colors"
                                            >
                                                <span className="font-semibold uppercase tracking-wider">Generation Log ({genLogs.length})</span>
                                                <span>dismiss</span>
                                            </button>
                                            <div className="max-h-28 overflow-y-auto px-3 pb-2">
                                                {genLogs.map((log, i) => (
                                                    <div key={i} className={`text-[10px] leading-relaxed font-mono ${log.msg.startsWith('ERROR') ? 'text-red-400' : log.msg.startsWith('Done') || log.msg.startsWith('All images') || log.msg.includes('plan received') ? 'text-emerald-400' : log.msg.startsWith('Image') ? 'text-blue-300' : 'text-white/40'}`}>
                                                        <span className="text-white/15 mr-1">{log.time}</span>
                                                        {log.msg}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

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
                                transcript={state.subtitles.map(s => s.text).join(' ')}
                                subtitles={state.subtitles}
                                onSubtitlesChange={(subtitles) => updateState({ subtitles })}
                                isGenerating={state.isGenerating}
                                onGenerateAI={handleAutoSuggest}
                                onAgenticEdit={handleAgenticEdit}
                                agenticResult={agenticResult}
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
                        subtitles={state.subtitles}
                        filters={state.filters}
                        textOverlays={state.textOverlays}
                        fps={state.fps}
                    />

                    {/* Keyboard Shortcuts Modal */}
                    <KeyboardShortcutsModal
                        isOpen={showShortcuts}
                        onClose={() => setShowShortcuts(false)}
                    />

                    {/* AI Meta Modal */}
                    <AiMetaModal
                        isOpen={showAiMeta}
                        onClose={() => setShowAiMeta(false)}
                        transcript={state.subtitles.map(s => s.text).join(' ')}
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

                    {/* Onboarding Modal */}
                    <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
                </>
            )}
        </div>
    );
}
