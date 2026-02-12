import { NextRequest, NextResponse } from 'next/server';

// Lightning AI API
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

interface SubtitleInput {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
}

interface OverlaySuggestion {
    segmentId: string;
    type: string;
    props: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
    try {
        const { subtitles } = (await request.json()) as { subtitles: SubtitleInput[] };

        if (!subtitles || subtitles.length === 0) {
            return NextResponse.json({ suggestions: [] });
        }

        const suggestions = await suggestWithAI(subtitles);
        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Overlay suggestion error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}

async function suggestWithAI(subtitles: SubtitleInput[]): Promise<OverlaySuggestion[]> {
    const subtitleList = subtitles
        .map((s) => `[${s.id}] "${s.text}" (${s.startTime}s - ${s.endTime}s)`)
        .join('\n');

    const prompt = `You are a Senior Motion Graphics Director at a top-tier video agency. 
Analyze the transcript below and decide where to place CINEMATIC programmatic B-roll scenes.
Think like an After Effects pro: timing, pacing, visual hierarchy.

IMPORTANT: Respond ONLY in English. Output ONLY a JSON array.

CRITICAL RULES:
1. **Less is More**: Only add overlays to IMPACTFUL moments (approx 1 overlay every 10-15 seconds). Leave silent/filler moments clean.
2. **Smart Selection**:
   - "visual-illustration": For VISUAL scenes, actions, places, concepts, objects, or anything a stock video would show. Use displayMode "full" for cinematic full-screen B-roll.
     Available scenes: "solar-system" (planets, space), "growth-chart" (data, revenue, progress), "globe" (worldwide, global), "rocket-launch" (launching, taking off), "brain-idea" (thinking, ideas, creativity), "connections" (networks, social), "clock-time" (time, deadline), "heartbeat" (health, pulse, alive), "money-flow" (money, costs, investment), "lightning" (speed, power, fast), "shopping-cart" (buying, shopping, commerce), "cooking" (food, recipe, kitchen), "nature-tree" (nature, environment, growth), "city-skyline" (urban, city, business), "person-walking" (people, walking, journey), "celebration" (party, achievement, success), "music-notes" (music, sound, audio), "book-reading" (education, learning, study), "camera" (photography, video, film), "code-terminal" (programming, tech, software).
   - "emoji-reaction": For EMOTIONAL moments, reactions, humor, surprise, excitement. Use a single emoji that captures the feeling.
3. **Pacing**: Never stack overlays. Space them out.
4. **Variety**: Use different scenes and emojis. Don't repeat consecutively.

Available overlays with props:
- "visual-illustration": { scene: string, label: string, color: string, displayMode: "full"|"fit"|"overlay"|"card"|"split-top"|"split-bottom", transition: "slide-in"|"fade-in"|"appear" }
- "emoji-reaction": { emoji: string (single emoji), size: number (60-100) }

Transcript Segments:
${subtitleList}

Return strictly a JSON array of objects: { "segmentId": string, "type": string, "props": object }.
Pick whichever type best fits each segment's content. Use visual-illustration with displayMode "full" for scenes, emoji-reaction for emotions. Return [] if no graphics are needed.`;

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
            console.error('[AI Suggest] API error:', response.status, errorText);
            return [];
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) return [];

        console.log('[AI Suggest] Raw response:', content.substring(0, 300));

        // Extract JSON array from response (handle possible markdown wrapping)
        let jsonStr = content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const suggestions: OverlaySuggestion[] = JSON.parse(jsonStr);

        // Validate suggestions
        return suggestions.filter(
            (s) =>
                s.segmentId &&
                VALID_OVERLAY_TYPES.includes(s.type) &&
                subtitles.some((sub) => sub.id === s.segmentId)
        );
    } catch (error) {
        console.error('[AI Suggest] Error:', error);
        return [];
    }
}
