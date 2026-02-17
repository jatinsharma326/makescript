// Transcription service for video speech-to-text
// Uses server-side API route that calls ModelScope Whisper

import { SubtitleSegment } from './types';

/**
 * Transcribe a video file using real speech-to-text.
 * Sends the file to /api/transcribe which calls the Whisper model.
 * Falls back to mock transcript if the API fails.
 */
export async function transcribeVideo(
    file: File,
    duration: number
): Promise<{ subtitles: SubtitleSegment[]; isReal: boolean; noAudio?: boolean; lowConfidence?: boolean }> {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        // Handle no-audio-track error explicitly
        if (data.noAudio) {
            console.warn('Video has no audio track — cannot transcribe.');
            return { subtitles: [], isReal: false, noAudio: true };
        }

        // If API returned without error, use the result (even if empty)
        if (!data.fallback && !data.error) {
            const avgConfidence = data.avgConfidence ?? 1.0;
            const filteredCount = data.filteredCount ?? 0;

            if (filteredCount > 0) {
                console.warn(`Filtered ${filteredCount} hallucinated segment(s) from transcription.`);
            }

            const lowConfidence = avgConfidence < 0.5;
            if (lowConfidence) {
                console.warn(`Low transcription confidence (${avgConfidence}). Audio may not contain clear speech.`);
            }

            if (!data.subtitles || data.subtitles.length === 0) {
                console.warn('Real transcription completed but returned no segments (silence or no speech detected).');
            }

            return { subtitles: data.subtitles || [], isReal: true, lowConfidence };
        }

        // API returned error or fallback flag — return empty so editor can decide
        console.warn('Transcription failed:', data.error || 'Unknown error');
        return { subtitles: [], isReal: false };
    } catch (error) {
        console.error('Transcription network request failed:', error);
        return { subtitles: [], isReal: false };
    }
}

/**
 * Generate mock transcript from video duration.
 * Used as fallback when real transcription is unavailable.
 */
export function generateMockTranscript(duration: number): SubtitleSegment[] {
    const sentences = [
        "Hey everyone, welcome back to another video",
        "Today we're going to talk about something really exciting that could launch your career like a rocket",
        "I've been working on this project for a while and the growth has been incredible",
        "Think of it like the earth orbiting around the sun, everything is connected",
        "The idea behind this is actually quite simple but very powerful",
        "Let me show you how it works step by step, it's lightning fast",
        "This network of connections is what makes it all come together",
        "The global impact of this technology is changing the world",
        "Your brain will love this because it makes everything click",
        "The money flow from this investment has been absolutely worth it",
        "Time is ticking so let's not waste another moment",
        "The energy and pulse of this community keeps growing stronger",
        "Watch how the progress chart just keeps going up and up",
        "Let me know in the comments what you think about this",
        "Don't forget to like and subscribe for more content",
        "Thanks for watching, see you in the next one",
    ];

    const segmentDuration = Math.max(2, duration / Math.min(sentences.length, Math.ceil(duration / 3)));
    const numSegments = Math.min(sentences.length, Math.ceil(duration / segmentDuration));

    const subtitles: SubtitleSegment[] = [];
    for (let i = 0; i < numSegments; i++) {
        const startTime = i * segmentDuration;
        const endTime = Math.min(startTime + segmentDuration, duration);
        subtitles.push({
            id: `seg-${i}`,
            startTime: Math.round(startTime * 100) / 100,
            endTime: Math.round(endTime * 100) / 100,
            text: sentences[i % sentences.length],
        });
    }

    return subtitles;
}

/**
 * Format seconds to MM:SS display
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
