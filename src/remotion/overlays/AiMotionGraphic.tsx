import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface AiMotionGraphicProps {
    svgContent: string;
    startFrame: number;
    endFrame: number;
}

function sanitizeSvg(raw: string): string {
    let svg = raw;
    svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
    svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
    svg = svg.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
    svg = svg.replace(/\bon\w+\s*=\s*[^\s>]+/gi, '');
    svg = svg.replace(/javascript\s*:/gi, 'blocked:');
    return svg;
}

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
<style>
@keyframes pulse{0%,100%{opacity:.4;r:80}50%{opacity:.7;r:100}}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
</style>
<defs><radialGradient id="fbg"><stop offset="0%" stop-color="#6366f1" stop-opacity=".6"/><stop offset="100%" stop-color="#6366f1" stop-opacity="0"/></radialGradient></defs>
<circle cx="200" cy="150" fill="url(#fbg)" style="animation:pulse 3s ease-in-out infinite"><animate attributeName="r" values="80;100;80" dur="3s" repeatCount="indefinite"/></circle>
<g style="transform-origin:200px 150px;animation:spin 8s linear infinite"><circle cx="200" cy="80" r="4" fill="#a78bfa" opacity=".8"/></g>
</svg>`;

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

    const enterScale = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 100, mass: 0.8 } });
    const enterOpacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    const exitOpacity = interpolate(localFrame, [duration - 12, duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const exitScale = interpolate(localFrame, [duration - 12, duration], [1, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    let cleanSvg = sanitizeSvg(svgContent || '');

    // Use fallback if SVG is empty or invalid
    if (!cleanSvg || !cleanSvg.includes('<svg')) {
        cleanSvg = FALLBACK_SVG;
    }

    // Remove background rects from AI-generated SVGs
    cleanSvg = cleanSvg.replace(/<rect[^>]*width=["'](?:100%|400)["'][^>]*height=["'](?:100%|300)["'][^>]*\/?>(?:<\/rect>)?/i, '');

    // Force SVG to fill space, transparent background, and ensure CSS animations run
    cleanSvg = cleanSvg.replace(/<svg([^>]*)>/i, (match, p1) => {
        let attrs = p1;
        if (!attrs.includes('width=')) attrs += ' width="100%"';
        if (!attrs.includes('height=')) attrs += ' height="100%"';
        return `<svg${attrs} style="background:transparent!important;overflow:visible;">` +
            '<style>*{animation-play-state:running!important}</style>';
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
