import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFile, unlink, mkdir, appendFile } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Use absolute paths since conda might not be in Node.js PATH
const PYTHON_PATH = 'C:\\Users\\jatin\\miniconda3\\python.exe';

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
    avg_confidence?: number;
    filtered_count?: number;
    total_raw?: number;
}

async function logToFile(message: string) {
    const logPath = join(process.cwd(), 'tmp', 'transcribe_debug.log');
    const timestamp = new Date().toISOString();
    try {
        await appendFile(logPath, `[${timestamp}] ${message}\n`);
    } catch {
        // Ignore logging errors
    }
}

export async function POST(request: NextRequest) {
    let tempFilePath: string | null = null;
    const tempDir = join(process.cwd(), 'tmp');

    try {
        await mkdir(tempDir, { recursive: true });
        await logToFile('--- Starting new transcription request ---');

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            await logToFile('Error: No file provided');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        await logToFile(`Received file: ${file.name}, size: ${file.size} bytes`);

        // Save uploaded file to a temp location
        const ext = file.name.split('.').pop() || 'mp4';
        tempFilePath = join(tempDir, `upload_${Date.now()}.${ext}`);

        const bytes = await file.arrayBuffer();
        await writeFile(tempFilePath, Buffer.from(bytes));
        await logToFile(`Saved temp file: ${tempFilePath}`);

        // Run the Python Whisper transcription script
        const scriptPath = join(process.cwd(), 'scripts', 'transcribe.py');

        // Use absolute python path and set PATH to include ffmpeg
        const env = {
            ...process.env,
            PATH: `C:\\Users\\jatin\\miniconda3;C:\\Users\\jatin\\miniconda3\\Library\\bin;C:\\Users\\jatin\\miniconda3\\Scripts;${process.env.PATH || ''}`,
        };

        const command = `"${PYTHON_PATH}" "${scriptPath}" "${tempFilePath}" small`;
        await logToFile(`Running command: ${command}`);

        const { stdout, stderr } = await execAsync(
            command,
            {
                timeout: 300000, // 5 minute timeout
                maxBuffer: 10 * 1024 * 1024, // 10MB output buffer
                env,
            }
        );

        if (stderr) {
            await logToFile(`stderr (partial): ${stderr.substring(0, 500)}`);
        }

        await logToFile(`stdout length: ${stdout.length}`);

        // Try to parse JSON, but log raw output if it fails
        let result: WhisperResult;
        try {
            const trimmedOutput = stdout.trim();
            if (!trimmedOutput) {
                const msg = 'Empty stdout from Python script';
                await logToFile(msg);
                throw new Error(msg);
            }
            // Find the last valid JSON object if there's noise
            const lastBrace = trimmedOutput.lastIndexOf('}');
            const firstBrace = trimmedOutput.indexOf('{');
            if (lastBrace !== -1 && firstBrace !== -1) {
                const jsonStr = trimmedOutput.substring(firstBrace, lastBrace + 1);
                result = JSON.parse(jsonStr);
            } else {
                result = JSON.parse(trimmedOutput);
            }
        } catch (parseError) {
            await logToFile(`JSON Parse Error: ${parseError}`);
            await logToFile(`Raw Stdout Dump: ${stdout}`);
            return NextResponse.json({
                subtitles: [],
                fallback: true,
                error: 'Failed to parse script output. Check server logs.',
            });
        }

        if (result.error) {
            await logToFile(`Script returned error: ${result.error}`);

            // Special handling for no audio stream
            if (result.error === 'no_audio_stream') {
                return NextResponse.json({
                    subtitles: [],
                    fallback: true,
                    error: result.message || 'This video has no audio track.',
                    noAudio: true,
                });
            }

            return NextResponse.json({
                subtitles: [],
                fallback: true,
                error: result.error,
            });
        }

        const filteredCount = result.filtered_count || 0;
        const avgConfidence = result.avg_confidence || 1.0;
        await logToFile(`Success! ${result.segments.length} segments (filtered ${filteredCount} hallucinations), confidence: ${avgConfidence}, language: ${result.language}`);

        return NextResponse.json({
            subtitles: result.segments,
            language: result.language,
            avgConfidence,
            filteredCount,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await logToFile(`Execution Error Exception: ${message}`);
        // Log stack trace if available
        if (error instanceof Error && error.stack) {
            await logToFile(`Stack: ${error.stack}`);
        }

        return NextResponse.json(
            {
                subtitles: [],
                fallback: true,
                error: `Transcription execution failed: ${message}`,
            },
            { status: 200 } // Return 200 so client sees the error message in the JSON
        );
    } finally {
        // Clean up temp file
        if (tempFilePath) {
            try {
                await unlink(tempFilePath);
                await logToFile(`Cleaned up temp file: ${tempFilePath}`);
            } catch {
                await logToFile(`Failed to clean up temp file: ${tempFilePath}`);
            }
        }
    }
}
