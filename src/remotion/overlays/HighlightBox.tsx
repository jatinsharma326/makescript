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

    // Scale-in with spring overshoot
    const cardScale = spring({
        frame: localFrame,
        fps,
        config: { damping: 10, stiffness: 140, mass: 0.6 },
    });

    // Content slide-up (delayed)
    const contentReveal = spring({
        frame: Math.max(0, localFrame - 6),
        fps,
        config: { damping: 14, stiffness: 120 },
    });

    // Accent bar width
    const accentWidth = spring({
        frame: Math.max(0, localFrame - 4),
        fps,
        config: { damping: 16, stiffness: 100 },
    });

    // Subtle glow pulse
    const glowIntensity = Math.sin(localFrame * 0.1) * 0.3 + 0.7;

    // Exit
    const exitOpacity = interpolate(
        localFrame,
        [duration - 12, duration],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const exitScale = interpolate(
        localFrame,
        [duration - 12, duration],
        [1, 0.88],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

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
                {/* Card body */}
                <div
                    style={{
                        position: 'relative',
                        padding: '20px 28px',
                        borderRadius: '16px',
                        background: 'linear-gradient(145deg, rgba(8,8,20,0.82), rgba(20,20,50,0.68))',
                        backdropFilter: 'blur(14px)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow: `
                            0 14px 44px rgba(0,0,0,0.4),
                            inset 0 1px 0 rgba(255,255,255,0.05),
                            0 0 ${glowIntensity * 20}px ${color}18
                        `,
                        overflow: 'hidden',
                    }}
                >
                    {/* Top accent bar + label */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '12px',
                        }}
                    >
                        {/* Animated dot */}
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: color,
                                boxShadow: `0 0 ${glowIntensity * 10}px ${color}`,
                                transform: `scale(${0.85 + glowIntensity * 0.3})`,
                            }}
                        />
                        {/* Accent line */}
                        <div
                            style={{
                                width: `${accentWidth * 70}px`,
                                height: '2px',
                                background: `linear-gradient(90deg, ${color}, transparent)`,
                                borderRadius: '1px',
                            }}
                        />
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
                            }}
                        >
                            KEY POINT
                        </span>
                    </div>

                    {/* Main text */}
                    <div
                        style={{
                            transform: `translateY(${(1 - contentReveal) * 14}px)`,
                            opacity: contentReveal,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                fontSize: 25,
                                fontWeight: 700,
                                color: '#ffffff',
                                lineHeight: 1.3,
                                letterSpacing: '-0.01em',
                                textShadow: `0 2px 6px rgba(0,0,0,0.4), 0 0 14px ${color}15`,
                            }}
                        >
                            {text}
                        </span>
                    </div>

                    {/* Bottom gradient line */}
                    <div
                        style={{
                            marginTop: '14px',
                            height: '2px',
                            background: `linear-gradient(90deg, ${color}50, transparent)`,
                            width: `${accentWidth * 100}%`,
                            borderRadius: '1px',
                        }}
                    />
                </div>
            </div>
        </AbsoluteFill>
    );
};
