'use client';

import React from 'react';
import { Player } from '@remotion/player';
import { VideoWithOverlays } from '../../remotion/VideoWithOverlays';
import { SubtitleSegment, VideoFilters, TextOverlay } from '../../lib/types';

interface PlayerPreviewProps {
    videoSrc: string;
    subtitles: SubtitleSegment[];
    durationInFrames: number;
    fps: number;
    compositionWidth?: number;
    compositionHeight?: number;
    filters?: VideoFilters;
    textOverlays?: TextOverlay[];
    playbackRate?: number;
}

const PlayerPreview: React.FC<PlayerPreviewProps> = ({
    videoSrc,
    subtitles,
    durationInFrames,
    fps,
    compositionWidth = 1920,
    compositionHeight = 1080,
    filters,
    textOverlays = [],
    playbackRate = 1,
}) => {
    return (
        <div className="w-full rounded-xl bg-black shadow-2xl ring-1 ring-white/5 transition-shadow duration-300 hover:ring-white/10"
            style={{ overflow: 'visible' }}>
            <Player
                component={VideoWithOverlays}
                inputProps={{
                    videoSrc,
                    subtitles,
                    fps,
                    filters,
                    textOverlays,
                }}
                durationInFrames={Math.max(1, durationInFrames)}
                fps={fps}
                compositionWidth={compositionWidth}
                compositionHeight={compositionHeight}
                style={{
                    width: '100%',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                }}
                controls
                showVolumeControls
                allowFullscreen
                clickToPlay
                doubleClickToFullscreen
                autoPlay={false}
                loop
                playbackRate={playbackRate}
            />
        </div>
    );
};

export default PlayerPreview;
