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

// Detect overall video topic from full transcript for context-aware matching
const TOPIC_KEYWORDS: Record<string, string[]> = {
    'GAMING/ENTERTAINMENT': ['game', 'play', 'player', 'nintendo', 'pokemon', 'xbox', 'playstation', 'level', 'boss', 'quest', 'character', 'multiplayer', 'console', 'controller', 'gamer', 'stream', 'twitch', 'esport', 'mod', 'cheat', 'glitch', 'speedrun', 'lore', 'dex', 'generation'],
    'TECHNOLOGY/CODING': ['code', 'programming', 'software', 'hardware', 'api', 'database', 'server', 'cloud', 'algorithm', 'debug', 'deploy', 'framework', 'react', 'python', 'javascript', 'developer', 'startup', 'saas'],
    'FINANCE/BUSINESS': ['money', 'invest', 'stock', 'crypto', 'bitcoin', 'revenue', 'profit', 'startup', 'entrepreneur', 'business', 'income', 'passive', 'wealth', 'trading', 'market', 'portfolio'],
    'FITNESS/HEALTH': ['workout', 'exercise', 'gym', 'muscle', 'protein', 'diet', 'weight', 'calories', 'cardio', 'training', 'fitness', 'health', 'nutrition', 'supplement'],
    'BEAUTY/FASHION': ['makeup', 'skincare', 'fashion', 'outfit', 'style', 'beauty', 'hair', 'nails', 'cosmetic', 'foundation', 'lipstick', 'concealer', 'moisturizer'],
    'EDUCATION/SCIENCE': ['research', 'study', 'university', 'science', 'experiment', 'theory', 'hypothesis', 'professor', 'lecture', 'course', 'exam', 'school', 'physics', 'chemistry', 'biology'],
    'COOKING/FOOD': ['recipe', 'cook', 'ingredient', 'kitchen', 'bake', 'meal', 'restaurant', 'chef', 'food', 'dish', 'flavor', 'taste', 'seasoning'],
    'MUSIC/ARTS': ['song', 'music', 'album', 'artist', 'concert', 'guitar', 'piano', 'drums', 'beat', 'melody', 'lyrics', 'studio', 'producer', 'remix'],
    'TRAVEL/ADVENTURE': ['travel', 'trip', 'destination', 'flight', 'hotel', 'tourist', 'country', 'city', 'backpack', 'explore', 'vacation', 'passport'],
    'NEWS/DRAMA/STORY': ['breaking', 'revealed', 'secret', 'hidden', 'forbidden', 'conspiracy', 'mystery', 'shocking', 'scandal', 'exposed', 'truth', 'controversy', 'leaked'],
};

