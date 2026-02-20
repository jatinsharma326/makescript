'use client';

import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Player, PlayerRef } from '@remotion/player';
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
    onTimeUpdate?: (timeInSeconds: number) => void;
    onPlayStateChange?: (isPlaying: boolean) => void;
}

export interface PlayerPreviewHandle {
    seekTo: (timeInSeconds: number) => void;
    getCurrentTime: () => number;
    play: () => void;
    pause: () => void;
    isPlaying: () => boolean;
    toggle: () => void;
}

const PlayerPreview = forwardRef<PlayerPreviewHandle, PlayerPreviewProps>(({
    videoSrc,
    subtitles,
    durationInFrames,
    fps,
    compositionWidth = 1920,
    compositionHeight = 1080,
    filters,
    textOverlays = [],
    playbackRate = 1,
    onTimeUpdate,
    onPlayStateChange,
}, ref) => {
    const playerRef = useRef<PlayerRef>(null);
    const animFrameRef = useRef<number>(0);
    const lastReportedTime = useRef<number>(-1);
    const lastPlayingState = useRef<boolean>(false);

    // Store callbacks in refs so the polling loop never restarts
    const onTimeUpdateRef = useRef(onTimeUpdate);
    onTimeUpdateRef.current = onTimeUpdate;
    const onPlayStateChangeRef = useRef(onPlayStateChange);
    onPlayStateChangeRef.current = onPlayStateChange;

    useImperativeHandle(ref, () => ({
        seekTo: (timeInSeconds: number) => {
            if (playerRef.current) {
                const frame = Math.round(timeInSeconds * fps);
                playerRef.current.seekTo(frame);
            }
        },
        getCurrentTime: () => {
            if (playerRef.current) {
                return playerRef.current.getCurrentFrame() / fps;
            }
            return 0;
        },
        play: () => {
            playerRef.current?.play();
        },
        pause: () => {
            playerRef.current?.pause();
        },
        isPlaying: () => {
            return playerRef.current?.isPlaying() ?? false;
        },
        toggle: () => {
            if (playerRef.current?.isPlaying()) {
                playerRef.current.pause();
            } else {
                playerRef.current?.play();
            }
        },
    }), [fps]);

    // Stable polling loop — uses refs so it never needs to be recreated
    const pollTime = useCallback(() => {
        if (playerRef.current) {
            if (onTimeUpdateRef.current) {
                const frame = playerRef.current.getCurrentFrame();
                const time = frame / fps;
                if (Math.abs(time - lastReportedTime.current) > 0.03) {
                    lastReportedTime.current = time;
                    onTimeUpdateRef.current(time);
                }
            }
            if (onPlayStateChangeRef.current) {
                const playing = playerRef.current.isPlaying();
                if (playing !== lastPlayingState.current) {
                    lastPlayingState.current = playing;
                    onPlayStateChangeRef.current(playing);
                }
            }
        }
        animFrameRef.current = requestAnimationFrame(pollTime);
    }, [fps]); // only depends on fps now — stable

    useEffect(() => {
        animFrameRef.current = requestAnimationFrame(pollTime);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [pollTime]);

    // Memoize inputProps to prevent Remotion from re-mounting <Video>
    // This is the key fix for double audio: a new inputProps object reference
    // causes the Player to think the composition changed, re-creating the
    // underlying <video> element while the old one's audio is still playing.
    const inputProps = useMemo(() => ({
        videoSrc,
        subtitles,
        fps,
        filters,
        textOverlays,
    }), [videoSrc, subtitles, fps, filters, textOverlays]);

    // Stable style object
    const playerStyle = useMemo(() => ({
        width: '100%' as const,
        borderRadius: '0.75rem',
        overflow: 'hidden' as const,
    }), []);

    return (
        <div className="w-full rounded-xl bg-black shadow-2xl ring-1 ring-white/5 transition-shadow duration-300 hover:ring-white/10"
            style={{ overflow: 'visible' }}>
            <Player
                ref={playerRef}
                component={VideoWithOverlays}
                inputProps={inputProps}
                durationInFrames={Math.max(1, durationInFrames)}
                fps={fps}
                compositionWidth={compositionWidth}
                compositionHeight={compositionHeight}
                style={playerStyle}
                controls
                showVolumeControls
                allowFullscreen
                clickToPlay
                doubleClickToFullscreen
                autoPlay={false}
                loop={false}
                playbackRate={playbackRate}
                numberOfSharedAudioTags={1}
            />
        </div>
    );
});

PlayerPreview.displayName = 'PlayerPreview';

export default PlayerPreview;

