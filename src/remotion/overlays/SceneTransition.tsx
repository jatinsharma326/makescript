import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
    random,
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

    // === Wipe — smooth light bar sweep ===
    if (style === 'wipe') {
        const wipePos = interpolate(
            localFrame,
            [0, duration],
            [-10, 110],
            { extrapolateRight: 'clamp' }
        );
        const wipeOpacity = interpolate(
            localFrame,
            [0, 4, duration - 4, duration],
            [0, 0.8, 0.8, 0],
            { extrapolateRight: 'clamp' }
        );

        // Trailing glow
        const trailPos = interpolate(
            localFrame,
            [0, duration],
            [-15, 105],
            { extrapolateRight: 'clamp' }
        );

        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                {/* Main wipe line */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${wipePos}%`,
                        top: 0,
                        width: '4px',
                        height: '100%',
                        background: `linear-gradient(180deg, transparent, ${color}, #a78bfa, transparent)`,
                        boxShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
                        opacity: wipeOpacity,
                    }}
                />
                {/* Trailing glow */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${trailPos}%`,
                        top: 0,
                        width: '60px',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, ${color}10, transparent)`,
                        opacity: wipeOpacity * 0.6,
                    }}
                />
            </AbsoluteFill>
        );
    }

    // === Zoom — radial vignette with flash ===
    if (style === 'zoom') {
        const vignetteOpacity = interpolate(
            localFrame,
            [0, midpoint * 0.5, midpoint, duration],
            [0, 0.45, 0.3, 0],
            { extrapolateRight: 'clamp' }
        );

        const flashOpacity = interpolate(
            localFrame,
            [midpoint - 3, midpoint, midpoint + 6],
            [0, 0.35, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        const zoomScale = interpolate(
            localFrame,
            [0, midpoint, duration],
            [1, 1.06, 1],
            { extrapolateRight: 'clamp' }
        );

        // Edge ring
        const ringSize = interpolate(
            localFrame,
            [0, midpoint, duration],
            [0, 100, 0],
            { extrapolateRight: 'clamp' }
        );

        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                {/* Vignette */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle at 50% 50%, transparent ${ringSize * 0.3}%, ${color}12 ${ringSize * 0.6}%, ${color}25 100%)`,
                        opacity: vignetteOpacity,
                    }}
                />

                {/* Edge glow ring */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: `${ringSize * 4}px`,
                        height: `${ringSize * 4}px`,
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        border: `1.5px solid ${color}30`,
                        boxShadow: `0 0 20px ${color}15, inset 0 0 20px ${color}08`,
                        opacity: vignetteOpacity * 0.7,
                    }}
                />

                {/* Flash */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle, white, ${color}30)`,
                        opacity: flashOpacity,
                        mixBlendMode: 'plus-lighter',
                    }}
                />
            </AbsoluteFill>
        );
    }

    // === Fade — cinematic flash ===
    const flashOpacity = interpolate(
        localFrame,
        [0, 3, 8, 15],
        [0, 0.55, 0.12, 0],
        { extrapolateRight: 'clamp' }
    );

    // Horizontal accent line
    const lineScale = interpolate(localFrame, [0, 8], [0, 1], {
        extrapolateRight: 'clamp',
    });
    const lineOpacity = interpolate(localFrame, [0, 5, 15], [0, 0.5, 0]);

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {/* Flash */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(135deg, white, ${color}30)`,
                    opacity: flashOpacity,
                    mixBlendMode: 'plus-lighter',
                }}
            />

            {/* Accent line across screen */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
                    opacity: lineOpacity,
                    transform: `scaleX(${lineScale})`,
                }}
            />
        </AbsoluteFill>
    );
};
