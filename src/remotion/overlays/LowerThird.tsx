import React from 'react';
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    spring,
} from 'remotion';

interface LowerThirdProps {
    name: string;
    title: string;
    color?: string;
    startFrame: number;
    endFrame: number;
}

export const LowerThird: React.FC<LowerThirdProps> = ({
    name,
    title,
    color = '#6366f1',
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;

    // Stage 1: Accent line shoots in (0-8 frames)
    const lineWidth = spring({
        frame: localFrame,
        fps,
        config: { damping: 16, stiffness: 180, mass: 0.6 },
    });

    // Stage 2: Background panel slides in (delayed 5 frames)
    const panelSlide = spring({
        frame: Math.max(0, localFrame - 5),
        fps,
        config: { damping: 14, stiffness: 100, mass: 0.7 },
    });

    // Stage 3: Name text reveals (delayed 10 frames)
    const nameReveal = spring({
        frame: Math.max(0, localFrame - 10),
        fps,
        config: { damping: 14, stiffness: 100 },
    });

    // Stage 4: Title text reveals (delayed 16 frames)
    const titleReveal = spring({
        frame: Math.max(0, localFrame - 16),
        fps,
        config: { damping: 14, stiffness: 100 },
    });

    // Exit — smooth slide + fade
    const exitProgress = interpolate(
        localFrame,
        [duration - 18, duration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const exitSlide = interpolate(exitProgress, [0, 1], [0, -350]);
    const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    bottom: '8%',
                    left: '5%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    transform: `translateX(${exitSlide}px)`,
                    opacity: exitOpacity,
                }}
            >
                {/* Accent vertical bar with gradient */}
                <div
                    style={{
                        width: '5px',
                        height: `${lineWidth * 85}px`,
                        background: `linear-gradient(180deg, ${color}, #a78bfa, transparent)`,
                        borderRadius: '3px',
                        boxShadow: `0 0 12px ${color}60`,
                        marginRight: '16px',
                        flexShrink: 0,
                    }}
                />

                {/* Main panel */}
                <div
                    style={{
                        transform: `translateX(${(1 - panelSlide) * -180}px)`,
                        opacity: panelSlide,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                    }}
                >
                    {/* Glassmorphic card */}
                    <div
                        style={{
                            position: 'relative',
                            padding: '18px 30px 16px 22px',
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(15,15,40,0.6))',
                            backdropFilter: 'blur(14px)',
                            borderRadius: '0 12px 12px 0',
                            border: '1px solid rgba(255,255,255,0.06)',
                            boxShadow: `0 10px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)`,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Top accent gradient line */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `${lineWidth * 100}%`,
                                height: '3px',
                                background: `linear-gradient(90deg, ${color}, #c084fc, transparent)`,
                                boxShadow: `0 0 8px ${color}50`,
                            }}
                        />

                        {/* Name */}
                        <div
                            style={{
                                overflow: 'hidden',
                                transform: `translateY(${(1 - nameReveal) * 25}px)`,
                                opacity: nameReveal,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 34,
                                    fontWeight: 800,
                                    color: '#ffffff',
                                    letterSpacing: '-0.02em',
                                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                    display: 'block',
                                }}
                            >
                                {name}
                            </span>
                        </div>

                        {/* Gradient divider */}
                        <div
                            style={{
                                width: `${nameReveal * 110}px`,
                                height: '2px',
                                background: `linear-gradient(90deg, ${color}, transparent)`,
                                margin: '6px 0',
                                opacity: nameReveal,
                            }}
                        />

                        {/* Title */}
                        <div
                            style={{
                                overflow: 'hidden',
                                transform: `translateY(${(1 - titleReveal) * 18}px)`,
                                opacity: titleReveal,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 17,
                                    fontWeight: 500,
                                    color: '#a5b4fc',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                                    display: 'block',
                                }}
                            >
                                {title}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};
