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
        const { subtitles, model } = (await request.json()) as { subtitles: SubtitleInput[]; model?: string };

        if (!subtitles || subtitles.length === 0) {
            return NextResponse.json({ suggestions: [] });
        }

        const suggestions = await suggestWithAI(subtitles, model);
        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Overlay suggestion error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}

async function suggestWithAI(subtitles: SubtitleInput[], requestedModel?: string): Promise<OverlaySuggestion[]> {
    const subtitleList = subtitles
        .map((s) => `[${s.id}] "${s.text}" (${s.startTime}s - ${s.endTime}s)`)
        .join('\n');

    const prompt = `You are a Senior Motion Graphics Director. Your job: add contextual on-screen overlays that appear ON TOP of the playing video. These are NOT full-screen replacements — the video is ALWAYS visible.

AVAILABLE OVERLAY TYPES:

1. "emoji-reaction" — A pop-up emoji that matches the mood/content
   Props: { "emoji": "🔥", "size": 70 }
   Use for: emotional moments, reactions, emphasis
   Popular emojis: 🔥 ⚡ 💰 📈 🚀 🎯 💡 🧠 ❤️ 😊 🤩 😮 💪 🏆 ✅ 👑 🎉 💎 💻 🌍 📚 ⏰ 📸 🎵 ⚠️

2. "kinetic-text" — Animated text overlay showing key phrases
   Props: { "text": "Key Phrase", "color": "#hex", "style": "pop"|"slide"|"bounce", "position": "center"|"top"|"bottom", "fontSize": 42 }
   Use for: stats, important statements, key takeaways

3. "highlight-box" — Highlighted text box for emphasis
   Props: { "text": "Key Point", "color": "#hex", "style": "glow"|"underline"|"box" }
   Use for: definitions, callouts, emphasis

RULES:
1. Overlays appear ON TOP of the video — the video is ALWAYS visible
2. Pick the overlay type that BEST MATCHES the content
3. Be SELECTIVE — only add overlays to 30-40% of segments with strong keywords or key moments
4. Skip filler text ("so", "and then", "you know", "let me tell you", greetings)
5. Use VARIED overlay types — mix emojis, kinetic text, and highlight boxes
6. For kinetic-text: extract SHORT punchy labels (2-5 words) from the transcript
7. Quality over quantity

Transcript Segments:
${subtitleList}

Return strictly a JSON array:
[{
  "segmentId": string,
  "type": "emoji-reaction" | "kinetic-text" | "highlight-box",
  "props": { ... }
}]`;

    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 500;

    const fallbackModels = [
        { name: 'DeepSeek V3.1', model: 'lightning-ai/DeepSeek-V3.1' },
        { name: 'OpenAI o3', model: 'openai/o3' },
        { name: 'OpenAI o4-mini', model: 'openai/o4-mini' },
    ];

    // If a specific model was requested, try it first
    const models = requestedModel
        ? [{ name: requestedModel.split('/').pop() || requestedModel, model: requestedModel }, ...fallbackModels.filter(m => m.model !== requestedModel)]
        : fallbackModels;

    for (const modelInfo of models) {
        for (let retry = 0; retry < MAX_RETRIES; retry++) {
            try {
                if (retry > 0) {
                    console.log(`[AI Suggest] ${modelInfo.name} retry ${retry}/${MAX_RETRIES}...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                } else {
                    console.log(`[AI Suggest] Trying model: ${modelInfo.name}`);
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
                        console.warn(`[AI Suggest] ${modelInfo.name} ${isRateLimit ? 'rate limited' : 'server error'}, will retry...`);
                        continue;
                    }
                    break;
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content?.trim();

                if (!content) {
                    console.warn(`[AI Suggest] ${modelInfo.name} returned empty content`);
                    continue;
                }

                console.log(`[AI Suggest] ${modelInfo.name} response:`, content.substring(0, 300));

                let jsonStr = content;
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }

                const suggestions: OverlaySuggestion[] = JSON.parse(jsonStr);

                // Validate: ensure all have valid overlay types
                const validatedSuggestions = suggestions
                    .filter((s) => s.segmentId && VALID_OVERLAY_TYPES.includes(s.type))
                    .map((s) => {
                        const count = hashString(s.segmentId);
                        const origSeg = subtitles.find(sub => sub.id === s.segmentId);
                        // Ensure color is set
                        if (!s.props.color) s.props.color = getProColor(count);
                        // For kinetic-text, ensure text prop exists
                        if (s.type === 'kinetic-text' && !s.props.text && origSeg) {
                            s.props.text = extractLabelFromText(origSeg.text);
                        }
                        return s;
                    });

                console.log(`[AI Suggest] Success with ${modelInfo.name} - ${validatedSuggestions.length} motion graphics`);
                return validatedSuggestions;

            } catch (error) {
                console.error(`[AI Suggest] ${modelInfo.name} error:`, error);
                continue;
            }
        }

        console.warn(`[AI Suggest] ${modelInfo.name} failed, trying next model...`);
    }

    console.log('[AI Suggest] Using local motion graphic generation');
    return generateLocalMotionGraphics(subtitles);
}

// ==================== LABEL EXTRACTION ====================
const STOP_WORDS = new Set([
    'about', 'above', 'after', 'again', 'against', 'all', 'also', 'although', 'always', 'am', 'among', 'an', 'and', 'another',
    'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
    'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
    'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it',
    'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
    'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'still',
    'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
    'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

function extractLabelFromText(text: string): string {
    const numberPatterns = text.match(/\$[\d,.]+[MBKmk]?|\d+[%x×]|\d{2,}[+]?|\d+[\s-]+(to|→|->)[\s-]+\d+/g);
    if (numberPatterns && numberPatterns.length >= 2) {
        const keyWord = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w))[0];
        const prefix = keyWord ? keyWord.charAt(0).toUpperCase() + keyWord.slice(1) : 'Growth';
        return `${prefix}: ${numberPatterns[0]} → ${numberPatterns[1]}`;
    }
    const singleNumber = text.match(/(\$[\d,.]+[MBKmk]?|\d+[%x×+]|\d{3,})/);
    if (singleNumber) {
        const keyWord = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w))[0];
        const prefix = keyWord ? keyWord.charAt(0).toUpperCase() + keyWord.slice(1) : 'Impact';
        const num = singleNumber[0].endsWith('+') ? singleNumber[0] : singleNumber[0] + '+';
        return `${prefix}: ${num}`;
    }
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
    if (words.length === 0) return '';
    return words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ==================== LOCAL MOTION GRAPHIC GENERATION ====================
// Smart content analysis → picks the best animated scene for each segment

// Keyword → scene mapping for content-aware selection
const CONTENT_SCENE_MAP: Record<string, string> = {
    // Money & Business
    money: 'money-flow', revenue: 'money-flow', profit: 'money-flow', income: 'money-flow',
    dollar: 'money-flow', cash: 'money-flow', price: 'money-flow', cost: 'money-flow',
    sales: 'shopping-cart', buy: 'shopping-cart', shop: 'shopping-cart', purchase: 'shopping-cart',
    store: 'shopping-cart', product: 'shopping-cart', ecommerce: 'shopping-cart',
    business: 'growth-chart', company: 'growth-chart', startup: 'growth-chart',
    stock: 'growth-chart', invest: 'growth-chart', market: 'growth-chart',
    billion: 'growth-chart', million: 'growth-chart',
    luxury: 'diamond-gem', premium: 'diamond-gem', expensive: 'diamond-gem',
    valuable: 'diamond-gem', precious: 'diamond-gem', rich: 'diamond-gem',

    // Growth & Success
    growth: 'arrow-growth', grow: 'arrow-growth', increase: 'arrow-growth',
    rise: 'arrow-growth', scale: 'arrow-growth', expand: 'arrow-growth',
    up: 'arrow-growth', skyrocket: 'arrow-growth', boost: 'arrow-growth',
    success: 'checkmark-success', achieve: 'checkmark-success', accomplish: 'checkmark-success',
    done: 'checkmark-success', complete: 'checkmark-success', finish: 'checkmark-success',
    win: 'celebration', champion: 'celebration', winner: 'celebration',
    congratulations: 'celebration', celebrate: 'celebration', victory: 'celebration',
    goal: 'target-bullseye', target: 'target-bullseye', aim: 'target-bullseye',
    focus: 'target-bullseye', precise: 'target-bullseye', accurate: 'target-bullseye',
    best: 'crown-royal', king: 'crown-royal', queen: 'crown-royal',
    top: 'crown-royal', leader: 'crown-royal', number: 'crown-royal',

    // Technology & Science
    ai: 'brain-idea', artificial: 'brain-idea', intelligence: 'brain-idea',
    brain: 'brain-idea', think: 'brain-idea', idea: 'brain-idea',
    smart: 'brain-idea', mind: 'brain-idea', cognitive: 'brain-idea',
    learn: 'brain-idea', knowledge: 'brain-idea', understand: 'brain-idea',
    code: 'code-terminal', programming: 'code-terminal', software: 'code-terminal',
    developer: 'code-terminal', app: 'code-terminal', website: 'code-terminal',
    tech: 'code-terminal', digital: 'code-terminal', computer: 'code-terminal',
    connect: 'connections', network: 'connections', social: 'connections',
    internet: 'connections', online: 'connections', link: 'connections',
    community: 'connections', together: 'connections', collaborate: 'connections',
    science: 'atom-science', research: 'atom-science', experiment: 'atom-science',
    physics: 'atom-science', chemistry: 'atom-science', quantum: 'atom-science',
    atom: 'atom-science', molecule: 'atom-science', lab: 'atom-science',
    machine: 'gear-system', system: 'gear-system', engine: 'gear-system',
    process: 'gear-system', automate: 'gear-system', mechanism: 'gear-system',
    tool: 'gear-system', build: 'gear-system', work: 'gear-system',
    watch: 'eye-vision', see: 'eye-vision', look: 'eye-vision',
    observe: 'eye-vision', view: 'eye-vision', discover: 'eye-vision',
    reveal: 'eye-vision', vision: 'eye-vision', insight: 'eye-vision',

    // Energy & Power
    power: 'energy-pulse', energy: 'energy-pulse', force: 'energy-pulse',
    strong: 'energy-pulse', charge: 'energy-pulse', activate: 'energy-pulse',
    electric: 'lightning', shock: 'lightning', bolt: 'lightning',
    fast: 'lightning', speed: 'lightning', quick: 'lightning', instant: 'lightning',
    explode: 'explosion-burst', boom: 'explosion-burst', blast: 'explosion-burst',
    massive: 'explosion-burst', huge: 'explosion-burst', incredible: 'explosion-burst',
    impact: 'explosion-burst', disrupt: 'explosion-burst', revolutionary: 'explosion-burst',
    launch: 'rocket-launch', rocket: 'rocket-launch', fly: 'rocket-launch',
    moon: 'rocket-launch', space: 'rocket-launch', sky: 'rocket-launch',
    fire: 'fire-blaze', hot: 'fire-blaze', burn: 'fire-blaze',
    flame: 'fire-blaze', heat: 'fire-blaze', lit: 'fire-blaze',
    passion: 'fire-blaze', intense: 'fire-blaze', blazing: 'fire-blaze',
    attract: 'magnet-attract', pull: 'magnet-attract', draw: 'magnet-attract',
    magnetic: 'magnet-attract', irresistible: 'magnet-attract', grab: 'magnet-attract',

    // Nature & World
    earth: 'globe', world: 'globe', global: 'globe',
    country: 'globe', international: 'globe', planet: 'globe',
    travel: 'globe', everywhere: 'globe', worldwide: 'globe',
    tree: 'nature-tree', nature: 'nature-tree', forest: 'nature-tree',
    green: 'nature-tree', environment: 'nature-tree', organic: 'nature-tree',
    ocean: 'water-wave', water: 'water-wave', sea: 'water-wave',
    wave: 'water-wave', flow: 'water-wave', river: 'water-wave',
    swim: 'water-wave', beach: 'water-wave', calm: 'water-wave',
    mountain: 'mountain-peak', climb: 'mountain-peak', summit: 'mountain-peak',
    peak: 'mountain-peak', challenge: 'mountain-peak', overcome: 'mountain-peak',
    journey: 'mountain-peak', adventure: 'mountain-peak', effort: 'mountain-peak',
    sun: 'solar-system', star: 'solar-system', universe: 'solar-system',
    galaxy: 'solar-system', cosmic: 'solar-system', astro: 'solar-system',
    city: 'city-skyline', urban: 'city-skyline', downtown: 'city-skyline',
    building: 'city-skyline', skyline: 'city-skyline', new: 'city-skyline',

    // Emotions & Actions
    love: 'heartbeat', heart: 'heartbeat', feel: 'heartbeat',
    care: 'heartbeat', emotion: 'heartbeat', soul: 'heartbeat',
    health: 'heartbeat', life: 'heartbeat', alive: 'heartbeat',
    protect: 'shield-protect', safe: 'shield-protect', security: 'shield-protect',
    guard: 'shield-protect', defense: 'shield-protect', trust: 'shield-protect',
    guarantee: 'shield-protect', reliable: 'shield-protect', shield: 'shield-protect',
    walk: 'person-walking', step: 'person-walking', move: 'person-walking',
    run: 'person-walking', exercise: 'person-walking', fitness: 'person-walking',

    // Time & Activities
    time: 'clock-time', hour: 'clock-time', minute: 'clock-time',
    schedule: 'clock-time', deadline: 'clock-time', wait: 'clock-time',
    today: 'clock-time', tomorrow: 'clock-time', years: 'clock-time',
    music: 'music-notes', song: 'music-notes', sound: 'music-notes',
    listen: 'music-notes', audio: 'music-notes', podcast: 'music-notes',
    book: 'book-reading', read: 'book-reading', study: 'book-reading',
    education: 'book-reading', course: 'book-reading', teach: 'book-reading',
    video: 'camera', photo: 'camera', film: 'camera',
    record: 'camera', content: 'camera', create: 'camera',
    food: 'cooking', eat: 'cooking', recipe: 'cooking',
    cook: 'cooking', meal: 'cooking', kitchen: 'cooking',
};

function generateLocalMotionGraphics(subtitles: SubtitleInput[]): OverlaySuggestion[] {
    const results: OverlaySuggestion[] = [];

    for (let index = 0; index < subtitles.length; index++) {
        const seg = subtitles[index];
        // Only add overlay if the text has meaningful keywords
        if (!hasVisualKeyword(seg.text)) continue;

        const color = getProColor(index);
        const label = extractLabelFromText(seg.text);
        const emoji = pickEmojiFromText(seg.text);

        // Alternate between overlay types for variety
        let overlay: OverlaySuggestion;
        if (emoji && index % 3 !== 0) {
            overlay = {
                segmentId: seg.id,
                type: 'emoji-reaction',
                props: { emoji, size: 70 },
            };
        } else if (label && label.length > 2 && index % 4 !== 0) {
            const kineticStyles = ['pop', 'slide', 'bounce'];
            const positions = ['center', 'top', 'bottom'];
            overlay = {
                segmentId: seg.id,
                type: 'kinetic-text',
                props: {
                    text: label,
                    color,
                    style: kineticStyles[index % kineticStyles.length],
                    position: positions[index % positions.length],
                    fontSize: 42,
                },
            };
        } else {
            const highlightStyles = ['glow', 'underline', 'box'];
            overlay = {
                segmentId: seg.id,
                type: 'highlight-box',
                props: {
                    text: label || seg.text.substring(0, 30),
                    color,
                    style: highlightStyles[index % highlightStyles.length],
                },
            };
        }

        results.push(overlay);
    }

    return results;
}

function hasVisualKeyword(text: string): boolean {
    const lower = text.toLowerCase();
    // Be more lenient - check for any words that could match
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 1);
    return words.some(w => CONTENT_SCENE_MAP[w] !== undefined);
}

function pickSceneFromText(text: string, index: number, lastScene?: string): string {
    const lower = text.toLowerCase();
    const allWords = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length >= 2);

    // Score all matching scenes by counting how many keywords point to each
    const sceneScores: Record<string, number> = {};
    for (const word of allWords) {
        const scene = CONTENT_SCENE_MAP[word];
        if (scene) {
            sceneScores[scene] = (sceneScores[scene] || 0) + 1;
        }
    }

    // Sort scenes by score (highest first), filter out lastScene
    const scoredScenes = Object.entries(sceneScores)
        .filter(([scene]) => scene !== lastScene)
        .sort((a, b) => b[1] - a[1]);

    if (scoredScenes.length > 0) {
        // If there are ties at the top, use text hash to break them deterministically
        const topScore = scoredScenes[0][1];
        const topScenes = scoredScenes.filter(([, score]) => score === topScore).map(([scene]) => scene);
        if (topScenes.length === 1) {
            return topScenes[0];
        }
        // Same text always picks the same scene
        const textHash = hashString(text);
        return topScenes[textHash % topScenes.length];
    }

    // Fallback: use text hash for unique-per-content selection instead of index cycling
    const fallbackScenes = ALL_SCENES.filter(s => s !== lastScene);
    const textHash = hashString(text);
    return fallbackScenes[textHash % fallbackScenes.length];
}

function pickEmojiFromText(text: string): string | null {
    const lower = text.toLowerCase();
    const emojiMap: Record<string, string> = {
        love: '❤️', heart: '❤️', happy: '😊', joy: '😊', laugh: '😂', funny: '😂',
        excited: '🤩', amazing: '🤩', awesome: '🤩', wow: '😮', cool: '😎',
        fire: '🔥', hot: '🔥', lit: '🔥', explode: '💥', boom: '💥',
        power: '⚡', energy: '⚡', fast: '⚡', speed: '⚡', strong: '💪',
        win: '🏆', champion: '🏆', success: '✅', done: '✅', goal: '🎯', target: '🎯',
        best: '👑', king: '👑', celebrate: '🎉', party: '🎉', star: '⭐',
        money: '💰', revenue: '💰', profit: '💰', growth: '📈', grow: '📈',
        invest: '💎', valuable: '💎', brain: '🧠', think: '🧠', idea: '🧠',
        code: '💻', tech: '💻', rocket: '🚀', launch: '🚀', light: '💡',
        earth: '🌍', world: '🌍', ocean: '🌊', water: '🌊', subscribe: '🔔',
        music: '🎵', book: '📚', time: '⏰', food: '🍕', danger: '⚠️',
        question: '❓', important: '👆', secret: '🤫',
    };
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/);
    for (const word of words) {
        if (emojiMap[word]) return emojiMap[word];
    }
    return null;
}

function getProColor(count: number): string {
    const proColors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
        '#10b981', '#06b6d4', '#3b82f6', '#ef4444',
    ];
    return proColors[count % proColors.length];
}

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash);
}