function detectVideoTopic(fullText: string): string {
    const lower = fullText.toLowerCase();
    const topicScores: Record<string, { count: number; matches: string[] }> = {};

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        const matches: string[] = [];
        for (const kw of keywords) {
            if (lower.includes(kw)) {
                matches.push(kw);
            }
        }
        if (matches.length > 0) {
            topicScores[topic] = { count: matches.length, matches };
        }
    }

    const sorted = Object.entries(topicScores).sort((a, b) => b[1].count - a[1].count);
    if (sorted.length === 0) {
        return 'General/conversational video. Match scenes to the MEANING of each segment.';
    }

    const topTopics = sorted.slice(0, 2).map(([topic, { matches }]) =>
        `${topic} (mentions: ${matches.slice(0, 5).join(', ')})`
    );
    return `This video is about ${topTopics.join(' and ')}. Choose scenes that make sense for this topic.`;
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

    // Detect video topic from FULL transcript for context-aware scene matching
    const fullTranscript = subtitles.map(s => s.text).join(' ').toLowerCase();
    const videoTopic = detectVideoTopic(fullTranscript);

    const prompt = `You are a Senior Motion Graphics Director. Add animated overlays to this video based on the transcript.

VIDEO TOPIC CONTEXT: ${videoTopic}

AVAILABLE OVERLAY TYPES:

1. "dynamic-broll" — Procedurally generated motion graphics B-roll, fullscreen (USE THIS 40% of the time)
   Props: { "keywords": "KEYWORD1,KEYWORD2", "color": "#hex", "style": "abstract"|"geometric"|"wave"|"particles"|"data" }
   Extract 1-2 of the MOST IMPORTANT words from the segment.
   Example: "trading in the market" → keywords: "TRADING,MARKET"
   Example: "go to your settings" → keywords: "SETTINGS"
   Example: "you need power to make it work" → keywords: "POWER"

2. "kinetic-text" (25%) Props: { "text": "Phrase", "color": "#hex", "style": "pop"|"slide"|"bounce", "position": "center"|"top"|"bottom", "fontSize": 42 }
3. "transcript-motion" (20%) Props: { "text": "text", "color": "#hex", "style": "karaoke"|"typewriter"|"wave", "position": "center"|"top"|"bottom" }
4. "emoji-reaction" (10%) Props: { "emoji": "🔥", "size": 70 }
5. "highlight-box" (5%) Props: { "text": "phrase", "color": "#hex", "style": "glow"|"underline"|"box" }

RULES:
1. Keywords must be 1-2 STRONG words from the segment (nouns/verbs)
2. Only overlay 45-55% of segments
3. Vary types

Transcript Segments:
${subtitleList}

Return JSON array:
[{ "segmentId": string, "type": "dynamic-broll"|"kinetic-text"|"transcript-motion"|"emoji-reaction"|"highlight-box", "props": { ... } }]`;

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
    earn: 'money-flow', pay: 'money-flow', afford: 'money-flow', salary: 'money-flow',
    sales: 'shopping-cart', buy: 'shopping-cart', shop: 'shopping-cart', purchase: 'shopping-cart',
    store: 'shopping-cart', product: 'shopping-cart', ecommerce: 'shopping-cart', order: 'shopping-cart', deal: 'shopping-cart',
    business: 'growth-chart', company: 'growth-chart', startup: 'growth-chart',
    stock: 'growth-chart', invest: 'growth-chart', market: 'growth-chart',
    billion: 'growth-chart', million: 'growth-chart',
    luxury: 'diamond-gem', premium: 'diamond-gem', expensive: 'diamond-gem',
    valuable: 'diamond-gem', precious: 'diamond-gem', rich: 'diamond-gem',

    // Growth & Success
    growth: 'arrow-growth', grow: 'arrow-growth', increase: 'arrow-growth',
    rise: 'arrow-growth', scale: 'arrow-growth', expand: 'arrow-growth',
    up: 'arrow-growth', skyrocket: 'arrow-growth', boost: 'arrow-growth', level: 'arrow-growth',
    success: 'checkmark-success', achieve: 'checkmark-success', accomplish: 'checkmark-success',
    done: 'checkmark-success', complete: 'checkmark-success', finish: 'checkmark-success',
    results: 'checkmark-success', progress: 'checkmark-success', improve: 'checkmark-success',
    win: 'celebration', champion: 'celebration', winner: 'celebration',
    congratulations: 'celebration', celebrate: 'celebration', victory: 'celebration',
    party: 'celebration', awesome: 'celebration', amazing: 'celebration', excited: 'celebration',
    goal: 'target-bullseye', target: 'target-bullseye', aim: 'target-bullseye',
    focus: 'target-bullseye', precise: 'target-bullseye', accurate: 'target-bullseye',
    strategy: 'target-bullseye', plan: 'target-bullseye',
    best: 'crown-royal', king: 'crown-royal', queen: 'crown-royal',
    top: 'crown-royal', leader: 'crown-royal', number: 'crown-royal', greatest: 'crown-royal',

    // Technology & Science
    ai: 'brain-idea', artificial: 'brain-idea', intelligence: 'brain-idea',
    brain: 'brain-idea', think: 'brain-idea', idea: 'brain-idea',
    smart: 'brain-idea', mind: 'brain-idea', cognitive: 'brain-idea',
    learn: 'brain-idea', knowledge: 'brain-idea', understand: 'brain-idea', realize: 'brain-idea',
    secret: 'brain-idea', tip: 'brain-idea', trick: 'brain-idea', hack: 'brain-idea',
    code: 'code-terminal', programming: 'code-terminal', software: 'code-terminal',
    developer: 'code-terminal', app: 'code-terminal', website: 'code-terminal',
    tech: 'code-terminal', digital: 'code-terminal', computer: 'code-terminal',
    connect: 'connections', network: 'connections', social: 'connections',
    internet: 'connections', online: 'connections', link: 'connections',
    community: 'connections', together: 'connections', collaborate: 'connections', share: 'connections',
    people: 'connections', friends: 'connections', relationship: 'connections',
    science: 'atom-science', research: 'atom-science', experiment: 'atom-science',
    physics: 'atom-science', chemistry: 'atom-science', quantum: 'atom-science',
    atom: 'atom-science', molecule: 'atom-science', lab: 'atom-science',
    machine: 'gear-system', system: 'gear-system', engine: 'gear-system',
    process: 'gear-system', automate: 'gear-system', mechanism: 'gear-system',
    tool: 'gear-system', build: 'gear-system', work: 'gear-system', method: 'gear-system',
    watch: 'eye-vision', see: 'eye-vision', look: 'eye-vision',
    observe: 'eye-vision', view: 'eye-vision', discover: 'eye-vision',
    reveal: 'eye-vision', vision: 'eye-vision', insight: 'eye-vision',
    show: 'eye-vision', check: 'eye-vision', notice: 'eye-vision',

    // Energy & Power
    power: 'energy-pulse', energy: 'energy-pulse', force: 'energy-pulse',
    strong: 'energy-pulse', charge: 'energy-pulse', activate: 'energy-pulse',
    electric: 'lightning', shock: 'lightning', bolt: 'lightning',
    fast: 'lightning', speed: 'lightning', quick: 'lightning', instant: 'lightning',
    explode: 'explosion-burst', boom: 'explosion-burst', blast: 'explosion-burst',
    massive: 'explosion-burst', huge: 'explosion-burst', incredible: 'explosion-burst',
    impact: 'explosion-burst', disrupt: 'explosion-burst', revolutionary: 'explosion-burst',
    crazy: 'explosion-burst', insane: 'explosion-burst', unbelievable: 'explosion-burst',
    launch: 'rocket-launch', rocket: 'rocket-launch', fly: 'rocket-launch',
    moon: 'rocket-launch', space: 'rocket-launch', sky: 'rocket-launch',
    start: 'rocket-launch', begin: 'rocket-launch', kick: 'rocket-launch',
    fire: 'fire-blaze', hot: 'fire-blaze', burn: 'fire-blaze',
    flame: 'fire-blaze', heat: 'fire-blaze', lit: 'fire-blaze',
    passion: 'fire-blaze', intense: 'fire-blaze', blazing: 'fire-blaze', trending: 'fire-blaze',
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
    swim: 'water-wave', beach: 'water-wave', calm: 'water-wave', smooth: 'water-wave',
    mountain: 'mountain-peak', climb: 'mountain-peak', summit: 'mountain-peak',
    peak: 'mountain-peak', challenge: 'mountain-peak', overcome: 'mountain-peak',
    journey: 'mountain-peak', adventure: 'mountain-peak', effort: 'mountain-peak',
    hard: 'mountain-peak', difficult: 'mountain-peak', struggle: 'mountain-peak',
    sun: 'solar-system', star: 'solar-system', universe: 'solar-system',
    galaxy: 'solar-system', cosmic: 'solar-system', astro: 'solar-system',
    city: 'city-skyline', urban: 'city-skyline', downtown: 'city-skyline',
    building: 'city-skyline', skyline: 'city-skyline',

    // Emotions & Actions
    love: 'heartbeat', heart: 'heartbeat', feel: 'heartbeat',
    care: 'heartbeat', emotion: 'heartbeat', soul: 'heartbeat',
    health: 'heartbeat', life: 'heartbeat', alive: 'heartbeat', want: 'heartbeat', dream: 'heartbeat',
    protect: 'shield-protect', safe: 'shield-protect', security: 'shield-protect',
    guard: 'shield-protect', defense: 'shield-protect', trust: 'shield-protect',
    guarantee: 'shield-protect', reliable: 'shield-protect', shield: 'shield-protect',
    walk: 'person-walking', step: 'person-walking', move: 'person-walking',
    run: 'person-walking', exercise: 'person-walking', fitness: 'person-walking', going: 'person-walking',

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

    // Common conversational words
    guys: 'connections', everybody: 'connections', hello: 'connections',
    welcome: 'celebration', subscribe: 'target-bullseye', follow: 'connections',
    important: 'energy-pulse', serious: 'shield-protect', real: 'eye-vision',
    true: 'checkmark-success', right: 'checkmark-success', exactly: 'target-bullseye',
    wrong: 'explosion-burst', bad: 'fire-blaze', problem: 'gear-system',
    question: 'brain-idea', answer: 'checkmark-success', explain: 'brain-idea',
    reason: 'brain-idea', because: 'brain-idea', why: 'brain-idea',
    different: 'connections', change: 'arrow-growth', new: 'rocket-launch',
    old: 'clock-time', next: 'arrow-growth', first: 'crown-royal',
    help: 'shield-protect', need: 'target-bullseye', absolutely: 'energy-pulse',
    story: 'book-reading', tell: 'eye-vision', happen: 'explosion-burst',
    finally: 'checkmark-success', literally: 'explosion-burst', actually: 'brain-idea',
    basically: 'gear-system', definitely: 'checkmark-success', probably: 'brain-idea',
    game: 'celebration', play: 'celebration', fun: 'celebration',
    free: 'diamond-gem', hundred: 'growth-chart',
    thousand: 'growth-chart', percent: 'growth-chart',
};

