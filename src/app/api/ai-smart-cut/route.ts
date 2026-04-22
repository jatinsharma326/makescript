import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscription, getModelForTier } from '@/lib/subscription';
import {
    SmartCutErrorCode,
    SmartCutErrorResponse,
    SmartCutFillerSegment,
    SmartCutRequest,
    SmartCutRequestSegment,
    SmartCutSuccessResponse,
    SmartCutWarning,
} from '@/lib/types';

const LIGHTNING_API_URL = process.env.LIGHTNING_API_URL || 'https://lightning.ai/api/v1/chat/completions';
const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY || '';

const MAX_SEGMENTS = 5000;
const MAX_TEXT_LENGTH = 1000;
const MAX_TOTAL_TEXT_LENGTH = 300_000;

type ValidationResult = {
    ok: true;
    subtitles: SmartCutRequestSegment[];
} | {
    ok: false;
    code: SmartCutErrorCode;
    message: string;
    status: number;
};

// Common filler words and phrases
const FILLER_PATTERNS = [
    /\b(um+|uh+|uhm+|umm+|er+|ah+)\b/gi,
    /\b(like,?\s+like|you know|i mean|basically|literally|actually|sort of|kind of)\b/gi,
    /\b(so,?\s+so|and,?\s+and|but,?\s+but)\b/gi,
];

function errorResponse(code: SmartCutErrorCode, message: string, status: number) {
    const body: SmartCutErrorResponse = {
        ok: false,
        error: { code, message },
    };

    return NextResponse.json(body, { status });
}

function validatePayload(payload: unknown): ValidationResult {
    if (!payload || typeof payload !== 'object' || !('subtitles' in payload)) {
        return {
            ok: false,
            code: 'INVALID_PAYLOAD',
            message: 'Payload must be an object with a subtitles array.',
            status: 400,
        };
    }

    const { subtitles } = payload as Partial<SmartCutRequest>;

    if (!Array.isArray(subtitles) || subtitles.length === 0) {
        return {
            ok: false,
            code: 'INVALID_PAYLOAD',
            message: 'Subtitles array is required and cannot be empty.',
            status: 400,
        };
    }

    if (subtitles.length > MAX_SEGMENTS) {
        return {
            ok: false,
            code: 'PAYLOAD_TOO_LARGE',
            message: `Too many subtitle segments. Maximum is ${MAX_SEGMENTS}.`,
            status: 413,
        };
    }

    const cleaned: SmartCutRequestSegment[] = [];
    let totalTextLength = 0;

    for (let i = 0; i < subtitles.length; i++) {
        const seg = subtitles[i] as Partial<SmartCutRequestSegment>;

        if (!seg || typeof seg !== 'object') {
            return {
                ok: false,
                code: 'INVALID_PAYLOAD',
                message: `Subtitle at index ${i} must be an object.`,
                status: 400,
            };
        }

        if (typeof seg.id !== 'string' || seg.id.trim().length === 0) {
            return {
                ok: false,
                code: 'INVALID_PAYLOAD',
                message: `Subtitle at index ${i} is missing a valid id.`,
                status: 400,
            };
        }

        if (typeof seg.startTime !== 'number' || !Number.isFinite(seg.startTime)) {
            return {
                ok: false,
                code: 'INVALID_PAYLOAD',
                message: `Subtitle ${seg.id} has an invalid startTime.`,
                status: 400,
            };
        }

        if (typeof seg.endTime !== 'number' || !Number.isFinite(seg.endTime)) {
            return {
                ok: false,
                code: 'INVALID_PAYLOAD',
                message: `Subtitle ${seg.id} has an invalid endTime.`,
                status: 400,
            };
        }

        if (seg.endTime <= seg.startTime) {
            return {
                ok: false,
                code: 'INVALID_PAYLOAD',
                message: `Subtitle ${seg.id} must have endTime greater than startTime.`,
                status: 400,
            };
        }

        if (typeof seg.text !== 'string') {
            return {
                ok: false,
                code: 'INVALID_PAYLOAD',
                message: `Subtitle ${seg.id} has invalid text.`,
                status: 400,
            };
        }

        const trimmedText = seg.text.trim();
        if (trimmedText.length > MAX_TEXT_LENGTH) {
            return {
                ok: false,
                code: 'PAYLOAD_TOO_LARGE',
                message: `Subtitle ${seg.id} text exceeds maximum length of ${MAX_TEXT_LENGTH}.`,
                status: 413,
            };
        }

        totalTextLength += trimmedText.length;

        cleaned.push({
            id: seg.id,
            startTime: seg.startTime,
            endTime: seg.endTime,
            text: seg.text,
        });
    }

    if (totalTextLength > MAX_TOTAL_TEXT_LENGTH) {
        return {
            ok: false,
            code: 'PAYLOAD_TOO_LARGE',
            message: `Total subtitle text exceeds maximum length of ${MAX_TOTAL_TEXT_LENGTH}.`,
            status: 413,
        };
    }

    return { ok: true, subtitles: cleaned };
}

