import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Video } from 'remotion';

interface BrollVideoProps {
    url?: string;
    keyword?: string;
    style?: 'split-screen' | 'picture-in-picture' | 'fullscreen';
    startFrame: number;
    endFrame: number;
}

// Fallback videos to use if no URL is provided, mapped by basic themes
const FALLBACK_VIDEOS: Record<string, string[]> = {
    nature: [
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    ],
    tech: [
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    ],
    general: [
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
    ]
};

function getFallbackVideo(keyword: string = ''): string {
    const k = keyword.toLowerCase();
    if (k.includes('nature') || k.includes('tree') || k.includes('water') || k.includes('earth')) {
        return FALLBACK_VIDEOS.nature[Math.floor(Math.random() * FALLBACK_VIDEOS.nature.length)];
    }
    if (k.includes('tech') || k.includes('code') || k.includes('computer') || k.includes('digital') || k.includes('ai')) {
        return FALLBACK_VIDEOS.tech[Math.floor(Math.random() * FALLBACK_VIDEOS.tech.length)];
    }
    return FALLBACK_VIDEOS.general[Math.floor(Math.random() * FALLBACK_VIDEOS.general.length)];
}

export const BrollVideo: React.FC<BrollVideoProps> = ({
    url,
    keyword,
    style = 'picture-in-picture',
    startFrame,
    endFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const [videoSrc, setVideoSrc] = useState<string>('');

    useEffect(() => {
        if (url) {
            setVideoSrc(url);
        } else {
            // Pick a fallback based on keyword if we don't have a real Pexels/stock API connected yet
            setVideoSrc(getFallbackVideo(keyword));
        }
    }, [url, keyword]);

    if (frame < startFrame || frame > endFrame || !videoSrc) {
        return null;
    }

    const duration = endFrame - startFrame;
    const progress = frame - startFrame;

    // Fade in/out
    const fadeFrames = fps * 0.5; // half second fade
    const fadeIn = Math.min(1, progress / fadeFrames);
    const fadeOut = Math.min(1, (endFrame - frame) / fadeFrames);
    const opacity = Math.min(fadeIn, fadeOut);

    // Style variations
    let containerStyle: React.CSSProperties = { opacity };
    let innerStyle: React.CSSProperties = {};

    switch (style) {
        case 'fullscreen':
            containerStyle = {
                ...containerStyle,
                backgroundColor: 'black',
                zIndex: 5, // high z-index to cover
            };
            innerStyle = { width: '100%', height: '100%', objectFit: 'cover' };
            break;
        case 'split-screen':
            containerStyle = {
                ...containerStyle,
                right: 0,
                width: '50%',
                height: '100%',
                backgroundColor: 'black',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            };
            innerStyle = { width: '100%', height: '100%', objectFit: 'cover' };
            break;
        case 'picture-in-picture':
        default:
            const slideUp = Math.max(0, 50 - progress * 2);
            containerStyle = {
                ...containerStyle,
                top: '10%',
                right: '5%',
                width: '40%',
                height: 'auto',
                aspectRatio: '16/9',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                border: '4px solid rgba(255,255,255,0.1)',
                transform: `translateY(${slideUp}px)`,
            };
            innerStyle = { width: '100%', height: '100%', objectFit: 'cover' };
            break;
    }

    return (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', ...containerStyle }}>
                <Video
                    src={videoSrc}
                    style={innerStyle}
                    muted={true} // B-roll should usually be muted
                    volume={0}
                />
            </div>
        </AbsoluteFill>
    );
};
