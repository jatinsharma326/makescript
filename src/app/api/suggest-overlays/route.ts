import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscription, getModelForTier } from '@/lib/subscription';
import { getModelProvider, getApiKey, getApiEndpoint, CUSTOM_APIS, getCustomApiConfig, DEFAULT_PROVIDERS } from '@/lib/apiKeys';

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
    'dynamic-broll',
    'visual-illustration',
    'ai-motion-graphic',
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
    'GAMING/ENTERTAINMENT': ['game', 'play', 'player', 'nintendo', 'pokemon', 'xbox', 'playstation', 'level', 'boss', 'quest', 'character', 'multiplayer', 'console', 'controller', 'gamer', 'stream', 'twitch', 'esport', 'mod', 'cheat', 'glitch', 'speedrun', 'lore', 'dex', 'generation', 'roblox', 'minecraft', 'fortnite', 'blox', 'obby', 'simulator', 'tycoon', 'raid', 'skin', 'avatar', 'npc', 'mob', 'spawn', 'lobby', 'server', 'craft', 'build', 'survival', 'creative', 'battle', 'royale', 'shoot', 'fps', 'mmorpg', 'rpg', 'adventure', 'sandbox', 'pixel', 'block', 'cube', 'virtual', 'world', 'gameplay', 'gaming'],
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

/** Detailed topic detection that returns structured data for image prompt generation */
function detectVideoTopicDetailed(fullText: string): { primaryTopic: string; matchedKeywords: string[] } {
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
        return { primaryTopic: 'general', matchedKeywords: [] };
    }

    const [topTopic, topData] = sorted[0];
    return {
        primaryTopic: topTopic,
        matchedKeywords: topData.matches.slice(0, 10)
    };
}

