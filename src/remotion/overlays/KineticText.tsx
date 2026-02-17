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

    // Cinematic exit with motion blur feel
    const exitProgress = interpolate(
        localFrame,
        [duration - 18, duration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const exitOpacity = 1 - exitProgress;
    const exitScale = interpolate(exitProgress, [0, 1], [1, 0.88]);
    const exitBlur = interpolate(exitProgress, [0, 0.5, 1], [0, 0, 4]);
    const exitY = interpolate(exitProgress, [0, 1], [0, 25]);

    const posY = position === 'top' ? '15%' : position === 'bottom' ? '78%' : '50%';

    // === Pop — cinematic word-by-word reveal with 3D depth ===
    if (style === 'pop') {
        // Anamorphic lens flare on entrance
        const flareOpacity = interpolate(localFrame, [0, 4, 12, 20], [0, 0.6, 0.2, 0], {
            extrapolateRight: 'clamp',
        });
        const flareWidth = interpolate(localFrame, [0, 8, 20], [20, 120, 140], {
            extrapolateRight: 'clamp',
        });

        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                {/* Deep cinematic background glow */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        width: '700px',
                        height: '300px',
                        transform: 'translate(-50%, -50%)',
                        background: `radial-gradient(ellipse, ${color}18, ${color}08 40%, transparent 70%)`,
                        opacity: exitOpacity,
                        filter: 'blur(40px)',
                        zIndex: -1,
                    }}
                />

                {/* Anamorphic horizontal lens flare */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        width: `${flareWidth}%`,
                        height: '2px',
                        transform: 'translate(-50%, -50%)',
                        background: `linear-gradient(90deg, transparent, ${color}40, white, ${color}40, transparent)`,
                        opacity: flareOpacity * exitOpacity,
                        filter: 'blur(1px)',
                        boxShadow: `0 0 30px 8px ${color}25, 0 0 60px 16px ${color}12`,
                    }}
                />

                {/* Secondary wider flare */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        width: `${flareWidth * 0.8}%`,
                        height: '8px',
                        transform: 'translate(-50%, -50%)',
                        background: `linear-gradient(90deg, transparent, ${color}12, ${color}20, ${color}12, transparent)`,
                        opacity: flareOpacity * exitOpacity * 0.5,
                        filter: 'blur(6px)',
                    }}
                />

                {/* Words container */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        transform: `translate(-50%, -50%) scale(${exitScale}) translateY(${exitY}px)`,
                        opacity: exitOpacity,
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '14px',
                        maxWidth: '80%',
                        filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
                        perspective: '800px',
                    }}
                >
                    {words.map((word, i) => {
                        const wordDelay = i * 3;
                        const wordSpring = spring({
                            frame: Math.max(0, localFrame - wordDelay),
                            fps,
                            config: { damping: 12, stiffness: 280, mass: 0.4 },
                        });
                        const wordScale = interpolate(wordSpring, [0, 1], [0.3, 1]);
                        const wordOpacity = interpolate(
                            Math.max(0, localFrame - wordDelay),
                            [0, 2, 5],
                            [0, 0.7, 1],
                            { extrapolateRight: 'clamp' }
                        );
                        const wordRotateX = interpolate(wordSpring, [0, 1], [45, 0]);
                        const wordY = interpolate(wordSpring, [0, 1], [30, 0]);
                        // Motion blur simulation during fast movement
                        const wordBlur = interpolate(wordSpring, [0, 0.3, 0.7, 1], [3, 2, 0.5, 0]);
                        // Slight random rotation for organic feel
                        const wordTilt = interpolate(wordSpring, [0, 1], [Math.sin(i * 2.5) * 8, 0]);

                        return (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 62,
                                    fontWeight: 900,
                                    letterSpacing: '-0.04em',
                                    color: '#ffffff',
                                    transform: `scale(${wordScale}) rotateX(${wordRotateX}deg) translateY(${wordY}px) rotate(${wordTilt}deg)`,
                                    opacity: wordOpacity,
                                    filter: wordBlur > 0.3 ? `blur(${wordBlur}px)` : undefined,
                                    textShadow: `
                                        0 0 40px ${color}50,
                                        0 0 80px ${color}25,
                                        0 0 120px ${color}15,
                                        0 4px 12px rgba(0,0,0,0.6),
                                        0 1px 0 rgba(255,255,255,0.1)
                                    `,
                                    WebkitTextStroke: '0.5px rgba(255,255,255,0.05)',
                                }}
                            >
                                {word}
                            </span>
                        );
                    })}
                </div>

                {/* Subtle chromatic aberration accent lines */}
                {localFrame < 15 && (
                    <>
                        <div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: posY,
                                width: '60%',
                                height: '1px',
                                transform: 'translate(-50%, 40px)',
                                background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
                                opacity: interpolate(localFrame, [4, 8, 15], [0, 0.6, 0], {
                                    extrapolateRight: 'clamp',
                                }),
                            }}
                        />
                    </>
                )}
            </AbsoluteFill>
        );
    }

    // === Slide — cinematic split-screen reveal with parallax ===
    if (style === 'slide') {
        // Vertical reveal wipe
        const revealProgress = interpolate(localFrame, [0, 12], [0, 1], {
            extrapolateRight: 'clamp',
        });

        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                {/* Background cinematic bar */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: posY,
                        height: '120px',
                        transform: 'translateY(-50%)',
                        background: `linear-gradient(180deg, transparent, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.5) 80%, transparent)`,
                        opacity: interpolate(localFrame, [0, 6, duration - 10, duration], [0, 0.8, 0.8, 0], {
                            extrapolateRight: 'clamp',
                        }),
                    }}
                />

                {/* Leading edge light */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: posY,
                        height: '1px',
                        transform: 'translateY(-60px)',
                        background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
                        opacity: interpolate(localFrame, [0, 4, 10, 20], [0, 0.8, 0.4, 0], {
                            extrapolateRight: 'clamp',
                        }),
                        boxShadow: `0 0 20px 4px ${color}30`,
                    }}
                />

                {/* Words with staggered parallax slide */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        transform: `translate(-50%, -50%) scale(${exitScale}) translateY(${exitY}px)`,
                        opacity: exitOpacity,
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '16px',
                        maxWidth: '80%',
                        filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
                    }}
                >
                    {words.map((word, i) => {
                        const wordDelay = i * 4;
                        const direction = i % 2 === 0 ? -1 : 1;

                        const slideProgress = spring({
                            frame: Math.max(0, localFrame - wordDelay),
                            fps,
                            config: { damping: 18, stiffness: 100, mass: 0.6 },
                        });

                        const slideX = interpolate(slideProgress, [0, 1], [120 * direction, 0]);
                        const wordOpacity = interpolate(slideProgress, [0, 0.15, 1], [0, 0.6, 1]);
                        // Motion blur in slide direction
                        const motionBlur = interpolate(slideProgress, [0, 0.4, 0.8, 1], [6, 3, 0.5, 0]);
                        // Slight Y offset for depth
                        const slideY = interpolate(slideProgress, [0, 1], [direction * 8, 0]);

                        return (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    fontSize: 56,
                                    fontWeight: 800,
                                    letterSpacing: '-0.03em',
                                    color: '#ffffff',
                                    transform: `translateX(${slideX}px) translateY(${slideY}px)`,
                                    opacity: wordOpacity,
                                    filter: motionBlur > 0.5 ? `blur(${motionBlur}px)` : undefined,
                                    textShadow: `
                                        0 0 30px ${color}40,
                                        0 0 60px ${color}18,
                                        0 3px 10px rgba(0,0,0,0.5)
                                    `,
                                }}
                            >
                                {word}
                            </span>
                        );
                    })}
                </div>

                {/* Trailing edge light */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: posY,
                        height: '1px',
                        transform: 'translateY(60px)',
                        background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
                        opacity: interpolate(localFrame, [2, 6, 12, 22], [0, 0.5, 0.3, 0], {
                            extrapolateRight: 'clamp',
                        }),
                    }}
                />
            </AbsoluteFill>
        );
    }

    // === Typewriter — cinematic terminal with scan lines and CRT glow ===
    const totalChars = text.length;
    const charsPerFrame = totalChars / Math.max(duration * 0.55, 1);
    const visibleChars = Math.min(totalChars, Math.floor(localFrame * charsPerFrame));
    const cursorBlink = Math.sin(localFrame * 0.35) > 0;

    // CRT screen entrance
    const screenReveal = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 120, mass: 0.6 },
    });
    const screenScaleY = interpolate(screenReveal, [0, 0.5, 1], [0.01, 0.8, 1]);
    const screenScaleX = interpolate(screenReveal, [0, 0.3, 1], [0.6, 0.95, 1]);
    const screenGlow = interpolate(screenReveal, [0, 0.5, 1], [0, 1, 0.6]);

    // Scan line animation
    const scanLineY = (localFrame * 3) % 120;

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {/* Screen power-on flash */}
            {localFrame < 8 && (
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        width: '500px',
                        height: '4px',
                        transform: 'translate(-50%, -50%)',
                        background: `linear-gradient(90deg, transparent, ${color}, white, ${color}, transparent)`,
                        opacity: interpolate(localFrame, [0, 2, 5, 8], [0, 0.8, 0.3, 0], {
                            extrapolateRight: 'clamp',
                        }),
                        filter: 'blur(2px)',
                        boxShadow: `0 0 40px 10px ${color}40`,
                    }}
                />
            )}

            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: posY,
                    transform: `translate(-50%, -50%) scaleX(${screenScaleX * exitScale}) scaleY(${screenScaleY * exitScale}) translateY(${exitY}px)`,
                    opacity: exitOpacity,
                    maxWidth: '75%',
                    filter: exitBlur > 0 ? `blur(${exitBlur}px)` : undefined,
                }}
            >
                <div
                    style={{
                        padding: '24px 32px',
                        background: 'linear-gradient(145deg, rgba(2,6,18,0.92), rgba(8,12,30,0.85))',
                        borderRadius: '14px',
                        border: `1px solid ${color}20`,
                        backdropFilter: 'blur(16px)',
                        boxShadow: `
                            0 12px 40px rgba(0,0,0,0.5),
                            0 0 ${screenGlow * 40}px ${color}18,
                            0 0 ${screenGlow * 80}px ${color}08,
                            inset 0 1px 0 rgba(255,255,255,0.05)
                        `,
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* CRT scan line effect */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: `repeating-linear-gradient(
                                0deg,
                                transparent,
                                transparent 2px,
                                rgba(0,0,0,0.03) 2px,
                                rgba(0,0,0,0.03) 4px
                            )`,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* Moving scan line */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: `${scanLineY}px`,
                            height: '2px',
                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)`,
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Terminal header */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '14px',
                        }}
                    >
                        {['#ff5f56', '#ffbd2e', '#27c93f'].map((dotColor, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '9px',
                                    height: '9px',
                                    borderRadius: '50%',
                                    background: dotColor,
                                    opacity: 0.8,
                                    boxShadow: `0 0 4px ${dotColor}60`,
                                }}
                            />
                        ))}
                        <span
                            style={{
                                marginLeft: '8px',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10,
                                color: 'rgba(255,255,255,0.25)',
                                letterSpacing: '0.05em',
                            }}
                        >
                            ~/makescript
                        </span>
                    </div>

                    {/* Prompt line */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 14,
                                color: color,
                                opacity: 0.8,
                                textShadow: `0 0 10px ${color}40`,
                            }}
                        >
                            {'>'}
                        </span>
                        <div>
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: '#e0e7ff',
                                    letterSpacing: '0.01em',
                                    lineHeight: 1.4,
                                    textShadow: `0 0 20px ${color}15, 0 0 40px ${color}08`,
                                }}
                            >
                                {text.substring(0, visibleChars)}
                            </span>
                            {visibleChars < totalChars && (
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '3px',
                                        height: '28px',
                                        background: `linear-gradient(180deg, ${color}, ${color}80)`,
                                        marginLeft: '2px',
                                        verticalAlign: 'text-bottom',
                                        opacity: cursorBlink ? 1 : 0.2,
                                        boxShadow: `0 0 8px ${color}80, 0 0 16px ${color}40`,
                                        borderRadius: '1px',
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};
