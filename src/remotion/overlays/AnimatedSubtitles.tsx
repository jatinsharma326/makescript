import React from 'react';
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    spring,
    Easing,
} from 'remotion';

interface AnimatedSubtitlesProps {
    subtitles: Array<{
        text: string;
        startFrame: number;
        endFrame: number;
    }>;
    fontSize?: number;
    color?: string;
    highlightColor?: string;
    position?: 'bottom' | 'center' | 'top';
}

export const AnimatedSubtitles: React.FC<AnimatedSubtitlesProps> = ({
    subtitles,
    fontSize = 42,
    color = '#ffffff',
    highlightColor = '#6366f1',
    position = 'bottom',
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const currentSub = subtitles.find(
        (s) => frame >= s.startFrame && frame <= s.endFrame
    );

    if (!currentSub) return null;

    const localFrame = frame - currentSub.startFrame;
    const duration = currentSub.endFrame - currentSub.startFrame;
    const progress = localFrame / duration;
    const words = currentSub.text.split(' ');
    const currentWordIndex = Math.floor(progress * words.length);

    // Smooth scale entrance with spring
    const containerScale = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 120, mass: 0.8 },
    });

    // Fade in
    const enterOpacity = interpolate(localFrame, [0, 8], [0, 1], {
        extrapolateRight: 'clamp',
    });

    // Fade out
    const exitOpacity = interpolate(
        localFrame,
        [duration - 10, duration],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const posY = position === 'bottom' ? '82%' : position === 'top' ? '12%' : '50%';

    // Animated underline sweep
    const underlineWidth = interpolate(progress, [0, 1], [0, 100]);

    // Subtle glow breathing
    const glowPulse = Math.sin(localFrame * 0.12) * 0.25 + 0.75;

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: posY,
                    transform: `translate(-50%, -50%) scale(${containerScale})`,
                    opacity: enterOpacity * exitOpacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: '85%',
                }}
            >
                {/* Glassmorphic backdrop */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '-16px -28px',
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(10,10,30,0.55))',
                        borderRadius: '16px',
                        backdropFilter: 'blur(12px)',
                        border: `1px solid rgba(255,255,255, ${glowPulse * 0.08})`,
                        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 ${glowPulse * 15}px rgba(99, 102, 241, ${glowPulse * 0.1})`,
                    }}
                />

                {/* Words with per-word highlight */}
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '10px',
                        zIndex: 1,
                    }}
                >
                    {words.map((word, i) => {
                        const isActive = i <= currentWordIndex;
                        const isCurrent = i === currentWordIndex;

                        // Per-word fade-in with stagger
                        const wordDelay = Math.max(0, localFrame - (i * 2));
                        const wordFade = interpolate(wordDelay, [0, 5], [0, 1], {
                            extrapolateRight: 'clamp',
                        });

                        // Active word bump
                        const yOffset = isCurrent
                            ? interpolate(
                                spring({ frame: Math.max(0, localFrame - (i * 2)), fps, config: { damping: 12, stiffness: 200 } }),
                                [0, 1],
                                [6, -2]
                            )
                            : 0;

                        return (
                            <span
                                key={i}
                                style={{
                                    position: 'relative',
                                    fontSize,
                                    fontWeight: 800,
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    letterSpacing: '-0.02em',
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                                    transform: `scale(${isCurrent ? 1.1 : 1}) translateY(${yOffset}px)`,
                                    textShadow: isActive
                                        ? `0 0 20px ${highlightColor}50, 0 2px 4px rgba(0,0,0,0.7)`
                                        : '0 2px 4px rgba(0,0,0,0.5)',
                                    opacity: wordFade,
                                    transition: 'color 0.1s ease-out',
                                    // Gradient text for current word
                                    ...(isCurrent ? {
                                        background: `linear-gradient(135deg, #fff, ${highlightColor})`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        filter: `drop-shadow(0 0 8px ${highlightColor}40)`,
                                    } : {}),
                                }}
                            >
                                {word}
                            </span>
                        );
                    })}
                </div>

                {/* Progress underline */}
                <div
                    style={{
                        position: 'relative',
                        width: '90%',
                        height: '3px',
                        marginTop: '14px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        zIndex: 1,
                    }}
                >
                    <div
                        style={{
                            width: `${underlineWidth}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${highlightColor}, #a78bfa)`,
                            borderRadius: '2px',
                            boxShadow: `0 0 8px ${highlightColor}60`,
                        }}
                    />
                </div>
            </div>
        </AbsoluteFill>
    );
};
