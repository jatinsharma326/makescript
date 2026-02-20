'use client';

import type { VideoFilters, TextOverlay } from '../lib/types';

import React from 'react';
import {
    AbsoluteFill,
    Video,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';
import { LowerThird } from './overlays/LowerThird';
import { HighlightBox } from './overlays/HighlightBox';
import { EmojiReaction } from './overlays/EmojiReaction';
import { SceneTransition } from './overlays/SceneTransition';
import { GlowingParticles } from './overlays/GlowingParticles';
import { KineticText } from './overlays/KineticText';
import { VisualIllustration } from './overlays/VisualIllustration';
import { ImageCard } from './overlays/ImageCard';
import { SubtitleSegment } from '../lib/types';

// Overlay types that already render the segment text visually.
// The burn-in subtitle layer should skip these to avoid showing duplicates.
const TEXT_OVERLAYS = new Set([
    'kinetic-text',
    'highlight-box',
    'lower-third',
    'animated-subtitles',
    'image-card',
    'ai-generated-image',
]);

interface VideoWithOverlaysProps {
    videoSrc: string;
    subtitles: SubtitleSegment[];
    fps: number;
    filters?: VideoFilters;
    textOverlays?: TextOverlay[];
}

export const VideoWithOverlays: React.FC<VideoWithOverlaysProps> = ({
    videoSrc,
    subtitles,
    fps,
    filters,
    textOverlays = [],
}) => {
    const frame = useCurrentFrame();

    // Build CSS filter string from filters
    const cssFilter = filters ? [
        filters.brightness !== 100 ? `brightness(${filters.brightness / 100})` : '',
        filters.contrast !== 100 ? `contrast(${filters.contrast / 100})` : '',
        filters.saturation !== 100 ? `saturate(${filters.saturation / 100})` : '',
        filters.blur > 0 ? `blur(${filters.blur}px)` : '',
    ].filter(Boolean).join(' ') : 'none';

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* Base video — always visible, overlays appear on top */}
            <AbsoluteFill style={{
                filter: cssFilter !== 'none' ? cssFilter : undefined,
            }}>
                <Video src={videoSrc} volume={1} />
            </AbsoluteFill>

            {/* Vignette overlay */}
            {filters && filters.vignette > 0 && (
                <AbsoluteFill style={{
                    background: `radial-gradient(ellipse at center, transparent ${100 - filters.vignette}%, rgba(0,0,0,${filters.vignette / 100 * 0.8}) 100%)`,
                    pointerEvents: 'none',
                }} />
            )}

            {/* Temperature overlay */}
            {filters && filters.temperature !== 0 && (
                <AbsoluteFill style={{
                    background: filters.temperature > 0
                        ? `rgba(255, ${180 - filters.temperature * 2}, 0, ${Math.abs(filters.temperature) / 200})`
                        : `rgba(0, ${100 + Math.abs(filters.temperature) * 2}, 255, ${Math.abs(filters.temperature) / 200})`,
                    mixBlendMode: 'overlay',
                    pointerEvents: 'none',
                }} />
            )}

            {/* Custom text overlays */}
            {textOverlays.map((txt) => {
                const txtStart = Math.round(txt.startTime * fps);
                const txtEnd = Math.round(txt.endTime * fps);
                if (frame < txtStart || frame > txtEnd) return null;
                const localF = frame - txtStart;
                const fadeIn = Math.min(1, localF / 6);
                const fadeOut = Math.min(1, (txtEnd - frame) / 6);
                const opacity = Math.min(fadeIn, fadeOut);
                return (
                    <div key={txt.id} style={{
                        position: 'absolute',
                        left: `${txt.x}%`,
                        top: `${txt.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: txt.fontSize,
                        fontWeight: txt.fontWeight,
                        color: txt.color,
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                        textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.4)',
                        opacity,
                        transition: 'opacity 0.1s',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}>{txt.text}</div>
                );
            })}

            {/* Animated subtitles — hidden when the segment has an overlay that already displays text */}
            {subtitles.map((seg) => {
                // Skip subtitle burn-in for segments whose overlay already renders text,
                // to avoid showing the same words twice on screen.
                if (seg.overlay && TEXT_OVERLAYS.has(seg.overlay.type)) return null;

                const startFrame = Math.round(seg.startTime * fps);
                const endFrame = Math.round(seg.endTime * fps);
                if (frame < startFrame || frame > endFrame) return null;

                const localFrame = frame - startFrame;
                const totalFrames = endFrame - startFrame;
                const fadeIn = Math.min(1, localFrame / 8);
                const fadeOut = Math.min(1, (endFrame - frame) / 8);
                const opacity = Math.min(fadeIn, fadeOut);
                const slideUp = Math.max(0, 10 - localFrame * 2);

                return (
                    <div
                        key={`sub-${seg.id}`}
                        style={{
                            position: 'absolute',
                            bottom: '8%',
                            left: '50%',
                            transform: `translateX(-50%) translateY(${slideUp}px)`,
                            maxWidth: '85%',
                            textAlign: 'center',
                            opacity,
                            pointerEvents: 'none',
                            zIndex: 10,
                        }}
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '8px 20px',
                                borderRadius: '8px',
                                background: 'rgba(0, 0, 0, 0.75)',
                                backdropFilter: 'blur(8px)',
                                color: '#ffffff',
                                fontSize: '28px',
                                fontWeight: 600,
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                lineHeight: 1.4,
                                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                                letterSpacing: '0.01em',
                            }}
                        >
                            {seg.text}
                        </span>
                    </div>
                );
            })}

            {/* Overlay layers from user selections */}
            {subtitles.map((seg) => {
                if (!seg.overlay) return null;

                const startFrame = Math.round(seg.startTime * fps);
                const endFrame = Math.round(seg.endTime * fps);

                switch (seg.overlay.type) {
                    case 'lower-third':
                        return (
                            <LowerThird
                                key={seg.id}
                                name={String(seg.overlay.props.name || 'Creator')}
                                title={String(seg.overlay.props.title || 'Title')}
                                color={String(seg.overlay.props.color || '#6366f1')}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    case 'highlight-box': {
                        const rawStyle = String(seg.overlay.props.style || 'glow');
                        const validStyles = ['glow', 'solid', 'outline'];
                        const style = validStyles.includes(rawStyle) ? rawStyle : 'glow';
                        return (
                            <HighlightBox
                                key={seg.id}
                                text={seg.text}
                                color={String(seg.overlay.props.color || '#f59e0b')}
                                style={style as 'glow' | 'solid' | 'outline'}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    }
                    case 'emoji-reaction':
                        return (
                            <EmojiReaction
                                key={seg.id}
                                emoji={String(seg.overlay.props.emoji || '🔥')}
                                size={Number(seg.overlay.props.size || 70)}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    case 'scene-transition': {
                        const rawStyle = String(seg.overlay.props.style || 'fade');
                        const validStyles = ['fade', 'wipe', 'zoom'];
                        const style = validStyles.includes(rawStyle) ? rawStyle : 'fade';
                        return (
                            <SceneTransition
                                key={seg.id}
                                color={String(seg.overlay.props.color || '#6366f1')}
                                style={style as 'fade' | 'wipe' | 'zoom'}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    }
                    case 'glowing-particles': {
                        const rawStyle = String(seg.overlay.props.style || 'ambient');
                        const validStyles = ['ambient', 'burst', 'rain'];
                        const pStyle = validStyles.includes(rawStyle) ? rawStyle : 'ambient';
                        return (
                            <GlowingParticles
                                key={seg.id}
                                color={String(seg.overlay.props.color || '#6366f1')}
                                count={Number(seg.overlay.props.count || 20)}
                                style={pStyle as 'ambient' | 'burst' | 'rain'}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    }
                    case 'kinetic-text': {
                        const rawStyle = String(seg.overlay.props.style || 'pop');
                        const validStyles = ['pop', 'slide', 'typewriter'];
                        const kStyle = validStyles.includes(rawStyle) ? rawStyle : 'pop';
                        const rawPos = String(seg.overlay.props.position || 'center');
                        const validPos = ['center', 'top', 'bottom'];
                        const kPos = validPos.includes(rawPos) ? rawPos : 'center';
                        return (
                            <KineticText
                                key={seg.id}
                                text={String(seg.overlay.props.text || seg.text)}
                                color={String(seg.overlay.props.color || '#6366f1')}
                                style={kStyle as 'pop' | 'slide' | 'typewriter'}
                                position={kPos as 'center' | 'top' | 'bottom'}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    }
                    case 'zoom-effect':
                        // Zoom effect is a subtle overlay
                        return (
                            <AbsoluteFill
                                key={seg.id}
                                style={{
                                    display: frame >= startFrame && frame <= endFrame ? 'flex' : 'none',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        border: '3px solid #6366f1',
                                        borderRadius: 0,
                                        opacity: 0.6,
                                        boxShadow: 'inset 0 0 30px rgba(99, 102, 241, 0.2)',
                                    }}
                                />
                            </AbsoluteFill>
                        );
                    case 'visual-illustration':
                        return (
                            <VisualIllustration
                                key={seg.id}
                                scene={String(seg.overlay.props.scene || 'solar-system')}
                                label={String(seg.overlay.props.label || '')}
                                color={String(seg.overlay.props.color || '#6366f1')}
                                displayMode={String(seg.overlay.props.displayMode || 'overlay')}
                                transition={String(seg.overlay.props.transition || 'fade-in')}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    case 'image-card':
                        return (
                            <ImageCard
                                key={seg.id}
                                imageUrl={String(seg.overlay.props.imageUrl || '')}
                                keyword={String(seg.overlay.props.keyword || '')}
                                label={String(seg.overlay.props.label || '')}
                                displayMode={(seg.overlay.props.displayMode as 'card' | 'fullscreen' | 'picture-in-picture' | 'split') || 'card'}
                                position={(seg.overlay.props.position as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') || 'center'}
                                transition={(seg.overlay.props.transition as 'slide-in' | 'zoom-in' | 'fade-in' | 'flip') || 'slide-in'}
                                cardStyle={(seg.overlay.props.cardStyle as 'glass' | 'solid' | 'minimal' | 'neon') || 'glass'}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    case 'ai-generated-image':
                        // AI-generated images are rendered the same as image-cards but with different source
                        return (
                            <ImageCard
                                key={seg.id}
                                imageUrl={String(seg.overlay.props.imageUrl || '')}
                                keyword={String(seg.overlay.props.style || 'AI Generated')}
                                label={String(seg.overlay.props.imagePrompt || '').substring(0, 50) + '...'}
                                displayMode={(seg.overlay.props.displayMode as 'card' | 'fullscreen' | 'picture-in-picture' | 'split') || 'full'}
                                position="center"
                                transition={(seg.overlay.props.transition as 'slide-in' | 'zoom-in' | 'fade-in' | 'flip') || 'fade-in'}
                                cardStyle="glass"
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    default:
                        return null;
                }
            })}
        </AbsoluteFill>
    );
};
