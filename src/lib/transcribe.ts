// Transcription service — extracts audio from video in-browser, calls Gradio directly

import { SubtitleSegment } from './types';

const GRADIO_BASE_URL = 'https://ai-modelscope-cohere-transcribe-03-2026-demo.ms.show/gradio_api';

/**
 * Extract audio from a video File using captureStream() + MediaRecorder.
 * Returns an audio/webm Blob.
 */
export async function extractAudioFromVideo(videoFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const videoUrl = URL.createObjectURL(videoFile);
        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        video.playsInline = true;
        video.muted = true;
        video.preload = 'auto';

        let recorder: MediaRecorder | null = null;
        const chunks: Blob[] = [];
        let started = false;

        const cleanup = () => {
            URL.revokeObjectURL(videoUrl);
            try { video.pause(); } catch { /* ignore */ }
            try { video.removeAttribute('src'); } catch { /* ignore */ }
            if (recorder && recorder.state !== 'inactive') {
                try { recorder.stop(); } catch { /* ignore */ }
            }
        };

        const onError = (err: Error | Event) => {
            cleanup();
            const msg = err instanceof Error ? err.message : 'Audio extraction failed';
            reject(new Error(msg));
        };

        video.addEventListener('error', () => onError(new Error('Failed to load video')));

        video.addEventListener('loadedmetadata', () => {
            if (started) return;
            started = true;

            try {
                const stream = (video as any).captureStream?.() || (video as any).mozCaptureStream?.();
                if (!stream) {
                    throw new Error('captureStream() not supported');
                }

                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length === 0) {
                    cleanup();
                    resolve(new Blob([], { type: 'audio/webm' }));
                    return;
                }

                const audioOnlyStream = new MediaStream(audioTracks);
                const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : MediaRecorder.isTypeSupported('audio/webm')
                        ? 'audio/webm'
                        : 'audio/ogg';

                recorder = new MediaRecorder(audioOnlyStream, { mimeType });

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) chunks.push(e.data);
                };

                recorder.onstop = () => {
                    const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                    console.log('[extractAudio] Captured:', audioBlob.size, 'bytes');
                    cleanup();
                    resolve(audioBlob);
                };

                recorder.onerror = () => onError(new Error('MediaRecorder error'));
                recorder.start(1000);
                video.play().catch(onError);
            } catch (e) {
                onError(e instanceof Error ? e : new Error(String(e)));
            }
        });

        video.addEventListener('ended', () => {
            if (recorder && recorder.state !== 'inactive') {
                recorder.stop();
            } else {
                cleanup();
                resolve(new Blob([], { type: 'audio/webm' }));
            }
        });

        const safetyTimeout = Math.min((videoFile.size > 0 ? 300000 : 30000), 300000);
        setTimeout(() => {
            if (recorder?.state === 'recording') {
                recorder.stop();
            } else {
                cleanup();
                reject(new Error('Audio extraction timed out'));
            }
        }, safetyTimeout);
    });
}

/**
 * Convert a webm/ogg audio Blob to WAV format using Web Audio API.
 * This is needed because the Gradio transcription service doesn't support webm.
 */
async function convertBlobToWav(audioBlob: Blob): Promise<Blob> {
    console.log('[convertToWav] Converting', audioBlob.type, 'to WAV, size:', audioBlob.size);

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
        // Decode the audio data
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        console.log('[convertToWav] Decoded audio:', {
            channels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
            duration: audioBuffer.duration,
            length: audioBuffer.length,
        });

        // Encode as WAV
        const wavBlob = encodeWav(audioBuffer);
        console.log('[convertToWav] ✓ WAV encoded, size:', wavBlob.size);
        return wavBlob;
    } finally {
        await audioContext.close();
    }
}

/**
 * Encode an AudioBuffer as a WAV Blob (PCM 16-bit).
 */
