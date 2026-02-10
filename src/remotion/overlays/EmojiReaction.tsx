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
    size = 80,
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;

    const popIn = spring({
        frame: localFrame,
        fps,
        config: { damping: 8, stiffness: 150, mass: 0.5 },
    });

    const rotation = interpolate(
        localFrame,
        [0, 8, 16],
        [-15, 15, 0],
        { extrapolateRight: 'clamp' }
    );

    const float = Math.sin(localFrame * 0.1) * 5;

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    top: '20%',
                    right: '10%',
                    transform: `scale(${popIn}) rotate(${rotation}deg) translateY(${float}px)`,
                    fontSize: size,
                    filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.3))`,
                    opacity: popIn,
                }}
            >
                {emoji}
            </div>
            {/* Particle burst on appear */}
            {localFrame < 15 && (
                <>
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                        const angle = (i / 6) * Math.PI * 2;
                        const distance = localFrame * 4;
                        const particleOpacity = interpolate(localFrame, [0, 15], [1, 0]);
                        return (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    top: '20%',
                                    right: '10%',
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: '#f59e0b',
                                    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
                                    opacity: particleOpacity,
                                    boxShadow: '0 0 6px #f59e0b',
                                }}
                            />
                        );
                    })}
                </>
            )}
        </AbsoluteFill>
    );
};
