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

    // Accent bar slides in
    const barWidth = spring({
        frame: localFrame,
        fps,
        config: { damping: 16, stiffness: 150, mass: 0.6 },
    });

    // Panel slides in (delayed)
    const panelSlide = spring({
        frame: Math.max(0, localFrame - 5),
        fps,
        config: { damping: 14, stiffness: 100, mass: 0.7 },
    });

    // Name fades in (delayed)
    const nameReveal = spring({
        frame: Math.max(0, localFrame - 10),
        fps,
        config: { damping: 14, stiffness: 100 },
    });

    // Title fades in (delayed more)
    const titleReveal = spring({
        frame: Math.max(0, localFrame - 16),
        fps,
        config: { damping: 14, stiffness: 100 },
    });

    // Exit — slide left and fade out
    const exitProgress = interpolate(
        localFrame,
        [duration - 15, duration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const exitSlide = interpolate(exitProgress, [0, 1], [0, -300]);
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
                {/* Accent bar */}
                <div
                    style={{
                        width: '4px',
                        height: `${barWidth * 80}px`,
                        background: color,
                        borderRadius: '2px',
                        marginRight: '14px',
                        flexShrink: 0,
                    }}
                />

                {/* Panel */}
                <div
                    style={{
                        transform: `translateX(${(1 - panelSlide) * -150}px)`,
                        opacity: panelSlide,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}
                >
                    <div
                        style={{
                            padding: '16px 28px 14px 20px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '0 10px 10px 0',
                        }}
                    >
                        {/* Name */}
                        <div
                            style={{
                                transform: `translateY(${(1 - nameReveal) * 20}px)`,
                                opacity: nameReveal,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 34,
                                    fontWeight: 700,
                                    color: '#ffffff',
                                    display: 'block',
                                }}
                            >
                                {name}
                            </span>
                        </div>

                        {/* Divider */}
                        <div
                            style={{
                                width: `${nameReveal * 100}px`,
                                height: '2px',
                                background: color,
                                margin: '6px 0',
                                opacity: nameReveal,
                                borderRadius: '1px',
                            }}
                        />

                        {/* Title */}
                        <div
                            style={{
                                transform: `translateY(${(1 - titleReveal) * 15}px)`,
                                opacity: titleReveal,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 17,
                                    fontWeight: 500,
                                    color: 'rgba(255,255,255,0.7)',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
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
