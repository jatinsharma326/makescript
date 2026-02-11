import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from 'remotion';

interface HighlightBoxProps {
    text: string;
    color?: string;
    startFrame: number;
    endFrame: number;
    style?: 'glow' | 'solid' | 'outline';
}

export const HighlightBox: React.FC<HighlightBoxProps> = ({
    text,
    color = '#f59e0b',
    startFrame,
    endFrame,
    style = 'glow',
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;

    // Scale-in entrance
    const cardScale = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 120, mass: 0.6 },
    });

    // Content reveal (delayed)
    const contentReveal = spring({
        frame: Math.max(0, localFrame - 6),
        fps,
        config: { damping: 14, stiffness: 120 },
    });

    // Exit fade + scale
    const exitOpacity = interpolate(
        localFrame,
        [duration - 12, duration],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const exitScale = interpolate(
        localFrame,
        [duration - 12, duration],
        [1, 0.9],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Position based on style variant
    const positions: Record<string, React.CSSProperties> = {
        glow: { top: '12%', right: '8%' },
        solid: { bottom: '15%', left: '8%' },
        outline: { top: '15%', left: '8%' },
    };

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    ...positions[style],
                    transform: `scale(${cardScale * exitScale})`,
                    opacity: exitOpacity,
                    maxWidth: '45%',
                }}
            >
                {/* Card */}
                <div
                    style={{
                        padding: '18px 26px',
                        borderRadius: '14px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(10px)',
                        borderLeft: `4px solid ${color}`,
                    }}
                >
                    {/* Label */}
                    <span
                        style={{
                            fontFamily: "'Inter', 'Segoe UI', sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                            color: color,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            opacity: contentReveal,
                            display: 'block',
                            marginBottom: '10px',
                        }}
                    >
                        KEY POINT
                    </span>

                    {/* Text */}
                    <div
                        style={{
                            transform: `translateY(${(1 - contentReveal) * 12}px)`,
                            opacity: contentReveal,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                fontSize: 24,
                                fontWeight: 600,
                                color: '#ffffff',
                                lineHeight: 1.3,
                            }}
                        >
                            {text}
                        </span>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};