export async function POST(req: NextRequest) {
    try {
        const subscription = await getUserSubscription();

        if (!subscription.isAuthenticated) {
            return errorResponse('UNAUTHORIZED', 'You must be logged in to use Smart Cut.', 401);
        }

        const payload: unknown = await req.json();
        const validation = validatePayload(payload);

        if (!validation.ok) {
            return errorResponse(validation.code, validation.message, validation.status);
        }

        const subtitles = validation.subtitles;

        const fillers = detectFillers(subtitles);
        const warnings: SmartCutWarning[] = [];
        let strategy: 'local' | 'local+ai' = 'local';

        const canUseAI = subscription.tier !== 'free';

        if (canUseAI) {
            if (LIGHTNING_API_KEY) {
                try {
                    const activeModel = getModelForTier(subscription.tier);
                    const aiFillers = await detectFillersWithAI(subtitles, activeModel);
                    strategy = 'local+ai';

                    if (aiFillers.length > 0) {
                        const seen = new Set(fillers.map((f) => f.id));
                        for (const af of aiFillers) {
                            if (!seen.has(af.id)) {
                                fillers.push(af);
                                seen.add(af.id);
                            }
                        }
                    }
                } catch (e) {
                    console.error('[AI Smart Cut] AI detection failed, using local only:', e);
                    warnings.push({
                        code: 'AI_FALLBACK_LOCAL',
                        message: 'AI augmentation is temporarily unavailable. Showing local Smart Cut results.',
                    });
                }
            } else {
                warnings.push({
                    code: 'AI_UNAVAILABLE',
                    message: 'AI augmentation is not configured. Showing local Smart Cut results.',
                });
            }
        }

        const sortedFillers = fillers.sort((a, b) => a.startTime - b.startTime);
        const totalFillerTime = sortedFillers.reduce((sum, f) => sum + (f.endTime - f.startTime), 0);

        const successBody: SmartCutSuccessResponse = {
            ok: true,
            fillers: sortedFillers,
            summary: {
                totalFillerTime: Math.round(totalFillerTime * 10) / 10,
                totalSegments: subtitles.length,
                fillerCount: sortedFillers.length,
                strategy,
                tier: subscription.tier,
            },
            ...(warnings.length > 0 ? { warnings } : {}),
        };

        return NextResponse.json(successBody);
    } catch (error) {
        console.error('[AI Smart Cut] Error:', error);
        return errorResponse('INTERNAL_ERROR', 'Unexpected Smart Cut error.', 500);
    }
}

function detectFillers(subtitles: SmartCutRequestSegment[]): SmartCutFillerSegment[] {
    const fillers: SmartCutFillerSegment[] = [];

    for (const seg of subtitles) {
        const lower = seg.text.toLowerCase().trim();

        // Check filler patterns
        for (const pattern of FILLER_PATTERNS) {
            pattern.lastIndex = 0;
            if (pattern.test(lower)) {
                // If the segment is mostly filler (>60% of words are filler)
                const words = lower.split(/\s+/);
                const fillerWords = words.filter(w =>
                    /^(um+|uh+|uhm+|umm+|er+|ah+|like|you|know|i|mean|basically|literally|actually|so|and|but)$/i.test(w)
                );
                const fillerRatio = fillerWords.length / words.length;

                if (fillerRatio > 0.5 || words.length <= 3) {
                    fillers.push({
                        id: seg.id,
                        startTime: seg.startTime,
                        endTime: seg.endTime,
                        text: seg.text,
                        type: 'filler-word',
                        confidence: Math.min(0.95, 0.5 + fillerRatio * 0.4),
                    });
                    break;
                }
            }
        }

        // Detect long pauses (segment with very short text but long duration)
        const duration = seg.endTime - seg.startTime;
        const wordCount = seg.text.split(/\s+/).length;
        if (duration > 2 && wordCount <= 2 && lower.length < 10) {
            if (!fillers.find(f => f.id === seg.id)) {
                fillers.push({
                    id: seg.id,
                    startTime: seg.startTime,
                    endTime: seg.endTime,
                    text: seg.text || '(silence)',
                    type: 'long-pause',
                    confidence: 0.7,
                });
            }
        }
    }

    return fillers;
}

async function detectFillersWithAI(subtitles: SmartCutRequestSegment[], activeModel: string): Promise<SmartCutFillerSegment[]> {
    const transcriptList = subtitles
        .map((s, i) => `[${i}] (${s.startTime.toFixed(1)}s-${s.endTime.toFixed(1)}s) "${s.text}"`)
        .join('\n');

    const prompt = `Analyze this video transcript. Identify filler segments that should be CUT to make the video tighter and more professional. Look for:
- Filler words (um, uh, like, you know, I mean, basically)
- Repetitions where the speaker re-starts a sentence
- Long meaningless pauses or throat-clearing

Transcript segments:
${transcriptList.substring(0, 4000)}

Return ONLY a JSON array of segment indices to cut:
{"cuts": [0, 3, 7]}

Only include segments that are CLEARLY filler. Do NOT cut meaningful content.`;

    const response = await fetch(LIGHTNING_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${LIGHTNING_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: activeModel,
            messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
            max_tokens: 300,
            temperature: 0.3,
        }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    const cuts: number[] = Array.isArray(parsed.cuts) ? parsed.cuts : [];

    return cuts
        .filter(i => i >= 0 && i < subtitles.length)
        .map(i => ({
            id: subtitles[i].id,
            startTime: subtitles[i].startTime,
            endTime: subtitles[i].endTime,
            text: subtitles[i].text,
            type: 'filler-word' as const,
            confidence: 0.85,
        }));
}
