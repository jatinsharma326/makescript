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

    const progress = localFrame / duration;

    if (style === 'wipe') {
        const wipeProgress = interpolate(
            localFrame,
            [0, midpoint, duration],
            [0, 100, 0],
            { extrapolateRight: 'clamp' }
        );

        return (
            <AbsoluteFill>
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: `${wipeProgress}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    }}
                />
            </AbsoluteFill>
        );
    }

    if (style === 'zoom') {
        const scale = interpolate(
            localFrame,
            [0, midpoint, duration],
            [1, 1.5, 1],
            { extrapolateRight: 'clamp' }
        );
        const opacity = interpolate(
            localFrame,
            [0, midpoint * 0.8, midpoint, midpoint * 1.2, duration],
            [0, 1, 1, 1, 0],
            { extrapolateRight: 'clamp' }
        );

        return (
            <AbsoluteFill>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `${color}40`,
                        opacity,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: `scale(${scale})`,
                    }}
                >
                    {text && (
                        <span
                            style={{
                                fontSize: 48,
                                fontWeight: 800,
                                color: '#fff',
                                fontFamily: "'Inter', sans-serif",
                                textShadow: `0 0 30px ${color}`,
                            }}
                        >
                            {text}
                        </span>
                    )}
                </div>
            </AbsoluteFill>
        );
    }

    // Default: fade
    const fadeOpacity = interpolate(
        localFrame,
        [0, midpoint * 0.5, midpoint, duration * 0.8, duration],
        [0, 0.8, 0.9, 0.8, 0],
        { extrapolateRight: 'clamp' }
    );

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at center, ${color}60, ${color}20)`,
                    opacity: fadeOpacity,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {text && (
                    <span
                        style={{
                            fontSize: 40,
                            fontWeight: 700,
                            color: '#fff',
                            fontFamily: "'Inter', sans-serif",
                            opacity: fadeOpacity > 0.5 ? 1 : 0,
                            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        }}
                    >
                        {text}
                    </span>
                )}
            </div>
        </AbsoluteFill>
    );
};
