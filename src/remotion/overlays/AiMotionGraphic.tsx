import React, { useMemo, useState, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img, random } from 'remotion';
import * as Babel from '@babel/standalone';
import { CanvasMotionGraphic } from './CanvasMotionGraphic';

interface AiMotionGraphicProps {
    reactCode?: string;
    svgContent?: string;
    text?: string;
    imageUrl?: string;
    label?: string;
    color?: string;
    startFrame: number;
    endFrame: number;
}

// Error boundary to catch errors in dynamically evaluated React components
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: any) {
        console.error('[LiveMotionGraphic] Evaluation error:', error);
    }
    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

import * as Remotion from 'remotion';
export const AiMotionGraphic: React.FC<AiMotionGraphicProps> = ({
    reactCode,
    svgContent,
    text,
    imageUrl,
    label,
    color = '#6366f1',
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const { Component: DynamicComponent, error: evalError } = useMemo(() => {
        if (!reactCode) return { Component: null, error: null };
        
        try {
            const transpiled = Babel.transform(reactCode, {
                presets: ['env', 'react', 'typescript'],
                filename: 'dynamic.tsx',
            }).code;

            const scope = {
                React,
                ...Remotion,
                console
            };

            const evalCode = `
                const exports = {};
                const require = (moduleName) => {
                    if (moduleName === 'react') return scope.React;
                    if (moduleName === 'remotion') return scope;
                    throw new Error('Module ' + moduleName + ' not found');
                };
                ${Object.keys(scope).map(k => `const ${k} = scope.${k};`).join('\n')}
                
                ${transpiled}
                
                return exports.LiveGraphic || exports.default || exports.FocusMode || Object.values(exports)[0] || null;
            `;

            const createComponent = new Function('scope', evalCode);
            const Component = createComponent(scope);
            
            return { Component: Component as React.FC<any>, error: null };
        } catch (err: any) {
            console.error('[LiveMotionGraphic] Failed to compile/evaluate React code:', err);
            return { Component: null, error: err.message || String(err) };
        }
    }, [reactCode]);

    // ALL HOOKS MUST BE BEFORE THIS EARLY RETURN!
    const localFrame = Math.max(0, frame - startFrame);
    const duration = endFrame - startFrame;
    const enterProgress = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 100, mass: 0.8 } });
    const enterOpacity = interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
    const exitOpacity = interpolate(localFrame, [duration - 12, duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const opacity = Math.min(enterOpacity, exitOpacity);

    if (frame < startFrame || frame > endFrame) return null;

    if (evalError) {
        return (
            <AbsoluteFill style={{ backgroundColor: 'rgba(255,0,0,0.8)', zIndex: 99, padding: 40, color: 'white', fontFamily: 'monospace', justifyContent: 'center' }}>
                <h1 style={{ fontSize: 40, marginBottom: 20 }}>AI Code Evaluation Failed</h1>
                <p style={{ fontSize: 24, whiteSpace: 'pre-wrap' }}>{evalError}</p>
            </AbsoluteFill>
        );
    }

    if (DynamicComponent) {
        return (
            <AbsoluteFill style={{ opacity, pointerEvents: 'none', zIndex: 20 }}>
                <ErrorBoundary fallback={<div style={{ display: 'none' }} />}>
                    <DynamicComponent />
                </ErrorBoundary>
            </AbsoluteFill>
        );
    }

    // PRIORITY 2: AI-generated SVG content (from preGenerateMotionSVGs)
    if (svgContent && svgContent.includes('<svg')) {
        let cleanSvg = svgContent
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
            .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript\s*:/gi, 'blocked:');
        // Inject responsive dimensions
        cleanSvg = cleanSvg.replace(/<svg([^>]*)>/i, (_match, p1) => {
            let attrs = p1;
            if (!attrs.includes('width=')) attrs += ' width="100%"';
            if (!attrs.includes('height=')) attrs += ' height="100%"';
            return `<svg${attrs} style="overflow:visible;">`;
        });
        return (
            <AbsoluteFill style={{ opacity, pointerEvents: 'none', zIndex: 20 }}>
                <AbsoluteFill style={{ background: `linear-gradient(135deg, ${color}22 0%, #0a0a0f 50%, ${color}11 100%)` }} />
                <div style={{
                    width: '100%', height: '100%',
                    transform: `scale(${1 + enterProgress * 0.6})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    filter: `drop-shadow(0 0 60px ${color}99)`,
                }}
                    dangerouslySetInnerHTML={{ __html: cleanSvg }}
                />
            </AbsoluteFill>
        );
    }

    // PRIORITY 3: If no AI-generated React code or SVG, don't show a fallback.
    // Let the video play through without an ugly text overlay.
    // The CanvasMotionGraphic was previously used here but it just showed
    // simple text with colors which looked unprofessional.
    if (!reactCode && !svgContent) {
        return null;
    }

    // FALLBACK: Image-based motion graphic
    // FALLBACK: Image-based motion graphic
    if (imageUrl) {
        const slideUp = interpolate(localFrame, [0, 15], [40, 0], { extrapolateRight: 'clamp' });
        const labelSlide = interpolate(localFrame, [5, 18], [30, 0], { extrapolateRight: 'clamp' });
        const labelOpacity = interpolate(localFrame, [5, 18], [0, 1], { extrapolateRight: 'clamp' });
        const glowPulse = interpolate(localFrame % 60, [0, 30, 60], [0.3, 0.6, 0.3], { extrapolateRight: 'clamp' });
        const barScale = spring({ frame: Math.max(0, localFrame - 8), fps, config: { damping: 12, stiffness: 80 } });

        return (
            <AbsoluteFill style={{ opacity, pointerEvents: 'none', zIndex: 10 }}>
                {/* Darkened background image */}
                <AbsoluteFill style={{
                    transform: `scale(${1 + enterProgress * 0.05}) translateY(${slideUp}px)`,
                    borderRadius: 16,
                    overflow: 'hidden',
                }}>
                    <Img
                        src={imageUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'brightness(0.4) saturate(1.3)',
                        }}
                    />
                </AbsoluteFill>

                {/* Color gradient overlay */}
                <AbsoluteFill style={{
                    background: `linear-gradient(135deg, ${color}40 0%, transparent 50%, ${color}20 100%)`,
                    borderRadius: 16,
                }} />

                {/* Glow accent line at top */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '10%',
                    right: '10%',
                    height: 3,
                    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                    opacity: glowPulse,
                    borderRadius: 2,
                    transform: `scaleX(${barScale})`,
                }} />

                {/* Label text */}
                {label && (
                    <AbsoluteFill style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 12,
                    }}>
                        <div style={{
                            fontSize: 42,
                            fontWeight: 900,
                            fontFamily: 'sans-serif',
                            color: '#ffffff',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: 3,
                            textShadow: `0 0 40px ${color}, 0 0 80px ${color}80, 0 4px 20px rgba(0,0,0,0.8)`,
                            transform: `translateY(${labelSlide}px)`,
                            opacity: labelOpacity,
                            padding: '0 40px',
                            lineHeight: 1.2,
                        }}>
                            {label}
                        </div>

                        {/* Accent bar under label */}
                        <div style={{
                            width: 80,
                            height: 4,
                            background: `linear-gradient(90deg, ${color}, ${color}80)`,
                            borderRadius: 2,
                            transform: `scaleX(${barScale}) translateY(${labelSlide}px)`,
                            opacity: labelOpacity,
                            boxShadow: `0 0 20px ${color}`,
                        }} />
                    </AbsoluteFill>
                )}

                {/* Corner accents */}
                <div style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    width: 24,
                    height: 24,
                    borderTop: `2px solid ${color}`,
                    borderLeft: `2px solid ${color}`,
                    opacity: labelOpacity * 0.6,
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    width: 24,
                    height: 24,
                    borderBottom: `2px solid ${color}`,
                    borderRight: `2px solid ${color}`,
                    opacity: labelOpacity * 0.6,
                }} />
            </AbsoluteFill>
        );
    }

    return null;
};
