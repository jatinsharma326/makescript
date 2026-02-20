import { NextRequest, NextResponse } from 'next/server';

// Lightning AI API — keys from environment
const LIGHTNING_API_URL = process.env.LIGHTNING_API_URL || 'https://lightning.ai/api/v1/chat/completions';
const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY || '';

const VALID_OVERLAY_TYPES = [
    'emoji-reaction',
    'kinetic-text',
    'highlight-box',
    'lower-third',
    'glowing-particles',
    'scene-transition',
    'broll-video',
    'gif-reaction',
    'visual-illustration',
    'ai-generated-image',
    'transcript-motion',
    'dynamic-broll',
];

export async function POST(request: NextRequest) {
    try {
        const { segmentText, userPrompt } = (await request.json()) as {
            segmentText: string;
            userPrompt: string;
        };

        if (!userPrompt || !segmentText) {
            return NextResponse.json({ overlay: null });
        }

        const overlay = await suggestSingleOverlay(segmentText, userPrompt);
        return NextResponse.json({ overlay });
    } catch (error) {
        console.error('[Single Overlay] Error:', error);
        return NextResponse.json({ overlay: null });
    }
}

async function suggestSingleOverlay(
    segmentText: string,
    userPrompt: string
): Promise<{ type: string; props: Record<string, unknown> } | null> {
    const prompt = `You are a Senior Motion Graphics Director. Given a transcript segment and user instruction, pick the BEST contextual on-screen overlay.

TRANSCRIPT TEXT: "${segmentText}"
USER INSTRUCTION: "${userPrompt}"

AVAILABLE OVERLAY TYPES:

1. "ai-generated-image" — AI-generated B-roll image unique to this segment (PREFER THIS FOR VISUAL B-ROLL)
   { "type": "ai-generated-image", "props": { "imagePrompt": "vivid 15-25 word visual description", "displayMode": "picture-in-picture", "transition": "fade-in" } }
   displayMode must be "picture-in-picture", "card", or "split" (NEVER "fullscreen"). Make imagePrompt VIVID and SPECIFIC.

2. "transcript-motion" — Live word-by-word animated text synced to speech
   { "type": "transcript-motion", "props": { "text": "the transcript text", "color": "#6366f1", "style": "karaoke"|"typewriter"|"wave", "position": "center"|"top"|"bottom" } }

3. "kinetic-text" — Animated text overlay with key phrases
   { "type": "kinetic-text", "props": { "text": "Key Phrase", "color": "#hex", "style": "pop"|"slide"|"bounce", "position": "center"|"top"|"bottom", "fontSize": 42 } }

4. "highlight-box" — Text emphasis with animated highlight
   { "type": "highlight-box", "props": { "text": "Important phrase", "color": "#hex", "style": "glow"|"underline"|"box" } }

5. "emoji-reaction" — A pop-up emoji
   { "type": "emoji-reaction", "props": { "emoji": "\uD83D\uDD25", "size": 70 } }

RULES:
- PREFER ai-generated-image for visual B-roll requests
- Pick the overlay that BEST matches the user instruction
- Do NOT use visual-illustration
- For kinetic-text: extract SHORT punchy labels (2-5 words)

Respond with ONLY a JSON object.`;

    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 500;

    const models = [
        { name: 'DeepSeek V3.1', model: 'lightning-ai/DeepSeek-V3.1' },
        { name: 'OpenAI o3', model: 'openai/o3' },
        { name: 'OpenAI o4-mini', model: 'openai/o4-mini' },
    ];

    for (const modelInfo of models) {
        for (let retry = 0; retry < MAX_RETRIES; retry++) {
            try {
                if (retry > 0) {
                    console.log(`[Single Overlay] ${modelInfo.name} retry ${retry}/${MAX_RETRIES}...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                } else {
                    console.log(`[Single Overlay] Trying model: ${modelInfo.name}`);
                }

                const response = await fetch(LIGHTNING_API_URL, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${LIGHTNING_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: modelInfo.model,
                        messages: [
                            {
                                role: 'user',
                                content: [{ type: 'text', text: prompt }],
                            },
                        ],
                    }),
                });

                if (!response.ok) {
                    const isRateLimit = response.status === 429;
                    const isServerError = response.status >= 500;

                    if (isRateLimit || isServerError) {
                        console.warn(`[Single Overlay] ${modelInfo.name} ${isRateLimit ? 'rate limited' : 'server error'}, will retry...`);
                        continue;
                    }
                    break;
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content?.trim();

                if (!content) {
                    console.warn(`[Single Overlay] ${modelInfo.name} returned empty content`);
                    continue;
                }

                console.log(`[Single Overlay] ${modelInfo.name} response:`, content.substring(0, 300));

                let jsonStr = content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }

                const result = JSON.parse(jsonStr);

                if (result.type && VALID_OVERLAY_TYPES.includes(result.type) && result.props) {
                    console.log(`[Single Overlay] Success with ${modelInfo.name}`);
                    return { type: result.type, props: result.props };
                }

                console.warn(`[Single Overlay] ${modelInfo.name} returned invalid result`);
                return null;

            } catch (error) {
                console.error(`[Single Overlay] ${modelInfo.name} attempt ${retry + 1} error:`, error);
            }
        }

        console.warn(`[Single Overlay] ${modelInfo.name} failed, trying next model...`);
    }

    console.error('[Single Overlay] All models failed');
    return null;
}
