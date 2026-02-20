import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from 'remotion';

interface TranscriptMotionProps {
    text: string;
    color?: string;
    startFrame: number;
    endFrame: number;
    style?: 'karaoke' | 'typewriter' | 'wave';
    position?: 'center' | 'top' | 'bottom';
    emphasisWords?: string[];
}

// Common stop words to de-emphasize
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up',
    'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further',
    'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
    'because', 'as', 'until', 'while', 'if', 'that', 'which', 'who',
    'whom', 'this', 'these', 'those', 'am', 'it', 'its', 'my', 'your',
    'his', 'her', 'our', 'their', 'what', 'all', 'you', 'i', 'me',
    'he', 'she', 'we', 'they', 'them', 'him', 'us',
]);

function isKeyWord(word: string): boolean {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    return clean.length > 3 && !STOP_WORDS.has(clean);
}

export const TranscriptMotion: React.FC<TranscriptMotionProps> = ({
    text,
    color = '#6366f1',
    startFrame,
    endFrame,
    style = 'karaoke',
    position = 'bottom',
    emphasisWords = [],
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const totalFrames = endFrame - startFrame;
    const progress = Math.min(1, localFrame / totalFrames);

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // -- Entrance / exit opacity --
    const fadeIn = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    const fadeOut = interpolate(localFrame, [totalFrames - 10, totalFrames], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const opacity = fadeIn * fadeOut;

    // Container entrance spring
    const containerSpring = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 100, mass: 0.8 },
    });

    const posY = position === 'bottom' ? '80%' : position === 'top' ? '15%' : '50%';

    // Glow breathing
    const glowPulse = Math.sin(localFrame * 0.1) * 0.3 + 0.7;

    // Current word index based on progress
    const currentWordIdx = Math.min(
        wordCount - 1,
        Math.floor(progress * wordCount)
    );

    // Frames per word
    const framesPerWord = totalFrames / Math.max(wordCount, 1);

    // Check if a word should be emphasized
    const emphasisSet = new Set(emphasisWords.map(w => w.toLowerCase()));
    const shouldEmphasize = (word: string) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, '');
        return emphasisSet.has(clean) || isKeyWord(word);
    };

    // ==================== KARAOKE STYLE ====================
    if (style === 'karaoke') {
        return (
            <AbsoluteFill>
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        transform: `translate(-50%, -50%) scale(${containerSpring})`,
                        opacity,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        maxWidth: '88%',
                        zIndex: 20,
                    }}
                >
                    {/* Glassmorphic backdrop */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: '-18px -32px',
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(10,10,30,0.6))',
                            borderRadius: '18px',
                            backdropFilter: 'blur(16px)',
                            border: `1px solid rgba(255,255,255,${glowPulse * 0.1})`,
                            boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 ${glowPulse * 20}px ${color}15`,
                        }}
                    />

                    {/* Words */}
                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '8px 10px',
                            zIndex: 1,
                        }}
                    >
                        {words.map((word, i) => {
                            const isActive = i <= currentWordIdx;
                            const isCurrent = i === currentWordIdx;
                            const isEmphasis = shouldEmphasize(word);

                            // Per-word spring with stagger
                            const wordAppearFrame = Math.max(0, localFrame - Math.floor(i * framesPerWord));
                            const wordSpring = spring({
                                frame: wordAppearFrame,
                                fps,
                                config: { damping: 12, stiffness: 180 },
                            });

                            const wordFade = interpolate(wordAppearFrame, [0, 4], [0, 1], {
                                extrapolateRight: 'clamp',
                            });

                            // Active word gets a Y bounce
                            const yBounce = isCurrent
                                ? interpolate(
                                    spring({
                                        frame: Math.max(0, wordAppearFrame),
                                        fps,
                                        config: { damping: 10, stiffness: 200 },
                                    }),
                                    [0, 1],
                                    [8, -2]
                                )
                                : 0;

                            const baseSize = isEmphasis && isActive ? 38 : 32;

                            return (
                                <span
                                    key={i}
                                    style={{
                                        fontSize: baseSize,
                                        fontWeight: isEmphasis ? 900 : 700,
                                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                        letterSpacing: '-0.02em',
                                        color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                                        transform: `scale(${isCurrent ? 1.15 : wordSpring}) translateY(${yBounce}px)`,
                                        textShadow: isActive
                                            ? `0 0 24px ${color}60, 0 2px 6px rgba(0,0,0,0.8)`
                                            : '0 2px 4px rgba(0,0,0,0.5)',
                                        opacity: wordFade,
                                        transition: 'color 0.08s',
                                        ...(isCurrent
                                            ? {
                                                background: `linear-gradient(135deg, #fff, ${color})`,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                filter: `drop-shadow(0 0 12px ${color}50)`,
                                            }
                                            : {}),
                                        ...(isEmphasis && isActive && !isCurrent
                                            ? {
                                                background: `linear-gradient(135deg, #fff, ${color}cc)`,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                            }
                                            : {}),
                                    }}
                                >
                                    {word}
                                </span>
                            );
                        })}
                    </div>

                    {/* Progress bar */}
                    <div
                        style={{
                            position: 'relative',
                            width: '85%',
                            height: '3px',
                            marginTop: '16px',
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            zIndex: 1,
                        }}
                    >
                        <div
                            style={{
                                width: `${progress * 100}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                                borderRadius: '2px',
                                boxShadow: `0 0 10px ${color}70`,
                                transition: 'width 0.05s linear',
                            }}
                        />
                    </div>
                </div>
            </AbsoluteFill>
        );
    }

    // ==================== TYPEWRITER STYLE ====================
    if (style === 'typewriter') {
        // Characters revealed progressively
        const totalChars = text.length;
        const charsToShow = Math.floor(progress * totalChars);
        const visibleText = text.substring(0, charsToShow);
        const cursorBlink = Math.sin(localFrame * 0.4) > 0;

        return (
            <AbsoluteFill>
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: posY,
                        transform: `translate(-50%, -50%) scale(${containerSpring})`,
                        opacity,
                        maxWidth: '85%',
                        zIndex: 20,
                    }}
                >
                    {/* Background */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: '-16px -28px',
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(15,15,40,0.65))',
                            borderRadius: '14px',
                            backdropFilter: 'blur(14px)',
                            border: `1px solid ${color}20`,
                            boxShadow: `0 8px 36px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
                        }}
                    />

                    <div
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            textAlign: 'center',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 32,
                                fontWeight: 700,
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                color: '#fff',
                                letterSpacing: '-0.01em',
                                textShadow: `0 0 20px ${color}40, 0 2px 8px rgba(0,0,0,0.7)`,
                                lineHeight: 1.5,
                            }}
                        >
                            {visibleText}
                        </span>
                        {/* Cursor */}
                        <span
                            style={{
                                display: 'inline-block',
                                width: '2px',
                                height: '32px',
                                background: cursorBlink ? color : 'transparent',
                                marginLeft: '2px',
                                verticalAlign: 'middle',
                                boxShadow: cursorBlink ? `0 0 8px ${color}80` : 'none',
                            }}
                        />
                    </div>

                    {/* Progress bar */}
                    <div
                        style={{
                            position: 'relative',
                            width: '90%',
                            height: '2px',
                            marginTop: '14px',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: '1px',
                            overflow: 'hidden',
                            zIndex: 1,
                        }}
                    >
                        <div
                            style={{
                                width: `${progress * 100}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${color}, ${color}80)`,
                                borderRadius: '1px',
                            }}
                        />
                    </div>
                </div>
            </AbsoluteFill>
        );
    }

    // ==================== WAVE STYLE ====================
    // Words wave in with staggered vertical animation
    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: posY,
                    transform: `translate(-50%, -50%) scale(${containerSpring})`,
                    opacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: '88%',
                    zIndex: 20,
                }}
            >
                {/* Background */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '-18px -32px',
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(10,10,30,0.55))',
                        borderRadius: '18px',
                        backdropFilter: 'blur(14px)',
                        border: `1px solid rgba(255,255,255,${glowPulse * 0.08})`,
                        boxShadow: `0 8px 36px rgba(0,0,0,0.45), 0 0 ${glowPulse * 15}px ${color}10`,
                    }}
                />

                {/* Words with wave animation */}
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '8px 10px',
                        zIndex: 1,
                    }}
                >
                    {words.map((word, i) => {
                        const isEmphasis = shouldEmphasize(word);

                        // Staggered wave — each word has offset sinusoidal motion
                        const wavePhase = localFrame * 0.15 - i * 0.6;
                        const waveY = Math.sin(wavePhase) * 6;

                        // Per-word entrance delay
                        const wordDelay = i * 2;
                        const wordAppearFrame = Math.max(0, localFrame - wordDelay);

                        const wordSpring = spring({
                            frame: wordAppearFrame,
                            fps,
                            config: { damping: 12, stiffness: 160 },
                        });

                        const wordFade = interpolate(wordAppearFrame, [0, 6], [0, 1], {
                            extrapolateRight: 'clamp',
                        });

                        const baseSize = isEmphasis ? 36 : 30;

                        // Color cycling for emphasis words
                        const hueShift = isEmphasis ? Math.sin(localFrame * 0.05 + i) * 10 : 0;

                        return (
                            <span
                                key={i}
                                style={{
                                    fontSize: baseSize,
                                    fontWeight: isEmphasis ? 900 : 700,
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    letterSpacing: '-0.02em',
                                    color: '#fff',
                                    transform: `translateY(${waveY}px) scale(${wordSpring})`,
                                    textShadow: isEmphasis
                                        ? `0 0 20px ${color}60, 0 0 40px ${color}20, 0 2px 6px rgba(0,0,0,0.8)`
                                        : '0 2px 4px rgba(0,0,0,0.6)',
                                    opacity: wordFade,
                                    filter: hueShift !== 0 ? `hue-rotate(${hueShift}deg)` : undefined,
                                    ...(isEmphasis
                                        ? {
                                            background: `linear-gradient(135deg, #fff, ${color})`,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }
                                        : {}),
                                }}
                            >
                                {word}
                            </span>
                        );
                    })}
                </div>

                {/* Progress bar */}
                <div
                    style={{
                        position: 'relative',
                        width: '85%',
                        height: '3px',
                        marginTop: '16px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        zIndex: 1,
                    }}
                >
                    <div
                        style={{
                            width: `${progress * 100}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                            borderRadius: '2px',
                            boxShadow: `0 0 10px ${color}70`,
                        }}
                    />
                </div>
            </div>
        </AbsoluteFill>
    );
};
