import { NextRequest, NextResponse } from 'next/server';

interface WhisperSegment {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
}

// Gradio Transcription API (FREE — no API key needed)
const GRADIO_BASE_URL = 'https://ai-modelscope-cohere-transcribe-03-2026-demo.ms.show/gradio_api';

/**
 * Fetch with optional timeout helper.
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 30000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Upload audio file directly to Gradio's own /upload endpoint.
 * Returns the file path on the Gradio server that can be used in API calls.
 */
async function uploadToGradio(file: File): Promise<string> {
    console.log('[Transcribe] Uploading file to Gradio server, file:', file.name, 'size:', file.size, 'type:', file.type);

    const formData = new FormData();
    formData.append('files', file);

    const response = await fetchWithTimeout(`${GRADIO_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
    }, 180000); // 3 min timeout (includes cold-start wake-up)

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Transcribe] Gradio upload failed:', response.status, errorText.substring(0, 300));
        throw new Error(`Gradio upload failed (HTTP ${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('[Transcribe] Gradio upload response:', JSON.stringify(data));

    // Gradio /upload returns an array of file paths, e.g. ["/tmp/gradio/xxx/audio.webm"]
    let filePath: string;
    if (Array.isArray(data) && data.length > 0) {
        filePath = data[0];
    } else if (typeof data === 'string') {
        filePath = data;
    } else {
        throw new Error('Gradio upload returned unexpected format: ' + JSON.stringify(data));
    }

    console.log('[Transcribe] ✓ Uploaded to Gradio server, path:', filePath);
    return filePath;
}

/**
 * Submit the uploaded file path to the Gradio transcription API.
 * Returns the event_id for polling.
 */
async function submitToGradio(filePath: string): Promise<string> {
    console.log('[Transcribe] Submitting to Gradio /call/transcribe...');

    const response = await fetchWithTimeout(`${GRADIO_BASE_URL}/call/transcribe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: [
                {
                    path: filePath,
                    meta: { _type: 'gradio.FileData' },
                },
                'en',
            ],
        }),
    }, 60000);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Transcribe] Gradio submit failed:', response.status, errorText.substring(0, 300));
        throw new Error(`Gradio submit failed (HTTP ${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('[Transcribe] Gradio submit response:', JSON.stringify(data));

    const eventId = data?.event_id;
    if (!eventId) {
        throw new Error('Gradio submit failed: no event_id — ' + JSON.stringify(data));
    }

    console.log('[Transcribe] ✓ Got event_id:', eventId);
    return eventId;
}

/**
 * Poll the Gradio event endpoint for the transcription result.
 * The endpoint returns SSE (Server-Sent Events) format.
 */
async function pollGradioResult(eventId: string): Promise<string> {
    console.log('[Transcribe] Polling Gradio for result, event_id:', eventId);

    const response = await fetchWithTimeout(
        `${GRADIO_BASE_URL}/call/transcribe/${eventId}`,
        {},
        300000 // 5 minutes timeout for transcription
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Transcribe] Gradio poll failed:', response.status, errorText.substring(0, 300));
        throw new Error(`Gradio poll failed (HTTP ${response.status}): ${errorText.substring(0, 200)}`);
    }

    const rawText = await response.text();
    console.log('[Transcribe] Gradio poll raw response (first 1000 chars):', rawText.substring(0, 1000));

    // Parse SSE format: lines like "event: complete\ndata: ["transcription text"]"
    const lines = rawText.split('\n');
    let transcription = '';
    let hasError = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for error events
        if (line === 'event: error') {
            hasError = true;
            // Try to get the error data from the next data: line
            const nextLine = lines[i + 1]?.trim() || '';
            const errorData = nextLine.startsWith('data:') ? nextLine.replace('data:', '').trim() : 'unknown';
            console.error('[Transcribe] Gradio returned error event, data:', errorData);
        }

        // Look for data lines with the transcription result
        if (line.startsWith('data:')) {
            const jsonStr = line.replace('data:', '').trim();
            if (jsonStr === 'null' || jsonStr === '') continue;

            try {
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                    transcription = parsed[0];
                    console.log('[Transcribe] ✓ Found transcription in SSE data');
                }
            } catch {
                // Not a valid JSON data line, skip
            }
        }
    }

    if (!transcription) {
        if (hasError) {
            throw new Error('Gradio transcription failed — the API returned an error. The audio file may be unsupported or too large.');
        }
        throw new Error('Could not parse transcription from Gradio response: ' + rawText.substring(0, 500));
    }

    console.log('[Transcribe] ✓ Got transcription, length:', transcription.length);
    console.log('[Transcribe] Preview:', transcription.substring(0, 150));
    return transcription;
}

/**
 * Full transcription pipeline using Gradio:
 * 1. Upload audio directly to Gradio's /upload endpoint
 * 2. Submit the server-side file path to /call/transcribe
 * 3. Poll for transcription result via SSE
 */
async function transcribeWithGradio(file: File): Promise<string> {
    // Step 1: Upload directly to Gradio server
    const gradioPath = await uploadToGradio(file);

    // Step 2: Submit to transcription API
    const eventId = await submitToGradio(gradioPath);

    // Step 3: Poll for result
    const transcription = await pollGradioResult(eventId);

    return transcription;
}

/**
 * Parse raw transcription text into segments with timestamps.
 */
function parseTranscriptionToSegments(rawText: string, durationSeconds: number): WhisperSegment[] {
    console.log('[Transcribe] Parsing transcription, length:', rawText.length, 'duration:', durationSeconds);

    const cleanedText = rawText
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const sentences = cleanedText
        .split(/[.!?]+\s+|\n+|;\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 2);

    if (sentences.length === 0) {
        const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
        const groupSize = 6;
        const groups: string[] = [];
        for (let i = 0; i < words.length; i += groupSize) {
            groups.push(words.slice(i, i + groupSize).join(' '));
        }
        if (groups.length === 0) return [];

        const segmentDuration = durationSeconds / groups.length;
        return groups.map((group, index) => ({
            id: `seg_${index}`,
            startTime: Math.round(index * segmentDuration * 1000) / 1000,
            endTime: Math.round((index + 1) * segmentDuration * 1000) / 1000,
            text: group,
        }));
    }

    const segmentDuration = durationSeconds / sentences.length;
    return sentences.map((sentence, index) => ({
        id: `seg_${index}`,
        startTime: Math.round(index * segmentDuration * 1000) / 1000,
        endTime: Math.round((index + 1) * segmentDuration * 1000) / 1000,
        text: sentence,
    }));
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
        console.log('[Transcribe] ========== STARTING TRANSCRIPTION ==========');
        console.log('[Transcribe] File:', file.name, 'type:', file.type, 'size:', file.size);
        console.log('[Transcribe] Duration:', videoDuration, 'seconds');

        let rawTranscription = '';
        let usedProvider = '';

        try {
            console.log('[Transcribe] Using Gradio transcription (upload to Gradio → transcribe → poll)...');
            rawTranscription = await transcribeWithGradio(file);
            usedProvider = 'gradio';
            console.log('[Transcribe] ✓ Gradio transcription success!');
        } catch (err) {
            console.warn('[Transcribe] Gradio failed:', err instanceof Error ? err.message : err);
            throw err;
        }

        console.log('[Transcribe] Raw text preview:', rawTranscription.substring(0, 100));

        const segments = parseTranscriptionToSegments(rawTranscription, videoDuration);
        console.log('[Transcribe] ✓ Created', segments.length, 'subtitle segments');
        console.log('[Transcribe] ========== TRANSCRIPTION COMPLETE ==========');

        return NextResponse.json({
            subtitles: segments,
            language: 'en',
            rawText: rawTranscription,
            success: true,
            provider: usedProvider,
            avgConfidence: 0.95,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Transcribe] ❌ Error:', message);

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
