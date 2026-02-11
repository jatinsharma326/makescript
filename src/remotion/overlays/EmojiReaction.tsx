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

    // Bouncy pop-in with overshoot
    const centralPop = spring({
        frame: localFrame,
        fps,
        config: { damping: 6, stiffness: 200, mass: 0.5 },
    });

    // Opacity fade in/out
    const centralOpacity = interpolate(
        localFrame,
        [0, 5, 40, 55],
        [0, 1, 1, 0],
        { extrapolateRight: 'clamp' }
    );

    // Gentle floating
    const centralFloat = Math.sin(localFrame * 0.08) * 5;

    // Expanding ring (single, clean)
    const ringScale = interpolate(localFrame, [0, 20], [0.4, 2.5], {
        extrapolateRight: 'clamp',
    });
    const ringOpacity = interpolate(localFrame, [0, 6, 20], [0, 0.5, 0], {
        extrapolateRight: 'clamp',
    });

    // Glow backdrop
    const glowOpacity = interpolate(localFrame, [0, 8, 35, 50], [0, 0.6, 0.4, 0], {
        extrapolateRight: 'clamp',
    });

    const centerX = 75;
    const centerY = 30;

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {/* Expanding ring */}
            <div
                style={{
                    position: 'absolute',
                    left: `${centerX}%`,
                    top: `${centerY}%`,
                    width: `${size * 1.5}px`,
                    height: `${size * 1.5}px`,
                    transform: `translate(-50%, -50%) scale(${ringScale})`,
                    borderRadius: '50%',
                    border: '2px solid rgba(99, 102, 241, 0.4)',
                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
                    opacity: ringOpacity,
                }}
            />

            {/* Glow backdrop */}
            <div
                style={{
                    position: 'absolute',
                    left: `${centerX}%`,
                    top: `${centerY}%`,
                    width: `${size * 2.2}px`,
                    height: `${size * 2.2}px`,
                    transform: `translate(-50%, -50%) scale(${centralPop})`,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12), transparent 70%)',
                    opacity: glowOpacity,
                }}
            />

            {/* Central emoji */}
            <div
                style={{
                    position: 'absolute',
                    left: `${centerX}%`,
                    top: `${centerY}%`,
                    transform: `translate(-50%, -50%) scale(${centralPop * 1.15}) translateY(${centralFloat}px)`,
                    opacity: centralOpacity,
                    fontSize: size,
                    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3)) drop-shadow(0 0 15px rgba(99, 102, 241, 0.2))',
                    zIndex: 10,
                }}
            >
                {emoji}
            </div>
        </AbsoluteFill>
    );
};
