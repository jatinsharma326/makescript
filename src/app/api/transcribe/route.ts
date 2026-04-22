import { NextRequest, NextResponse } from 'next/server';

interface WhisperSegment {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
}

interface WhisperResult {
    segments: WhisperSegment[];
    language?: string;
    text?: string;
    error?: string;
    message?: string;
}

// ModelScope Gradio Transcription API
const GRADIO_TRANSCRIBE_URL = 'https://ai-modelscope-cohere-transcribe-03-2026-demo.ms.show/gradio_api/call/transcribe';
const TMPFILES_UPLOAD_URL = 'https://tmpfiles.org/api/v1/upload';

/**
 * Upload file to tmpfiles.org to get a public URL
 */
async function uploadToTmpfiles(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(TMPFILES_UPLOAD_URL, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    
    if (!data?.data?.url) {
        throw new Error('Failed to upload file to tmpfiles: ' + JSON.stringify(data));
    }

    // Convert to direct download URL
    const directUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    return directUrl;
}

/**
 * Submit transcription job to ModelScope Gradio API
 */
async function submitTranscription(fileUrl: string, language: string = 'en'): Promise<string> {
    const response = await fetch(GRADIO_TRANSCRIBE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: [
                {
                    path: fileUrl,
                    meta: {
                        _type: 'gradio.FileData',
                    },
                },
                language,
            ],
        }),
    });

    const data = await response.json();
    
    if (!data.event_id) {
        throw new Error('No event_id from Gradio API: ' + JSON.stringify(data));
    }

    return data.event_id;
}

/**
 * Poll for transcription result from Gradio API
 */
async function pollTranscription(eventId: string, maxAttempts: number = 60): Promise<string> {
    const pollUrl = `${GRADIO_TRANSCRIBE_URL}/${eventId}`;
    
    for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch(pollUrl);
        const text = await response.text();

        // Parse SSE format to find the transcription result
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data:') && line.includes('[')) {
                const jsonStr = line.replace('data:', '').trim();
                try {
                    const parsed = JSON.parse(jsonStr);
                    if (Array.isArray(parsed) && parsed[0]) {
                        return parsed[0];
                    }
                } catch (e) {
                    // Continue polling
                }
            }
        }

        // Check for completion message
        if (text.includes('Completed') || text.includes('process_completed')) {
            // Try one more parse attempt
            const finalMatch = text.match(/data:\s*\[\s*"([^"]+)"/);
            if (finalMatch) {
                return finalMatch[1];
            }
        }

        // Wait before next poll (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Transcription timed out after ' + maxAttempts + ' attempts');
}

/**
 * Parse raw transcription text into segments with timestamps
 * The ModelScope API returns raw text, so we'll create segments based on sentences
 */
function parseTranscriptionToSegments(rawText: string, durationSeconds: number): WhisperSegment[] {
    // Split into sentences/phrases
    const sentences = rawText
        .replace(/\n+/g, ' ')
        .split(/[.!?]+\s*|\n+/)
        .filter(s => s.trim().length > 0);

    if (sentences.length === 0) {
        return [];
    }

    // Distribute sentences across the video duration
    const segmentDuration = durationSeconds / sentences.length;
    const segments: WhisperSegment[] = [];

    sentences.forEach((sentence, index) => {
        const startTime = index * segmentDuration;
        const endTime = (index + 1) * segmentDuration;

        segments.push({
            id: `seg_${index}`,
            startTime: Math.round(startTime * 1000) / 1000,
            endTime: Math.round(endTime * 1000) / 1000,
            text: sentence.trim(),
        });
    });

    return segments;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const duration = formData.get('duration') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const videoDuration = duration ? parseFloat(duration) : 30;
        console.log('[Transcribe] Received file:', file.name, 'size:', file.size, 'duration:', videoDuration);

        // Upload file to tmpfiles.org for public URL
        console.log('[Transcribe] Uploading to tmpfiles.org...');
        const fileUrl = await uploadToTmpfiles(file);
        console.log('[Transcribe] File URL:', fileUrl);

        // Submit transcription job
        console.log('[Transcribe] Submitting to ModelScope Gradio API...');
        const eventId = await submitTranscription(fileUrl, 'en');
        console.log('[Transcribe] Event ID:', eventId);

        // Poll for result
        console.log('[Transcribe] Polling for transcription result...');
        const rawTranscription = await pollTranscription(eventId);
        console.log('[Transcribe] Raw transcription length:', rawTranscription.length);

        // Parse into segments using the video duration
        const segments = parseTranscriptionToSegments(rawTranscription, videoDuration);

        console.log('[Transcribe] Created', segments.length, 'segments');

        return NextResponse.json({
            subtitles: segments,
            language: 'en',
            rawText: rawTranscription,
            success: true,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Transcribe] Error:', message);

        return NextResponse.json(
            {
                subtitles: [],
                fallback: true,
                error: `Transcription failed: ${message}`,
            },
            { status: 200 }
        );
    }
}