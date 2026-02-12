import { NextRequest, NextResponse } from 'next/server';

// Lightning AI API (same credentials as bulk suggest)
const LIGHTNING_API_URL = 'https://lightning.ai/api/v1/chat/completions';
const LIGHTNING_API_KEY = '21bfb255-eb32-4187-9a0a-fc99de7b3b33/rurobomuvevi03/deploy-model-project';

const VALID_OVERLAY_TYPES = [
    'lower-third',
    'highlight-box',
    'emoji-reaction',
    'zoom-effect',
    'scene-transition',
    'glowing-particles',
    'kinetic-text',
    'visual-illustration',
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
    const prompt = `You are a motion graphics B-roll expert. Given a transcript segment and a user instruction, return the SINGLE BEST programmatic B-roll scene to visually illustrate the content. These scenes replace stock footage with animated illustrations.

IMPORTANT: Respond ONLY in English. Output ONLY a JSON object with no extra text.

TRANSCRIPT TEXT: "${segmentText}"
USER INSTRUCTION: "${userPrompt}"

Available overlay type:
- "visual-illustration": { scene: string, label: string, color: string, displayMode: "full"|"fit"|"overlay"|"card"|"split-top"|"split-bottom", transition: "slide-in"|"fade-in"|"appear" }
  Scene options: "solar-system"|"growth-chart"|"globe"|"rocket-launch"|"brain-idea"|"connections"|"clock-time"|"heartbeat"|"money-flow"|"lightning"|"shopping-cart"|"cooking"|"nature-tree"|"city-skyline"|"person-walking"|"celebration"|"music-notes"|"book-reading"|"camera"|"code-terminal"
  Use displayMode "full" for cinematic full-screen B-roll. Use "overlay" for a smaller corner graphic.
- "emoji-reaction": { emoji: string (single emoji), size: number (60-100) }
  Use for emotional moments, reactions, humor, or when a single emoji perfectly captures the feeling.

RULES for choosing:
- If the text describes a VISUAL SCENE, action, place, or concept → use "visual-illustration" with displayMode "full" (B-roll)
- If the text expresses EMOTION, reaction, humor, surprise, or a feeling → use "emoji-reaction"
- Pick whichever fits the content best. Be smart about it.

Respond with ONLY a JSON object: { "type": string, "props": object }`;

    try {
        const response = await fetch(LIGHTNING_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${LIGHTNING_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'lightning-ai/kimi-k2.5',
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
            console.error('[Single Overlay] API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) return null;

        console.log('[Single Overlay] Raw response:', content.substring(0, 300));

        // Extract JSON object from response
        let jsonStr = content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const result = JSON.parse(jsonStr);

        // Validate
        if (result.type && VALID_OVERLAY_TYPES.includes(result.type) && result.props) {
            return { type: result.type, props: result.props };
        }

        return null;
    } catch (error) {
        console.error('[Single Overlay] Parse error:', error);
        return null;
    }
}
