import React from 'react';
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    spring,
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

    // Smooth scale entrance
    const containerScale = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 100, mass: 0.8 },
    });

    // Fade out at end
    const exitOpacity = interpolate(
        localFrame,
        [duration - 8, duration],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const posY = position === 'bottom' ? '82%' : position === 'top' ? '12%' : '50%';

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: posY,
                    transform: `translate(-50%, -50%) scale(${containerScale})`,
                    opacity: exitOpacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: '85%',
                }}
            >
                {/* Simple semi-transparent backdrop */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '-14px -24px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)',
                    }}
                />

                {/* Words with simple highlight */}
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

                        return (
                            <span
                                key={i}
                                style={{
                                    fontSize,
                                    fontWeight: 700,
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                    transition: 'color 0.15s ease',
                                }}
                            >
                                {word}
                            </span>
                        );
                    })}
                </div>
            </div>
        </AbsoluteFill>
    );
};
