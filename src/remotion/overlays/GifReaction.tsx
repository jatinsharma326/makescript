import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface GifReactionProps {
    url?: string;
    keyword?: string;
    size?: 'small' | 'medium' | 'large' | 'fullscreen';
    position?: 'center' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
    startFrame: number;
    endFrame: number;
}

// Curated high-quality GIFs mapped by content theme
const THEMED_GIFS: Record<string, string[]> = {
    // Reactions & Emotions
    happy: [
        'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
        'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
        'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    ],
    celebrate: [
        'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
        'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
        'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif',
    ],
    shock: [
        'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
        'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
        'https://media.giphy.com/media/xT0xeJpnrWC3XWblEk/giphy.gif',
    ],
    funny: [
        'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
        'https://media.giphy.com/media/l2JhtKtDWYNKdRpoA/giphy.gif',
        'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif',
    ],
    sad: [
        'https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif',
        'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
    ],
    thinking: [
        'https://media.giphy.com/media/a5viI92PAF89q/giphy.gif',
        'https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif',
    ],

    // Business & Money
    money: [
        'https://media.giphy.com/media/JpG2A9P3dPHXaTYrwu/giphy.gif',
        'https://media.giphy.com/media/67ThRZlYBvibtdF9JH/giphy.gif',
        'https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif',
    ],
    growth: [
        'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
        'https://media.giphy.com/media/3o7btNhMBytxAM6YBa/giphy.gif',
    ],
    success: [
        'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
        'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',
    ],

    // Tech & AI
    tech: [
        'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif',
        'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
        'https://media.giphy.com/media/3o7btNa0RUYa5E7iiQ/giphy.gif',
    ],
    ai: [
        'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
        'https://media.giphy.com/media/3o7btNa0RUYa5E7iiQ/giphy.gif',
    ],
    code: [
        'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif',
        'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
    ],

    // Action & Energy
    fire: [
        'https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif',
        'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.gif',
    ],
    rocket: [
        'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
        'https://media.giphy.com/media/3o7btNhMBytxAM6YBa/giphy.gif',
    ],
    power: [
        'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif',
        'https://media.giphy.com/media/xT0xeJpnrWC3XWblEk/giphy.gif',
    ],

    // Approval & Agreement
    agree: [
        'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif',
        'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
    ],
    clap: [
        'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
        'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif',
    ],

    // General / Default
    general: [
        'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
        'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif',
        'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
        'https://media.giphy.com/media/3o7btNa0RUYa5E7iiQ/giphy.gif',
        'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
    ],
};

// Keyword → theme mapping for smart GIF selection
const KEYWORD_THEME_MAP: Record<string, string> = {
    // Money & Business
    money: 'money', revenue: 'money', profit: 'money', income: 'money', dollar: 'money',
    invest: 'money', stock: 'money', market: 'money', cash: 'money', earn: 'money',
    growth: 'growth', scale: 'growth', grow: 'growth', increase: 'growth', expand: 'growth',
    success: 'success', win: 'success', winner: 'success', champion: 'success', achieve: 'success',

    // Tech
    technology: 'tech', tech: 'tech', software: 'tech', computer: 'tech', digital: 'tech',
    ai: 'ai', artificial: 'ai', intelligence: 'ai', machine: 'ai', neural: 'ai', algorithm: 'ai',
    code: 'code', programming: 'code', developer: 'code', hack: 'code', coding: 'code',

    // Emotions
    happy: 'happy', joy: 'happy', great: 'happy', amazing: 'happy', awesome: 'happy', love: 'happy',
    celebrate: 'celebrate', celebration: 'celebrate', party: 'celebrate', congratulations: 'celebrate',
    shock: 'shock', wow: 'shock', omg: 'shock', crazy: 'shock', unbelievable: 'shock', insane: 'shock',
    funny: 'funny', laugh: 'funny', lol: 'funny', haha: 'funny', hilarious: 'funny',
    sad: 'sad', cry: 'sad', unfortunate: 'sad', bad: 'sad',
    think: 'thinking', question: 'thinking', wonder: 'thinking', curious: 'thinking',

    // Action
    fire: 'fire', hot: 'fire', burn: 'fire', lit: 'fire', trending: 'fire',
    rocket: 'rocket', launch: 'rocket', blast: 'rocket', fly: 'rocket', soar: 'rocket',
    power: 'power', strong: 'power', energy: 'power', force: 'power', unstoppable: 'power',
    agree: 'agree', yes: 'agree', right: 'agree', correct: 'agree', exactly: 'agree',
    clap: 'clap', applause: 'clap', bravo: 'clap',
};

function pickGifForText(text: string, seed: number): string {
    const lower = text.toLowerCase();
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length >= 2);

    // Score each theme based on keyword matches
    const scores: Record<string, number> = {};
    for (const word of words) {
        const theme = KEYWORD_THEME_MAP[word];
        if (theme) {
            scores[theme] = (scores[theme] || 0) + 1;
        }
    }

    // Pick the top-scoring theme
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    let theme = 'general';
    if (sorted.length > 0) {
        theme = sorted[0][0];
    }

    const gifs = THEMED_GIFS[theme] || THEMED_GIFS.general;
    return gifs[Math.abs(seed) % gifs.length];
}

