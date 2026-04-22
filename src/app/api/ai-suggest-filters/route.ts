import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscription, getModelForTier } from '@/lib/subscription';

const LIGHTNING_API_URL = process.env.LIGHTNING_API_URL || 'https://lightning.ai/api/v1/chat/completions';
const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY || '';
const LIGHTNING_MODEL = process.env.LIGHTNING_MODEL || 'anthropic/claude-sonnet-4-6';

export interface FilterPreset {
    name: string;
    emoji: string;
    description: string;
    filters: {
        brightness: number;
        contrast: number;
        saturation: number;
        blur: number;
        vignette: number;
        temperature: number;
    };
}

const PRESET_LIBRARY: FilterPreset[] = [
    { name: 'Cinematic Dark', emoji: '🎬', description: 'Moody, dramatic feel', filters: { brightness: 90, contrast: 130, saturation: 80, blur: 0, vignette: 40, temperature: -10 } },
    { name: 'Warm & Cozy', emoji: '🌅', description: 'Golden hour warmth', filters: { brightness: 105, contrast: 105, saturation: 120, blur: 0, vignette: 20, temperature: 25 } },
    { name: 'Cool Professional', emoji: '💼', description: 'Clean corporate look', filters: { brightness: 105, contrast: 110, saturation: 85, blur: 0, vignette: 10, temperature: -15 } },
    { name: 'High Energy', emoji: '⚡', description: 'Punchy and vibrant', filters: { brightness: 110, contrast: 140, saturation: 140, blur: 0, vignette: 30, temperature: 10 } },
    { name: 'Vintage Film', emoji: '📽️', description: 'Retro film grain look', filters: { brightness: 95, contrast: 115, saturation: 70, blur: 0.5, vignette: 50, temperature: 15 } },
    { name: 'Nature Fresh', emoji: '🌿', description: 'Clean and natural', filters: { brightness: 108, contrast: 105, saturation: 115, blur: 0, vignette: 15, temperature: 5 } },
    { name: 'Night Mode', emoji: '🌙', description: 'Dark and mysterious', filters: { brightness: 80, contrast: 120, saturation: 90, blur: 0, vignette: 60, temperature: -20 } },
    { name: 'Pop & Color', emoji: '🎨', description: 'Bold, saturated colors', filters: { brightness: 105, contrast: 120, saturation: 160, blur: 0, vignette: 10, temperature: 5 } },
    { name: 'Soft & Dreamy', emoji: '☁️', description: 'Ethereal soft look', filters: { brightness: 115, contrast: 90, saturation: 90, blur: 1, vignette: 25, temperature: 10 } },
    { name: 'Documentary', emoji: '📹', description: 'Neutral, true-to-life', filters: { brightness: 100, contrast: 110, saturation: 95, blur: 0, vignette: 20, temperature: 0 } },
];

export async function POST(req: NextRequest) {
    try {
        const { transcript } = await req.json();

        if (!transcript || typeof transcript !== 'string') {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        const sub = await getUserSubscription();
        const activeModel = getModelForTier(sub.tier);

        if (!LIGHTNING_API_KEY) {
            return NextResponse.json({ presets: pickPresetsLocally(transcript) });
        }

        const prompt = `Analyze this video transcript and determine the mood/tone. Then pick the 3 BEST color grading styles from this list that match the content:

Styles: ${PRESET_LIBRARY.map(p => p.name).join(', ')}

Transcript:
"""
${transcript.substring(0, 2000)}
"""

Respond ONLY with valid JSON:
{
  "mood": "one word mood like energetic/calm/professional/dramatic",
  "picks": ["Style Name 1", "Style Name 2", "Style Name 3"],
  "reason": "brief explanation why these styles match"
}`;

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
                temperature: 0.6,
            }),
        });

        if (!response.ok) {
            return NextResponse.json({ presets: pickPresetsLocally(transcript) });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const pickedNames: string[] = parsed.picks || [];
            const matched = pickedNames
                .map(name => PRESET_LIBRARY.find(p => p.name.toLowerCase() === name.toLowerCase()))
                .filter((p): p is FilterPreset => p !== undefined);

            if (matched.length > 0) {
                return NextResponse.json({
                    mood: parsed.mood || 'neutral',
                    reason: parsed.reason || '',
                    presets: matched,
                });
            }
        }

        return NextResponse.json({ presets: pickPresetsLocally(transcript) });
    } catch (error) {
        console.error('[AI Filters] Error:', error);
        return NextResponse.json({ presets: pickPresetsLocally('') });
    }
}

function pickPresetsLocally(transcript: string): FilterPreset[] {
    const lower = transcript.toLowerCase();
    // Simple keyword matching
    if (/money|business|profit|revenue|market|invest/i.test(lower)) {
        return [PRESET_LIBRARY[2], PRESET_LIBRARY[9], PRESET_LIBRARY[0]]; // Professional, Documentary, Cinematic
    }
    if (/energy|hype|fire|explode|amazing|incredible|power/i.test(lower)) {
        return [PRESET_LIBRARY[3], PRESET_LIBRARY[7], PRESET_LIBRARY[0]]; // High Energy, Pop, Cinematic
    }
    if (/nature|calm|peace|relax|beauty|ocean|mountain/i.test(lower)) {
        return [PRESET_LIBRARY[5], PRESET_LIBRARY[8], PRESET_LIBRARY[1]]; // Nature, Dreamy, Warm
    }
    // Default: Cinematic, Documentary, Warm
    return [PRESET_LIBRARY[0], PRESET_LIBRARY[9], PRESET_LIBRARY[1]];
}
