'use client';

import React, { useState, useCallback } from 'react';
import { OverlayType, OverlayConfig } from '../../lib/types';
import { suggestSingleOverlayWithAI } from '../../lib/ai';

interface OverlayContextMenuProps {
    segmentId: string;
    segmentText?: string;
    existingOverlayType?: OverlayType;
    existingProps?: Record<string, unknown>;
    onApply: (type: OverlayType, props?: Record<string, unknown>) => void;
    onApplyConfig?: (config: OverlayConfig) => void;
    onClear: () => void;
    onClose: () => void;
    position: { top: number; left: number };
}

const SCENES = [
    { id: 'solar-system', label: 'Solar System', icon: '🪐' },
    { id: 'growth-chart', label: 'Growth Chart', icon: '📈' },
    { id: 'globe', label: 'Globe', icon: '🌍' },
    { id: 'rocket-launch', label: 'Rocket', icon: '🚀' },
    { id: 'brain-idea', label: 'Brain/Idea', icon: '💡' },
    { id: 'connections', label: 'Network', icon: '🔗' },
    { id: 'clock-time', label: 'Clock', icon: '⏰' },
    { id: 'heartbeat', label: 'Heartbeat', icon: '❤️' },
    { id: 'money-flow', label: 'Money', icon: '💰' },
    { id: 'lightning', label: 'Lightning', icon: '⚡' },
];

const DISPLAY_MODES = [
    { id: 'full', label: 'Full', icon: '↗' },
    { id: 'fit', label: 'Fit', icon: '⊡' },
    { id: 'overlay', label: 'Overlay', icon: '⊞' },
    { id: 'fade-up', label: 'Fade ↑', icon: '↑' },
    { id: 'fade-down', label: 'Fade ↓', icon: '↓' },
];

const TRANSITIONS = [
    { id: 'slide-in', label: 'Slide in', icon: '↓' },
    { id: 'fade-in', label: 'Fade in', icon: '⊡' },
    { id: 'appear', label: 'Appear', icon: '✦' },
];

const SOUND_EFFECTS = [
    { id: 'whoosh', label: 'Whoosh' },
    { id: 'swoosh', label: 'Swoosh' },
    { id: 'click', label: 'Click' },
    { id: 'pop', label: 'Pop' },
    { id: 'none', label: 'None' },
];

/* SVG Icons */
const IconChevronLeft = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const IconX = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const IconSparkle = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
);
const IconTrash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);

const overlayIcons: Record<string, React.ReactNode> = {
    'visual-illustration': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    'highlight-box': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>,
    'emoji-reaction': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
    'zoom-effect': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
    'scene-transition': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>,
};

