import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface AiMotionGraphicProps {
    svgContent: string;
    startFrame: number;
    endFrame: number;
}

export const AiMotionGraphic: React.FC<AiMotionGraphicProps> = ({
    svgContent,
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    if (frame < startFrame || frame > endFrame) return null;

    const localFrame = frame - startFrame;
    const duration = endFrame - startFrame;

    // Entrance / Exit
    const enterScale = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 100, mass: 0.8 } });
    const enterOpacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    const exitOpacity = interpolate(localFrame, [duration - 12, duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const exitScale = interpolate(localFrame, [duration - 12, duration], [1, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    // Remove background rects from legacy AI-generated SVGs
    let cleanSvg = svgContent || '';
    
    // Remove the first <rect> tag that spans 100% or the typical 400x300 viewBox
    cleanSvg = cleanSvg.replace(/<rect[^>]*width=["'](?:100%|400)["'][^>]*height=["'](?:100%|300)["'][^>]*\/?>(?:<\/rect>)?/i, '');
    
    // Force SVG to take up full space and have transparent background
    cleanSvg = cleanSvg.replace(/<svg([^>]*)>/i, (match, p1) => {
        let attrs = p1;
        if (!attrs.includes('width=')) attrs += ' width="100%"';
        if (!attrs.includes('height=')) attrs += ' height="100%"';
        return `<svg${attrs} style="background: transparent !important; overflow: visible;">`;
    });

    return (
        <AbsoluteFill style={{
            opacity: Math.min(enterOpacity, exitOpacity),
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
        }}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    transform: `scale(${enterScale * exitScale * 1.6})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 0 50px rgba(99, 102, 241, 0.5))'
                }}
                dangerouslySetInnerHTML={{ __html: cleanSvg }}
            />
        </AbsoluteFill>
    );
};