export async function POST(request: NextRequest) {
    try {
        const { subtitles, model } = (await request.json()) as { subtitles: SubtitleInput[]; model?: string };

        if (!subtitles || subtitles.length === 0) {
            return NextResponse.json({ suggestions: [] });
        }

        const sub = await getUserSubscription();
        const activeModel = model || getModelForTier(sub.tier);

        const suggestions = await suggestWithAI(subtitles, activeModel);
        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Overlay suggestion error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}

async function suggestWithAI(subtitles: SubtitleInput[], requestedModel?: string): Promise<OverlaySuggestion[]> {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const subtitleList = subtitles
        .map((s) => `[${s.id}] "${s.text}" (${s.startTime}s - ${s.endTime}s)`)
        .join('\n');

    const fullTranscript = subtitles.map(s => s.text).join(' ').toLowerCase();
    const videoTopic = detectVideoTopic(fullTranscript);
    
    const segmentContexts = subtitles.map(s => {
        const hash = Math.abs(s.text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
        return `${s.id}:uniqueSeed=${hash}`;
    }).join(', ');

    const prompt = `You are an elite Motion Graphics Director for a top-tier video production studio. Your job is to create PROFESSIONAL, contextually-relevant motion graphics based EXACTLY on what the speaker is saying.

⚠️ CRITICAL: Session ID ${sessionId} — Generate FRESH content for THIS video only.

VIDEO TOPIC CONTEXT: ${videoTopic}

AVAILABLE PROFESSIONAL OVERLAY TYPES:

1. "visual-illustration" — PRE-BUILT PROFESSIONAL ANIMATED SCENE (Use 20% of the time)
   This renders a stunning pre-built animated SVG scene. You just pick the right scene name.
   Available scenes: solar-system, growth-chart, globe, rocket-launch, brain-idea, connections, clock-time, heartbeat, money-flow, lightning, shopping-cart, cooking, nature-tree, city-skyline, person-walking, celebration, music-notes, book-reading, camera, code-terminal, fire-blaze, water-wave, shield-protect, target-bullseye, explosion-burst, magnet-attract, gear-system, energy-pulse, eye-vision, arrow-growth, checkmark-success, diamond-gem, crown-royal, atom-science, mountain-peak
   Props: { "scene": "scene-name-from-list", "label": "Key phrase from segment", "color": "#6366f1", "transition": "fade-in" }
   
   Scene selection guide (MATCH THE SPEAKER'S WORDS):
   - Money/revenue/profit → "money-flow" or "growth-chart"
   - Brain/ideas/AI/think → "brain-idea"
   - Rocket/launch/start → "rocket-launch"
   - Earth/world/global → "globe"
   - Success/win/achieve → "checkmark-success" or "crown-royal"
   - Growth/increase/scale → "arrow-growth"
   - Fire/power/energy → "fire-blaze" or "energy-pulse"
   - Time/schedule/deadline → "clock-time"
   - Protection/security → "shield-protect"
   - Goal/target/focus → "target-bullseye"
   - Technology/code/software → "code-terminal" or "atom-science"
   - Nature/tree/environment → "nature-tree"
   - City/building/urban → "city-skyline"
   - Connection/network/social → "connections"
   - Heart/love/care → "heartbeat"
   - Lightning/fast/speed → "lightning"
   - Explosion/impact/massive → "explosion-burst"
   - Mountain/climb/challenge → "mountain-peak"

2. "ai-generated-image" — AI-GENERATED B-ROLL IMAGE (Use 60% of the time)
   Creates a cinematic AI-generated image as B-roll. Provide a RICH, DETAILED, CINEMATIC image prompt that captures the MOOD and TONE of the segment.
   Props: { "caption": "Short label", "imagePrompt": "the detailed prompt" }
   
   ⚠️ IMAGE PROMPT RULES:
   - Write prompts that evoke the EMOTIONAL MOOD of the segment (dramatic, triumphant, calm, energetic, mysterious, warm, etc.)
   - Use cinematic language: lighting terms (golden hour, chiaroscuro, volumetric, rim light), composition terms (wide shot, close-up, aerial, Dutch angle), atmosphere (foggy, misty, ethereal, gritty)
   - Match the visual style to the topic: corporate luxury for business, futuristic for tech, editorial for fashion, gritty for gaming
   - Be SPECIFIC about what the image shows — not abstract concepts
   - Include style quality tags: "cinematic lighting, 8k, hyperrealistic, professional color grading, shallow depth of field"
   
   BAD examples (avoid these):
   - "business growth" — too vague
   - "happy person working" — generic and boring
   - "technology concept" — meaningless
   
   GOOD examples:
   - "A dramatic upward-trending stock chart rendered as a glowing glass sculpture in a dark executive boardroom, golden hour light streaming through floor-to-ceiling windows, cinematic wide shot, hyperrealistic, professional color grading, 8k"
   - "Close-up of weathered hands typing code on a backlit mechanical keyboard, neon blue reflections dancing on the keys, shallow depth of field, cyberpunk atmosphere, volumetric fog, moody lighting"
   - "A lone explorer standing atop a mountain peak at sunrise, arms raised in triumph, golden sun rays bursting through dramatic clouds, inspirational adventure photography, 8k, National Geographic style"

3. "gif-reaction" — CONTEXTUAL GIF REACTION (Use 10% of the time)
   Props: { "keyword": "search term from segment", "size": "large", "position": "center" }

4. "emoji-reaction" — SUBTLE EMOJI (Use 5% of the time, only for casual moments)
   Props: { "emoji": "🔥", "size": 70 }

⚠️ MANDATORY RULES FOR PROFESSIONAL RESULTS:
1. READ EACH SEGMENT CAREFULLY — the overlay MUST reflect the SPECIFIC words and meaning
2. ONLY overlay 25-35% of segments — skip filler ("um", "like", "so yeah", "anyway")
3. NEVER put overlays on consecutive segments — minimum 2 segments apart
4. For "visual-illustration", ALWAYS choose a scene that MATCHES the segment's keywords
5. For "ai-generated-image", write a RICH, DETAILED prompt (not just the raw text)
6. The "label" prop should be a SHORT, PUNCHY phrase extracted from the segment (2-4 words, capitalized)
7. If a segment has numbers/stats, HIGHLIGHT them in the label or image

Transcript Segments:
${subtitleList}

Return ONLY a JSON array. No markdown, no explanation:
[{ "segmentId": string, "type": "visual-illustration"|"ai-generated-image"|"gif-reaction"|"emoji-reaction", "props": { ... } }]`;

    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 500;

    type ModelInfo = {
        name: string;
        model: string;
        provider: string;
        isCustom?: boolean;
    };

    const fallbackModels: ModelInfo[] = [
        { name: 'DeepSeek V3.1', model: 'lightning-ai/DeepSeek-V3.1', provider: 'deepseek' },
        { name: 'OpenAI o3', model: 'openai/o3', provider: 'openai' },
        { name: 'OpenAI o4-mini', model: 'openai/o4-mini', provider: 'openai' },
    ];

    const requestedProvider = requestedModel ? getModelProvider(requestedModel) : 'lightning';
    
    const customApi = requestedModel ? getCustomApiConfig(requestedModel) : undefined;
    
    const models = requestedModel
        ? [{ 
            name: customApi?.name || requestedModel.split('/').pop() || requestedModel, 
            model: requestedModel, 
            provider: requestedProvider,
            isCustom: !!customApi
        }, ...fallbackModels.filter(m => m.model !== requestedModel)]
        : fallbackModels;

    for (const modelInfo of models) {
        for (let retry = 0; retry < MAX_RETRIES; retry++) {
            try {
                if (retry > 0) {
                    console.log(`[AI Suggest] ${modelInfo.name} retry ${retry}/${MAX_RETRIES}...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                } else {
                    console.log(`[AI Suggest] Trying model: ${modelInfo.name} via ${modelInfo.provider}`);
                }

                let apiEndpoint: string;
                let apiKey: string;
                let customConfig: typeof customApi = undefined;
                
                if (modelInfo.isCustom) {
                    customConfig = getCustomApiConfig(modelInfo.model);
                    if (!customConfig) {
                        customConfig = CUSTOM_APIS.find(api => api.model === modelInfo.model || api.name === modelInfo.name);
                    }
                    if (!customConfig) {
                        console.warn(`[AI Suggest] Custom API config not found: ${modelInfo.model}`);
                        break;
                    }
                    apiEndpoint = customConfig.baseUrl;
                    apiKey = customConfig.apiKey;
                } else {
                    apiEndpoint = getApiEndpoint(modelInfo.provider);
                    apiKey = getApiKey(modelInfo.provider);
                }
                
                if (!apiKey && !modelInfo.isCustom) {
                    console.warn(`[AI Suggest] No API key for provider: ${modelInfo.provider}, skipping...`);
                    break;
                }

                const { url, headers, body } = modelInfo.isCustom 
                    ? buildCustomApiRequest(customConfig!, prompt)
                    : buildProviderRequest(apiEndpoint, apiKey, modelInfo.model, prompt);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    const isRateLimit = response.status === 429;
                    const isServerError = response.status >= 500;

                    if (isRateLimit || isServerError) {
                        console.warn(`[AI Suggest] ${modelInfo.name} ${isRateLimit ? 'rate limited' : 'server error'}, will retry...`);
                        continue;
                    }
                    console.warn(`[AI Suggest] ${modelInfo.name} failed: ${response.status} - ${errorText.substring(0, 100)}`);
                    break;
                }

                const data = await response.json();
                const content = extractContentFromResponse(data, modelInfo.provider);

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

                const validatedSuggestions = suggestions
                    .filter((s) => s.segmentId && VALID_OVERLAY_TYPES.includes(s.type))
                    .map((s) => {
                        const count = hashString(s.segmentId);
                        const origSeg = subtitles.find(sub => sub.id === s.segmentId);
                        if (!s.props.color) s.props.color = getProColor(count);
                        if (s.type === 'kinetic-text' && !s.props.text && origSeg) {
                            s.props.text = extractLabelFromText(origSeg.text);
                        }
                        if (s.type === 'ai-generated-image') {
                            if (s.props.imageUrl) {
                                // Strip out hallucinated imageUrls so the client generates a fresh one
                                // based on the imagePrompt or segment text.
                                delete s.props.imageUrl;
                            }
                            if (s.props.seed !== undefined) {
                                // Strip out hallucinated seeds to ensure we generate a truly unique seed
                                // per segment based on the segment ID.
                                delete s.props.seed;
                            }
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

    console.log('[AI Suggest] Using local motion graphic generation with LLM-powered image prompts');
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

function matchSceneToText(text: string): string {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    for (const word of words) {
        if (CONTENT_SCENE_MAP[word]) return CONTENT_SCENE_MAP[word];
    }
    const hash = Math.abs(text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
    return ALL_SCENES[hash % ALL_SCENES.length];
}

let currentVideoTopic: { primaryTopic: string; matchedKeywords: string[] } = { primaryTopic: 'general', matchedKeywords: [] };

async function generateLocalMotionGraphics(subtitles: SubtitleInput[]): Promise<OverlaySuggestion[]> {
    const results: OverlaySuggestion[] = [];
    
    const sessionSeed = Date.now() % 100000;
    
    const fullTranscriptText = subtitles.map(s => s.text).join(' ');
    const topicInfo = detectVideoTopicDetailed(fullTranscriptText);
    currentVideoTopic = topicInfo;
    console.log('[LocalMotion] Detected video topic:', topicInfo.primaryTopic, 'keywords:', topicInfo.matchedKeywords.slice(0, 5));
    
    let overlayCount = 0;
    
    let lastUsedSceneType = '';

    const scored = subtitles.map((seg, index) => ({
        seg,
        index,
        score: scoreSegmentRelevanceServer(seg.text),
    }));

    const maxOverlays = Math.max(2, Math.floor(subtitles.length * 0.30));
    const topSegments = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxOverlays);

    const overlayIndices = new Set<number>();
    const sortedByIndex = topSegments.sort((a, b) => a.index - b.index);
    let lastIdx = -3;
    for (const entry of sortedByIndex) {
        if (entry.index - lastIdx >= 2) {
            overlayIndices.add(entry.index);
            lastIdx = entry.index;
        }
    }

    // Generate AI images for ALL overlay segments upfront (type is decided later per content)
    console.log(`[ImageGen] Starting parallel generation of ${[...overlayIndices].length} images with LLM-powered prompts...`);
    
    const imageResults: Map<number, string> = new Map();
    
    const allOverlaySegments = [...overlayIndices].map(index => {
        const seg = subtitles[index];
        const segmentHash = hashString(seg.text);
        const uniqueSeed = (sessionSeed + segmentHash + index) % 1000000;
        const label = extractLabelFromText(seg.text);
        return { index, seg, uniqueSeed, label };
    });

    if (allOverlaySegments.length > 0) {
        const imagePromises = allOverlaySegments.map(async ({ index, seg, uniqueSeed }) => {
            const imagePrompt = await generateLLMPoweredImagePrompt(seg.text, topicInfo);
            console.log(`[ImageGen] Prompt for segment ${seg.id}: "${imagePrompt.substring(0, 120)}..."`);
            const imageUrl = await generateErnieImageUrl(imagePrompt, uniqueSeed);
            return { index, imageUrl };
        });
        
        const settledResults = await Promise.allSettled(imagePromises);
        
        for (const result of settledResults) {
            if (result.status === 'fulfilled') {
                imageResults.set(result.value.index, result.value.imageUrl);
                console.log(`[ImageGen] Image ready for index ${result.value.index}`);
            } else {
                console.warn('[ImageGen] Image generation failed:', result.reason);
            }
        }
        
        console.log(`[ImageGen] Completed ${imageResults.size}/${allOverlaySegments.length} image generations`);
    }
    
    // Build overlay suggestions — type chosen per-segment based on CONTENT, not a fixed slot
    for (let index = 0; index < subtitles.length; index++) {
        if (!overlayIndices.has(index)) continue;
        const seg = subtitles[index];

        const segmentHash = hashString(seg.text);
        const uniqueSeed = (sessionSeed + segmentHash + index) % 1000000;
        
        const color = getProColor(uniqueSeed);
        const label = extractLabelFromText(seg.text);

        // ── Content-driven type selection ──
        const lower = seg.text.toLowerCase();
        const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
        const contentHash = Math.abs(seg.text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));

        const hasStrongSceneKeyword = words.some(w => CONTENT_SCENE_MAP[w]);
        const hasVisualNoun = words.some(w => [
            'money', 'rocket', 'brain', 'fire', 'ocean', 'mountain', 'city',
            'star', 'earth', 'code', 'heart', 'clock', 'tree', 'food',
        ].includes(w));
        const hasEmotionWord = words.some(w => [
            'love', 'happy', 'amazing', 'incredible', 'awesome', 'fire', 'lit',
            'crazy', 'insane', 'wow', 'excited', 'cool', 'funny',
        ].includes(w));
        const hasNumbers = /\$[\d,.]+|\d+%|\d{3,}/.test(seg.text);
        const isQuestion = seg.text.includes('?');
        const textLen = seg.text.length;

        let chosenType: 'ai-generated-image' | 'visual-illustration' | 'gif-reaction' | 'emoji-reaction';

        if (hasStrongSceneKeyword && (contentHash % 3 !== 0)) {
            chosenType = 'visual-illustration';
        } else if (textLen > 40 && !hasEmotionWord && (contentHash % 4 !== 0)) {
            chosenType = 'ai-generated-image';
        } else if (hasEmotionWord && !hasNumbers) {
            chosenType = (contentHash % 2 === 0) ? 'gif-reaction' : 'emoji-reaction';
        } else if (hasNumbers || hasVisualNoun) {
            chosenType = (contentHash % 2 === 0) ? 'ai-generated-image' : 'visual-illustration';
        } else if (isQuestion) {
            chosenType = 'visual-illustration';
        } else {
            const pick = contentHash % 10;
            if (pick < 4) chosenType = 'visual-illustration';
            else if (pick < 7) chosenType = 'ai-generated-image';
            else if (pick < 9) chosenType = 'gif-reaction';
            else chosenType = 'emoji-reaction';
        }

        let overlay: OverlaySuggestion;

        switch (chosenType) {
            case 'ai-generated-image': {
                const imageUrl = imageResults.get(index) || generatePollinationsUrlFromText(seg.text, topicInfo, uniqueSeed);
                overlay = {
                    segmentId: seg.id,
                    type: 'ai-generated-image',
                    props: {
                        imageUrl,
                        caption: label || seg.text.substring(0, 40),
                        seed: uniqueSeed,
                        imagePrompt: deriveImagePromptFromText(seg.text, topicInfo),
                    },
                };
                lastUsedSceneType = 'ai-generated-image';
                break;
            }

            case 'visual-illustration': {
                const scene = pickSceneFromText(seg.text, overlayCount, lastUsedSceneType);
                const transitions = ['fade-in', 'slide-in', 'zoom-in'];
                overlay = {
                    segmentId: seg.id,
                    type: 'visual-illustration',
                    props: {
                        scene,
                        label: label || seg.text.substring(0, 30),
                        color,
                        transition: transitions[contentHash % transitions.length],
                    },
                };
                lastUsedSceneType = scene;
                break;
            }

            case 'gif-reaction': {
                const sizes = ['medium', 'large', 'fullscreen'];
                const gifPositions = ['center', 'top-right', 'bottom-right'];
                overlay = {
                    segmentId: seg.id,
                    type: 'gif-reaction',
                    props: {
                        keyword: seg.text.substring(0, 80),
                        size: sizes[contentHash % sizes.length],
                        position: gifPositions[contentHash % gifPositions.length],
                    },
                };
                lastUsedSceneType = 'gif-reaction';
                break;
            }

            case 'emoji-reaction':
            default: {
                const emoji = pickEmojiFromText(seg.text);
                const fallbackEmojis = ['🔥', '⚡', '🎯', '💡', '🚀', '💎', '✨', '💪', '🎉', '📈'];
                overlay = {
                    segmentId: seg.id,
                    type: 'emoji-reaction',
                    props: {
                        emoji: emoji || fallbackEmojis[contentHash % fallbackEmojis.length],
                        size: 70,
                    },
                };
                lastUsedSceneType = 'emoji-reaction';
                break;
            }
        }

        results.push(overlay);
        overlayCount++;
    }

    return results;
}

function scoreSegmentRelevanceServer(text: string): number {
    const lower = text.toLowerCase();
    if (lower.length < 8) return 0;

    const fillerPatterns = [
        'thank you for watching', 'like and subscribe', 'please subscribe',
        'see you in the next', 'don\'t forget', 'comment below', 'let me know',
        'that\'s it for', 'alright guys', 'anyway', 'moving on', 'so basically',
    ];
    if (fillerPatterns.some(p => lower.includes(p))) return 0;

    let score = 0;
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);

    const strongKeywords = new Set([
        'money', 'revenue', 'profit', 'income', 'growth', 'success', 'rocket',
        'brain', 'technology', 'code', 'science', 'power', 'energy', 'fire',
        'earth', 'world', 'mountain', 'ocean', 'celebrate', 'love', 'protect',
        'invest', 'market', 'stock', 'launch', 'explode', 'scale', 'secret',
        'ai', 'data', 'cloud', 'digital', 'algorithm', 'machine', 'network',
    ]);
    for (const w of words) {
        if (strongKeywords.has(w)) score += 3;
        else if (CONTENT_SCENE_MAP[w]) score += 1;
    }

    if (/\$[\d,.]+|\d+%|\d{3,}/.test(text)) score += 4;
    if (text.includes('?')) score += 2;
    if (text.includes('!')) score += 1;

    const nonStopWords = words.filter(w => !STOP_WORDS.has(w));
    if (nonStopWords.length < 2) score -= 2;

    return Math.max(0, score);
}

// ==================== MOOD DETECTION ====================

type VideoMood = 'triumphant' | 'dramatic' | 'calm' | 'energetic' | 'mysterious' | 'warm' | 'dark' | 'futuristic' | 'nostalgic' | 'neutral';

function detectSegmentMood(text: string): VideoMood {
    const lower = text.toLowerCase();
    
    // Score each mood
    const scores: Record<VideoMood, number> = {
        triumphant: 0, dramatic: 0, calm: 0, energetic: 0, mysterious: 0, warm: 0, dark: 0, futuristic: 0, nostalgic: 0, neutral: 0,
    };
    
    const moodWords: Record<VideoMood, string[]> = {
        triumphant: ['triumph', 'victory', 'won', 'winning', 'champion', 'conquered', 'dominated', 'crushed it', 'unstoppable', 'glory', 'achievement', 'milestone', 'record', 'broke', 'breakthrough', 'finally'],
        dramatic: ['shocking', 'revealed', 'secret', 'exposed', 'truth', 'scandal', 'controversy', 'banned', 'forbidden', 'danger', 'warning', 'never before', 'unprecedented', 'crisis', 'disaster', 'war', 'battle'],
        calm: ['peaceful', 'serene', 'tranquil', 'gentle', 'quiet', 'soft', 'smooth', 'relax', 'meditate', 'breathe', 'slow', 'steady', 'patient', 'mindful', 'balanced', 'harmony'],
        energetic: ['explosive', 'insane', 'crazy', 'wild', 'hype', 'pumped', 'amazing', 'incredible', 'awesome', 'fantastic', 'mind-blowing', 'game-changer', 'revolutionary', 'fast', 'rapid', 'instant'],
        mysterious: ['mystery', 'unknown', 'conspiracy', 'unsolved', 'strange', 'weird', 'bizarre', 'odd', 'curious', 'hidden', 'secret', 'cloak', 'shadow', 'enigma', 'puzzle', 'riddle', 'cipher'],
        warm: ['love', 'heart', 'happy', 'joy', 'celebrate', 'family', 'friend', 'together', 'community', 'kindness', 'grateful', 'blessed', 'cozy', 'comfort', 'home', 'welcome', 'hug'],
        dark: ['death', 'destroy', 'ruin', 'apocalypse', 'doom', 'darkness', 'evil', 'horror', 'terror', 'fear', 'nightmare', 'haunt', 'bleak', 'hopeless', 'despair', 'suffer', 'pain', 'agony'],
        futuristic: ['future', 'cyber', 'hologram', 'robot', 'android', 'spaceship', 'interstellar', 'quantum', 'nanotech', 'artificial', 'synthetic', 'digital', 'virtual', 'metaverse', 'neural', 'upload'],
        nostalgic: ['remember', 'memories', 'throwback', 'vintage', 'retro', 'classic', 'old school', 'back then', 'used to', 'childhood', 'growing up', 'nostalgia', 'reminisce', 'past', 'era', 'decade'],
        neutral: [],
    };
    
    for (const [mood, words] of Object.entries(moodWords)) {
        for (const word of words) {
            if (lower.includes(word)) {
                scores[mood as VideoMood] += 2;
            }
        }
    }
    
    // Analyze sentence structure
    if (text.includes('!')) scores.energetic += 1;
    if (text.includes('?')) scores.mysterious += 1;
    if (text.includes('...')) scores.dramatic += 1;
    
    // Capital letters ratio (for ENERGY)
    const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(1, text.length);
    if (capsRatio > 0.3) scores.energetic += 1;
    
    // Find highest scoring mood
    let bestMood: VideoMood = 'neutral';
    let bestScore = 0;
    for (const [mood, score] of Object.entries(scores)) {
        if (score > bestScore) {
            bestScore = score;
            bestMood = mood as VideoMood;
        }
    }
    
    return bestMood;
}

// ==================== LLM-POWERED IMAGE PROMPT GENERATION ====================

/**
 * Generate a cinematic image prompt using an LLM (uses NVIDIA GLM-5 or MiniMax).
 * This is the PRIMARY method — produces rich, mood-synced, professional prompts.
 * Falls back to keyword-based generation if the LLM is unavailable.
 */
async function generateLLMPoweredImagePrompt(
    segmentText: string,
    topicInfo: { primaryTopic: string; matchedKeywords: string[] }
): Promise<string> {
    const mood = detectSegmentMood(segmentText);
    const topicContext = topicInfo.primaryTopic !== 'general' 
        ? `Video category: ${topicInfo.primaryTopic}. Key themes: ${topicInfo.matchedKeywords.slice(0, 5).join(', ')}.`
        : '';
    
    const moodGuide = getMoodPromptGuide(mood);
    const topicStyleGuide = getTopicStyleGuide(topicInfo.primaryTopic);
    
    const llmPrompt = `You are a world-class cinematographer and visual artist. Generate ONE highly specific, cinematic image prompt based on this video segment.

VIDEO SEGMENT TEXT: "${segmentText}"

EMOTIONAL MOOD: ${mood}
MOOD VISUAL GUIDE: ${moodGuide}
STYLE DIRECTION: ${topicStyleGuide}
${topicContext}

RULES FOR THE IMAGE PROMPT:
1. Describe a SPECIFIC, CONCRETE scene — not an abstract concept
2. Use cinematic language: specify lighting (golden hour, neon, volumetric, rim light), composition (close-up, wide shot, aerial, Dutch angle), atmosphere
3. The prompt MUST be 50-200 words, rich in visual detail
4. Match the emotional tone (${mood}) precisely through color palette, lighting, and composition
5. Include these quality tags at the end: "cinematic lighting, hyperrealistic, professional color grading, 8k, high detail"
6. NEVER use placeholder words like "concept of" or "visualization of" — describe the actual scene
7. If the segment mentions specific objects/places/actions, INCLUDE them visually
8. Make it feel like a frame from a premium film or documentary

Respond with ONLY the image prompt, nothing else. No quotes, no labels, no markdown.`;

    // Try NVIDIA APIs first (GLM-5 or MiniMax), then fall back to any available LLM
    const llmConfigs = [
        { 
            name: 'MiniMax M2.7',
            baseUrl: 'https://integrate.api.nvidia.com/v1',
            apiKey: process.env.NVIDIA_MINIMAX_API_KEY || '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',
            model: 'openai/minimaxai/minimax-m2.7',
        },
        {
            name: 'GLM-5',
            baseUrl: 'https://integrate.api.nvidia.com/v1',
            apiKey: process.env.NVIDIA_GLM5_API_KEY || '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',
            model: 'openai/z-ai/glm-5.1',
        },
    ];

    for (const config of llmConfigs) {
        if (!config.apiKey) continue;
        
        try {
            console.log(`[LLMPrompt] Trying ${config.name} for image prompt generation...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(`${config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: 'user', content: llmPrompt }],
                    max_tokens: 300,
                    temperature: 0.85,
                }),
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn(`[LLMPrompt] ${config.name} failed: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            
            if (content && typeof content === 'string' && content.trim().length > 20) {
                const cleanPrompt = content.trim()
                    .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
                    .replace(/^Image prompt:?\s*/i, '')  // Remove "Image prompt:" prefix
                    .replace(/\n+/g, ' ')  // Collapse newlines
                    .trim();
                
                console.log(`[LLMPrompt] ${config.name} generated prompt (${cleanPrompt.length} chars)`);
                return cleanPrompt;
            }
            
            console.warn(`[LLMPrompt] ${config.name} returned insufficient content`);
        } catch (error) {
            console.warn(`[LLMPrompt] ${config.name} error:`, error);
            continue;
        }
    }
    
    // Fallback: use enhanced keyword-based generation
    console.log('[LLMPrompt] All LLMs failed, using enhanced keyword-based prompt generation');
    return generateEnhancedImagePrompt(segmentText, topicInfo, mood);
}

function getMoodPromptGuide(mood: VideoMood): string {
    const guides: Record<VideoMood, string> = {
        triumphant: 'Warm golden lighting, heroic low-angle composition, lens flare, epic scale, vibrant warm colors, upward movement, inspirational atmosphere, rays of sunlight bursting through',
        dramatic: 'High contrast chiaroscuro lighting, deep shadows, intense atmosphere, dramatic color grading with teal and orange, shallow depth of field, tension-filled composition, cinematic wide shot',
        calm: 'Soft diffused natural lighting, pastel muted tones, peaceful atmosphere, gentle bokeh background, serene composition, zen aesthetic, clean minimal space, smooth gradients',
        energetic: 'Dynamic motion blur, neon accent lighting, high energy action composition, saturated vibrant pop colors, explosive particles, fast shutter effect, electric atmosphere, bold graphic elements',
        mysterious: 'Foggy atmospheric lighting, deep shadows with rim light, silhouette composition, enigmatic mood, dark teal and purple palette, volumetric light rays piercing darkness, smoke and haze',
        warm: 'Warm tungsten lighting, cozy intimate atmosphere, golden amber tones, soft focus background, emotional shallow depth of field, comfortable lived-in setting, gentle warm glow',
        dark: 'Low-key lighting, desaturated cold tones, gritty texture, harsh shadows, bleak atmosphere, muted earth tones, stark contrast, somber mood, film noir aesthetic',
        futuristic: 'Cool blue and cyan lighting, sleek metallic surfaces, holographic neon accents, clean minimal composition, cyberpunk aesthetic, glass and steel materials, ethereal glow, sci-fi atmosphere',
        nostalgic: 'Film grain texture, warm faded colors, vintage soft focus, sun-bleached tones, analog photography feel, gentle vignette, retro color palette, dreamy hazy atmosphere',
        neutral: 'Balanced studio lighting, clean professional composition, neutral gray background, crisp details, editorial photography style, well-lit even exposure',
    };
    return guides[mood] || guides.neutral;
}

function getTopicStyleGuide(primaryTopic: string): string {
    const guides: Record<string, string> = {
        'GAMING/ENTERTAINMENT': 'Video game cinematic style, dynamic action angles, neon-lit environments, character-driven scenes, epic boss battle atmosphere, pixel art or high-poly aesthetic depending on context, gaming setup with RGB lighting',
        'TECHNOLOGY/CODING': 'Sleek futuristic tech aesthetic, dark mode interfaces with glowing syntax, clean minimal hardware shots, data center/server room atmosphere, circuit board macro photography, holographic displays',
        'FINANCE/BUSINESS': 'Corporate luxury aesthetic, modern glass office buildings, executive boardroom atmosphere, premium materials (marble, gold, leather), professional attire, power-dressing, stock exchange energy',
        'FITNESS/HEALTH': 'Athletic dynamic shots, gym atmosphere with dramatic lighting, sweat and determination, muscular definition, healthy vibrant food photography, medical/professional clean aesthetic',
        'BEAUTY/FASHION': 'High fashion editorial style, soft glamour lighting, luxury cosmetic textures, runway atmosphere, beauty macro shots, elegant minimalist composition, Vogue magazine aesthetic',
        'EDUCATION/SCIENCE': 'Academic library atmosphere, laboratory with scientific equipment, chalkboard with complex equations, microscope macro shots, clean research facility aesthetic, scholarly warm lighting',
        'COOKING/FOOD': 'Gourmet food photography, steam and sizzle action shots, rustic kitchen atmosphere, fresh ingredients overhead flat lay, dramatic plating presentation, warm inviting restaurant lighting',
        'MUSIC/ARTS': 'Concert stage dramatic lighting, recording studio atmosphere, instruments in spotlight, artistic creative process, gallery exhibition aesthetic, vibrant creative energy',
        'TRAVEL/ADVENTURE': 'National Geographic documentary style, dramatic landscapes, golden hour adventure, aerial drone photography, cultural authentic moments, wanderlust atmosphere',
        'NEWS/DRAMA/STORY': 'Breaking news urgency, dramatic investigative atmosphere, documentary realism, high-stakes tension, journalistic integrity aesthetic, truth-revealing spotlight',
    };
    return guides[primaryTopic] || 'Professional cinematic style, clean composition, balanced lighting, editorial quality, 8k detail';
}

/**
 * Enhanced fallback image prompt generator — produces much better results than the old keyword matcher.
 * Used when LLM is unavailable. Uses mood, topic, and content analysis.
 */
function generateEnhancedImagePrompt(
    text: string,
    topicInfo: { primaryTopic: string; matchedKeywords: string[] },
    mood: VideoMood
): string {
    const lower = text.toLowerCase();
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    const keyPhrase = words.slice(0, 5).join(' ');
    
    const moodLighting: Record<VideoMood, string> = {
        triumphant: 'golden hour sunlight streaming through clouds, dramatic lens flare, warm amber glow',
        dramatic: 'harsh chiaroscuro lighting, deep shadows cutting across the frame, moody atmosphere',
        calm: 'soft diffused morning light, gentle pastel sky, peaceful serenity',
        energetic: 'vibrant neon lights, dynamic motion, electric energy crackling',
        mysterious: 'volumetric fog illuminated by a single light source, deep shadows, enigmatic atmosphere',
        warm: 'warm tungsten light, cozy golden glow, intimate soft focus',
        dark: 'low-key dramatic lighting, cold desaturated tones, stark shadows',
        futuristic: 'cool blue holographic light, sleek metallic reflections, cyberpunk neon glow',
        nostalgic: 'warm sun-bleached film look, gentle lens flare, vintage color palette',
        neutral: 'balanced studio lighting, clean professional look, crisp shadows',
    };

    // ----- Build a scene description UNIQUE to this segment's actual words -----
    // Map individual content words to concrete visual elements
    const visualElements: Record<string, string> = {
        money: 'stacks of golden coins and currency bills', revenue: 'rising financial bar chart', profit: 'gleaming gold bars',
        income: 'flowing stream of golden light', dollar: 'crisp hundred dollar bills', cash: 'briefcase full of cash',
        growth: 'a dramatic upward-trending arrow piercing through clouds', grow: 'a seedling growing into a massive tree in time-lapse',
        success: 'a glowing trophy on a pedestal', achieve: 'a runner crossing a finish line',
        rocket: 'a rocket launching with fiery exhaust trail', launch: 'a countdown clock reaching zero with sparks flying',
        brain: 'a luminous brain with electric synapses firing', think: 'a silhouette surrounded by floating lightbulbs',
        idea: 'a single lightbulb igniting with brilliant golden light', smart: 'holographic data flowing around a head silhouette',
        code: 'lines of glowing code cascading down a dark screen', software: 'a futuristic IDE with holographic debugging',
        tech: 'a sleek circuit board with pulsing blue light traces', digital: 'digital particles assembling into a geometric shape',
        fire: 'intense flames dancing against a dark background', hot: 'glowing embers and sparks rising in the heat',
        power: 'an energy surge radiating from a central source', energy: 'electric arcs between two tesla coils',
        earth: 'planet Earth viewed from space with aurora borealis', world: 'a spinning globe with golden trade routes',
        mountain: 'a snow-capped mountain peak at sunrise', climb: 'a climber reaching a summit silhouetted against sunset',
        ocean: 'massive turquoise ocean waves crashing dramatically', water: 'crystal clear water with sunlight refracting through',
        love: 'a warm glowing heart surrounded by soft light', heart: 'a beating heart made of light particles',
        celebrate: 'golden confetti exploding in slow motion', win: 'a champion raising a trophy with stadium spotlights',
        protect: 'a glowing shield deflecting incoming particles', safe: 'a secure vault door with golden light behind it',
        time: 'an elegant clock face with hands frozen in motion', fast: 'light streaks of a car at high speed on a highway',
        learn: 'an ancient library with sunlight streaming through windows', education: 'floating books with pages turning magically',
        music: 'sound waves visualized as colorful flowing ribbons', art: 'a paintbrush creating vibrant strokes on canvas',
        food: 'a gourmet dish with steam rising dramatically', cook: 'flames leaping from a chef\'s pan in a professional kitchen',
        travel: 'a winding road leading into a breathtaking mountain valley', adventure: 'a lone explorer on a cliff edge at golden hour',
        city: 'a modern city skyline reflecting in water at twilight', building: 'a futuristic glass skyscraper reaching into clouds',
        team: 'diverse hands joining together from above', people: 'a crowd of silhouettes under a dramatic sky',
        star: 'a brilliant star exploding in a supernova', galaxy: 'a spiral galaxy with billions of glowing stars',
        secret: 'a mysterious locked chest with light escaping through cracks', mystery: 'fog-shrouded forest with a single beam of light',
        game: 'a neon-lit gaming controller with RGB reflections', play: 'colorful game elements floating in zero gravity',
        science: 'a DNA double helix spiraling with bioluminescent light', research: 'a microscope revealing glowing cells',
        network: 'glowing interconnected nodes forming a web pattern', connect: 'two glowing hands reaching toward each other',
        data: 'holographic data streams flowing through a futuristic corridor', cloud: 'a luminous cloud computing infrastructure',
        invest: 'a hand planting a golden seed that sprouts into a tree of coins', stock: 'a dramatic candlestick chart with green candles rising',
        health: 'a human body silhouette radiating vibrant health energy', fitness: 'an athlete mid-jump with perfect form',
        nature: 'lush green forest with light filtering through canopy', tree: 'a majestic ancient tree with sunlight rays through its branches',
    };

    // Collect concrete visual elements from the actual segment text
    const matchedVisuals: string[] = [];
    for (const word of words) {
        if (visualElements[word] && !matchedVisuals.includes(visualElements[word])) {
            matchedVisuals.push(visualElements[word]);
            if (matchedVisuals.length >= 2) break; // cap at 2 for focused imagery
        }
    }

    let sceneDescription: string;
    if (matchedVisuals.length > 0) {
        // Build scene from the actual words in the segment
        sceneDescription = `A cinematic composition featuring ${matchedVisuals.join(' alongside ')}, professional composition with depth and atmosphere`;
    } else if (keyPhrase) {
        // No keyword hits — use the segment's own key phrase as the visual subject
        sceneDescription = `A visually stunning cinematic scene depicting "${keyPhrase}", rendered as a photorealistic still from a premium documentary, dramatic composition with leading lines`;
    } else {
        sceneDescription = `An abstract cinematic visual with flowing light particles, professional composition, premium feel`;
    }
    
    const lighting = moodLighting[mood] || moodLighting.neutral;
    const styleGuide = getTopicStyleGuide(topicInfo.primaryTopic);
    
    return `${sceneDescription}, ${lighting}, ${styleGuide}, cinematic lighting, hyperrealistic, professional color grading, 8k, high detail, shallow depth of field`;
}

/**
 * Generate a Pollinations URL using the enhanced prompt system (non-async fallback)
 */
function generatePollinationsUrlFromText(
    text: string,
    topicInfo: { primaryTopic: string; matchedKeywords: string[] },
    seed: number
): string {
    const mood = detectSegmentMood(text);
    const prompt = generateEnhancedImagePrompt(text, topicInfo, mood);
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${seed}`;
}

/**
 * Derive a text-only image prompt (for storage in props) without async calls
 */
function deriveImagePromptFromText(
    text: string,
    topicInfo: { primaryTopic: string; matchedKeywords: string[] }
): string {
    const mood = detectSegmentMood(text);
    return generateEnhancedImagePrompt(text, topicInfo, mood);
}

// ==================== IMAGE GENERATION API ====================

async function generateErnieImageUrl(prompt: string, seed: number): Promise<string> {
    const ERNIE_API_BASE = 'https://paddlepaddle-ernie-image.ms.fun';
    
    console.log('[Ernie] Generating image for prompt:', prompt.substring(0, 100));
    
    try {
        const initiateResponse = await fetch(`${ERNIE_API_BASE}/gradio_api/call/generate_image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: [
                    prompt,
                    "",
                    1024,
                    768,
                    seed,
                    8,
                    1
                ]
            }),
        });

        if (!initiateResponse.ok) {
            console.warn('[Ernie] Failed to initiate:', initiateResponse.status);
            return generatePollinationsUrl(prompt, seed);
        }

        const initiateText = await initiateResponse.text();
        
        let eventId: string;
        try {
            const initiateData = JSON.parse(initiateText);
            eventId = initiateData.event_id;
        } catch {
            const match = initiateText.match(/"event_id"\s*:\s*"([^"]+)"/);
            if (match) {
                eventId = match[1];
            } else {
                console.warn('[Ernie] Could not parse event_id:', initiateText);
                return generatePollinationsUrl(prompt, seed);
            }
        }

        if (!eventId) {
            console.warn('[Ernie] No event_id received');
            return generatePollinationsUrl(prompt, seed);
        }

        console.log('[Ernie] Got event_id:', eventId);

        const resultUrl = `${ERNIE_API_BASE}/gradio_api/call/generate_image/${eventId}`;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let imageUrl: string | null = null;
        
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                console.log(`[Ernie] Fetching result, attempt ${attempt + 1}...`);
                const resultResponse = await fetch(resultUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/event-stream',
                    },
                });

                if (!resultResponse.ok) {
                    console.warn(`[Ernie] Attempt ${attempt + 1} failed: ${resultResponse.status}`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }

                const resultText = await resultResponse.text();
                console.log(`[Ernie] Response: ${resultText.substring(0, 200)}`);
                
                if (resultText.includes('event: complete')) {
                    const dataMatch = resultText.match(/data:\s*(\[.*\])/);
                    if (dataMatch) {
                        try {
                            const jsonData = JSON.parse(dataMatch[1]);
                            if (Array.isArray(jsonData) && jsonData[0]?.url) {
                                imageUrl = jsonData[0].url;
                                console.log('[Ernie] Successfully extracted URL:', imageUrl);
                                break;
                            }
                        } catch (parseError) {
                            console.warn('[Ernie] JSON parse error:', parseError);
                        }
                    }
                }
                
                if (!imageUrl) {
                    const urlMatch = resultText.match(/"url"\s*:\s*"([^"]+)"/);
                    if (urlMatch) {
                        imageUrl = urlMatch[1];
                        console.log('[Ernie] Extracted URL via regex:', imageUrl);
                        break;
                    }
                }
                
                if (resultText.includes('event: generating') || !resultText.includes('event:')) {
                    console.log('[Ernie] Still generating, waiting...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (fetchError) {
                console.warn(`[Ernie] Fetch error:`, fetchError);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        if (imageUrl) {
            console.log('[Ernie] Success! Got image URL:', imageUrl.substring(0, 80));
            
            console.log('[Ernie] Downloading image content...');
            try {
                const imageResponse = await fetch(imageUrl);
                
                if (imageResponse.ok) {
                    const imageBuffer = await imageResponse.arrayBuffer();
                    const base64 = Buffer.from(imageBuffer).toString('base64');
                    const mimeType = imageResponse.headers.get('content-type') || 'image/webp';
                    const dataUrl = `data:${mimeType};base64,${base64}`;
                    
                    console.log('[Ernie] Image downloaded, size:', imageBuffer.byteLength, 'bytes');
                    return dataUrl;
                } else {
                    console.warn('[Ernie] Failed to download image:', imageResponse.status);
                }
            } catch (downloadError) {
                console.warn('[Ernie] Download error:', downloadError);
            }
            
            console.warn('[Ernie] Using Pollinations fallback due to download failure');
            return generatePollinationsUrl(prompt, seed);
        }

        console.warn('[Ernie] No image URL found, using Pollinations fallback');
        return generatePollinationsUrl(prompt, seed);
        
    } catch (error) {
        console.error('[Ernie] Error:', error);
        return generatePollinationsUrl(prompt, seed);
    }
}

