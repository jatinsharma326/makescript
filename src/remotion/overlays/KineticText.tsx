import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from 'remotion';

interface KineticTextProps {
    text: string;
    color?: string;
    startFrame: number;
    endFrame: number;
    style?: 'pop' | 'slide' | 'typewriter';
    position?: 'center' | 'top' | 'bottom';
}

export const KineticText: React.FC<KineticTextProps> = ({
    text,
    color = '#6366f1',
    startFrame,
    endFrame,
    style = 'pop',
    position = 'center',
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;

    const words = text.split(' ');

    // Exit
    const exitOpacity = interpolate(
        localFrame,
        [duration - 10, duration],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const exitScale = interpolate(
        localFrame,
        [duration - 10, duration],
        [1, 0.92],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const posY = position === 'top' ? '15%' : position === 'bottom' ? '80%' : '50%';

    // === Pop — words pop in with spring bounce ===
    if (style === 'pop') {
        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        transform: `translate(-50%, -50%) scale(${exitScale})`,
                        opacity: exitOpacity,
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '12px',
                        maxWidth: '80%',
                    }}
                >
                    {words.map((word, i) => {
                        const wordDelay = i * 4;
                        const wordScale = spring({
                            frame: Math.max(0, localFrame - wordDelay),
                            fps,
                            config: { damping: 8, stiffness: 200, mass: 0.5 },
                        });
                        const wordOpacity = interpolate(
                            Math.max(0, localFrame - wordDelay),
                            [0, 3],
                            [0, 1],
                            { extrapolateRight: 'clamp' }
                        );
                        const wordRotate = interpolate(
                            spring({
                                frame: Math.max(0, localFrame - wordDelay),
                                fps,
                                config: { damping: 10, stiffness: 180 },
                            }),
                            [0, 1],
                            [-12, 0]
                        );

                        return (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 58,
                                    fontWeight: 900,
                                    letterSpacing: '-0.03em',
                                    color: '#ffffff',
                                    transform: `scale(${wordScale}) rotate(${wordRotate}deg)`,
                                    opacity: wordOpacity,
                                    textShadow: `
                                        0 0 30px ${color}40,
                                        0 0 60px ${color}20,
                                        0 4px 10px rgba(0,0,0,0.5)
                                    `,
                                }}
                            >
                                {word}
                            </span>
                        );
                    })}
                </div>

                {/* Background glow */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        width: '450px',
                        height: '180px',
                        transform: 'translate(-50%, -50%)',
                        background: `radial-gradient(ellipse, ${color}10, transparent 70%)`,
                        opacity: exitOpacity,
                        filter: 'blur(16px)',
                        zIndex: -1,
                    }}
                />
            </AbsoluteFill>
        );
    }

    // === Slide — words slide in from alternating sides ===
    if (style === 'slide') {
        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        transform: `translate(-50%, -50%) scale(${exitScale})`,
                        opacity: exitOpacity,
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '14px',
                        maxWidth: '80%',
                    }}
                >
                    {words.map((word, i) => {
                        const wordDelay = i * 5;
                        const direction = i % 2 === 0 ? -1 : 1;

                        const slideProgress = spring({
                            frame: Math.max(0, localFrame - wordDelay),
                            fps,
                            config: { damping: 14, stiffness: 120, mass: 0.7 },
                        });

                        const slideX = interpolate(slideProgress, [0, 1], [70 * direction, 0]);
                        const wordOpacity = interpolate(slideProgress, [0, 0.3, 1], [0, 0.5, 1]);

                        return (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 54,
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    color: '#ffffff',
                                    transform: `translateX(${slideX}px)`,
                                    opacity: wordOpacity,
                                    textShadow: `
                                        0 0 24px ${color}35,
                                        0 3px 8px rgba(0,0,0,0.4)
                                    `,
                                }}
                            >
                                {word}
                            </span>
                        );
                    })}
                </div>
            </AbsoluteFill>
        );
    }

    // === Typewriter — chars appear with cursor ===
    const totalChars = text.length;
    const charsPerFrame = totalChars / Math.max(duration * 0.6, 1);
    const visibleChars = Math.min(totalChars, Math.floor(localFrame * charsPerFrame));
    const cursorBlink = Math.sin(localFrame * 0.3) > 0;

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: posY,
                    transform: `translate(-50%, -50%) scale(${exitScale})`,
                    opacity: exitOpacity,
                    maxWidth: '80%',
                }}
            >
                <div
                    style={{
                        padding: '20px 28px',
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(10,10,30,0.65))',
                        borderRadius: '12px',
                        border: `1px solid ${color}25`,
                        backdropFilter: 'blur(12px)',
                        boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 15px ${color}10`,
                    }}
                >
                    {/* Terminal dots */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '6px',
                            marginBottom: '12px',
                        }}
                    >
                        {['#ff5f56', '#ffbd2e', '#27c93f'].map((dotColor, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: dotColor,
                                    opacity: 0.75,
                                }}
                            />
                        ))}
                    </div>

                    <span
                        style={{
                            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                            fontSize: 30,
                            fontWeight: 600,
                            color: '#e0e7ff',
                            letterSpacing: '0.01em',
                            lineHeight: 1.4,
                            textShadow: `0 0 16px ${color}20`,
                        }}
                    >
                        {text.substring(0, visibleChars)}
                    </span>
                    {visibleChars < totalChars && (
                        <span
                            style={{
                                display: 'inline-block',
                                width: '3px',
                                height: '30px',
                                background: color,
                                marginLeft: '2px',
                                verticalAlign: 'text-bottom',
                                opacity: cursorBlink ? 1 : 0.3,
                                boxShadow: `0 0 6px ${color}`,
                            }}
                        />
                    )}
                </div>
            </div>
        </AbsoluteFill>
    );
};
