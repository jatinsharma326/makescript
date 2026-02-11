import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from 'remotion';

interface EmojiReactionProps {
    emoji: string;
    size?: number;
    startFrame: number;
    endFrame: number;
}

export const EmojiReaction: React.FC<EmojiReactionProps> = ({
    emoji,
    size = 70,
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;

    // Bouncy pop-in
    const pop = spring({
        frame: localFrame,
        fps,
        config: { damping: 8, stiffness: 200, mass: 0.5 },
    });

    // Gentle float
    const floatY = Math.sin(localFrame * 0.08) * 5;

    // Fade in and out
    const opacity = interpolate(
        localFrame,
        [0, 5, 40, 55],
        [0, 1, 1, 0],
        { extrapolateRight: 'clamp' }
    );

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div
                style={{
                    position: 'absolute',
                    left: '75%',
                    top: '30%',
                    transform: `translate(-50%, -50%) scale(${pop}) translateY(${floatY}px)`,
                    opacity,
                    fontSize: size,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                }}
            >
                {emoji}
            </div>
        </AbsoluteFill>
    );
};
