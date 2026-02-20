'use client';

import React from 'react';
import {
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from 'remotion';

interface ImageCardProps {
    imageUrl: string;
    keyword: string;
    label?: string;
    displayMode?: 'card' | 'fullscreen' | 'picture-in-picture' | 'split';
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    transition?: 'slide-in' | 'zoom-in' | 'fade-in' | 'flip' | 'appear';
    cardStyle?: 'glass' | 'solid' | 'minimal' | 'neon';
    startFrame?: number;
    endFrame?: number;
}

export const ImageCard: React.FC<ImageCardProps> = ({
    imageUrl,
    keyword,
    label,
    displayMode = 'card',
    position = 'center',
    transition = 'slide-in',
    cardStyle = 'glass',
    startFrame = 0,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const localFrame = frame - startFrame;
    const actualEnd = endFrame ?? Infinity;
    const duration = actualEnd - startFrame;

    if (frame < startFrame || frame > actualEnd) return null;

    // Animation progress
    const entryProgress = spring({
        frame: localFrame,
        fps,
        config: { damping: 15, stiffness: 80, mass: 0.8 },
    });

    const exitFrames = duration - 8;
    const exitProgress = localFrame > exitFrames
        ? interpolate(localFrame - exitFrames, [0, 8], [1, 0], { extrapolateRight: 'clamp' })
        : 1;

    const opacity = Math.min(entryProgress, exitProgress);

    // Float animation (subtle bobbing)
    const float = Math.sin(localFrame / 20) * 3;

    // Get entry transform based on transition type
    const getEntryTransform = () => {
        switch (transition) {
            case 'slide-in': {
                const slideX = interpolate(entryProgress, [0, 1], [60, 0]);
                return `translateX(${slideX}px) translateY(${float}px)`;
            }
            case 'zoom-in': {
                const scale = interpolate(entryProgress, [0, 1], [0.3, 1]);
                return `scale(${scale}) translateY(${float}px)`;
            }
            case 'flip': {
                const rotY = interpolate(entryProgress, [0, 1], [90, 0]);
                return `perspective(800px) rotateY(${rotY}deg) translateY(${float}px)`;
            }
            case 'fade-in':
            default:
                return `translateY(${float}px)`;
        }
    };

    // Position styles
    const getPositionStyle = (): React.CSSProperties => {
        if (displayMode === 'fullscreen') {
            return { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };
        }
        if (displayMode === 'split') {
            return { position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
        }

        const pad = Math.round(width * 0.04);
        const positions: Record<string, React.CSSProperties> = {
            'center': { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
            'top-left': { position: 'absolute', top: pad, left: pad },
            'top-right': { position: 'absolute', top: pad, right: pad },
            'bottom-left': { position: 'absolute', bottom: pad + Math.round(height * 0.08), left: pad },
            'bottom-right': { position: 'absolute', bottom: pad + Math.round(height * 0.08), right: pad },
        };
        return positions[position] || positions['center'];
    };

    // Card size based on display mode
    const getCardSize = () => {
        if (displayMode === 'fullscreen') return { w: width, h: height };
        if (displayMode === 'split') return { w: width * 0.35, h: height * 0.55 };
        if (displayMode === 'picture-in-picture') return { w: width * 0.20, h: width * 0.15 };
        return { w: width * 0.28, h: width * 0.20 }; // card mode
    };

    // Card styling
    const getCardBackground = () => {
        switch (cardStyle) {
            case 'glass':
                return {
                    background: 'rgba(15, 15, 25, 0.65)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                };
            case 'neon':
                return {
                    background: 'rgba(10, 10, 20, 0.85)',
                    border: '1.5px solid rgba(99, 102, 241, 0.5)',
                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.2), 0 0 60px rgba(99, 102, 241, 0.08), 0 20px 40px rgba(0,0,0,0.5)',
                };
            case 'solid':
                return {
                    background: 'rgba(20, 20, 30, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
                };
            case 'minimal':
                return {
                    background: 'transparent',
                    border: 'none',
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
                };
            default:
                return {};
        }
    };

    const { w: cardWidth, h: cardHeight } = getCardSize();
    const cardBg = getCardBackground();

    // Shimmer animation for loading feel
    const shimmerX = interpolate(localFrame % 60, [0, 60], [-100, 200]);

    // Pulse glow for neon style
    const glowIntensity = cardStyle === 'neon'
        ? 0.15 + Math.sin(localFrame / 15) * 0.05
        : 0;

    return (
        <div style={getPositionStyle()}>
            <div
                style={{
                    width: cardWidth,
                    height: cardHeight,
                    borderRadius: displayMode === 'fullscreen' ? 0 : (cardStyle === 'minimal' ? 12 : 16),
                    overflow: 'hidden',
                    opacity,
                    transform: displayMode === 'fullscreen' ? undefined : getEntryTransform(),
                    ...(displayMode === 'fullscreen' ? { background: '#000' } : cardBg),
                    ...(glowIntensity > 0 ? {
                        boxShadow: `0 0 ${30 + glowIntensity * 100}px rgba(99, 102, 241, ${glowIntensity}), ${cardBg.boxShadow}`,
                    } : {}),
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Image area */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: cardStyle === 'minimal' ? 12 : undefined,
                }}>
                    {/* Use standard img to avoid Remotion Img crashes on network errors */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={keyword}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                        onError={(e) => {
                            // On error, replace with gradient placeholder
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            if (target.parentElement) {
                                target.parentElement.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
                            }
                        }}
                    />

                    {/* Shimmer overlay */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(105deg, transparent ${shimmerX - 10}%, rgba(255,255,255,0.04) ${shimmerX}%, transparent ${shimmerX + 10}%)`,
                        pointerEvents: 'none',
                    }} />

                    {/* Gradient overlay at bottom of image */}
                    {cardStyle !== 'minimal' && (
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '40%',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
                            pointerEvents: 'none',
                        }} />
                    )}
                </div>

                {/* Label / keyword bar — hidden in fullscreen B-roll mode */}
                {cardStyle !== 'minimal' && displayMode !== 'fullscreen' && (
                    <div style={{
                        padding: `${Math.round(cardHeight * 0.04)}px ${Math.round(cardWidth * 0.05)}px`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: Math.round(cardWidth * 0.025),
                    }}>
                        {/* Keyword badge */}
                        <div style={{
                            padding: `${Math.round(cardHeight * 0.015)}px ${Math.round(cardWidth * 0.03)}px`,
                            borderRadius: 6,
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            fontSize: Math.round(cardWidth * 0.038),
                            fontWeight: 600,
                            color: '#a5b4fc',
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '0.02em',
                            whiteSpace: 'nowrap',
                        }}>
                            {keyword}
                        </div>

                        {/* Label text */}
                        {label && (
                            <div style={{
                                fontSize: Math.round(cardWidth * 0.035),
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                            }}>
                                {label}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
