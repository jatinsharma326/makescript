'use client';

import React from 'react';
import {
    AbsoluteFill,
    Video,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';
import { AnimatedSubtitles } from './overlays/AnimatedSubtitles';
import { LowerThird } from './overlays/LowerThird';
import { HighlightBox } from './overlays/HighlightBox';
import { EmojiReaction } from './overlays/EmojiReaction';
import { SceneTransition } from './overlays/SceneTransition';
import { GlowingParticles } from './overlays/GlowingParticles';
import { KineticText } from './overlays/KineticText';
import { VisualIllustration } from './overlays/VisualIllustration';
import { SubtitleSegment } from '../lib/types';

interface VideoWithOverlaysProps {
    videoSrc: string;
    subtitles: SubtitleSegment[];
    fps: number;
    showSubtitles?: boolean;
}

export const VideoWithOverlays: React.FC<VideoWithOverlaysProps> = ({
    videoSrc,
    subtitles,
    fps,
    showSubtitles = true,
}) => {
    const frame = useCurrentFrame();

    // Convert subtitle timestamps to frames for the subtitle renderer
    const subtitleFrames = subtitles.map((s) => ({
        text: s.text,
        startFrame: Math.round(s.startTime * fps),
        endFrame: Math.round(s.endTime * fps),
    }));

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* Base video */}
            <AbsoluteFill>
                <Video src={videoSrc} />
            </AbsoluteFill>

            {/* Animated subtitles layer */}
            {showSubtitles && (
                <AnimatedSubtitles
                    subtitles={subtitleFrames}
                    fontSize={38}
                    highlightColor="#6366f1"
                />
            )}

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
                    default:
                        return null;
                }
            })}
        </AbsoluteFill>
    );
};
