'use client';

import React from 'react';
import { Player } from '@remotion/player';
import { VideoWithOverlays } from '../../remotion/VideoWithOverlays';
import { SubtitleSegment } from '../../lib/types';

interface PlayerPreviewProps {
    videoSrc: string;
    subtitles: SubtitleSegment[];
    durationInFrames: number;
    fps: number;
}

const PlayerPreview: React.FC<PlayerPreviewProps> = ({
    videoSrc,
    subtitles,
    durationInFrames,
    fps,
}) => {
    return (
        <div
            style={{
                width: '100%',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                background: '#000',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
        >
            <Player
                component={VideoWithOverlays}
                inputProps={{
                    videoSrc,
                    subtitles,
                    fps,
                    showSubtitles: true,
                }}
                durationInFrames={Math.max(1, durationInFrames)}
                fps={fps}
                compositionWidth={1920}
                compositionHeight={1080}
                style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                }}
                controls
                autoPlay={false}
                loop
            />
        </div>
    );
};

export default PlayerPreview;
