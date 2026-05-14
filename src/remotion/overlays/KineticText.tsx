import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
    Img,
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
    const { fps, width } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;

    const words = text.split(' ');

    // Cinematic exit
    const exitProgress = interpolate(
        localFrame,
        [duration - 15, duration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    const exitOpacity = 1 - exitProgress;
    const exitScale = interpolate(exitProgress, [0, 1], [1, 1.1]);
    const exitY = interpolate(exitProgress, [0, 1], [0, -20]);

    const posY = position === 'top' ? '15%' : position === 'bottom' ? '82%' : '50%';

    // === POP — Premium Impact 3D Typography ===
    if (style === 'pop') {
        const bgGlowOpacity = interpolate(localFrame, [0, 10], [0, 0.4], { extrapolateRight: 'clamp' });
        
        return (
            <AbsoluteFill style={{ pointerEvents: 'none', perspective: '1200px' }}>
                {/* Deep background ambient glow */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        width: '80%',
                        height: '400px',
                        transform: 'translate(-50%, -50%)',
                        background: `radial-gradient(ellipse at center, ${color}40 0%, transparent 60%)`,
                        opacity: bgGlowOpacity * exitOpacity,
                        filter: 'blur(50px)',
                        zIndex: -1,
                    }}
                />

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
                        gap: '18px',
                        width: '90%',
                        maxWidth: '90%',
                    }}
                >
                    {words.map((word, i) => {
                        const delay = i * 2.5;
                        const popSpring = spring({
                            frame: Math.max(0, localFrame - delay),
                            fps,
                            config: { damping: 10, stiffness: 220, mass: 0.8 },
                        });

                        const scale = interpolate(popSpring, [0, 1], [0.1, 1]);
                        const wordOpacity = interpolate(popSpring, [0, 0.5, 1], [0, 0.8, 1]);
                        const rotateX = interpolate(popSpring, [0, 1], [80, 0]);
                        const translateY = interpolate(popSpring, [0, 1], [60, 0]);

                        return (
                            <span
                                key={i}
                                style={{
                                    display: 'inline-block',
                                    fontFamily: "'Outfit', 'Inter', sans-serif",
                                    fontSize: Math.min(85, width * 0.08),
                                    fontWeight: 900,
                                    letterSpacing: '-0.05em',
                                    lineHeight: 1.1,
                                    textTransform: 'uppercase',
                                    color: '#ffffff',
                                    transform: `scale(${scale}) rotateX(${rotateX}deg) translateY(${translateY}px)`,
                                    transformOrigin: 'bottom center',
                                    opacity: wordOpacity,
                                    background: `linear-gradient(180deg, #ffffff 20%, ${color} 120%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: `drop-shadow(0px 10px 30px ${color}60) drop-shadow(0px 2px 5px rgba(0,0,0,0.8))`,
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

    // === SLIDE — Elegant Cinematic Mask Reveal ===
    if (style === 'slide') {
        const wipeProgress = spring({
            frame: localFrame,
            fps,
            config: { damping: 16, stiffness: 90, mass: 1 },
        });
        const containerWidth = interpolate(wipeProgress, [0, 1], [0, 100]);

        return (
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        transform: `translate(-50%, -50%) scale(${exitScale}) translateY(${exitY}px)`,
                        opacity: exitOpacity,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '90%',
                        maxWidth: '90%',
                    }}
                >
                    {/* Glassmorphic backplate */}
                    <div style={{
                        padding: '30px 50px',
                        borderRadius: '24px',
                        background: 'rgba(10, 10, 10, 0.4)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: `0 30px 60px rgba(0,0,0,0.6), inset 0 0 40px ${color}10`,
                        overflow: 'hidden',
                        position: 'relative',
                    }}>
                        {/* Dynamic sweep line */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            background: color,
                            transform: `translateX(${interpolate(wipeProgress, [0, 1], [-20, 800])}px)`,
                            boxShadow: `0 0 20px 4px ${color}`,
                            opacity: interpolate(localFrame, [0, 15], [1, 0]),
                        }} />

                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: '16px',
                                width: '100%',
                            }}
                        >
                            {words.map((word, i) => {
                                const delay = i * 1.5 + 5;
                                const slideUp = spring({
                                    frame: Math.max(0, localFrame - delay),
                                    fps,
                                    config: { damping: 15, stiffness: 150 },
                                });

                                const y = interpolate(slideUp, [0, 1], [80, 0]);
                                const opacity = interpolate(slideUp, [0, 0.5, 1], [0, 1, 1]);

                                return (
                                    <div key={i} style={{ overflow: 'hidden', paddingBottom: '10px' }}>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                fontFamily: "'Inter', sans-serif",
                                                fontSize: Math.min(64, width * 0.06),
                                                fontWeight: 800,
                                                letterSpacing: '-0.02em',
                                                color: '#ffffff',
                                                transform: `translateY(${y}px)`,
                                                opacity,
                                                textShadow: '0 4px 15px rgba(0,0,0,0.5)',
                                            }}
                                        >
                                            {word}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </AbsoluteFill>
        );
    }

    // === TYPEWRITER — Cyberpunk Neon Console ===
    const totalChars = text.length;
    const charsPerFrame = totalChars / Math.max(duration * 0.4, 1);
    const visibleChars = Math.min(totalChars, Math.floor(localFrame * charsPerFrame));
    const cursorBlink = Math.sin(localFrame * 0.4) > 0;

    const boxEntrance = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 140 },
    });
    const boxScale = interpolate(boxEntrance, [0, 1], [0.8, 1]);
    const boxOpacity = interpolate(boxEntrance, [0, 1], [0, 1]);

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: posY,
                    transform: `translate(-50%, -50%) scale(${boxScale * exitScale}) translateY(${exitY}px)`,
                    opacity: boxOpacity * exitOpacity,
                    width: '90%',
                    maxWidth: '90%',
                }}
            >
                <div
                    style={{
                        padding: '24px 36px',
                        background: 'linear-gradient(135deg, rgba(5,5,10,0.95), rgba(15,15,25,0.9))',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${color}`,
                        boxShadow: `
                            0 20px 50px rgba(0,0,0,0.8),
                            0 0 30px ${color}30,
                            inset 0 0 20px rgba(255,255,255,0.02)
                        `,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <span
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 32,
                                fontWeight: 700,
                                color: color,
                                textShadow: `0 0 15px ${color}`,
                                marginTop: '4px'
                            }}
                        >
                            ❯
                        </span>
                        <div>
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: Math.min(36, width * 0.04),
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    letterSpacing: '0.02em',
                                    lineHeight: 1.3,
                                    textShadow: `0 0 10px ${color}60`,
                                }}
                            >
                                {text.substring(0, visibleChars)}
                            </span>
                            {visibleChars < totalChars && (
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '36px',
                                        background: color,
                                        marginLeft: '8px',
                                        verticalAlign: 'middle',
                                        opacity: cursorBlink ? 1 : 0,
                                        boxShadow: `0 0 15px ${color}`,
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
