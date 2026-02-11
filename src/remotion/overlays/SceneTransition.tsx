import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from 'remotion';

interface SceneTransitionProps {
    color?: string;
    text?: string;
    startFrame: number;
    endFrame: number;
    style?: 'fade' | 'wipe' | 'zoom';
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
    color = '#6366f1',
    text,
    startFrame,
    endFrame,
    style = 'fade',
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;
    const midpoint = duration / 2;

    // === Wipe — single clean line sweep ===
    if (style === 'wipe') {
        const wipePos = interpolate(
            localFrame,
            [0, duration],
            [-5, 105],
            { extrapolateRight: 'clamp' }
        );
        const wipeOpacity = interpolate(
            localFrame,
            [0, 4, duration - 4, duration],
            [0, 0.7, 0.7, 0],
            { extrapolateRight: 'clamp' }
        );

        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                <div
                    style={{
                        position: 'absolute',
                        left: `${wipePos}%`,
                        top: 0,
                        width: '3px',
                        height: '100%',
                        background: color,
                        opacity: wipeOpacity,
                        boxShadow: `0 0 12px ${color}60`,
                    }}
                />
            </AbsoluteFill>
        );
    }

    // === Zoom — subtle vignette pulse ===
    if (style === 'zoom') {
        const vignetteOpacity = interpolate(
            localFrame,
            [0, midpoint * 0.5, midpoint, duration],
            [0, 0.4, 0.3, 0],
            { extrapolateRight: 'clamp' }
        );

        const flashOpacity = interpolate(
            localFrame,
            [midpoint - 3, midpoint, midpoint + 6],
            [0, 0.3, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                {/* Vignette */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle, transparent 40%, ${color}20 100%)`,
                        opacity: vignetteOpacity,
                    }}
                />
                {/* Flash */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'white',
                        opacity: flashOpacity,
                        mixBlendMode: 'plus-lighter',
                    }}
                />
            </AbsoluteFill>
        );
    }

    // === Fade — simple flash ===
    const flashOpacity = interpolate(
        localFrame,
        [0, 3, 8, 15],
        [0, 0.5, 0.1, 0],
        { extrapolateRight: 'clamp' }
    );

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'white',
                    opacity: flashOpacity,
                    mixBlendMode: 'plus-lighter',
                }}
            />
        </AbsoluteFill>
    );
};