function generatePollinationsUrl(prompt: string, seed: number): string {
    const encodedPrompt = encodeURIComponent(`${prompt}`);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${seed}`;
}

function hasVisualKeyword(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (lower.length < 5) return false;
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 1);
    if (words.length < 2) return false;
    const fillerPhrases = ['um', 'uh', 'like', 'you know', 'so yeah', 'and then', 'okay so'];
    if (fillerPhrases.some(f => lower === f)) return false;
    return true;
}

function pickSceneFromText(text: string, index: number, lastScene?: string): string {
    const lower = text.toLowerCase();
    const allWords = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length >= 2);

    const sceneScores: Record<string, number> = {};
    for (const word of allWords) {
        const scene = CONTENT_SCENE_MAP[word];
        if (scene) {
            sceneScores[scene] = (sceneScores[scene] || 0) + 1;
        }
    }

    const scoredScenes = Object.entries(sceneScores)
        .filter(([scene]) => scene !== lastScene)
        .sort((a, b) => b[1] - a[1]);

    if (scoredScenes.length > 0) {
        return scoredScenes[0][0];
    }

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

// ==================== MULTI-PROVIDER API ROUTING ====================

function buildProviderRequest(
    apiEndpoint: string,
    apiKey: string,
    modelId: string,
    prompt: string
): { url: string; headers: Record<string, string>; body: Record<string, unknown> } {
    
    const modelMap: Record<string, Record<string, string>> = {
        anthropic: {
            'anthropic/claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
            'anthropic/claude-sonnet-4-6': 'claude-sonnet-4-6',
            'anthropic/claude-opus-4-6': 'claude-opus-4-6',
            'anthropic/claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',
        },
        openai: {
            'openai/gpt-5-nano': 'gpt-5-nano',
            'openai/gpt-5': 'gpt-5',
            'openai/gpt-5.2-2025-12-11': 'gpt-5.2-2025-12-11',
            'openai/o3': 'o3',
            'openai/o4-mini': 'o4-mini',
        },
        google: {
            'google/gemini-3-flash-preview': 'gemini-3-flash-preview',
            'google/gemini-3-pro-preview': 'gemini-3-pro-preview',
        },
        deepseek: {
            'lightning-ai/DeepSeek-V3.1': 'deepseek-chat',
            'deepseek/deepseek-v3': 'deepseek-chat',
        },
    };

    let provider = 'lightning';
    if (modelId.startsWith('anthropic/')) provider = 'anthropic';
    else if (modelId.startsWith('openai/')) provider = 'openai';
    else if (modelId.startsWith('google/')) provider = 'google';
    else if (modelId.startsWith('deepseek/') || modelId === 'lightning-ai/DeepSeek-V3.1') provider = 'deepseek';
    else if (modelId.includes('kimi')) provider = 'moonshot';
    else if (modelId.startsWith('lightning-ai/')) provider = 'lightning';

    switch (provider) {
        case 'anthropic':
            return {
                url: apiEndpoint,
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                body: {
                    model: modelMap.anthropic?.[modelId] || 'claude-sonnet-4-6',
                    max_tokens: 4096,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                },
            };

        case 'openai':
            return {
                url: apiEndpoint,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: {
                    model: modelMap.openai?.[modelId] || 'gpt-5',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 4096,
                },
            };

        case 'google':
            const geminiModel = modelMap.google?.[modelId] || 'gemini-3-flash-preview';
            return {
                url: `${apiEndpoint}/${geminiModel}:generateContent`,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: {
                    contents: [
                        { parts: [{ text: prompt }] }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4096,
                    },
                },
            };

        case 'moonshot':
            return {
                url: apiEndpoint,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: {
                    model: 'kimi-k2.5',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 4096,
                },
            };

        case 'deepseek':
            return {
                url: apiEndpoint,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: {
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 4096,
                },
            };

        case 'lightning':
        default:
            return {
                url: apiEndpoint,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: {
                    model: modelId,
                    messages: [
                        { role: 'user', content: [{ type: 'text', text: prompt }] }
                    ],
                },
            };
    }
}

function extractContentFromResponse(data: unknown, provider: string): string | null {
    if (!data || typeof data !== 'object') return null;

    const response = data as Record<string, unknown>;

    switch (provider) {
        case 'anthropic':
            const anthropicContent = response.content as Array<{ type: string; text?: string }> | undefined;
            if (Array.isArray(anthropicContent)) {
                const textBlock = anthropicContent.find((block) => block.type === 'text');
                return textBlock?.text || null;
            }
            return null;

        case 'google':
            const candidates = response.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
            if (Array.isArray(candidates) && candidates[0]?.content?.parts) {
                return candidates[0].content.parts[0]?.text || null;
            }
            return null;

        case 'openai':
        case 'moonshot':
        case 'deepseek':
        case 'lightning':
        default:
            const choices = response.choices as Array<{ message?: { content?: string | null } }> | undefined;
            if (Array.isArray(choices) && choices.length > 0 && choices[0]?.message?.content) {
                return choices[0].message.content;
            }
            if (choices && choices.length > 0 && typeof choices[0].message?.content === 'string') {
                return choices[0].message.content;
            }
            return null;
    }
}

function buildCustomApiRequest(
    config: { baseUrl: string; apiKey: string; model: string; authHeader?: string; authPrefix?: string },
    prompt: string
): { url: string; headers: Record<string, string>; body: Record<string, unknown> } {
    const { baseUrl, apiKey, model, authHeader = 'Authorization', authPrefix = 'Bearer' } = config;
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    if (authHeader && apiKey) {
        const authValue = authPrefix ? `${authPrefix} ${apiKey}` : apiKey;
        headers[authHeader] = authValue;
    }
    
    let url = baseUrl;
    
    if (!url.includes('/chat/completions') && !url.includes('/generateContent') && !url.includes('/api/chat')) {
        if (baseUrl.includes('ollama')) {
            url = `${baseUrl}`;
        } else if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            url = baseUrl.endsWith('/') ? `${baseUrl}v1/chat/completions` : `${baseUrl}/v1/chat/completions`;
        } else {
            url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
        }
    }
    
    const body: Record<string, unknown> = {
        model: model,
        messages: [
            { role: 'user', content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.7,
    };
    
    return { url, headers, body };
}