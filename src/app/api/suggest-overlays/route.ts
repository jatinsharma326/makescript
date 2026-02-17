import { NextRequest, NextResponse } from 'next/server';

// Lightning AI API — keys from environment
const LIGHTNING_API_URL = process.env.LIGHTNING_API_URL || 'https://lightning.ai/api/v1/chat/completions';
const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY || '';

const VALID_OVERLAY_TYPES = [
    'visual-illustration',
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

    const prompt = `You are a Senior Motion Graphics Director at a top-tier After Effects studio.

Your job: analyze the transcript and pick the BEST animated motion graphic scene for each segment. These are NOT text overlays - they are animated SVG illustrations (like After Effects motion graphics).

AVAILABLE ANIMATED SCENES (pick the one that best visualizes what's being said):

NATURE & SPACE:
- "solar-system" → planets orbiting sun, stars
- "globe" → spinning 3D earth with continents
- "nature-tree" → tree with swaying leaves, birds, sun
- "water-wave" → ocean waves, foam, moonlight reflection
- "mountain-peak" → mountain with flag at summit, sunrise, clouds
- "fire-blaze" → animated flames rising, ember particles, heat glow

BUSINESS & GROWTH:
- "growth-chart" → animated bar chart growing upward with trend line
- "money-flow" → golden coins flowing, dollar signs floating
- "arrow-growth" → arrows shooting upward with trails
- "target-bullseye" → target with arrow hitting center, impact ripple
- "shopping-cart" → animated cart with items dropping in
- "diamond-gem" → rotating sparkling diamond, light refraction

TECHNOLOGY & SCIENCE:
- "brain-idea" → brain with lightbulb, neural connections, sparks
- "connections" → network nodes connecting with data pulses
- "gear-system" → interlocking gears rotating, mechanical precision
- "atom-science" → atom with orbiting electrons, nucleus pulsing
- "code-terminal" → terminal with typing code, syntax highlighting
- "eye-vision" → eye opening with iris scan, pupil dilating

ENERGY & POWER:
- "lightning" → lightning bolt striking with flash, electric sparks
- "energy-pulse" → concentric energy rings pulsing, plasma core
- "explosion-burst" → central explosion, shockwave rings, debris
- "rocket-launch" → rocket launching into space with flames, smoke trail

EMOTIONS & STATUS:
- "celebration" → trophy with confetti, fireworks
- "heartbeat" → heart with EKG line, pulsing
- "checkmark-success" → animated checkmark drawing itself, burst particles
- "crown-royal" → golden crown with sparkling jewels
- "shield-protect" → shield materializing with energy pulse rings
- "magnet-attract" → magnet pulling particles, magnetic field lines

ACTIVITIES:
- "clock-time" → clock with moving hands, hour markers
- "person-walking" → stick figure walking with animation cycle
- "music-notes" → equalizer bars bouncing, floating musical notes
- "book-reading" → open book with glowing pages, knowledge particles
- "camera" → camera with flash, lens zoom, floating photos
- "cooking" → pan on stove with flames, steam, spatula stirring
- "city-skyline" → night cityscape with lit windows, moon, moving car

RULES:
1. Use ONLY "visual-illustration" type - NO text overlays
2. Pick the scene that BEST MATCHES the content being spoken
3. Be SELECTIVE - only add motion graphics to segments with strong visual keywords or key moments (roughly 30-40% of segments). Skip generic filler text like "so", "and then", "you know", "let me tell you", greetings, transitions. Only add when the text describes something visually interesting or has a clear concept.
4. Pick VARIED scenes - don't repeat the same scene consecutively
5. Match the MOOD: exciting content → explosion/lightning/energy, calm → nature/water/globe, business → growth-chart/money/arrow, science → atom/brain/connections
6. Quality over quantity - it's better to have fewer, well-matched motion graphics than one on every segment

Transcript Segments:
${subtitleList}

Return strictly a JSON array:
[{
  "segmentId": string,
  "type": "visual-illustration",
  "props": {
    "scene": string,
    "label": string,
    "color": "#hex",
    "displayMode": "full",
    "transition": "fade-in"
  }
}]

LABEL RULES:
- Generate a SHORT (3-8 word) label capturing specific details from the transcript segment
- Use concrete numbers/stats when available: "Revenue: $1M → $5M", "200+ Countries", "Team Growth: 50%"
- No numbers? Use punchy key phrases: "Global Market Launch", "Next-Gen Innovation"
- Labels make each motion graphic feel UNIQUE and LIVE — never leave label empty

Motion graphics REPLACE the video entirely (like B-roll) — always use displayMode "full".
For transition use: "fade-in", "slide-in", or "appear".`;

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

                // Validate: ensure all are visual-illustration with valid scenes
                const validatedSuggestions = suggestions
                    .filter((s) => s.segmentId && s.type === 'visual-illustration')
                    .map((s) => {
                        const count = hashString(s.segmentId);
                        // Validate scene exists
                        const scene = String(s.props?.scene || '');
                        if (!ALL_SCENES.includes(scene)) {
                            s.props.scene = pickSceneFromText('', count);
                        }
                        // Find original segment text for label fallback
                        const origSeg = subtitles.find(sub => sub.id === s.segmentId);
                        s.props = {
                            ...s.props,
                            label: s.props.label || (origSeg ? extractLabelFromText(origSeg.text) : ''),
                            color: s.props.color || getProColor(count),
                            displayMode: 'full',
                            transition: s.props.transition || 'fade-in',
                        };
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
    let lastScene = '';
    const results: OverlaySuggestion[] = [];

    for (let index = 0; index < subtitles.length; index++) {
        const seg = subtitles[index];
        // Only add motion graphic if the text has a matching keyword
        if (!hasVisualKeyword(seg.text)) continue;

        const scene = pickSceneFromText(seg.text, index, lastScene);
        lastScene = scene;
        const color = getProColor(index);

        results.push({
            segmentId: seg.id,
            type: 'visual-illustration',
            props: {
                scene,
                label: extractLabelFromText(seg.text),
                color,
                displayMode: 'full',
                transition: ['fade-in', 'slide-in', 'appear'][index % 3],
            },
        });
    }

    return results;
}

function hasVisualKeyword(text: string): boolean {
    const lower = text.toLowerCase();
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    return words.some(w => CONTENT_SCENE_MAP[w] !== undefined);
}

function pickSceneFromText(text: string, index: number, lastScene?: string): string {
    const lower = text.toLowerCase();
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);

    // Try to match keywords to scenes
    for (const word of words) {
        const scene = CONTENT_SCENE_MAP[word];
        if (scene && scene !== lastScene) {
            return scene;
        }
    }

    // Fallback: cycle through diverse scenes, avoiding repeat
    const fallbackScenes = ALL_SCENES.filter(s => s !== lastScene);
    return fallbackScenes[index % fallbackScenes.length];
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
