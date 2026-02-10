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
    fontSize = 36,
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

    const progress = (frame - currentSub.startFrame) / (currentSub.endFrame - currentSub.startFrame);
    const words = currentSub.text.split(' ');
    const currentWordIndex = Math.floor(progress * words.length);

    const fadeIn = spring({
        frame: frame - currentSub.startFrame,
        fps,
        config: { damping: 20, stiffness: 100 },
    });

    const posY = position === 'bottom' ? '80%' : position === 'top' ? '15%' : '50%';

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: posY,
                    transform: `translate(-50%, -50%) scale(${fadeIn})`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '8px',
                    maxWidth: '80%',
                    opacity: fadeIn,
                }}
            >
                {/* Background blur */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '-12px -20px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)',
                    }}
                />
                {words.map((word, i) => (
                    <span
                        key={i}
                        style={{
                            position: 'relative',
                            fontSize,
                            fontWeight: 700,
                            fontFamily: "'Inter', sans-serif",
                            color: i <= currentWordIndex ? highlightColor : color,
                            textShadow: i <= currentWordIndex
                                ? `0 0 20px ${highlightColor}40`
                                : '0 2px 4px rgba(0,0,0,0.5)',
                            transition: 'color 0.1s',
                            transform: i === currentWordIndex ? 'scale(1.1)' : 'scale(1)',
                        }}
                    >
                        {word}
                    </span>
                ))}
            </div>
        </AbsoluteFill>
    );
};
