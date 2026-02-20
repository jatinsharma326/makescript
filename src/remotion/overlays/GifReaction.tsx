import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from 'remotion';

interface GifReactionProps {
    url?: string;
    keyword?: string;
    size?: 'small' | 'medium' | 'large';
    startFrame: number;
    endFrame: number;
}

// Fallback GIFs mapped by reaction types
const FALLBACK_GIFS: Record<string, string[]> = {
    happy: [
        'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif', // Yes/Happy
        'https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.gif'
    ],
    sad: [
        'https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif', // Crying
    ],
    shock: [
        'https://media.giphy.com/media/ebFG4jcnC1Ny8/giphy.gif', // Mind blown
        'https://media.giphy.com/media/tfUW8mhiFk8NlJhgEh/giphy.gif'
    ],
    funny: [
        'https://media.giphy.com/media/l2JhtKtDWYNKdRpoA/giphy.gif', // Laugh
    ],
    tech: [
        'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif', // Matrix typing
    ],
    general: [
        'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif'
    ]
};

function getFallbackGif(keyword: string = ''): string {
    const k = keyword.toLowerCase();
    if (k.includes('happy') || k.includes('yay') || k.includes('yes') || k.includes('win')) {
        return FALLBACK_GIFS.happy[Math.floor(Math.random() * FALLBACK_GIFS.happy.length)];
    }
    if (k.includes('sad') || k.includes('cry') || k.includes('no') || k.includes('fail')) {
        return FALLBACK_GIFS.sad[Math.floor(Math.random() * FALLBACK_GIFS.sad.length)];
    }
    if (k.includes('shock') || k.includes('wow') || k.includes('omg') || k.includes('crazy')) {
        return FALLBACK_GIFS.shock[Math.floor(Math.random() * FALLBACK_GIFS.shock.length)];
    }
    if (k.includes('funny') || k.includes('laugh') || k.includes('lol') || k.includes('haha')) {
        return FALLBACK_GIFS.funny[Math.floor(Math.random() * FALLBACK_GIFS.funny.length)];
    }
    if (k.includes('tech') || k.includes('code') || k.includes('hack') || k.includes('computer')) {
        return FALLBACK_GIFS.tech[Math.floor(Math.random() * FALLBACK_GIFS.tech.length)];
    }
    return FALLBACK_GIFS.general[Math.floor(Math.random() * FALLBACK_GIFS.general.length)];
}

export const GifReaction: React.FC<GifReactionProps> = ({
    url,
    keyword,
    size = 'medium',
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
            setGifSrc(getFallbackGif(keyword));
        }
    }, [url, keyword]);

    if (frame < startFrame || frame > endFrame || !gifSrc) {
        return null;
    }

    const duration = endFrame - startFrame;
    const progress = frame - startFrame;

    // Pop animation
    const scaleFrames = fps * 0.3; // 0.3s popup
    let scale = 1;
    if (progress < scaleFrames) {
        // Elastic pop in
        const t = progress / scaleFrames;
        scale = Math.sin(-13.0 * (t + 1.0) * Math.PI / 2.0) * Math.pow(2.0, -10.0 * t) + 1.0;
    } else if (frame > endFrame - scaleFrames) {
        // Pop out
        const p = (endFrame - frame) / scaleFrames;
        scale = p * p;
    }

    // Size configuration
    let sizePx = 300;
    switch (size) {
        case 'small': sizePx = 150; break;
        case 'large': sizePx = 500; break;
        case 'medium':
        default: sizePx = 300; break;
    }

    return (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div
                style={{
                    position: 'absolute',
                    top: '15%',
                    transform: `translateX(-20%) scale(${scale})`,
                    transformOrigin: 'bottom center',
                    padding: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Img
                    src={gifSrc}
                    style={{
                        width: `${sizePx}px`,
                        height: 'auto',
                        borderRadius: '8px',
                        objectFit: 'cover'
                    }}
                />
            </div>
        </AbsoluteFill>
    );
};
