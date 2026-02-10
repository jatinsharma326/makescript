// Mock transcription service for MVP
// In production, replace with OpenAI Whisper API or Deepgram

import { SubtitleSegment } from './types';

/**
 * Generate mock transcript from video duration.
 * In production, this would call a speech-to-text API.
 */
export function generateMockTranscript(duration: number): SubtitleSegment[] {
    const sentences = [
        "Hey everyone, welcome back to another video",
        "Today we're going to talk about something really exciting",
        "I've been working on this project for a while now",
        "And I'm finally ready to share the results with you",
        "Let me show you how it works step by step",
        "First, you need to set up the basic structure",
        "Then we add the core functionality piece by piece",
        "This is where it gets really interesting",
        "Watch how everything comes together seamlessly",
        "The key insight here is to keep things simple",
        "Don't overcomplicate the process at the start",
        "Focus on getting the fundamentals right first",
        "Once you have that foundation, you can build on top",
        "Let me know in the comments what you think",
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
