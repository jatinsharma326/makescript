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
 * Includes keywords that will trigger overlay generation.
 */
export function generateMockTranscript(duration: number): SubtitleSegment[] {
    const sentences = [
        "Welcome to our new growth platform where technology meets innovation",
        "Our business has grown to over one million users worldwide",
        "The AI system processes data with incredible speed and accuracy",
        "Revenue increased from one million to five million dollars",
        "Our team is building the future of digital technology",
        "The brain processes information like a powerful computer",
        "We connect people through our global network platform",
        "Time is money and every second counts in business",
        "Energy flows through the system like electricity",
        "Our stock price is skyrocketing to new heights",
        "The rocket launched successfully into outer space",
        "Science and research drive innovation forward",
        "Our community is growing stronger every single day",
        "Success comes from hard work and dedication",
        "The future of technology is absolutely incredible",
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
