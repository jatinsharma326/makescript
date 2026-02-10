import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
} from 'remotion';

interface HighlightBoxProps {
    text: string;
    color?: string;
    startFrame: number;
    endFrame: number;
    style?: 'glow' | 'solid' | 'outline';
}

export const HighlightBox: React.FC<HighlightBoxProps> = ({
    text,
    color = '#f59e0b',
    startFrame,
    endFrame,
    style = 'glow',
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;

    const scaleIn = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 100 },
    });

    const glowPulse = Math.sin(localFrame * 0.15) * 0.3 + 0.7;

    const bgStyles: Record<string, React.CSSProperties> = {
        glow: {
            background: `${color}20`,
            border: `2px solid ${color}`,
            boxShadow: `0 0 ${20 * glowPulse}px ${color}60, inset 0 0 ${10 * glowPulse}px ${color}20`,
        },
        solid: {
            background: `${color}30`,
            border: `2px solid ${color}`,
        },
        outline: {
            background: 'transparent',
            border: `3px solid ${color}`,
            boxShadow: `0 0 10px ${color}40`,
        },
    };

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${scaleIn})`,
                    padding: '16px 32px',
                    borderRadius: '12px',
                    ...bgStyles[style],
                    opacity: scaleIn,
                }}
            >
                <span
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 32,
                        fontWeight: 700,
                        color: '#ffffff',
                        textShadow: `0 0 10px ${color}80`,
                    }}
                >
                    💡 {text}
                </span>
            </div>
        </AbsoluteFill>
    );
};