function encodeWav(audioBuffer: AudioBuffer): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    // Interleave channels
    let interleaved: Float32Array;
    if (numChannels === 1) {
        interleaved = audioBuffer.getChannelData(0);
    } else {
        // Mix down to mono for smaller file and better compatibility
        const left = audioBuffer.getChannelData(0);
        const right = numChannels > 1 ? audioBuffer.getChannelData(1) : left;
        interleaved = new Float32Array(left.length);
        for (let i = 0; i < left.length; i++) {
            interleaved[i] = (left[i] + right[i]) / 2;
        }
    }

    const dataLength = interleaved.length * (bitDepth / 8);
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 1 * (bitDepth / 8), true); // byte rate
    view.setUint16(32, 1 * (bitDepth / 8), true); // block align
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
        const sample = Math.max(-1, Math.min(1, interleaved[i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

/**
 * Fetch with timeout helper for client-side
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 300000
): Promise<Response> {
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

async function uploadToGradio(wavBlob: Blob): Promise<string> {
    console.log('[Gradio] Uploading audio, size:', wavBlob.size);
    const formData = new FormData();
    formData.append('files', new File([wavBlob], 'audio.wav', { type: 'audio/wav' }));

    const response = await fetchWithTimeout(`${GRADIO_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
    }, 120000);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gradio upload failed (HTTP ${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const filePath = Array.isArray(data) ? data[0] : typeof data === 'string' ? data : null;
    if (!filePath) throw new Error('Gradio upload returned unexpected format: ' + JSON.stringify(data));

    console.log('[Gradio] Uploaded, path:', filePath);
    return filePath;
}

async function submitToGradio(filePath: string): Promise<string> {
    console.log('[Gradio] Submitting to /call/transcribe...');
    const response = await fetchWithTimeout(`${GRADIO_BASE_URL}/call/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: [{ path: filePath, meta: { _type: 'gradio.FileData' } }, 'en'],
        }),
    }, 30000);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gradio submit failed (HTTP ${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    if (!data?.event_id) throw new Error('Gradio submit: no event_id — ' + JSON.stringify(data));

    console.log('[Gradio] event_id:', data.event_id);
    return data.event_id;
}

async function pollGradioResult(eventId: string): Promise<string> {
    console.log('[Gradio] Polling for result, event_id:', eventId);
    const response = await fetchWithTimeout(
        `${GRADIO_BASE_URL}/call/transcribe/${eventId}`,
        {},
        300000,
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gradio poll failed (HTTP ${response.status}): ${errorText.substring(0, 200)}`);
    }

    const rawText = await response.text();
    const lines = rawText.split('\n');
    let transcription = '';
    let hasError = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === 'event: error') hasError = true;
        if (line.startsWith('data:')) {
            const jsonStr = line.replace('data:', '').trim();
            if (!jsonStr || jsonStr === 'null') continue;
            try {
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                    transcription = parsed[0];
                }
            } catch { /* not valid JSON, skip */ }
        }
    }

    if (!transcription) {
        if (hasError) throw new Error('Gradio transcription error — audio may be unsupported or too large.');
        throw new Error('Could not parse transcription from Gradio response');
    }

    console.log('[Gradio] Transcription received, length:', transcription.length);
    return transcription;
}

function parseTranscriptionToSegments(rawText: string, durationSeconds: number): SubtitleSegment[] {
    const cleanedText = rawText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
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
        const segDur = durationSeconds / groups.length;
        return groups.map((group, i) => ({
            id: `seg_${i}`,
            startTime: Math.round(i * segDur * 1000) / 1000,
            endTime: Math.round((i + 1) * segDur * 1000) / 1000,
            text: group,
        }));
    }

    const segDur = durationSeconds / sentences.length;
    return sentences.map((sentence, i) => ({
        id: `seg_${i}`,
        startTime: Math.round(i * segDur * 1000) / 1000,
        endTime: Math.round((i + 1) * segDur * 1000) / 1000,
        text: sentence,
    }));
}

/**
 * Transcribe a video file.
 * 1. Extract audio from video in-browser
 * 2. Convert audio from webm to WAV
 * 3. Upload WAV directly to Gradio and poll for transcription (bypasses Vercel timeout)
 */
export async function transcribeVideo(
    file: File,
    duration: number
): Promise<{ subtitles: SubtitleSegment[]; isReal: boolean; noAudio?: boolean; lowConfidence?: boolean }> {
    try {
        console.log('[transcribeVideo] Extracting audio from video...');
        const audioBlob = await extractAudioFromVideo(file);

        if (audioBlob.size === 0) {
            console.warn('[transcribeVideo] No audio track detected.');
            return { subtitles: [], isReal: false, noAudio: true };
        }

        console.log('[transcribeVideo] Audio extracted, size:', audioBlob.size);
        console.log('[transcribeVideo] Converting audio to WAV format...');
        const wavBlob = await convertBlobToWav(audioBlob);
        console.log('[transcribeVideo] WAV audio ready, size:', wavBlob.size);

        const gradioPath = await uploadToGradio(wavBlob);
        const eventId = await submitToGradio(gradioPath);
        const rawTranscription = await pollGradioResult(eventId);

        const segments = parseTranscriptionToSegments(rawTranscription, duration);
        if (segments.length > 0) {
            console.log('[transcribeVideo] Success! Segments:', segments.length);
            return { subtitles: segments, isReal: true, lowConfidence: false };
        }

        console.warn('[transcribeVideo] No segments parsed from transcription');
        return { subtitles: [], isReal: false };
    } catch (error) {
        console.error('[transcribeVideo] Failed:', error);
        return { subtitles: [], isReal: false };
    }
}

/**
 * Generate mock transcript from video duration.
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
