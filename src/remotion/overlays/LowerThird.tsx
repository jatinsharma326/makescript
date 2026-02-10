import React from 'react';
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    spring,
} from 'remotion';

interface LowerThirdProps {
    name: string;
    title: string;
    color?: string;
    startFrame: number;
    endFrame: number;
}

export const LowerThird: React.FC<LowerThirdProps> = ({
    name,
    title,
    color = '#6366f1',
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;

    const slideIn = spring({
        frame: localFrame,
        fps,
        config: { damping: 15, stiffness: 80 },
    });

    const slideOut = localFrame > duration - 15
        ? interpolate(localFrame, [duration - 15, duration], [0, 100], {
            extrapolateRight: 'clamp',
        })
        : 0;

    const barWidth = interpolate(slideIn, [0, 1], [0, 100]);

    return (
        <AbsoluteFill>
            <div
                style={{
                    position: 'absolute',
                    bottom: '12%',
                    left: '5%',
                    transform: `translateX(${-100 + slideIn * 100 - slideOut}%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                }}
            >
                {/* Accent bar */}
                <div
                    style={{
                        width: `${barWidth}%`,
                        maxWidth: '300px',
                        height: '4px',
                        background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                        borderRadius: '2px',
                        boxShadow: `0 0 15px ${color}60`,
                    }}
                />
                {/* Name */}
                <div
                    style={{
                        background: color,
                        padding: '8px 24px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        width: 'fit-content',
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#ffffff',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {name}
                    </span>
                </div>
                {/* Title */}
                <div
                    style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        padding: '6px 24px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        width: 'fit-content',
                        border: `1px solid ${color}40`,
                    }}
                >
                    <span
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 18,
                            fontWeight: 400,
                            color: '#ccccdd',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}
                    >
                        {title}
                    </span>
                </div>
            </div>
        </AbsoluteFill>
    );
};