export { pickGifForText, THEMED_GIFS };

export const GifReaction: React.FC<GifReactionProps> = ({
    url,
    keyword,
    size = 'medium',
    position = 'center',
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const [gifSrc, setGifSrc] = useState<string>('');

    useEffect(() => {
        if (url) {
            setGifSrc(url);
        } else {
            // Smart pick based on keyword
            const seed = (keyword || '').split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
            setGifSrc(pickGifForText(keyword || '', seed));
        }
    }, [url, keyword]);

    if (frame < startFrame || frame > endFrame || !gifSrc) {
        return null;
    }

    const duration = endFrame - startFrame;
    const progress = frame - startFrame;

    // Smooth entrance/exit
    const enterDur = Math.min(fps * 0.4, duration * 0.2);
    const exitDur = Math.min(fps * 0.3, duration * 0.2);

    let opacity = 1;
    let scale = 1;
    let translateY = 0;

    if (progress < enterDur) {
        const t = progress / enterDur;
        // Elastic ease-out
        opacity = t;
        scale = 1 - Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) * 0.3;
        scale = Math.max(0.5, Math.min(1.1, scale));
        translateY = (1 - t) * 30;
    } else if (frame > endFrame - exitDur) {
        const t = (endFrame - frame) / exitDur;
        opacity = t;
        scale = 0.9 + t * 0.1;
        translateY = (1 - t) * -20;
    }

    // Size configuration
    const sizeMap = {
        small: { width: 180, height: 180 },
        medium: { width: 320, height: 320 },
        large: { width: 500, height: 500 },
        fullscreen: { width: '80%' as any, height: '70%' as any },
    };
    const dims = sizeMap[size] || sizeMap.medium;

    // Position configuration
    const posStyles: Record<string, React.CSSProperties> = {
        center: { top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${scale}) translateY(${translateY}px)` },
        'top-right': { top: '8%', right: '5%', transform: `scale(${scale}) translateY(${translateY}px)` },
        'bottom-right': { bottom: '12%', right: '5%', transform: `scale(${scale}) translateY(${translateY}px)` },
        'top-left': { top: '8%', left: '5%', transform: `scale(${scale}) translateY(${translateY}px)` },
        'bottom-left': { bottom: '12%', left: '5%', transform: `scale(${scale}) translateY(${translateY}px)` },
    };

    const isFullscreen = size === 'fullscreen' || size === 'large';

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <div
                style={{
                    position: 'absolute',
                    ...posStyles[position],
                    opacity,
                    transition: 'opacity 0.05s',
                }}
            >
                <div
                    style={{
                        width: typeof dims.width === 'number' ? `${dims.width}px` : dims.width,
                        height: typeof dims.height === 'number' ? `${dims.height}px` : dims.height,
                        borderRadius: isFullscreen ? '20px' : '16px',
                        overflow: 'hidden',
                        boxShadow: isFullscreen
                            ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
                            : '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    {/* Use standard img tag to avoid CORS issues with Remotion's Img component */}
                    {/* GIFs from Giphy often fail due to CORS restrictions */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={gifSrc}
                        alt={keyword || 'reaction'}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 'inherit',
                        }}
                        onError={(e) => {
                            // On CORS/network error, replace with animated gradient placeholder
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            if (target.parentElement) {
                                // Create a vibrant animated gradient as fallback
                                target.parentElement.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)';
                                target.parentElement.style.animation = 'pulse 2s ease-in-out infinite';
                            }
                        }}
                    />
                </div>
                {/* Subtle glow behind the GIF */}
                {isFullscreen && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: '-20%',
                            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)',
                            zIndex: -1,
                            filter: 'blur(30px)',
                        }}
                    />
                )}
            </div>
        </AbsoluteFill>
    );
};
