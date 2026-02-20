import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir, appendFile, stat } from 'fs/promises';
import { join } from 'path';

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

/**
 * Run the Python transcription script using spawn instead of exec.
 * spawn handles stdout/stderr as streams and doesn't throw on stderr output,
 * which is critical because Whisper always writes progress/warnings to stderr.
 */
function runTranscription(scriptPath: string, filePath: string, env: NodeJS.ProcessEnv): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    return new Promise((resolve, reject) => {
        const proc = spawn(PYTHON_PATH, [scriptPath, filePath, 'base'], {
            env,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';
        let killed = false;

        // 10 minute timeout for long videos on CPU
        const timer = setTimeout(() => {
            killed = true;
            proc.kill('SIGTERM');
        }, 600000);

        proc.stdout!.on('data', (chunk: Buffer) => {
            stdout += chunk.toString('utf-8');
        });

        proc.stderr!.on('data', (chunk: Buffer) => {
            stderr += chunk.toString('utf-8');
        });

        proc.on('close', (code: number | null) => {
            clearTimeout(timer);
            if (killed) {
                reject(new Error('Transcription timed out after 10 minutes'));
                return;
            }
            // Always resolve — we'll handle errors ourselves by inspecting stdout
            resolve({ stdout, stderr, exitCode: code });
        });

        proc.on('error', (err: Error) => {
            clearTimeout(timer);
            reject(err);
        });
    });
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
        const buffer = Buffer.from(bytes);
        await writeFile(tempFilePath, buffer);
        // Verify file was written completely
        const fileStats = await stat(tempFilePath);
        await logToFile(`Saved temp file: ${tempFilePath} (uploaded: ${file.size} bytes, written: ${fileStats.size} bytes)`);

        // Run the Python Whisper transcription script
        const scriptPath = join(process.cwd(), 'scripts', 'transcribe.py');

        // Use absolute python path and set PATH to include ffmpeg
        const env = {
            ...process.env,
            PATH: `C:\\Users\\jatin\\miniconda3;C:\\Users\\jatin\\miniconda3\\Library\\bin;C:\\Users\\jatin\\miniconda3\\Scripts;${process.env.PATH || ''}`,
        };

        await logToFile(`Running transcription with spawn: python "${scriptPath}" "${tempFilePath}" base`);

        const { stdout, stderr, exitCode } = await runTranscription(scriptPath, tempFilePath, env);

        if (stderr) {
            await logToFile(`stderr (partial): ${stderr.substring(0, 500)}`);
        }

        await logToFile(`stdout length: ${stdout.length}, exit code: ${exitCode}`);

        // Try to parse JSON from stdout regardless of exit code
        // Whisper always writes to stderr (FP16 warnings, progress bars), and
        // sometimes exits non-zero even when it produces valid JSON output
        let result: WhisperResult;
        try {
            const trimmedOutput = stdout.trim();
            if (!trimmedOutput) {
                const msg = `Empty stdout from Python script (exit code: ${exitCode})`;
                await logToFile(msg);
                // If stderr has useful info, include it
                if (stderr) {
                    await logToFile(`stderr with empty stdout: ${stderr.substring(0, 1000)}`);
                }
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
                error: `Failed to parse script output (exit code: ${exitCode}). Check server logs.`,
            });
        }

        if (result.error) {
            await logToFile(`Script returned error: ${result.error}`);

            // Detect no-audio errors (both from pre-check and from ffmpeg/whisper)
            const isNoAudio = result.error === 'no_audio_stream'
                || result.error.includes('does not contain any stream')
                || result.error.includes('no audio')
                || result.error.includes('Output file does not contain');

            if (isNoAudio) {
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
        const totalRaw = result.total_raw || 0;
        // Log audio coverage: last segment's endTime tells us how far Whisper got
        const lastEnd = result.segments.length > 0 ? result.segments[result.segments.length - 1].endTime : 0;
        await logToFile(`Success! ${result.segments.length} segments (raw: ${totalRaw}, filtered: ${filteredCount}), confidence: ${avgConfidence}, audio covered: ${lastEnd}s, language: ${result.language}`);

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

        // Log more details about common issues
        if (message.includes('ENOENT') || message.includes('not found')) {
            await logToFile('LIKELY ISSUE: Python or script not found. Check PYTHON_PATH and scriptPath.');
        }
        if (message.includes('timeout')) {
            await logToFile('LIKELY ISSUE: Transcription timed out. Video may be too long or Whisper is slow.');
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