export const OverlayContextMenu: React.FC<OverlayContextMenuProps> = ({
    segmentText = '',
    existingOverlayType,
    existingProps,
    onApply,
    onApplyConfig,
    onClear,
    onClose,
    position,
}) => {
    const [showDisplayOptions, setShowDisplayOptions] = useState(existingOverlayType === 'visual-illustration');
    const [selectedScene, setSelectedScene] = useState<string>(String(existingProps?.scene || 'solar-system'));
    const [displayMode, setDisplayMode] = useState<string>(String(existingProps?.displayMode || 'overlay'));
    const [transition, setTransition] = useState<string>(String(existingProps?.transition || 'fade-in'));
    const [soundEffect, setSoundEffect] = useState<string>(String(existingProps?.soundEffect || 'none'));

    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const overlayOptions: { type: OverlayType; label: string; color: string }[] = [
        { type: 'visual-illustration', label: 'Visual Illustration', color: 'text-indigo-500' },
        { type: 'highlight-box', label: 'Highlight Text', color: 'text-amber-500' },
        { type: 'emoji-reaction', label: 'Emoji Burst', color: 'text-rose-500' },
        { type: 'zoom-effect', label: 'Zoom In', color: 'text-blue-500' },
        { type: 'scene-transition', label: 'Flash Cut', color: 'text-purple-500' },
    ];

    const applyCurrentOptions = useCallback((
        overrideScene?: string,
        overrideDisplayMode?: string,
        overrideTransition?: string,
        overrideSoundEffect?: string,
    ) => {
        onApply('visual-illustration', {
            scene: overrideScene ?? selectedScene,
            label: '',
            color: '#6366f1',
            displayMode: overrideDisplayMode ?? displayMode,
            transition: overrideTransition ?? transition,
            soundEffect: overrideSoundEffect ?? soundEffect,
        });
    }, [onApply, selectedScene, displayMode, transition, soundEffect]);

    const handleSceneChange = (id: string) => {
        setSelectedScene(id);
        applyCurrentOptions(id, undefined, undefined, undefined);
    };
    const handleDisplayModeChange = (id: string) => {
        setDisplayMode(id);
        applyCurrentOptions(undefined, id, undefined, undefined);
    };
    const handleTransitionChange = (id: string) => {
        setTransition(id);
        applyCurrentOptions(undefined, undefined, id, undefined);
    };
    const handleSoundEffectChange = (id: string) => {
        setSoundEffect(id);
        applyCurrentOptions(undefined, undefined, undefined, id);
    };

    const applyWithDisplayOptions = () => {
        applyCurrentOptions();
        onClose();
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsAiGenerating(true);
        try {
            const config = await suggestSingleOverlayWithAI(segmentText, aiPrompt.trim());

            if (config) {
                if (config.type === 'visual-illustration') {
                    config.props = {
                        ...config.props,
                        displayMode: config.props.displayMode || 'full',
                        transition: config.props.transition || 'fade-in',
                        soundEffect: config.props.soundEffect || 'none',
                    };
                }
                if (onApplyConfig) {
                    onApplyConfig(config);
                } else {
                    onApply(config.type as OverlayType, config.props);
                }
            } else {
                const fallbackConfig = {
                    type: 'visual-illustration' as const,
                    props: { scene: 'brain-idea', label: segmentText.substring(0, 50), color: '#a78bfa', displayMode: 'full', transition: 'fade-in', soundEffect: 'none' },
                };
                if (onApplyConfig) {
                    onApplyConfig(fallbackConfig);
                } else {
                    onApply(fallbackConfig.type, fallbackConfig.props);
                }
            }
            onClose();
        } catch (err) {
            console.error('[AI Generate] Failed:', err);
        } finally {
            setIsAiGenerating(false);
        }
    };

    return (
        <div
            className="fixed z-50 flex flex-col gap-1 bg-card/95 backdrop-blur-2xl border border-border/60 rounded-xl p-3 animate-fade-in"
            style={{
                top: Math.min(position.top, typeof window !== 'undefined' ? window.innerHeight - 600 : position.top),
                left: Math.max(10, position.left),
                width: showDisplayOptions ? '340px' : '280px',
                boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-2 mb-1 border-b border-border/40">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest leading-none flex items-center gap-1.5">
                    {showDisplayOptions ? (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> Screen Layout</>
                    ) : 'Add Motion Graphic'}
                </span>
                <div className="flex items-center gap-1.5">
                    {showDisplayOptions && (
                        <button
                            onClick={() => setShowDisplayOptions(false)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
                        >
                            <IconChevronLeft /> Back
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
                    >
                        <IconX />
                    </button>
                </div>
            </div>

            {!showDisplayOptions ? (
                <>
                    {/* AI Prompt Input */}
                    <div className="flex items-center gap-2 px-1 mb-2">
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !isAiGenerating) handleAiGenerate(); }}
                            placeholder="Describe effect..."
                            disabled={isAiGenerating}
                            className="flex-1 bg-secondary/40 border border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-lg px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/60"
                            autoFocus
                        />
                        <button
                            onClick={handleAiGenerate}
                            disabled={isAiGenerating || !aiPrompt.trim()}
                            className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {isAiGenerating ? <span className="spinner w-4 h-4" /> : <IconSparkle />}
                        </button>
                    </div>

                    <div className="section-divider my-1.5" />

                    <div className="text-center text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5">
                        or pick manually
                    </div>

                    {/* Overlay type list */}
                    <div className="flex flex-col gap-0.5">
                        {overlayOptions.map((opt) => (
                            <button
                                key={opt.type}
                                onClick={() => {
                                    if (opt.type === 'visual-illustration') {
                                        setShowDisplayOptions(true);
                                    } else {
                                        onApply(opt.type);
                                        onClose();
                                    }
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground text-left transition-all duration-150
                                    ${existingOverlayType === opt.type ? 'bg-muted/70 font-medium' : 'hover:bg-muted/40'}
                                `}
                            >
                                <span className={`${opt.color} flex-shrink-0`}>{overlayIcons[opt.type]}</span>
                                <span className="flex-1">{opt.label}</span>
                                {opt.type === 'visual-illustration' && <span className="text-muted-foreground/40 text-xs">▸</span>}
                                {existingOverlayType === opt.type && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${opt.color.replace('text-', 'bg-')}`} />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Clear button */}
                    {existingOverlayType && (
                        <>
                            <div className="section-divider my-1.5" />
                            <button
                                onClick={() => { onClear(); onClose(); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/8 text-left transition-colors"
                            >
                                <IconTrash />
                                <span>Remove Graphic</span>
                            </button>
                        </>
                    )}
                </>
            ) : (
                /* ===== DISPLAY OPTIONS PANEL ===== */
                <div className="flex flex-col gap-4 px-1 py-1 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Scene Selection */}
                    <div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Scene</div>
                        <div className="flex flex-wrap gap-1.5">
                            {SCENES.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSceneChange(s.id)}
                                    className={`
                                        px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 flex items-center gap-1.5
                                        ${selectedScene === s.id
                                            ? 'bg-primary/10 border-primary/40 text-primary shadow-sm'
                                            : 'bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border'
                                        }
                                    `}
                                >
                                    <span>{s.icon}</span> {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Display Mode */}
                    <div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Display Mode</div>
                        <div className="flex flex-wrap gap-1.5">
                            {DISPLAY_MODES.map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => handleDisplayModeChange(d.id)}
                                    className={`
                                        px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 flex items-center gap-1.5
                                        ${displayMode === d.id
                                            ? 'bg-primary/10 border-primary/40 text-primary shadow-sm'
                                            : 'bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border'
                                        }
                                    `}
                                >
                                    {d.label} <span className="opacity-40">{d.icon}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transition */}
                    <div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Transition</div>
                        <div className="flex flex-wrap gap-1.5">
                            {TRANSITIONS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleTransitionChange(t.id)}
                                    className={`
                                        px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 flex items-center gap-1.5
                                        ${transition === t.id
                                            ? 'bg-primary/10 border-primary/40 text-primary shadow-sm'
                                            : 'bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border'
                                        }
                                    `}
                                >
                                    {t.label} <span className="opacity-40">{t.icon}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sound Effect */}
                    <div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Sound Effect</div>
                        <div className="flex flex-wrap gap-1.5">
                            {SOUND_EFFECTS.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSoundEffectChange(s.id)}
                                    className={`
                                        px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                                        ${soundEffect === s.id
                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                            : 'bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border'
                                        }
                                    `}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={applyWithDisplayOptions}
                        className="btn-primary mt-2 w-full py-2.5 text-sm rounded-lg gap-2"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        Apply Illustration
                    </button>
                </div>
            )}
        </div>
    );
};
