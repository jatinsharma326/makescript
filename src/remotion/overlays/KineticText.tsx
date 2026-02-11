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

    // Exit animation
    const exitOpacity = interpolate(
        localFrame,
        [duration - 10, duration],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const exitScale = interpolate(
        localFrame,
        [duration - 10, duration],
        [1, 0.95],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const posY = position === 'top' ? '15%' : position === 'bottom' ? '80%' : '50%';

    // === Pop — each word pops in ===
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
                            config: { damping: 10, stiffness: 180, mass: 0.5 },
                        });
                        const wordOpacity = interpolate(
                            Math.max(0, localFrame - wordDelay),
                            [0, 3],
                            [0, 1],
                            { extrapolateRight: 'clamp' }
                        );

                        return (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 56,
                                    fontWeight: 800,
                                    color: '#ffffff',
                                    transform: `scale(${wordScale})`,
                                    opacity: wordOpacity,
                                    textShadow: '0 3px 8px rgba(0,0,0,0.4)',
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

                        const slideX = interpolate(slideProgress, [0, 1], [60 * direction, 0]);
                        const wordOpacity = interpolate(slideProgress, [0, 0.3, 1], [0, 0.5, 1]);

                        return (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 52,
                                    fontWeight: 700,
                                    color: '#ffffff',
                                    transform: `translateX(${slideX}px)`,
                                    opacity: wordOpacity,
                                    textShadow: '0 2px 6px rgba(0,0,0,0.4)',
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

    // === Typewriter — chars appear one by one ===
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
                        padding: '18px 26px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '10px',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                            fontSize: 30,
                            fontWeight: 500,
                            color: '#e0e7ff',
                            lineHeight: 1.4,
                        }}
                    >
                        {text.substring(0, visibleChars)}
                    </span>
                    {visibleChars < totalChars && (
                        <span
                            style={{
                                display: 'inline-block',
                                width: '2px',
                                height: '30px',
                                background: color,
                                marginLeft: '2px',
                                verticalAlign: 'text-bottom',
                                opacity: cursorBlink ? 1 : 0.3,
                            }}
                        />
                    )}
                </div>
            </div>
        </AbsoluteFill>
    );
};
