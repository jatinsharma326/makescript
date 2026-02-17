import { NextRequest, NextResponse } from 'next/server';

// Lightning AI API — keys from environment
const LIGHTNING_API_URL = process.env.LIGHTNING_API_URL || 'https://lightning.ai/api/v1/chat/completions';
const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY || '';

const VALID_OVERLAY_TYPES = [
    'visual-illustration',
    'glowing-particles',
    'scene-transition',
    'emoji-reaction',
];

// All available animated motion graphic scenes
const ALL_SCENES = [
    'solar-system', 'growth-chart', 'globe', 'rocket-launch', 'brain-idea',
    'connections', 'clock-time', 'heartbeat', 'money-flow', 'lightning',
    'shopping-cart', 'cooking', 'nature-tree', 'city-skyline', 'person-walking',
    'celebration', 'music-notes', 'book-reading', 'camera', 'code-terminal',
    'fire-blaze', 'water-wave', 'shield-protect', 'target-bullseye',
    'explosion-burst', 'magnet-attract', 'gear-system', 'energy-pulse',
    'eye-vision', 'arrow-growth', 'checkmark-success', 'diamond-gem',
    'crown-royal', 'atom-science', 'mountain-peak',
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
    const prompt = `You are a Senior Motion Graphics Director. Given a transcript segment and user instruction, pick the BEST animated motion graphic scene to visualize the content.

These are ANIMATED SVG MOTION GRAPHICS (like After Effects), NOT text overlays or images.

TRANSCRIPT TEXT: "${segmentText}"
USER INSTRUCTION: "${userPrompt}"

AVAILABLE ANIMATED SCENES:
NATURE: "solar-system" | "globe" | "nature-tree" | "water-wave" | "mountain-peak" | "fire-blaze"
BUSINESS: "growth-chart" | "money-flow" | "arrow-growth" | "target-bullseye" | "shopping-cart" | "diamond-gem"
TECH: "brain-idea" | "connections" | "gear-system" | "atom-science" | "code-terminal" | "eye-vision"
ENERGY: "lightning" | "energy-pulse" | "explosion-burst" | "rocket-launch" | "magnet-attract"
STATUS: "celebration" | "heartbeat" | "checkmark-success" | "crown-royal" | "shield-protect"
ACTIVITIES: "clock-time" | "person-walking" | "music-notes" | "book-reading" | "camera" | "cooking" | "city-skyline"

RULES:
- PRIMARY: Use "visual-illustration" with the scene that best matches the content
- If user asks for particles/atmosphere → use "glowing-particles" with style "ambient"|"burst"|"rain"
- If user asks for emoji/reaction → use "emoji-reaction" with emoji and size
- ALWAYS prefer visual-illustration for most requests

For visual-illustration respond with:
{ "type": "visual-illustration", "props": { "scene": string, "label": string, "color": "#hex", "displayMode": "overlay"|"fit"|"full"|"card"|"split-top"|"split-bottom", "transition": "fade-in"|"slide-in"|"appear" } }

LABEL: Generate a SHORT (3-8 word) label with specific details from the transcript. Use numbers/stats when available. Never leave empty.

For glowing-particles:
{ "type": "glowing-particles", "props": { "style": "ambient"|"burst"|"rain", "color": "#hex", "count": number } }

For emoji-reaction:
{ "type": "emoji-reaction", "props": { "emoji": string, "size": number } }

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
                    const errorText = await response.text();
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
                    // Validate scene if visual-illustration
                    if (result.type === 'visual-illustration') {
                        const scene = String(result.props.scene || '');
                        if (!ALL_SCENES.includes(scene)) {
                            result.props.scene = 'brain-idea'; // safe fallback
                        }
                    }
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