/** Match transcript text to the best animated scene using keyword mapping */
function matchSceneToText(text: string): string {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    for (const word of words) {
        if (CONTENT_SCENE_MAP[word]) return CONTENT_SCENE_MAP[word];
    }
    // Fallback: pick a random scene based on text hash
    const hash = Math.abs(text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
    return ALL_SCENES[hash % ALL_SCENES.length];
}

function generateLocalMotionGraphics(subtitles: SubtitleInput[]): OverlaySuggestion[] {
    const results: OverlaySuggestion[] = [];
    let overlayCount = 0;

    for (let index = 0; index < subtitles.length; index++) {
        const seg = subtitles[index];
        if (!hasVisualKeyword(seg.text)) continue;

        const color = getProColor(overlayCount);
        const label = extractLabelFromText(seg.text);

        // 10-slot mix: ai-generated-image B-roll (40%) + kinetic-text (30%) + transcript-motion (20%) + emoji (10%)
        // slots 0,2,5,8 = ai-generated-image, 1,4,7 = kinetic-text, 3,6 = transcript-motion, 9 = emoji
        const slot = overlayCount % 10;
        let overlay: OverlaySuggestion;

        switch (slot) {
            case 0:
            case 2:
            case 5:
            case 8: {
                // Procedurally generated motion graphics B-roll
                const kwLabel = extractLabelFromText(seg.text);
                const brollStyles = ['abstract', 'geometric', 'wave', 'particles', 'data'];
                overlay = {
                    segmentId: seg.id,
                    type: 'dynamic-broll',
                    props: {
                        keywords: (kwLabel || seg.text.substring(0, 20)).toUpperCase(),
                        color,
                        style: brollStyles[overlayCount % brollStyles.length],
                    },
                };
                break;
            }

            case 1:
            case 4:
            case 7: {
                // Kinetic text
                const kineticStyles = ['pop', 'slide', 'bounce'];
                const positions = ['center', 'top', 'bottom'];
                overlay = {
                    segmentId: seg.id,
                    type: 'kinetic-text',
                    props: {
                        text: label || seg.text.substring(0, 30),
                        color,
                        style: kineticStyles[overlayCount % kineticStyles.length],
                        position: positions[overlayCount % positions.length],
                        fontSize: 42,
                    },
                };
                break;
            }

            case 3:
            case 6: {
                // Transcript motion
                const styles = ['karaoke', 'typewriter', 'wave'];
                const positions = ['bottom', 'center', 'bottom'];
                overlay = {
                    segmentId: seg.id,
                    type: 'transcript-motion',
                    props: {
                        text: seg.text,
                        color,
                        style: styles[overlayCount % styles.length],
                        position: positions[overlayCount % positions.length],
                    },
                };
                break;
            }

            case 9:
            default: {
                // Emoji reaction
                const emoji = pickEmojiFromText(seg.text);
                const fallbackEmojis = ['🔥', '⚡', '🎯', '💡', '🚀', '💎'];
                overlay = {
                    segmentId: seg.id,
                    type: 'emoji-reaction',
                    props: {
                        emoji: emoji || fallbackEmojis[overlayCount % fallbackEmojis.length],
                        size: 70,
                    },
                };
                break;
            }
        }

        results.push(overlay);
        overlayCount++;
    }

    return results;
}

/** Generate a vivid image prompt directly from transcript text for Pollinations.ai */
function generateImagePromptFromText(text: string): string {
    // Clean up the text and use it directly as the visual scene description
    const cleaned = text.replace(/[^\w\s,.!?'-]/g, '').trim();

    // Use the actual transcript text as the core of the prompt
    // This ensures every B-roll is unique to what the speaker is actually saying
    if (cleaned.length > 10) {
        return `${cleaned}, realistic visual scene, cinematic lighting, professional quality, 4k, detailed`;
    }

    return `Abstract professional concept art, cinematic lighting, dark moody background, modern design, high quality`;
}



/**
 * Generate Pollinations.ai image URL
 */
function generatePollinationsUrl(prompt: string, seed: number): string {
    const encodedPrompt = encodeURIComponent(`${prompt}, high quality, professional`);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${seed}`;
}

function hasVisualKeyword(text: string): boolean {
    const lower = text.toLowerCase().trim();
    // Accept ANY text with at least 2 meaningful words (not just filler)
    if (lower.length < 5) return false;
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 1);
    if (words.length < 2) return false;
    // Reject pure filler phrases
    const fillerPhrases = ['um', 'uh', 'like', 'you know', 'so yeah', 'and then', 'okay so'];
    if (fillerPhrases.some(f => lower === f)) return false;
    return true;
}

function pickSceneFromText(text: string, index: number, lastScene?: string): string {
    const lower = text.toLowerCase();
    const allWords = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length >= 2);

    // Score all matching scenes
    const sceneScores: Record<string, number> = {};
    for (const word of allWords) {
        const scene = CONTENT_SCENE_MAP[word];
        if (scene) {
            sceneScores[scene] = (sceneScores[scene] || 0) + 1;
        }
    }

    // Filter out lastScene and pick best match
    const scoredScenes = Object.entries(sceneScores)
        .filter(([scene]) => scene !== lastScene)
        .sort((a, b) => b[1] - a[1]);

    if (scoredScenes.length > 0) {
        return scoredScenes[0][0];
    }

    // Fallback: use TEXT HASH (different text → different scene)
    const allScenes = [
        'solar-system', 'growth-chart', 'globe', 'rocket-launch', 'brain-idea',
        'connections', 'clock-time', 'heartbeat', 'money-flow', 'lightning',
        'shopping-cart', 'cooking', 'nature-tree', 'city-skyline', 'person-walking',
        'celebration', 'music-notes', 'book-reading', 'camera', 'code-terminal',
        'fire-blaze', 'water-wave', 'shield-protect', 'target-bullseye',
        'explosion-burst', 'magnet-attract', 'gear-system', 'energy-pulse',
        'eye-vision', 'arrow-growth', 'checkmark-success', 'diamond-gem',
        'crown-royal', 'atom-science', 'mountain-peak',
    ];
    const hash = text.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0);
    return allScenes[Math.abs(hash) % allScenes.length];
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
