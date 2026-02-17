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

    // 3D perspective entrance with spring
    const cardReveal = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 160, mass: 0.5 },
    });

    // Content staggered reveal
    const contentReveal = spring({
        frame: Math.max(0, localFrame - 5),
        fps,
        config: { damping: 16, stiffness: 120, mass: 0.4 },
    });

    // Accent bar animated width
    const accentWidth = spring({
        frame: Math.max(0, localFrame - 3),
        fps,
        config: { damping: 18, stiffness: 90, mass: 0.5 },
    });

    // Text line-by-line reveal
    const textReveal = spring({
        frame: Math.max(0, localFrame - 8),
        fps,
        config: { damping: 14, stiffness: 100 },
    });

    // Subtle ambient glow pulse
    const glowPulse = Math.sin(localFrame * 0.08) * 0.25 + 0.75;
    // Rotating border gradient position
    const borderAngle = localFrame * 1.2;

    // Cinematic exit
    const exitProgress = interpolate(
        localFrame,
        [duration - 18, duration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const exitOpacity = 1 - exitProgress;
    const exitScale = interpolate(exitProgress, [0, 1], [1, 0.85]);
    const exitBlur = interpolate(exitProgress, [0, 0.5, 1], [0, 0, 3]);
    const exitY = interpolate(exitProgress, [0, 1], [0, 20]);

    const positions: Record<string, React.CSSProperties> = {
        glow: { top: '10%', right: '6%' },
        solid: { bottom: '14%', left: '6%' },
        outline: { top: '14%', left: '6%' },
    };

    // Card entrance: rotateY for 3D flip feel
    const cardRotateY = interpolate(cardReveal, [0, 1], [15, 0]);
    const cardRotateX = interpolate(cardReveal, [0, 1], [-5, 0]);
    const cardTranslateX = interpolate(cardReveal, [0, 1], [style === 'solid' ? -40 : 40, 0]);

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {/* Background glow behind card */}
            <div
                style={{
                    position: 'absolute',
                    ...positions[style],
                    width: '380px',
                    height: '200px',
                    background: `radial-gradient(ellipse, ${color}15, transparent 60%)`,
                    filter: 'blur(30px)',
                    opacity: exitOpacity * glowPulse * 0.6,
                    transform: `translate(${style === 'solid' ? '-20%' : '0'}, -20%)`,
                }}
            />

            {/* Main card container */}
            <div
                style={{
                    position: 'absolute',
                    ...positions[style],
                    transform: `
                        perspective(1000px)
                        rotateY(${cardRotateY}deg)
                        rotateX(${cardRotateX}deg)
                        translateX(${cardTranslateX}px)
                        scale(${cardReveal * exitScale})
                        translateY(${exitY}px)
                    `,
                    opacity: cardReveal * exitOpacity,
                    maxWidth: '42%',
                    filter: exitBlur > 0.3 ? `blur(${exitBlur}px)` : undefined,
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Card body with premium glass */}
                <div
                    style={{
                        position: 'relative',
                        padding: '22px 28px',
                        borderRadius: '18px',
                        background: 'linear-gradient(155deg, rgba(12,14,28,0.88), rgba(18,20,40,0.75), rgba(8,10,25,0.82))',
                        backdropFilter: 'blur(20px) saturate(1.4)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: `
                            0 20px 60px rgba(0,0,0,0.45),
                            0 8px 24px rgba(0,0,0,0.25),
                            inset 0 1px 0 rgba(255,255,255,0.08),
                            inset 0 -1px 0 rgba(255,255,255,0.02),
                            0 0 ${glowPulse * 30}px ${color}12,
                            0 0 ${glowPulse * 60}px ${color}06
                        `,
                        overflow: 'hidden',
                    }}
                >
                    {/* Animated gradient border overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '18px',
                            padding: '1px',
                            background: `conic-gradient(from ${borderAngle}deg, transparent 0%, ${color}15 10%, transparent 20%, transparent 50%, ${color}10 60%, transparent 70%)`,
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Top glass highlight */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: '10%',
                            right: '10%',
                            height: '1px',
                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.15) 70%, transparent)`,
                            borderRadius: '1px',
                        }}
                    />

                    {/* Header: accent dot + animated line + label */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '14px',
                            opacity: contentReveal,
                            transform: `translateY(${(1 - contentReveal) * 8}px)`,
                        }}
                    >
                        {/* Pulsing accent dot */}
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${color}, ${color}80)`,
                                boxShadow: `
                                    0 0 ${glowPulse * 12}px ${color}80,
                                    0 0 ${glowPulse * 24}px ${color}40
                                `,
                                transform: `scale(${0.8 + glowPulse * 0.3})`,
                            }}
                        />
                        {/* Gradient accent line */}
                        <div
                            style={{
                                width: `${accentWidth * 80}px`,
                                height: '2px',
                                background: `linear-gradient(90deg, ${color}, ${color}40, transparent)`,
                                borderRadius: '1px',
                                boxShadow: `0 0 4px ${color}30`,
                            }}
                        />
                        {/* Label badge */}
                        <span
                            style={{
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                fontSize: 10,
                                fontWeight: 700,
                                color: color,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                opacity: contentReveal * 0.9,
                                textShadow: `0 0 8px ${color}30`,
                            }}
                        >
                            KEY POINT
                        </span>
                    </div>

                    {/* Main text with stagger */}
                    <div
                        style={{
                            transform: `translateY(${(1 - textReveal) * 12}px)`,
                            opacity: textReveal,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                fontSize: 24,
                                fontWeight: 700,
                                color: '#ffffff',
                                lineHeight: 1.35,
                                letterSpacing: '-0.015em',
                                textShadow: `
                                    0 2px 8px rgba(0,0,0,0.4),
                                    0 0 20px ${color}10
                                `,
                            }}
                        >
                            {text}
                        </span>
                    </div>

                    {/* Bottom accent bar with gradient */}
                    <div
                        style={{
                            marginTop: '16px',
                            height: '2px',
                            borderRadius: '1px',
                            background: `linear-gradient(90deg, ${color}60, ${color}20, transparent)`,
                            width: `${accentWidth * 100}%`,
                            boxShadow: `0 0 6px ${color}15`,
                            opacity: 0.8,
                        }}
                    />

                    {/* Decorative corner accent */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '12px',
                            width: '20px',
                            height: '20px',
                            borderRight: `1.5px solid ${color}20`,
                            borderBottom: `1.5px solid ${color}20`,
                            borderRadius: '0 0 6px 0',
                            opacity: accentWidth * 0.6,
                        }}
                    />
                </div>
            </div>
        </AbsoluteFill>
    );
};
