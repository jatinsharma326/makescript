'use client';

import React from 'react';
import {
    AbsoluteFill,
    OffthreadVideo,
    useCurrentFrame,
    useVideoConfig,
    staticFile,
} from 'remotion';
import { AnimatedSubtitles } from './overlays/AnimatedSubtitles';
import { LowerThird } from './overlays/LowerThird';
import { HighlightBox } from './overlays/HighlightBox';
import { EmojiReaction } from './overlays/EmojiReaction';
import { SceneTransition } from './overlays/SceneTransition';
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
                <OffthreadVideo src={videoSrc} />
            </AbsoluteFill>

            {/* Animated subtitles layer */}
            {showSubtitles && (
                <AnimatedSubtitles
                    subtitles={subtitleFrames}
                    fontSize={32}
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
                    case 'highlight-box':
                        return (
                            <HighlightBox
                                key={seg.id}
                                text={seg.text}
                                color={String(seg.overlay.props.color || '#f59e0b')}
                                style={(seg.overlay.props.style as 'glow' | 'solid' | 'outline') || 'glow'}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    case 'emoji-reaction':
                        return (
                            <EmojiReaction
                                key={seg.id}
                                emoji={String(seg.overlay.props.emoji || '🔥')}
                                size={Number(seg.overlay.props.size || 80)}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    case 'scene-transition':
                        return (
                            <SceneTransition
                                key={seg.id}
                                color={String(seg.overlay.props.color || '#6366f1')}
                                style={(seg.overlay.props.style as 'fade' | 'wipe' | 'zoom') || 'fade'}
                                startFrame={startFrame}
                                endFrame={endFrame}
                            />
                        );
                    case 'zoom-effect':
                        // Zoom effect is a simple scale on the video itself
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
                    default:
                        return null;
                }
            })}
        </AbsoluteFill>
    );
};
