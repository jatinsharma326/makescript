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
    // Generate a UNIQUE session ID for this request to force fresh AI generation
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const subtitleList = subtitles
        .map((s) => `[${s.id}] "${s.text}" (${s.startTime}s - ${s.endTime}s)`)
        .join('\n');

    // Detect video topic from FULL transcript for context-aware scene matching
    const fullTranscript = subtitles.map(s => s.text).join(' ').toLowerCase();
    const videoTopic = detectVideoTopic(fullTranscript);
    
    // Create unique segment hashes to ensure each segment gets DIFFERENT visuals
    const segmentContexts = subtitles.map(s => {
        const hash = Math.abs(s.text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
        return `${s.id}:uniqueSeed=${hash}`;
    }).join(', ');

    const prompt = `You are a Senior Motion Graphics Director. Create UNIQUE animated overlays for this video.

⚠️ CRITICAL: Session ID ${sessionId} — You MUST generate FRESH, UNIQUE content for THIS specific video. Do NOT reuse previous responses.

VIDEO TOPIC CONTEXT: ${videoTopic}

UNIQUE SEGMENT SEEDS (use these to create different visuals for each segment): ${segmentContexts}

AVAILABLE OVERLAY TYPES:

1. "ai-motion-graphic" — GENERATE A UNIQUE CUSTOM ANIMATED SVG for THIS segment's specific content (USE THIS 40% of the time)
   Props: { "svgContent": "<svg viewBox='0 0 400 300' width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>...</svg>" }
   
   ⚠️ Each SVG must be UNIQUE based on the segment's actual text meaning:
   - If text mentions "Earth rotating around the sun" → Create sun + orbiting earth with rotation animation
   - If text mentions "revenue growth" → Create animated rising bars/graph with numbers
   - If text mentions "brain ideas" → Create neural network with firing synapses
   - If text mentions "rocket launch" → Create rocket with flame trail ascending
   - If text mentions specific numbers/stats → Visualize those exact numbers with animations
   
   The SVG MUST be self-contained with:
   - Transparent background (DO NOT use a background <rect> or <svg style="background:...">)</svg>)
   - Beautiful colors matching the segment's topic
   - Smooth <animate> or <animateTransform> SMIL animations
   - Visual elements that DIRECTLY relate to what the speaker is saying

2. "ai-generated-image" (25%) — Generate a unique image URL based on segment content
   Props: { "imageUrl": "https://image.pollinations.ai/prompt/...", "caption": "short label" }
   Construct the URL with the segment's text as context: https://image.pollinations.ai/prompt/{encodeURIComponent(segmentText + ', cinematic, professional')}?seed={uniqueSeed}

3. "kinetic-text" (30%) Props: { "text": "Phrase from segment", "color": "#hex", "style": "pop"|"slide"|"bounce", "position": "center"|"top"|"bottom", "fontSize": 42 }
4. "emoji-reaction" (5%) Props: { "emoji": "🔥", "size": 70 }

⚠️ MANDATORY RULES:
1. EACH overlay must be UNIQUE to its segment — match the ACTUAL content being spoken
2. ONLY overlay 25-35% of segments — skip filler and generic sentences
3. Never put overlays on consecutive segments — space them out
4. Vary overlay types across the video
5. For "ai-motion-graphic", the SVG content MUST reflect the specific words/numbers in that segment

Transcript Segments:
${subtitleList}

Return JSON array:
[{ "segmentId": string, "type": "ai-motion-graphic"|"ai-generated-image"|"kinetic-text"|"emoji-reaction", "props": { ... } }]`;

    const MAX_RETRIES = 1;
    const RETRY_DELAY_MS = 500;

    // Model info type
    type ModelInfo = {
        name: string;
        model: string;
        provider: string;
        isCustom?: boolean;
    };

    // Default fallback models (Lightning AI format)
    const fallbackModels: ModelInfo[] = [
        { name: 'DeepSeek V3.1', model: 'lightning-ai/DeepSeek-V3.1', provider: 'deepseek' },
        { name: 'OpenAI o3', model: 'openai/o3', provider: 'openai' },
        { name: 'OpenAI o4-mini', model: 'openai/o4-mini', provider: 'openai' },
    ];

    // If a specific model was requested, try it first
    const requestedProvider = requestedModel ? getModelProvider(requestedModel) : 'lightning';
    
    // Check if it's a custom API
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
                
                // Check if this is a custom API
                if (modelInfo.isCustom) {
                    // Use the model ID to look up the custom config
                    customConfig = getCustomApiConfig(modelInfo.model);
                    if (!customConfig) {
                        // Try looking up by model name as fallback
                        customConfig = CUSTOM_APIS.find(api => api.model === modelInfo.model || api.name === modelInfo.name);
                    }
                    if (!customConfig) {
                        console.warn(`[AI Suggest] Custom API config not found: ${modelInfo.model}`);
                        break;
                    }
                    apiEndpoint = customConfig.baseUrl;
                    apiKey = customConfig.apiKey;
                } else {
                    // Get the appropriate API endpoint and key for this provider
                    apiEndpoint = getApiEndpoint(modelInfo.provider);
                    apiKey = getApiKey(modelInfo.provider);
                }
                
                if (!apiKey && !modelInfo.isCustom) {
                    console.warn(`[AI Suggest] No API key for provider: ${modelInfo.provider}, skipping...`);
                    break;
                }

                // Build the request based on provider
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

// Store the detected video topic globally for the request (used by image prompt generation)
let currentVideoTopic: { primaryTopic: string; matchedKeywords: string[] } = { primaryTopic: 'general', matchedKeywords: [] };

async function generateLocalMotionGraphics(subtitles: SubtitleInput[]): Promise<OverlaySuggestion[]> {
    const results: OverlaySuggestion[] = [];
    
    // Generate a unique session seed for this video to ensure fresh content
    const sessionSeed = Date.now() % 100000;
    
    // Detect video topic from full transcript for context-aware image generation
    const fullTranscriptText = subtitles.map(s => s.text).join(' ');
    const topicInfo = detectVideoTopicDetailed(fullTranscriptText);
    currentVideoTopic = topicInfo;
    console.log('[LocalMotion] Detected video topic:', topicInfo.primaryTopic, 'keywords:', topicInfo.matchedKeywords.slice(0, 5));
    
    let overlayCount = 0;
    
    // Track last used scenes to avoid repetition
    let lastUsedSceneType = '';

    // Score each segment for relevance
    const scored = subtitles.map((seg, index) => ({
        seg,
        index,
        score: scoreSegmentRelevanceServer(seg.text),
    }));

    // Pick top ~30% most relevant
    const maxOverlays = Math.max(2, Math.floor(subtitles.length * 0.30));
    const topSegments = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxOverlays);

    // Enforce minimum gap of 2 segments
    const overlayIndices = new Set<number>();
    const sortedByIndex = topSegments.sort((a, b) => a.index - b.index);
    let lastIdx = -3;
    for (const entry of sortedByIndex) {
        if (entry.index - lastIdx >= 2) {
            overlayIndices.add(entry.index);
            lastIdx = entry.index;
        }
    }

    // First, collect all segments that need AI-generated images
    // We'll generate them all in parallel for faster processing
    const imageGenerationTasks: { index: number; seg: SubtitleInput; uniqueSeed: number; label: string }[] = [];
    
    for (let index = 0; index < subtitles.length; index++) {
        if (!overlayIndices.has(index)) continue;
        const seg = subtitles[index];
        const segmentHash = hashString(seg.text);
        const uniqueSeed = (sessionSeed + segmentHash + index) % 1000000;
        const label = extractLabelFromText(seg.text);

        // Count overlay position to determine type
        const overlayPosition = [...overlayIndices].filter(i => i <= index).length - 1;
        const slot = overlayPosition % 10;

        // Slots 0, 2, 5, 8 need AI-generated images
        if (slot === 0 || slot === 2 || slot === 5 || slot === 8) {
            imageGenerationTasks.push({ index, seg, uniqueSeed, label });
        }
    }
    
    // Generate ALL AI images in PARALLEL (concurrently) for much faster processing
    console.log(`[Ernie] Starting parallel generation of ${imageGenerationTasks.length} images...`);
    
    const imageResults: Map<number, string> = new Map();
    
    if (imageGenerationTasks.length > 0) {
        // Run all image generation requests concurrently
        const imagePromises = imageGenerationTasks.map(async ({ index, seg, uniqueSeed }) => {
            const imagePrompt = generateImagePromptFromText(seg.text);
            console.log(`[Ernie] Generating image for segment ${seg.id}...`);
            const imageUrl = await generateErnieImageUrl(imagePrompt, uniqueSeed);
            return { index, imageUrl };
        });
        
        // Wait for all images to complete (but in parallel)
        const settledResults = await Promise.allSettled(imagePromises);
        
        for (const result of settledResults) {
            if (result.status === 'fulfilled') {
                imageResults.set(result.value.index, result.value.imageUrl);
                console.log(`[Ernie] Image ready for index ${result.value.index}`);
            } else {
                console.warn('[Ernie] Image generation failed:', result.reason);
            }
        }
        
        console.log(`[Ernie] Completed ${imageResults.size}/${imageGenerationTasks.length} image generations`);
    }
    
    // Now build the overlay suggestions using the pre-generated images
    for (let index = 0; index < subtitles.length; index++) {
        if (!overlayIndices.has(index)) continue;
        const seg = subtitles[index];

        // Generate a unique seed for THIS segment based on its content + session
        const segmentHash = hashString(seg.text);
        const uniqueSeed = (sessionSeed + segmentHash + index) % 1000000;
        
        const color = getProColor(uniqueSeed);
        const label = extractLabelFromText(seg.text);

        // Mix overlay types with UNIQUE content per segment:
        // - ai-generated-image (40%): Dynamic B-roll image with segment-specific prompt
        // - kinetic-text (30%): Text animation with segment's key phrase
        // - transcript-motion (20%): Transcript animation
        // - emoji-reaction (10%): Contextual emoji
        const slot = overlayCount % 10;
        let overlay: OverlaySuggestion;

        switch (slot) {
            case 0:
            case 2:
            case 5:
            case 8: {
                // AI-GENERATED IMAGE - use pre-generated image from parallel batch
                const imagePrompt = generateImagePromptFromText(seg.text);
                // Get the pre-generated image URL (or fallback if failed)
                const imageUrl = imageResults.get(index) || generatePollinationsUrl(imagePrompt, uniqueSeed);
                
                overlay = {
                    segmentId: seg.id,
                    type: 'ai-generated-image',
                    props: {
                        imageUrl,
                        caption: label || seg.text.substring(0, 40),
                        seed: uniqueSeed,
                        imagePrompt,
                    },
                };
                lastUsedSceneType = 'ai-generated-image';
                break;
            }

            case 1:
            case 3:
            case 4:
            case 6:
            case 7: {
                // Kinetic text - use segment's extracted label
                const kineticStyles = ['pop', 'slide', 'bounce'];
                const positions = ['center', 'top', 'bottom'];
                overlay = {
                    segmentId: seg.id,
                    type: 'kinetic-text',
                    props: {
                        text: label || seg.text.substring(0, 30),
                        color,
                        style: kineticStyles[uniqueSeed % kineticStyles.length],
                        position: positions[uniqueSeed % positions.length],
                        fontSize: 42,
                    },
                };
                lastUsedSceneType = 'kinetic-text';
                break;
            }

            case 9:
            default: {
                // Emoji reaction - pick contextual emoji from segment text
                const emoji = pickEmojiFromText(seg.text);
                const fallbackEmojis = ['🔥', '⚡', '🎯', '💡', '🚀', '💎', '✨', '💪', '🎉', '📈'];
                overlay = {
                    segmentId: seg.id,
                    type: 'emoji-reaction',
                    props: {
                        emoji: emoji || fallbackEmojis[uniqueSeed % fallbackEmojis.length],
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

/**
 * Score segment relevance for server-side overlay generation.
 * Higher score = more visually relevant.
 */
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

/** Generate a vivid image prompt directly from transcript text for Ernie API
 *  Incorporates the detected video topic to ensure images match the video's context
 */
function generateImagePromptFromText(text: string): string {
    // Clean up the text and use it directly as the visual scene description
    const cleaned = text.replace(/[^\w\s,.!?'-]/g, '').trim();
    
    // Get the video's topic context for relevant image generation
    const { primaryTopic, matchedKeywords } = currentVideoTopic;
    
    // Build topic-specific context prefix for the image prompt
    // This ensures images match the VIDEO's overall theme, not just the segment text
    let topicContext = '';
    
    if (primaryTopic === 'GAMING/ENTERTAINMENT') {
        // For gaming videos (Roblox, Minecraft, etc.), explicitly mention the game context
        const gameKeywords = matchedKeywords.filter(k => 
            ['roblox', 'minecraft', 'fortnite', 'pokemon', 'game', 'player', 'character', 'level', 'boss', 'obby', 'simulator', 'tycoon', 'gameplay', 'gaming', 'avatar', 'npc', 'lobby', 'server', 'skin'].includes(k)
        );
        if (gameKeywords.length > 0) {
            // Use the specific game mentioned in the video
            topicContext = `${gameKeywords[0]} game screenshot, video game scene, `;
        } else {
            topicContext = 'video game scene, gaming content, ';
        }
    } else if (primaryTopic === 'TECHNOLOGY/CODING') {
        topicContext = 'technology, coding screen, software development, ';
    } else if (primaryTopic === 'FINANCE/BUSINESS') {
        topicContext = 'business, financial, professional setting, ';
    } else if (primaryTopic === 'FITNESS/HEALTH') {
        topicContext = 'fitness, workout, gym scene, ';
    } else if (primaryTopic === 'BEAUTY/FASHION') {
        topicContext = 'beauty, fashion, style, ';
    } else if (primaryTopic === 'EDUCATION/SCIENCE') {
        topicContext = 'education, science, learning, ';
    } else if (primaryTopic === 'COOKING/FOOD') {
        topicContext = 'cooking, food, kitchen scene, ';
    } else if (primaryTopic === 'MUSIC/ARTS') {
        topicContext = 'music, artistic, creative scene, ';
    } else if (primaryTopic === 'TRAVEL/ADVENTURE') {
        topicContext = 'travel, adventure, destination, ';
    } else if (primaryTopic === 'NEWS/DRAMA/STORY') {
        topicContext = 'news, dramatic scene, ';
    }
    
    // Use the actual transcript text as the core of the prompt, with topic context
    if (cleaned.length > 10) {
        return `${topicContext}${cleaned}, professional, cinematic lighting, high quality`;
    }

    return `${topicContext}professional scene, cinematic lighting, high quality`;
}



/**
 * Generate image using PaddlePaddle Ernie Image API
 * Falls back to Pollinations.ai if Ernie fails
 * The API returns results quickly (1-2 seconds) with SSE format:
 * event: complete
 * data: [{"path": "...", "url": "..."}]
 */
async function generateErnieImageUrl(prompt: string, seed: number): Promise<string> {
    const ERNIE_API_BASE = 'https://paddlepaddle-ernie-image.ms.fun';
    
    console.log('[Ernie] Generating image for prompt:', prompt.substring(0, 100));
    
    try {
        // Step 1: Call the Gradio API to get an event_id
        const initiateResponse = await fetch(`${ERNIE_API_BASE}/gradio_api/call/generate_image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: [
                    prompt,  // First parameter - the image prompt for context-specific generation
                    "",  // Second parameter (negative prompt - keep empty)
                    1024, // width
                    768,  // height
                    seed,
                    8,    // steps
                    1     // guidanceScale
                ]
            }),
        });

        if (!initiateResponse.ok) {
            console.warn('[Ernie] Failed to initiate:', initiateResponse.status);
            return generatePollinationsUrl(prompt, seed);
        }

        const initiateText = await initiateResponse.text();
        
        // Parse the response to get event_id: {"event_id":"xxx"}
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

        // Step 2: Fetch the result - Ernie returns result quickly (within 1-2 seconds)
        const resultUrl = `${ERNIE_API_BASE}/gradio_api/call/generate_image/${eventId}`;
        
        // Wait just 1 second for the image to be generated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let imageUrl: string | null = null;
        
        // Try fetching the result (may need a couple attempts if still generating)
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
                
                // Parse SSE format: "event: complete\ndata: [{...}]"
                // The URL is in the data JSON array
                if (resultText.includes('event: complete')) {
                    // Extract the JSON data after "data:"
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
                
                // Fallback regex extraction if JSON parsing fails
                if (!imageUrl) {
                    const urlMatch = resultText.match(/"url"\s*:\s*"([^"]+)"/);
                    if (urlMatch) {
                        imageUrl = urlMatch[1];
                        console.log('[Ernie] Extracted URL via regex:', imageUrl);
                        break;
                    }
                }
                
                // If still generating, wait a bit more
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
            
            // Download the actual image from Ernie
            // This is critical - Remotion can't load external URLs due to CORS
            console.log('[Ernie] Downloading image content...');
            try {
                const imageResponse = await fetch(imageUrl);
                
                if (imageResponse.ok) {
                    const imageBuffer = await imageResponse.arrayBuffer();
                    const base64 = Buffer.from(imageBuffer).toString('base64');
                    const mimeType = imageResponse.headers.get('content-type') || 'image/webp';
                    const dataUrl = `data:${mimeType};base64,${base64}`;
                    
                    console.log('[Ernie] Image downloaded, size:', imageBuffer.byteLength, 'bytes');
                    return dataUrl;  // Return base64 data URL
                } else {
                    console.warn('[Ernie] Failed to download image:', imageResponse.status);
                }
            } catch (downloadError) {
                console.warn('[Ernie] Download error:', downloadError);
            }
            
            // If download failed, fall back to Pollinations
            console.warn('[Ernie] Using Pollinations fallback due to download failure');
            return generatePollinationsUrl(prompt, seed);
        }

        // If no URL found, use Pollinations fallback
        console.warn('[Ernie] No image URL found, using Pollinations fallback');
        return generatePollinationsUrl(prompt, seed);
        
    } catch (error) {
        console.error('[Ernie] Error:', error);
        return generatePollinationsUrl(prompt, seed);
    }
}

/**
 * Generate Pollinations.ai image URL (fallback)
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

// ==================== MULTI-PROVIDER API ROUTING ====================

/**
 * Build API request based on the provider type
 */
function buildProviderRequest(
    apiEndpoint: string,
    apiKey: string,
    modelId: string,
    prompt: string
): { url: string; headers: Record<string, string>; body: Record<string, unknown> } {
    
    // Map model IDs to provider-specific model names
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

    // Determine the provider from the model ID
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
            // Google Gemini uses a different format
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
            // Moonshot (Kimi) API
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
            // Lightning AI format (unified gateway)
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

/**
 * Extract content from API response based on provider
 */
function extractContentFromResponse(data: unknown, provider: string): string | null {
    if (!data || typeof data !== 'object') return null;

    const response = data as Record<string, unknown>;

    switch (provider) {
        case 'anthropic':
            // Anthropic response format
            const anthropicContent = response.content as Array<{ type: string; text?: string }> | undefined;
            if (Array.isArray(anthropicContent)) {
                const textBlock = anthropicContent.find((block) => block.type === 'text');
                return textBlock?.text || null;
            }
            return null;

        case 'google':
            // Google Gemini response format
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
            // OpenAI/Lightning format
            const choices = response.choices as Array<{ message?: { content?: string | null } }> | undefined;
            if (Array.isArray(choices) && choices.length > 0 && choices[0]?.message?.content) {
                return choices[0].message.content;
            }
            // Handle string content (some endpoints return directly)
            if (choices && choices.length > 0 && typeof choices[0].message?.content === 'string') {
                return choices[0].message.content;
            }
            return null;
    }
}

/**
 * Build custom API request for user-defined endpoints
 * Supports any OpenAI-compatible API
 */
function buildCustomApiRequest(
    config: { baseUrl: string; apiKey: string; model: string; authHeader?: string; authPrefix?: string },
    prompt: string
): { url: string; headers: Record<string, string>; body: Record<string, unknown> } {
    const { baseUrl, apiKey, model, authHeader = 'Authorization', authPrefix = 'Bearer' } = config;
    
    // Build auth header
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    if (authHeader && apiKey) {
        const authValue = authPrefix ? `${authPrefix} ${apiKey}` : apiKey;
        headers[authHeader] = authValue;
    }
    
    // Check if it's a custom endpoint (may have different URL format)
    let url = baseUrl;
    
    // Check if URL already contains the path
    if (!url.includes('/chat/completions') && !url.includes('/generateContent') && !url.includes('/api/chat')) {
        // Append appropriate path based on common patterns
        if (baseUrl.includes('ollama')) {
            // Ollama local API
            url = `${baseUrl}`;
        } else if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            // Local APIs like LM Studio
            url = baseUrl.endsWith('/') ? `${baseUrl}v1/chat/completions` : `${baseUrl}/v1/chat/completions`;
        } else {
            // Default to OpenAI-compatible endpoint
            url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
        }
    }
    
    // Build request body (OpenAI-compatible format)
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
