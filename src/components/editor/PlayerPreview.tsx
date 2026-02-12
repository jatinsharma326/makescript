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
    compositionWidth?: number;
    compositionHeight?: number;
}

const PlayerPreview: React.FC<PlayerPreviewProps> = ({
    videoSrc,
    subtitles,
    durationInFrames,
    fps,
    compositionWidth = 1920,
    compositionHeight = 1080,
}) => {
    const aspectRatio = `${compositionWidth} / ${compositionHeight}`;

    return (
        <div className="w-full rounded-xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/5 transition-shadow duration-300 hover:ring-white/10">
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
                compositionWidth={compositionWidth}
                compositionHeight={compositionHeight}
                style={{
                    width: '100%',
                    aspectRatio,
                }}
                controls
                autoPlay={false}
                loop
            />
        </div>
    );
};

export default PlayerPreview;
