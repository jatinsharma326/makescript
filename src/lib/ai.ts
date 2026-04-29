// AI integration for auto-suggesting overlays
// Uses DeepSeek V3.1 via the /api/suggest-overlays server-side route
// Falls back to local keyword matching if API fails
// Now supports AI-generated images based on script content analysis

import { SubtitleSegment, OverlayConfig, EditingPlan, VideoFilters } from './types';
import type { VideoAnalysisResult } from './aiAnalysis';
import { analyzeAllSentiments, calculateAllEngagementScores } from './aiAnalysis';

// Enhanced scene descriptors for generating dynamic prompts
const SCENE_DESCRIPTORS: { concept: string; promptTemplate: string; style: string }[] = [
    {
        concept: 'earth',
        promptTemplate: 'Planet Earth viewed from space, blue oceans and swirling white clouds, sunlight reflecting off the atmosphere, cinematic lighting, high detail',
        style: 'cinematic photography'
    },
    {
        concept: 'growth',
        promptTemplate: 'Abstract upward trending graph with glowing green lines, digital particles rising, futuristic data visualization, dark background',
        style: '3d render'
    },
    {
        concept: 'rocket',
        promptTemplate: 'Rocket launching into space with fiery exhaust trail, dramatic clouds of smoke, cinematic wide angle, golden hour lighting',
        style: 'cinematic photography'
    },
    {
        concept: 'brain',
        promptTemplate: 'Glowing brain with neural network connections, electric blue synapses firing, dark background with particles, futuristic AI concept',
        style: 'digital art'
    },
    {
        concept: 'money',
        promptTemplate: 'Golden coins flowing like a waterfall, motion blur, dark luxurious background, professional financial visualization',
        style: '3d render'
    },
    {
        concept: 'time',
        promptTemplate: 'Elegant vintage clock face with hands moving, time passing concept, warm golden light, shallow depth of field',
        style: 'cinematic photography'
    },
    {
        concept: 'city',
        promptTemplate: 'Modern city skyline at night, skyscrapers with illuminated windows, reflection on water, cinematic urban landscape',
        style: 'cinematic photography'
    },
    {
        concept: 'nature',
        promptTemplate: 'Lush green forest with sunlight rays filtering through leaves, peaceful nature scene, vibrant colors, serene atmosphere',
        style: 'cinematic photography'
    },
    {
        concept: 'technology',
        promptTemplate: 'Futuristic circuit board patterns, blue glowing lines, technology concept, abstract digital background, high tech aesthetic',
        style: 'digital art'
    },
    {
        concept: 'celebration',
        promptTemplate: 'Colorful confetti and sparkles exploding, celebration atmosphere, bright festive lighting, joyful mood',
        style: '3d render'
    },
    {
        concept: 'idea',
        promptTemplate: 'Lightbulb glowing with warm golden light, surrounded by floating sparkles, inspiration concept, dark moody background',
        style: 'cinematic photography'
    },
    {
        concept: 'connection',
        promptTemplate: 'Abstract network of glowing nodes connected by lines, social connections visualization, dark background with blue and purple glow',
        style: 'digital art'
    },
];

// Extended keywords for better matching
const KEYWORD_MAP: Record<string, { prompt: string; style: string }> = {
    // Business & Finance
    'money': { prompt: 'Golden coins flowing like waterfall, dark luxurious background, professional financial visualization, 3d render', style: '3d render' },
    'revenue': { prompt: 'Bar chart growing upward with glowing blue bars, digital particles, futuristic data visualization, dark background', style: '3d render' },
    'profit': { prompt: 'Rising graph line with golden glow, financial success concept, dark background, professional chart', style: '3d render' },
    'sales': { prompt: 'Shopping cart with digital items, modern e-commerce concept, blue and white color scheme, clean lighting', style: 'digital art' },
    'business': { prompt: 'Modern office environment with glass walls, professional corporate setting, warm natural lighting', style: 'cinematic photography' },
    'company': { prompt: 'Corporate building exterior, modern architecture, blue sky, professional business setting', style: 'cinematic photography' },
    'startup': { prompt: 'Modern startup office with young professionals, collaborative workspace, bright optimistic lighting', style: 'cinematic photography' },
    'stock': { prompt: 'Stock market trading screen with glowing charts, financial data visualization, blue and green colors', style: 'digital art' },
    'invest': { prompt: 'Hand holding golden coin with glowing effect, investment concept, dark background with light rays', style: 'digital art' },

    // Technology
    'ai': { prompt: 'Futuristic AI brain with glowing neural network, electric blue synapses, dark background, technology concept', style: 'digital art' },
    'app': { prompt: 'Smartphone with glowing app interface, modern technology concept, blue and white color scheme', style: 'digital art' },
    'software': { prompt: 'Coding terminal with glowing code, programming concept, dark background with colorful syntax highlighting', style: 'digital art' },
    'code': { prompt: 'Abstract code visualization with glowing lines, programming concept, futuristic digital art', style: 'digital art' },
    'digital': { prompt: 'Digital transformation concept with glowing particles, futuristic technology visualization, blue tones', style: 'digital art' },
    'tech': { prompt: 'Futuristic technology concept with circuit board patterns, blue glowing lines, dark background', style: 'digital art' },
    'data': { prompt: 'Data visualization with glowing nodes and connections, big data concept, dark background with blue accents', style: 'digital art' },
    'cloud': { prompt: 'Cloud computing concept with glowing network connections, futuristic data center, dark blue background', style: 'digital art' },
    'internet': { prompt: 'Global internet connection visualization with glowing network, world map, digital communication concept', style: 'digital art' },
    'website': { prompt: 'Modern website design on screen, clean UI interface, professional web design concept', style: 'digital art' },
    'online': { prompt: 'Online connectivity concept with glowing digital elements, modern technology visualization', style: 'digital art' },

    // Marketing
    'marketing': { prompt: 'Marketing concept with growing graphs and targets, business success visualization, professional dark background', style: 'digital art' },
    'brand': { prompt: 'Brand identity concept with colorful geometric shapes, modern logo design, professional lighting', style: 'minimalist illustration' },
    'customer': { prompt: 'Happy customer silhouette with glowing aura, customer satisfaction concept, warm lighting', style: 'minimalist illustration' },
    'audience': { prompt: 'Group of diverse people connecting digitally, audience concept, warm community feeling', style: 'cinematic photography' },
    'content': { prompt: 'Creative content creation with glowing elements, digital media concept, colorful modern visualization', style: 'digital art' },
    'social': { prompt: 'Social media icons with glowing connections, digital communication concept, blue gradient background', style: 'digital art' },

    // Growth & Success
    'growth': { prompt: 'Upward trending arrow with glowing effect, business growth concept, professional chart visualization', style: '3d render' },
    'success': { prompt: 'Trophy with golden glow, success achievement concept, celebration background with light rays', style: '3d render' },
    'win': { prompt: 'Winner podium with spotlight, success achievement concept, dramatic lighting', style: 'cinematic photography' },
    'achieve': { prompt: 'Mountain peak with sunrise, achievement goal concept, inspirational landscape photography', style: 'cinematic photography' },
    'goal': { prompt: 'Target with arrow hitting bullseye, goal achievement concept, professional lighting', style: 'minimalist illustration' },
    'scale': { prompt: 'Scaling concept with rising bars and particles, growth visualization, futuristic blue background', style: '3d render' },
    'expand': { prompt: 'Expanding universe concept with glowing stars, growth and opportunity visualization, dark space background', style: '3d render' },

    // Education & Learning
    'learn': { prompt: 'Open book with glowing light rays, learning education concept, inspiring visualization', style: 'cinematic photography' },
    'education': { prompt: 'Modern classroom with digital elements, education technology concept, bright welcoming lighting', style: 'cinematic photography' },
    'teach': { prompt: 'Teacher with students concept, education growth, warm inspiring lighting', style: 'cinematic photography' },
    'course': { prompt: 'Online learning on laptop screen, course education concept, modern remote learning visualization', style: 'cinematic photography' },
    'training': { prompt: 'Professional training concept with glowing targets, skill development visualization', style: 'digital art' },
    'skill': { prompt: 'Skill development with growing elements, personal growth concept, professional visualization', style: 'digital art' },
    'knowledge': { prompt: 'Lightbulb with glowing filaments, knowledge inspiration concept, dark background with light rays', style: 'digital art' },

    // Emotions & Reactions
    'love': { prompt: 'Heart with soft glow, love and care concept, warm pink and red tones, gentle lighting', style: 'cinematic photography' },
    'happy': { prompt: 'Joyful celebration with colorful elements, happiness concept, bright warm lighting', style: 'cinematic photography' },
    'excited': { prompt: 'Excited energy with glowing particles, excitement concept, dynamic colorful visualization', style: 'digital art' },
    'amazing': { prompt: 'Amazing visuals with starburst, wonder and amazement concept, dramatic lighting', style: 'digital art' },
    'incredible': { prompt: 'Incredible scene with glowing effects, impressive visualization, professional lighting', style: 'cinematic photography' },
    'awesome': { prompt: 'Awesome presentation with spotlight, impressive concept, dramatic lighting', style: 'cinematic photography' },

    // Time
    'time': { prompt: 'Elegant clock with light rays, time passing concept, warm golden hour lighting', style: 'cinematic photography' },
    'today': { prompt: 'Modern calendar with glowing marks, present moment concept, professional lighting', style: 'digital art' },
    'week': { prompt: 'Weekly planner with colorful marks, week planning concept, modern productivity visualization', style: 'minimalist illustration' },
    'month': { prompt: 'Monthly calendar with growth chart, monthly progress concept, professional visualization', style: 'digital art' },
    'year': { prompt: 'Year progression with evolving elements, annual growth concept, timeline visualization', style: 'digital art' },

    // General Concepts
    'future': { prompt: 'Futuristic cityscape with glowing elements, future technology concept, blue and purple tones', style: '3d render' },
    'new': { prompt: 'New beginning with glowing door, fresh start concept, inspirational lighting', style: 'cinematic photography' },
    'best': { prompt: 'Best quality with golden star, premium concept, professional lighting', style: 'digital art' },
    'free': { prompt: 'Freedom concept with open sky, liberation visualization, inspiring landscape', style: 'cinematic photography' },
    'get': { prompt: 'Getting started with glowing arrow, momentum concept, forward movement visualization', style: 'minimalist illustration' },
    'start': { prompt: 'Starting line with runner, beginning concept, inspirational sports photography', style: 'cinematic photography' },
    'now': { prompt: 'Now moment with spotlight, present importance concept, dramatic lighting', style: 'cinematic photography' },
    'here': { prompt: 'Location pin with glowing effect, presence concept, modern minimal visualization', style: 'minimalist illustration' },
    'click': { prompt: 'Click button with glowing effect, digital interaction concept, modern UI visualization', style: 'digital art' },
    'join': { prompt: 'People connecting with glowing lines, community concept, collaborative visualization', style: 'digital art' },
    'download': { prompt: 'Download progress with glowing particles, digital transfer concept, futuristic visualization', style: 'digital art' },
    'subscribe': { prompt: 'Subscribe concept with notification bell, engagement visualization, modern design', style: 'minimalist illustration' },
    'follow': { prompt: 'Follow concept with connected users, social growth visualization, blue network', style: 'digital art' },
    'share': { prompt: 'Share concept with spreading particles, viral content visualization, colorful glow', style: 'digital art' },
    'video': { prompt: 'Video production with camera and lights, film making concept, professional set lighting', style: 'cinematic photography' },
    'watch': { prompt: 'Watching video on modern screen, media consumption concept, home entertainment setting', style: 'cinematic photography' },
    'see': { prompt: 'Eye with vision rays, seeing concept, perspective visualization', style: 'minimalist illustration' },
    'check': { prompt: 'Check mark with success glow, verification concept, positive confirmation', style: 'minimalist illustration' },
    'buy': { prompt: 'Shopping bag with premium products, purchase concept, luxury retail setting', style: 'cinematic photography' },
    'shop': { prompt: 'Modern shop interior, retail experience, professional product photography', style: 'cinematic photography' },
    'product': { prompt: 'Premium product with soft lighting, product showcase, professional photography', style: 'cinematic photography' },
    'service': { prompt: 'Professional service with helping hands, customer support concept, warm lighting', style: 'cinematic photography' },
    'help': { prompt: 'Helping hands with glowing connection, support assistance concept, collaborative visualization', style: 'digital art' },
    'support': { prompt: 'Customer support with headset and screen, service concept, professional setting', style: 'cinematic photography' },
    'answer': { prompt: 'Question mark transforming to lightbulb, answer revelation concept, inspiring visualization', style: 'digital art' },
    'question': { prompt: 'Question marks in modern visualization, inquiry concept, clean minimal design', style: 'minimalist illustration' },
    'find': { prompt: 'Search magnifying glass with glow, discovery concept, modern search visualization', style: 'minimalist illustration' },
    'search': { prompt: 'Search interface with glowing elements, modern search engine concept', style: 'digital art' },
    'create': { prompt: 'Creative process with colorful particles, creation concept, artistic visualization', style: 'digital art' },
    'make': { prompt: 'Making creation with tools and materials, craftsmanship concept, professional workshop', style: 'cinematic photography' },
    'build': { prompt: 'Building construction with rising structure, building concept, progress visualization', style: 'cinematic photography' },
    'develop': { prompt: 'Development growth with evolving elements, progress concept, professional visualization', style: 'digital art' },
    'work': { prompt: 'Modern workplace with collaborative team, professional office environment', style: 'cinematic photography' },
    'job': { prompt: 'Career success with professional setting, job achievement concept, business lighting', style: 'cinematic photography' },
    'career': { prompt: 'Career path with upward arrows, professional growth concept, inspirational visualization', style: 'digital art' },
    'team': { prompt: 'Team collaboration with connected people, group success concept, warm lighting', style: 'cinematic photography' },
    'people': { prompt: 'Diverse group of happy people, community concept, warm documentary photography', style: 'cinematic photography' },
    'user': { prompt: 'User interface with person silhouette, user experience concept, modern design', style: 'minimalist illustration' },
    'member': { prompt: 'Membership badge with glow, exclusive access concept, premium visualization', style: 'minimalist illustration' },
    'plan': { prompt: 'Strategic planning with roadmap, future planning concept, professional visualization', style: 'digital art' },
    'strategy': { prompt: 'Strategic chess pieces with glowing moves, strategy concept, modern visualization', style: 'digital art' },
    'method': { prompt: 'Methodology process with flowing steps, systematic approach concept', style: 'minimalist illustration' },
    'way': { prompt: 'Path forward with glowing direction, way forward concept, inspirational lighting', style: 'cinematic photography' },
    'result': { prompt: 'Results dashboard with success metrics, achievement visualization, professional data', style: 'digital art' },
    'proven': { prompt: 'Proven success with verification badge, trust concept, professional visualization', style: 'minimalist illustration' },
    'secret': { prompt: 'Secret vault with glowing lock, exclusive knowledge concept, mysterious lighting', style: 'cinematic photography' },
    'simple': { prompt: 'Simple clean design with minimal elements, simplicity concept, clean minimalist style', style: 'minimalist illustration' },
    'easy': { prompt: 'Easy process with streamlined steps, simplicity concept, smooth visualization', style: 'minimalist illustration' },
    'quick': { prompt: 'Fast motion with speed lines, quick action concept, dynamic visualization', style: 'digital art' },
    'fast': { prompt: 'Fast speed with motion blur, rapid movement concept, dynamic lighting', style: 'cinematic photography' },
    'instant': { prompt: 'Instant delivery with glowing effect, immediate result concept, modern visualization', style: 'digital art' },
};

// ==================== MOOD DETECTION (Client-side) ====================

type VideoMood = 'triumphant' | 'dramatic' | 'calm' | 'energetic' | 'mysterious' | 'warm' | 'dark' | 'futuristic' | 'nostalgic' | 'neutral';

function detectSegmentMood(text: string): VideoMood {
    const lower = text.toLowerCase();
    
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
    
    if (text.includes('!')) scores.energetic += 1;
    if (text.includes('?')) scores.mysterious += 1;
    if (text.includes('...')) scores.dramatic += 1;
    
    const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(1, text.length);
    if (capsRatio > 0.3) scores.energetic += 1;
    
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

// ==================== ENHANCED IMAGE PROMPT GENERATION (Client-side) ====================

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
        'GAMING/ENTERTAINMENT': 'Video game cinematic style, dynamic action angles, neon-lit environments, character-driven scenes, epic boss battle atmosphere, gaming setup with RGB lighting',
        'TECHNOLOGY/CODING': 'Sleek futuristic tech aesthetic, dark mode interfaces with glowing syntax, clean minimal hardware shots, circuit board macro photography, holographic displays',
        'FINANCE/BUSINESS': 'Corporate luxury aesthetic, modern glass office buildings, executive boardroom atmosphere, premium materials marble gold leather, professional attire, stock exchange energy',
        'FITNESS/HEALTH': 'Athletic dynamic shots, gym atmosphere with dramatic lighting, sweat and determination, muscular definition, healthy vibrant food photography, medical clean aesthetic',
        'BEAUTY/FASHION': 'High fashion editorial style, soft glamour lighting, luxury cosmetic textures, runway atmosphere, beauty macro shots, elegant minimalist composition, Vogue aesthetic',
        'EDUCATION/SCIENCE': 'Academic library atmosphere, laboratory with scientific equipment, chalkboard with complex equations, microscope macro shots, clean research facility aesthetic, scholarly warm lighting',
        'COOKING/FOOD': 'Gourmet food photography, steam and sizzle action shots, rustic kitchen atmosphere, fresh ingredients overhead flat lay, dramatic plating presentation, warm inviting restaurant lighting',
        'MUSIC/ARTS': 'Concert stage dramatic lighting, recording studio atmosphere, instruments in spotlight, artistic creative process, gallery exhibition aesthetic, vibrant creative energy',
        'TRAVEL/ADVENTURE': 'National Geographic documentary style, dramatic landscapes, golden hour adventure, aerial drone photography, cultural authentic moments, wanderlust atmosphere',
        'NEWS/DRAMA/STORY': 'Breaking news urgency, dramatic investigative atmosphere, documentary realism, high-stakes tension, journalistic integrity aesthetic, truth-revealing spotlight',
    };
    return guides[primaryTopic] || 'Professional cinematic style, clean composition, balanced lighting, editorial quality, 8k detail';
}

/**
 * Generate a dynamic image prompt based on text content using mood + topic analysis.
 * Produces RICH, CINEMATIC prompts that match the segment's emotional tone.
 */
function generateDynamicPrompt(text: string): { prompt: string; style: string } | null {
    const lower = text.toLowerCase();
    const mood = detectSegmentMood(text);
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !isStopWord(w));
    const keyPhrase = words.slice(0, 5).join(' ');
    
    // Detect rough topic from text
    let primaryTopic = 'general';
    const topicHints: Record<string, string[]> = {
        'GAMING/ENTERTAINMENT': ['game', 'play', 'level', 'character', 'player', 'gaming', 'stream'],
        'TECHNOLOGY/CODING': ['code', 'software', 'app', 'tech', 'digital', 'data', 'cloud', 'ai', 'algorithm'],
        'FINANCE/BUSINESS': ['money', 'revenue', 'profit', 'business', 'market', 'stock', 'invest', 'startup'],
        'FITNESS/HEALTH': ['workout', 'exercise', 'gym', 'muscle', 'health', 'fitness', 'diet'],
        'EDUCATION/SCIENCE': ['research', 'study', 'science', 'learn', 'education', 'course', 'university'],
        'COOKING/FOOD': ['recipe', 'cook', 'food', 'meal', 'kitchen', 'ingredient', 'chef'],
        'MUSIC/ARTS': ['music', 'song', 'art', 'artist', 'concert', 'guitar', 'piano'],
        'TRAVEL/ADVENTURE': ['travel', 'trip', 'destination', 'explore', 'adventure', 'country'],
    };
    for (const [topic, hints] of Object.entries(topicHints)) {
        if (hints.some(h => lower.includes(h))) {
            primaryTopic = topic;
            break;
        }
    }
    
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
    
    // Map individual content words to concrete visual elements for UNIQUE per-segment prompts
    const visualElements: Record<string, string> = {
        money: 'stacks of golden coins and currency bills', revenue: 'rising financial bar chart', profit: 'gleaming gold bars',
        income: 'flowing stream of golden light', dollar: 'crisp hundred dollar bills', cash: 'briefcase full of cash',
        growth: 'a dramatic upward-trending arrow piercing through clouds', grow: 'a seedling growing into a massive tree',
        success: 'a glowing trophy on a pedestal', achieve: 'a runner crossing a finish line',
        rocket: 'a rocket launching with fiery exhaust trail', launch: 'a countdown clock reaching zero with sparks',
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
        food: 'a gourmet dish with steam rising dramatically', cook: 'flames leaping from a chef\'s pan',
        travel: 'a winding road leading into a breathtaking mountain valley', adventure: 'a lone explorer on a cliff edge at golden hour',
        city: 'a modern city skyline reflecting in water at twilight', building: 'a futuristic glass skyscraper reaching into clouds',
        team: 'diverse hands joining together from above', people: 'a crowd of silhouettes under a dramatic sky',
        star: 'a brilliant star exploding in a supernova', galaxy: 'a spiral galaxy with billions of glowing stars',
        secret: 'a mysterious locked chest with light escaping through cracks', mystery: 'fog-shrouded forest with a single beam of light',
        game: 'a neon-lit gaming controller with RGB reflections', play: 'colorful game elements floating in zero gravity',
        science: 'a DNA double helix spiraling with bioluminescent light', research: 'a microscope revealing glowing cells',
        network: 'glowing interconnected nodes forming a web', connect: 'two glowing hands reaching toward each other',
        data: 'holographic data streams flowing through a futuristic corridor', cloud: 'a luminous cloud computing infrastructure',
        invest: 'a hand planting a golden seed that sprouts into coins', stock: 'a dramatic candlestick chart with green candles rising',
        health: 'a human body silhouette radiating vibrant energy', fitness: 'an athlete mid-jump with perfect form',
        nature: 'lush green forest with light filtering through canopy', tree: 'a majestic ancient tree with sunlight through its branches',
    };

    // Collect concrete visual elements from the actual segment text
    const matchedVisuals: string[] = [];
    for (const word of words) {
        if (visualElements[word] && !matchedVisuals.includes(visualElements[word])) {
            matchedVisuals.push(visualElements[word]);
            if (matchedVisuals.length >= 2) break;
        }
    }

    let sceneDescription: string;
    if (matchedVisuals.length > 0) {
        sceneDescription = `A cinematic composition featuring ${matchedVisuals.join(' alongside ')}, professional composition with depth`;
    } else if (keyPhrase) {
        sceneDescription = `A visually stunning cinematic scene depicting "${keyPhrase}", rendered as a photorealistic still from a premium documentary, dramatic composition`;
    } else {
        sceneDescription = 'An abstract cinematic visual with flowing light particles, professional composition';
    }
    
    const lighting = moodLighting[mood] || moodLighting.neutral;
    const styleGuide = getTopicStyleGuide(primaryTopic);
    
    const prompt = `${sceneDescription}, ${lighting}, ${styleGuide}, cinematic lighting, hyperrealistic, professional color grading, 8k, high detail, shallow depth of field`;
    
    return { prompt, style: 'cinematic photography' };
}

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

function isStopWord(word: string): boolean {
    return STOP_WORDS.has(word);
}

/**
 * Extract a short, punchy label from transcript text for motion graphic overlays.
 * Makes each motion graphic feel unique and content-specific.
 */
export function extractLabelFromText(text: string): string {
    // Try to extract numbers/stats first (most compelling labels)
    const numberPatterns = text.match(/\$[\d,.]+[MBKmk]?|\d+[%x×]|\d{2,}[+]?|\d+[\s-]+(to|→|->)[\s-]+\d+/g);
    if (numberPatterns && numberPatterns.length >= 2) {
        // Multiple numbers → show progression "Revenue: $1M → $5M"
        const keyWord = text.toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !isStopWord(w))[0];
        const prefix = keyWord ? keyWord.charAt(0).toUpperCase() + keyWord.slice(1) : 'Growth';
        return `${prefix}: ${numberPatterns[0]} → ${numberPatterns[1]}`;
    }

    // Single number → "Team Growth: 200+"
    const singleNumber = text.match(/(\$[\d,.]+[MBKmk]?|\d+[%x×+]|\d{3,})/);
    if (singleNumber) {
        const keyWord = text.toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !isStopWord(w))[0];
        const prefix = keyWord ? keyWord.charAt(0).toUpperCase() + keyWord.slice(1) : 'Impact';
        const num = singleNumber[0].endsWith('+') ? singleNumber[0] : singleNumber[0] + '+';
        return `${prefix}: ${num}`;
    }

    // No numbers → capitalize 2-4 key words (skip stop words)
    const words = text.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !isStopWord(w));

    if (words.length === 0) return '';

    const keyWords = words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1));
    return keyWords.join(' ');
}

/**
 * Generate AI image using PaddlePaddle Ernie Image API via our server route
 * Returns the generated image URL or falls back to Pollinations.ai
 */
export async function generateErnieImageUrl(prompt: string, seed: number = -1): Promise<string> {
    try {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                width: 1024,
                height: 768,
                seed: seed === -1 ? Date.now() % 1000000 : seed,
                steps: 8,
                guidanceScale: 1,
            }),
        });

        const data = await response.json();

        if (data.success && data.imageUrl) {
            return data.imageUrl;
        }

        // If Ernie failed but gave us a fallback, use it
        if (data.fallbackUrl) {
            console.warn('Using fallback image URL:', data.fallbackUrl);
            return data.fallbackUrl;
        }

        // Ultimate fallback to Pollinations
        return generateFallbackImageUrl(prompt, seed);
    } catch (error) {
        console.error('Ernie image generation failed:', error);
        return generateFallbackImageUrl(prompt, seed);
    }
}

/**
 * Fallback to Pollinations.ai if Ernie API fails
 */
function generateFallbackImageUrl(prompt: string, seed: number): string {
    const encodedPrompt = encodeURIComponent(`${prompt}, high quality, professional`);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${seed}`;
}

/**
 * Generate AI image URL using Pollinations.ai (kept for backward compatibility)
 */
function generateAIImageUrl(prompt: string, seed: number): string {
    const encodedPrompt = encodeURIComponent(`${prompt}, high quality, professional`);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${seed}`;
}

function serializeAnalysis(analysis: VideoAnalysisResult) {
    return {
        overallSentiment: analysis.overallSentiment,
        averageEngagement: analysis.averageEngagement,
        moodProfile: {
            primary: analysis.moodProfile.primary,
            secondary: analysis.moodProfile.secondary,
            energyLevel: analysis.moodProfile.energyLevel,
            tempo: analysis.moodProfile.tempo,
            colorPalette: analysis.moodProfile.colorPalette,
        },
        peakMomentIds: analysis.peakMoments.map(s => s.id),
        hookSegmentIds: analysis.hookSegments.map(s => s.id),
        segmentAnalysis: [] as { id: string; sentiment: string; engagement: number; isPeak: boolean }[],
        suggestedCuts: analysis.suggestedCuts.map(c => ({
            segmentId: c.segmentId,
            type: c.type,
            reason: c.reason,
        })),
    };
}

export function buildAnalysisPayload(analysis: VideoAnalysisResult, subtitles: SubtitleSegment[]) {
    const base = serializeAnalysis(analysis);
    const peakSet = new Set(base.peakMomentIds);

    const sentiments = analyzeAllSentiments(subtitles);
    const engagements = calculateAllEngagementScores(subtitles);

    base.segmentAnalysis = subtitles.map(s => {
        const sent = sentiments.find(r => r.segmentId === s.id);
        const eng = engagements.find(r => r.segmentId === s.id);
        return {
            id: s.id,
            sentiment: sent?.sentiment || 'neutral',
            engagement: eng?.score ? Math.round(eng.score) : Math.round(base.averageEngagement),
            isPeak: peakSet.has(s.id),
        };
    });

    return base;
}

/**
 * Suggest overlays using DeepSeek V3.1 AI via the server-side API route.
 * Falls back to local dynamic prompt generation if the API is unavailable.
 * Now generates custom AI images based on script content.
 */
export async function suggestOverlaysWithAI(
    subtitles: SubtitleSegment[],
    model?: string,
    analysis?: VideoAnalysisResult,
): Promise<SubtitleSegment[]> {
    try {
        let analysisPayload;
        try {
            analysisPayload = analysis ? buildAnalysisPayload(analysis, subtitles) : undefined;
        } catch (e) {
            console.error('[suggestOverlaysWithAI] Analysis serialization failed, sending request without it:', e);
        }

        const response = await fetch('/api/suggest-overlays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subtitles: subtitles.map((s) => ({
                    id: s.id,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    text: s.text,
                })),
                model,
                videoAnalysis: analysisPayload,
            }),
        });

        const data = await response.json();

        if (data.suggestions && data.suggestions.length > 0) {
            // Apply AI suggestions to the subtitle segments
            // OVERWRITE existing overlays so re-generation works with different models
            const withAISuggestions = subtitles.map((seg) => {
                const suggestion = data.suggestions.find(
                    (s: { segmentId: string; type: string; props: Record<string, unknown> }) =>
                        s.segmentId === seg.id
                );
                if (suggestion) {
                    return {
                        ...seg,
                        overlay: {
                            type: suggestion.type,
                            props: suggestion.props,
                        } as OverlayConfig,
                    };
                }
                return seg;
            });

            return withAISuggestions;
        }

        // API returned no suggestions, fall back to local dynamic generation with Ernie images
        console.warn('AI returned no suggestions, using local dynamic generation with Ernie images');
        return generateDynamicOverlaysAsync(subtitles);
    } catch (error) {
        console.error('AI suggestion API failed:', error);
        // Use async version with Ernie API for real AI-generated images
        return generateDynamicOverlaysAsync(subtitles);
    }
}

/**
 * Local dynamic overlay generation with AI-generated images
 * Creates custom prompts and image URLs based on content analysis
 * Each video gets UNIQUE B-roll based on its specific transcript
 * NOW uses async Ernie Image API for real AI-generated images
 */
export async function generateDynamicOverlaysAsync(subtitles: SubtitleSegment[]): Promise<SubtitleSegment[]> {
    // Reset module-level tracking so each video gets fresh scene selection
    lastUsedScene = '';
    
    // Generate a unique session seed for THIS video to ensure fresh content
    const sessionSeed = Date.now() % 100000;

    // Score each segment for visual relevance
    const scored = subtitles.map((seg, index) => ({
        seg,
        index,
        score: scoreSegmentRelevance(seg.text),
    }));

    // Sort by score, pick the top ~30% most relevant segments
    const totalSegments = subtitles.length;
    const maxOverlays = Math.max(2, Math.floor(totalSegments * 0.30));

    const topSegments = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxOverlays);

    // Build a set of segment indices that should get overlays
    // Also enforce minimum gap of 2 segments between overlays
    const overlayIndices = new Set<number>();
    const sortedByIndex = topSegments.sort((a, b) => a.index - b.index);
    let lastOverlayIdx = -3;
    for (const entry of sortedByIndex) {
        if (entry.index - lastOverlayIdx >= 2) {
            overlayIndices.add(entry.index);
            lastOverlayIdx = entry.index;
        }
    }

    // Process overlays asynchronously
    const results: SubtitleSegment[] = [];
    let overlayCount = 0;
    
    for (let index = 0; index < subtitles.length; index++) {
        const seg = subtitles[index];
        
        if (!overlayIndices.has(index)) {
            results.push(seg);
            continue;
        }

        // Generate a UNIQUE seed for THIS segment based on its content + session
        const segmentHash = hashString(seg.text);
        const uniqueSeed = (sessionSeed + segmentHash + index) % 1000000;
        
        // Get async overlay with real AI-generated image
        const overlay = await selectProOverlayWithErnieImage(seg.text, overlayCount, uniqueSeed);
        overlayCount++;

        results.push({ ...seg, overlay });
    }

    return results;
}

/**
 * Synchronous version for backward compatibility
 * Falls back to Pollinations.ai URLs (no real Ernie API calls)
 */
export function generateDynamicOverlays(subtitles: SubtitleSegment[]): SubtitleSegment[] {
    // Reset module-level tracking so each video gets fresh scene selection
    lastUsedScene = '';
    
    // Generate a unique session seed for THIS video to ensure fresh content
    const sessionSeed = Date.now() % 100000;

    // Score each segment for visual relevance
    const scored = subtitles.map((seg, index) => ({
        seg,
        index,
        score: scoreSegmentRelevance(seg.text),
    }));

    // Sort by score, pick the top ~30% most relevant segments
    const totalSegments = subtitles.length;
    const maxOverlays = Math.max(2, Math.floor(totalSegments * 0.30));

    const topSegments = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxOverlays);

    // Build a set of segment indices that should get overlays
    // Also enforce minimum gap of 2 segments between overlays
    const overlayIndices = new Set<number>();
    const sortedByIndex = topSegments.sort((a, b) => a.index - b.index);
    let lastOverlayIdx = -3;
    for (const entry of sortedByIndex) {
        if (entry.index - lastOverlayIdx >= 2) {
            overlayIndices.add(entry.index);
            lastOverlayIdx = entry.index;
        }
    }

    let overlayCount = 0;
    return subtitles.map((seg, index) => {
        if (!overlayIndices.has(index)) return seg;

        // Generate a UNIQUE seed for THIS segment based on its content + session
        const segmentHash = hashString(seg.text);
        const uniqueSeed = (sessionSeed + segmentHash + index) % 1000000;
        
        const overlayType = selectProOverlayWithUniqueSeed(seg.text, overlayCount, uniqueSeed);
        overlayCount++;

        return { ...seg, overlay: overlayType };
    });
}

/**
 * Async overlay selection with real Ernie Image API calls.
 * Overlay TYPE is chosen based on content analysis, not a fixed pattern.
 */
async function selectProOverlayWithErnieImage(text: string, count: number, uniqueSeed: number): Promise<OverlayConfig> {
    const lower = text.toLowerCase();
    const color = getProColor(uniqueSeed);
    const label = extractLabelFromText(text);
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);

    // ── Decide overlay type based on CONTENT, not a fixed slot ──
    // Score how well this text matches each overlay type
    const hasStrongSceneKeyword = words.some(w => CONTENT_SCENE_MAP[w]);
    const hasVisualNoun = words.some(w => [
        'money', 'rocket', 'brain', 'fire', 'ocean', 'mountain', 'city',
        'star', 'earth', 'code', 'heart', 'clock', 'tree', 'food',
    ].includes(w));
    const hasEmotionWord = words.some(w => [
        'love', 'happy', 'amazing', 'incredible', 'awesome', 'fire', 'lit',
        'crazy', 'insane', 'wow', 'excited', 'cool', 'funny',
    ].includes(w));
    const hasNumbers = /\$[\d,.]+|\d+%|\d{3,}/.test(text);
    const isQuestion = text.includes('?');
    const textLen = text.length;

    // Use content hash to add variety (so same-type segments don't all pick the same)
    const contentHash = Math.abs(text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));

    // Choose overlay type based on content characteristics + variety mixing
    let overlayType: 'ai-generated-image' | 'visual-illustration' | 'gif-reaction' | 'emoji-reaction';

    if (hasStrongSceneKeyword && (contentHash % 3 !== 0)) {
        // Text has a keyword that maps well to an animated SVG scene
        overlayType = 'visual-illustration';
    } else if (textLen > 40 && !hasEmotionWord && (contentHash % 4 !== 0)) {
        // Longer descriptive text → AI-generated image (rich visual)
        overlayType = 'ai-generated-image';
    } else if (hasEmotionWord && !hasNumbers) {
        // Emotional/reaction moment → alternate between gif and emoji
        overlayType = (contentHash % 2 === 0) ? 'gif-reaction' : 'emoji-reaction';
    } else if (hasNumbers || hasVisualNoun) {
        // Stats or concrete visual nouns → image or illustration
        overlayType = (contentHash % 2 === 0) ? 'ai-generated-image' : 'visual-illustration';
    } else if (isQuestion) {
        overlayType = 'visual-illustration';
    } else {
        // Fallback: rotate based on content hash (NOT count) for variety
        const pick = contentHash % 10;
        if (pick < 4) overlayType = 'visual-illustration';
        else if (pick < 7) overlayType = 'ai-generated-image';
        else if (pick < 9) overlayType = 'gif-reaction';
        else overlayType = 'emoji-reaction';
    }

    // ── Build the overlay ──
    switch (overlayType) {
        case 'ai-generated-image': {
            const dynamicPrompt = generateDynamicPrompt(text);
            const imagePrompt = dynamicPrompt?.prompt || `${text.substring(0, 100)}, cinematic, professional`;
            const imageUrl = await generateErnieImageUrl(imagePrompt, uniqueSeed);
            return {
                type: 'ai-generated-image',
                props: {
                    imageUrl,
                    caption: label || text.substring(0, 40),
                    seed: uniqueSeed,
                    imagePrompt,
                },
            };
        }

        case 'visual-illustration': {
            const scene = pickSceneForText(text, count);
            const finalScene = scene === lastUsedScene
                ? ALL_SCENES[(ALL_SCENES.indexOf(scene) + 1) % ALL_SCENES.length]
                : scene;
            lastUsedScene = finalScene;
            const transitions = ['fade-in', 'slide-in', 'zoom-in'] as const;
            return {
                type: 'visual-illustration',
                props: {
                    scene: finalScene,
                    label: label || text.substring(0, 30),
                    color,
                    transition: transitions[contentHash % transitions.length],
                },
            };
        }

        case 'gif-reaction': {
            const sizes = ['medium', 'large', 'fullscreen'] as const;
            const gifPositions = ['center', 'top-right', 'bottom-right'] as const;
            return {
                type: 'gif-reaction',
                props: {
                    keyword: text.substring(0, 80),
                    size: sizes[contentHash % sizes.length],
                    position: gifPositions[contentHash % gifPositions.length],
                },
            };
        }

        case 'emoji-reaction':
        default: {
            const emojiMatch = pickEmoji(lower);
            const fallbackEmojis = ['🔥', '⚡', '🎯', '💡', '🚀', '💎', '✨', '💪', '🎉', '📈'];
            return {
                type: 'emoji-reaction',
                props: {
                    emoji: emojiMatch || fallbackEmojis[contentHash % fallbackEmojis.length],
                    size: 70,
                },
            };
        }
    }
}

/**
 * Hash function for generating consistent but unique seeds from text
 */
function hashStringLocal(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

/**
 * Select overlay with a unique seed for THIS specific segment.
 * Overlay TYPE is chosen based on content analysis, not a fixed pattern.
 */
function selectProOverlayWithUniqueSeed(text: string, count: number, uniqueSeed: number): OverlayConfig {
    const lower = text.toLowerCase();
    const color = getProColor(uniqueSeed);
    const label = extractLabelFromText(text);
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);

    // ── Decide overlay type based on CONTENT ──
    const hasStrongSceneKeyword = words.some(w => CONTENT_SCENE_MAP[w]);
    const hasVisualNoun = words.some(w => [
        'money', 'rocket', 'brain', 'fire', 'ocean', 'mountain', 'city',
        'star', 'earth', 'code', 'heart', 'clock', 'tree', 'food',
    ].includes(w));
    const hasEmotionWord = words.some(w => [
        'love', 'happy', 'amazing', 'incredible', 'awesome', 'fire', 'lit',
        'crazy', 'insane', 'wow', 'excited', 'cool', 'funny',
    ].includes(w));
    const hasNumbers = /\$[\d,.]+|\d+%|\d{3,}/.test(text);
    const isQuestion = text.includes('?');
    const textLen = text.length;

    const contentHash = Math.abs(text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));

    let overlayType: 'ai-generated-image' | 'visual-illustration' | 'gif-reaction' | 'emoji-reaction';

    if (hasStrongSceneKeyword && (contentHash % 3 !== 0)) {
        overlayType = 'visual-illustration';
    } else if (textLen > 40 && !hasEmotionWord && (contentHash % 4 !== 0)) {
        overlayType = 'ai-generated-image';
    } else if (hasEmotionWord && !hasNumbers) {
        overlayType = (contentHash % 2 === 0) ? 'gif-reaction' : 'emoji-reaction';
    } else if (hasNumbers || hasVisualNoun) {
        overlayType = (contentHash % 2 === 0) ? 'ai-generated-image' : 'visual-illustration';
    } else if (isQuestion) {
        overlayType = 'visual-illustration';
    } else {
        const pick = contentHash % 10;
        if (pick < 4) overlayType = 'visual-illustration';
        else if (pick < 7) overlayType = 'ai-generated-image';
        else if (pick < 9) overlayType = 'gif-reaction';
        else overlayType = 'emoji-reaction';
    }

    switch (overlayType) {
        case 'ai-generated-image': {
            const dynamicPrompt = generateDynamicPrompt(text);
            const imagePrompt = dynamicPrompt?.prompt || `${text.substring(0, 100)}, cinematic, professional`;
            const imageUrl = generateAIImageUrl(imagePrompt, uniqueSeed);
            return {
                type: 'ai-generated-image',
                props: {
                    imageUrl,
                    caption: label || text.substring(0, 40),
                    seed: uniqueSeed,
                },
            };
        }

        case 'visual-illustration': {
            const scene = pickSceneForText(text, count);
            const finalScene = scene === lastUsedScene
                ? ALL_SCENES[(ALL_SCENES.indexOf(scene) + 1) % ALL_SCENES.length]
                : scene;
            lastUsedScene = finalScene;
            const transitions = ['fade-in', 'slide-in', 'zoom-in'] as const;
            return {
                type: 'visual-illustration',
                props: {
                    scene: finalScene,
                    label: label || text.substring(0, 30),
                    color,
                    transition: transitions[contentHash % transitions.length],
                },
            };
        }

        case 'gif-reaction': {
            const sizes = ['medium', 'large', 'fullscreen'] as const;
            const gifPositions = ['center', 'top-right', 'bottom-right'] as const;
            return {
                type: 'gif-reaction',
                props: {
                    keyword: text.substring(0, 80),
                    size: sizes[contentHash % sizes.length],
                    position: gifPositions[contentHash % gifPositions.length],
                },
            };
        }

        case 'emoji-reaction':
        default: {
            const emojiMatch = pickEmoji(lower);
            const fallbackEmojis = ['🔥', '⚡', '🎯', '💡', '🚀', '💎', '✨', '💪', '🎉', '📈'];
            return {
                type: 'emoji-reaction',
                props: {
                    emoji: emojiMatch || fallbackEmojis[contentHash % fallbackEmojis.length],
                    size: 70,
                },
            };
        }
    }
}

/**
 * Score a segment's visual relevance (0 = skip, higher = more relevant).
 * Only segments with a positive score are candidates for overlays.
 */
function scoreSegmentRelevance(text: string): number {
    const lower = text.toLowerCase();
    if (lower.length < 8) return 0;

    // Skip filler / conversational fluff
    const fillerPatterns = [
        'thank you for watching', 'like and subscribe', 'please subscribe',
        'see you in the next', 'don\'t forget', 'comment below', 'let me know',
        'that\'s it for', 'alright guys', 'anyway', 'moving on', 'so basically',
        'as i was saying', 'you know what i mean',
    ];
    if (fillerPatterns.some(p => lower.includes(p))) return 0;

    let score = 0;
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);

    // Strong keyword matches from CONTENT_SCENE_MAP (not common conversational words)
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

    // Numbers / stats are always visually interesting
    if (/\$[\d,.]+|\d+%|\d{3,}/.test(text)) score += 4;

    // Questions are good overlay points
    if (text.includes('?')) score += 2;

    // Exclamations / emphasis
    if (text.includes('!')) score += 1;

    // Penalize very short or purely conversational text
    const nonStopWords = words.filter(w => !STOP_WORDS.has(w));
    if (nonStopWords.length < 2) score -= 2;

    return Math.max(0, score);
}

/**
 * Content → scene mapping for smart visual selection
 */
const CONTENT_SCENE_MAP: Record<string, string> = {
    // Money & Business
    money: 'money-flow', revenue: 'money-flow', profit: 'money-flow', income: 'money-flow',
    dollar: 'money-flow', cash: 'money-flow', price: 'money-flow', cost: 'money-flow',
    earn: 'money-flow', pay: 'money-flow', afford: 'money-flow', salary: 'money-flow',
    sales: 'shopping-cart', buy: 'shopping-cart', shop: 'shopping-cart', purchase: 'shopping-cart',
    store: 'shopping-cart', product: 'shopping-cart', order: 'shopping-cart', deal: 'shopping-cart',
    business: 'growth-chart', company: 'growth-chart', startup: 'growth-chart',
    stock: 'growth-chart', invest: 'growth-chart', market: 'growth-chart',
    luxury: 'diamond-gem', premium: 'diamond-gem', expensive: 'diamond-gem',
    valuable: 'diamond-gem', precious: 'diamond-gem', rich: 'diamond-gem',
    // Growth & Success
    growth: 'arrow-growth', grow: 'arrow-growth', increase: 'arrow-growth',
    rise: 'arrow-growth', scale: 'arrow-growth', expand: 'arrow-growth',
    boost: 'arrow-growth', skyrocket: 'arrow-growth', level: 'arrow-growth',
    success: 'checkmark-success', achieve: 'checkmark-success', accomplish: 'checkmark-success',
    done: 'checkmark-success', complete: 'checkmark-success', finish: 'checkmark-success',
    results: 'checkmark-success', progress: 'checkmark-success', improve: 'checkmark-success',
    win: 'celebration', champion: 'celebration', winner: 'celebration',
    congratulations: 'celebration', celebrate: 'celebration', victory: 'celebration',
    party: 'celebration', awesome: 'celebration', amazing: 'celebration', excited: 'celebration',
    goal: 'target-bullseye', target: 'target-bullseye', aim: 'target-bullseye',
    focus: 'target-bullseye', precise: 'target-bullseye', strategy: 'target-bullseye',
    plan: 'target-bullseye',
    best: 'crown-royal', king: 'crown-royal', queen: 'crown-royal',
    top: 'crown-royal', leader: 'crown-royal', greatest: 'crown-royal',
    // Technology & Science
    brain: 'brain-idea', think: 'brain-idea', idea: 'brain-idea',
    smart: 'brain-idea', mind: 'brain-idea', learn: 'brain-idea',
    knowledge: 'brain-idea', understand: 'brain-idea', realize: 'brain-idea',
    secret: 'brain-idea', tip: 'brain-idea', trick: 'brain-idea', hack: 'brain-idea',
    code: 'code-terminal', programming: 'code-terminal', software: 'code-terminal',
    developer: 'code-terminal', app: 'code-terminal', website: 'code-terminal',
    tech: 'code-terminal', digital: 'code-terminal', computer: 'code-terminal',
    connect: 'connections', network: 'connections', social: 'connections',
    internet: 'connections', online: 'connections', community: 'connections',
    together: 'connections', collaborate: 'connections', share: 'connections',
    people: 'connections', friends: 'connections', relationship: 'connections',
    science: 'atom-science', research: 'atom-science', experiment: 'atom-science',
    physics: 'atom-science', chemistry: 'atom-science', quantum: 'atom-science',
    machine: 'gear-system', system: 'gear-system', engine: 'gear-system',
    process: 'gear-system', automate: 'gear-system', build: 'gear-system',
    tool: 'gear-system', work: 'gear-system', method: 'gear-system',
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
    passion: 'fire-blaze', intense: 'fire-blaze', trending: 'fire-blaze',
    attract: 'magnet-attract', pull: 'magnet-attract', draw: 'magnet-attract',
    magnetic: 'magnet-attract', irresistible: 'magnet-attract', grab: 'magnet-attract',
    // Nature & World
    earth: 'globe', world: 'globe', global: 'globe',
    country: 'globe', international: 'globe', planet: 'globe',
    travel: 'globe', everywhere: 'globe',
    tree: 'nature-tree', nature: 'nature-tree', forest: 'nature-tree',
    green: 'nature-tree', environment: 'nature-tree', organic: 'nature-tree',
    ocean: 'water-wave', water: 'water-wave', sea: 'water-wave',
    wave: 'water-wave', flow: 'water-wave', river: 'water-wave',
    calm: 'water-wave', beach: 'water-wave', smooth: 'water-wave',
    mountain: 'mountain-peak', climb: 'mountain-peak', summit: 'mountain-peak',
    peak: 'mountain-peak', challenge: 'mountain-peak', overcome: 'mountain-peak',
    journey: 'mountain-peak', adventure: 'mountain-peak', effort: 'mountain-peak',
    hard: 'mountain-peak', difficult: 'mountain-peak', struggle: 'mountain-peak',
    sun: 'solar-system', star: 'solar-system', universe: 'solar-system',
    galaxy: 'solar-system', cosmic: 'solar-system',
    city: 'city-skyline', urban: 'city-skyline', downtown: 'city-skyline',
    building: 'city-skyline', skyline: 'city-skyline',
    // Emotions & Actions
    love: 'heartbeat', heart: 'heartbeat', feel: 'heartbeat',
    care: 'heartbeat', emotion: 'heartbeat', life: 'heartbeat',
    health: 'heartbeat', alive: 'heartbeat', want: 'heartbeat', dream: 'heartbeat',
    protect: 'shield-protect', safe: 'shield-protect', security: 'shield-protect',
    guard: 'shield-protect', defense: 'shield-protect', trust: 'shield-protect',
    guarantee: 'shield-protect', reliable: 'shield-protect',
    walk: 'person-walking', step: 'person-walking', move: 'person-walking',
    run: 'person-walking', exercise: 'person-walking', going: 'person-walking',
    // Time & Activities
    time: 'clock-time', hour: 'clock-time', minute: 'clock-time',
    schedule: 'clock-time', deadline: 'clock-time', wait: 'clock-time',
    today: 'clock-time', tomorrow: 'clock-time',
    music: 'music-notes', song: 'music-notes', sound: 'music-notes',
    listen: 'music-notes', audio: 'music-notes', podcast: 'music-notes',
    book: 'book-reading', read: 'book-reading', study: 'book-reading',
    education: 'book-reading', course: 'book-reading', teach: 'book-reading',
    video: 'camera', photo: 'camera', film: 'camera',
    record: 'camera', content: 'camera', create: 'camera',
    food: 'cooking', eat: 'cooking', recipe: 'cooking',
    cook: 'cooking', meal: 'cooking', kitchen: 'cooking',
    // Common conversational words mapped to contextual scenes
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
    thousand: 'growth-chart', percent: 'growth-chart',
};

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

/** Match transcript text to the best animated Remotion scene */
function matchTextToScene(text: string): string {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    for (const word of words) {
        if (CONTENT_SCENE_MAP[word]) return CONTENT_SCENE_MAP[word];
    }
    const hash = Math.abs(text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
    return ALL_SCENES[hash % ALL_SCENES.length];
}

// Track last used scene to avoid repeats
let lastUsedScene = '';

/**
 * Select the best overlay type based on content analysis.
 * Uses content-matched animated scenes (VisualIllustration) for B-roll,
 * kinetic-text for emphasis, transcript-motion for flow, and emoji for reactions.
 */
function selectProOverlay(text: string, count: number): OverlayConfig {
    const lower = text.toLowerCase();
    const color = getProColor(count);
    const label = extractLabelFromText(text);

    // Round-robin across 10 slots — balanced content-matched B-roll + text:
    // 0,2,5,8 = visual-illustration, 1,4,7 = kinetic-text, 3,6 = gif-reaction, 9 = emoji
    const slot = count % 10;

    switch (slot) {
        case 0:
        case 2:
        case 5:
        case 8: {
            // Content-matched animated scene — uses VisualIllustration with 30+ scenes
            const scene = pickSceneForText(text, count);
            // Avoid repeating the same scene as last overlay
            const finalScene = scene === lastUsedScene
                ? ALL_SCENES[(ALL_SCENES.indexOf(scene) + 1) % ALL_SCENES.length]
                : scene;
            lastUsedScene = finalScene;

            const transitions = ['fade-in', 'slide-in', 'zoom-in'] as const;
            return {
                type: 'visual-illustration',
                props: {
                    scene: finalScene,
                    label: label || '',
                    color,
                    transition: transitions[count % transitions.length],
                },
            };
        }

        case 1:
        case 4:
        case 7: {
            // Professional animated SVG scene matched to transcript content
            const scene = pickSceneForText(text, count);
            const finalScene = scene === lastUsedScene
                ? ALL_SCENES[(ALL_SCENES.indexOf(scene) + 1) % ALL_SCENES.length]
                : scene;
            lastUsedScene = finalScene;
            const transitions = ['fade-in', 'slide-in', 'zoom-in'] as const;
            return {
                type: 'visual-illustration',
                props: {
                    scene: finalScene,
                    label: label || text.substring(0, 30),
                    color,
                    transition: transitions[count % transitions.length],
                },
            };
        }

        case 3:
        case 6: {
            // Contextual GIF reaction based on segment content
            const sizes = ['medium', 'large', 'fullscreen'] as const;
            const gifPositions = ['center', 'top-right', 'bottom-right'] as const;
            return {
                type: 'gif-reaction',
                props: {
                    keyword: text.substring(0, 80),
                    size: sizes[count % sizes.length],
                    position: gifPositions[count % gifPositions.length],
                },
            };
        }



        case 9:
        default: {
            const emojiMatch = pickEmoji(lower);
            const fallbackEmojis = ['🔥', '⚡', '🎯', '💡', '🚀', '💎'];
            return {
                type: 'emoji-reaction',
                props: {
                    emoji: emojiMatch || fallbackEmojis[count % fallbackEmojis.length],
                    size: 70,
                },
            };
        }
    }
}

/** Pick the best animated SVG scene based on transcript text.
 *  Uses keyword matching first, then hashes the text for a UNIQUE fallback per segment. */
function pickSceneForText(text: string, index: number): string {
    const lower = text.toLowerCase();
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length >= 2);

    // Score scenes using CONTENT_SCENE_MAP
    const sceneScores: Record<string, number> = {};
    for (const word of words) {
        const scene = CONTENT_SCENE_MAP[word];
        if (scene) {
            sceneScores[scene] = (sceneScores[scene] || 0) + 1;
        }
    }

    const scored = Object.entries(sceneScores).sort((a, b) => b[1] - a[1]);
    if (scored.length > 0) {
        const top = scored[0][1];
        const topScenes = scored.filter(([, s]) => s === top).map(([s]) => s);
        return topScenes[index % topScenes.length];
    }

    // Fallback: use TEXT HASH to pick a scene (different text → different scene)
    const hash = text.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0);
    return ALL_SCENES[Math.abs(hash) % ALL_SCENES.length];
}

/**
 * Pick a contextual emoji based on text content
 */
function pickEmoji(text: string): string | null {
    const emojiMap: Record<string, string> = {
        // Positive emotions
        love: '❤️', heart: '❤️', care: '❤️',
        happy: '😊', joy: '😊', glad: '😊', smile: '😊',
        laugh: '😂', funny: '😂', hilarious: '😂', lol: '😂',
        excited: '🤩', amazing: '🤩', incredible: '🤩', awesome: '🤩',
        wow: '😮', shocking: '😮', surprise: '😮', unbelievable: '😮',
        cool: '😎', dope: '😎', sick: '😎', nice: '😎',
        // Energy & power
        fire: '🔥', hot: '🔥', lit: '🔥', burn: '🔥', flame: '🔥',
        explode: '💥', boom: '💥', blast: '💥', massive: '💥',
        power: '⚡', energy: '⚡', electric: '⚡', fast: '⚡', speed: '⚡', quick: '⚡',
        strong: '💪', force: '💪', workout: '💪', gym: '💪',
        // Success & achievement
        win: '🏆', champion: '🏆', winner: '🏆', trophy: '🏆',
        success: '✅', done: '✅', complete: '✅', finish: '✅', achieve: '✅',
        goal: '🎯', target: '🎯', aim: '🎯', focus: '🎯',
        best: '👑', king: '👑', queen: '👑', top: '👑', leader: '👑',
        celebrate: '🎉', congratulations: '🎉', party: '🎉', victory: '🎉',
        star: '⭐', excellent: '⭐', outstanding: '⭐',
        // Money & business
        money: '💰', revenue: '💰', profit: '💰', income: '💰', dollar: '💰', cash: '💰',
        growth: '📈', grow: '📈', increase: '📈', rise: '📈', scale: '📈',
        invest: '💎', valuable: '💎', premium: '💎', luxury: '💎', rich: '💎',
        // Tech & ideas
        brain: '🧠', think: '🧠', idea: '🧠', smart: '🧠', mind: '🧠', learn: '🧠',
        code: '💻', software: '💻', app: '💻', tech: '💻', developer: '💻',
        rocket: '🚀', launch: '🚀', fly: '🚀', moon: '🚀', sky: '🚀',
        light: '💡', bulb: '💡', insight: '💡', discover: '💡', reveal: '💡',
        // Nature & world
        earth: '🌍', world: '🌍', global: '🌍', planet: '🌍',
        sun: '☀️', bright: '☀️', shine: '☀️',
        ocean: '🌊', water: '🌊', wave: '🌊', sea: '🌊',
        // Communication
        subscribe: '🔔', notification: '🔔', bell: '🔔',
        share: '📢', announce: '📢',
        music: '🎵', song: '🎵', sound: '🎵',
        camera: '📸', photo: '📸', video: '📸',
        book: '📚', read: '📚', study: '📚',
        time: '⏰', clock: '⏰', hour: '⏰', deadline: '⏰',
        food: '🍕', eat: '🍕', recipe: '🍕', cook: '🍕',
        // Warnings / negativity
        danger: '⚠️', warning: '⚠️', careful: '⚠️', risk: '⚠️',
        stop: '🛑', wrong: '🛑', mistake: '🛑', bad: '🛑',
        question: '❓', wonder: '❓', how: '❓', why: '❓',
        point: '👆', important: '👆', key: '👆', remember: '👆',
        secret: '🤫', exclusive: '🤫', private: '🤫',
    };

    const words = text.replace(/[^a-z\s]/g, '').split(/\s+/);
    for (const word of words) {
        if (emojiMap[word]) return emojiMap[word];
    }
    return null;
}

/**
 * Get professional color palette
 */
function getProColor(count: number): string {
    const proColors = [
        '#6366f1', // Indigo
        '#8b5cf6', // Violet
        '#06b6d4', // Cyan
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#ec4899', // Pink
        '#3b82f6', // Blue
    ];
    return proColors[count % proColors.length];
}

/**
 * Generate a generic but contextual prompt when no keywords match
 */
function generateGenericPrompt(text: string): string {
    const words = text.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !isStopWord(w));

    if (words.length > 0) {
        const keyConcept = words.slice(0, 2).join(' ');
        return `Professional ${keyConcept} visualization, modern corporate design, clean minimalist style, soft lighting, business presentation background, high quality professional ${keyConcept} concept`;
    }

    return 'Professional abstract business concept, modern corporate design, clean minimalist style, soft lighting, motivational startup visualization';
}

/**
 * Extract the most meaningful keyword from text for labeling
 */
function extractKeyword(text: string): string {
    const words = text.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !isStopWord(w));
    return words[0] || 'scene';
}

/**
 * Generate hash from string for consistent seeds
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash) % 1000000;
}

/**
 * Suggest a single overlay for one segment using AI, based on user's custom text prompt.
 * Falls back to local dynamic generation if the API fails.
 */
export async function suggestSingleOverlayWithAI(
    segmentText: string,
    userPrompt: string
): Promise<OverlayConfig | null> {
    try {
        const response = await fetch('/api/suggest-single-overlay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ segmentText, userPrompt }),
        });

        const data = await response.json();

        if (data.overlay && data.overlay.type && data.overlay.props) {
            return data.overlay as OverlayConfig;
        }

        console.warn('AI single overlay failed, using local dynamic generation');
        return generateSingleDynamicOverlay(segmentText, userPrompt);
    } catch (error) {
        console.error('Single overlay suggestion failed:', error);
        return generateSingleDynamicOverlay(segmentText, userPrompt);
    }
}

/**
 * Generate a single dynamic overlay based on text + user prompt
 * Picks a contextual on-screen overlay (emoji or kinetic text)
 */
function generateSingleDynamicOverlay(
    segmentText: string,
    userPrompt: string
): OverlayConfig | null {
    const combined = `${segmentText} ${userPrompt}`;
    const count = Math.floor(Math.random() * 100);
    return selectProOverlay(combined, count);
}

// ═══════════════════════════════════════════════════════════════════════
//  AGENTIC EDITING — request full editing plan and apply it
// ═══════════════════════════════════════════════════════════════════════

/**
 * Request a full AI editing plan from the /api/agent-edit endpoint.
 * Returns the raw EditingPlan or null on failure.
 */
export async function requestAgentEditPlan(
    subtitles: SubtitleSegment[],
    videoDuration: number,
    videoWidth?: number,
    videoHeight?: number,
    editingStyle?: string,
    model?: string,
    analysis?: VideoAnalysisResult,
): Promise<EditingPlan | null> {
    try {
        let analysisPayload;
        try {
            analysisPayload = analysis ? buildAnalysisPayload(analysis, subtitles) : undefined;
        } catch (e) {
            console.error('[AgentEdit] Analysis serialization failed, sending request without it:', e);
        }

        const response = await fetch('/api/agent-edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subtitles: subtitles.map(s => ({
                    id: s.id,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    text: s.text,
                })),
                videoDuration,
                videoWidth: videoWidth || 1920,
                videoHeight: videoHeight || 1080,
                editingStyle: editingStyle || 'auto',
                model,
                videoAnalysis: analysisPayload,
            }),
        });

        const data = await response.json();

        if (data.ok && data.editingPlan) {
            console.log('[AgentEdit] Received editing plan, source:', data.source);
            return data.editingPlan as EditingPlan;
        }

        console.warn('[AgentEdit] API returned error:', data.error);
        return null;
    } catch (error) {
        console.error('[AgentEdit] Request failed:', error);
        return null;
    }
}

/**
 * Apply an AI editing plan to subtitle segments.
 * Returns updated segments with overlays, effects, transitions, and speed changes,
 * plus suggested VideoFilters from the plan's colorGrade.
 */
export function applyEditingPlan(
    subtitles: SubtitleSegment[],
    plan: EditingPlan,
): { subtitles: SubtitleSegment[]; filters: Partial<VideoFilters> } {
    // Build a lookup map for the plan segments
    const planMap = new Map<string, (typeof plan.segments)[0]>();
    for (const seg of plan.segments) {
        planMap.set(seg.segmentId, seg);
    }

    // Apply the plan to each subtitle segment
    const updatedSubtitles = subtitles.map(seg => {
        const planSeg = planMap.get(seg.id);
        if (!planSeg) return { ...seg };

        const updated: SubtitleSegment = { ...seg };

        // Apply overlay (only if the plan specifies one)
        if (planSeg.overlay && planSeg.overlay.type) {
            updated.overlay = {
                type: planSeg.overlay.type as OverlayConfig['type'],
                props: planSeg.overlay.props || {},
            };

            // For ai-generated-image overlays, generate a Pollinations URL if no imageUrl provided
            if (planSeg.overlay.type === 'ai-generated-image' && !planSeg.overlay.props?.imageUrl) {
                const prompt = String(planSeg.overlay.props?.imagePrompt || seg.text);
                const seed = Math.abs(seg.text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)) % 1000000;
                updated.overlay.props = {
                    ...updated.overlay.props,
                    imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}, cinematic, professional`)}?width=1280&height=720&nologo=true&seed=${seed}`,
                    caption: planSeg.overlay.props?.caption || extractLabelFromText(seg.text),
                    seed,
                    imagePrompt: prompt,
                };
            }
        }

        // Apply effect
        if (planSeg.effect) {
            updated.effect = {
                type: planSeg.effect.type as SubtitleSegment['effect'] extends undefined ? never : NonNullable<SubtitleSegment['effect']>['type'],
                intensity: planSeg.effect.intensity,
                direction: planSeg.effect.direction,
            };
        }

        // Apply transition
        if (planSeg.transition) {
            updated.transition = {
                type: planSeg.transition.type as NonNullable<SubtitleSegment['transition']>['type'],
                duration: planSeg.transition.duration || 0.4,
            };
        }

        // Apply speed factor
        if (planSeg.speedFactor && planSeg.speedFactor !== 1) {
            updated.speedFactor = planSeg.speedFactor;
        }

        return updated;
    });

    // Extract color grading from the plan
    const filters: Partial<VideoFilters> = {};
    if (plan.colorGrade) {
        if (plan.colorGrade.brightness !== undefined) filters.brightness = plan.colorGrade.brightness;
        if (plan.colorGrade.contrast !== undefined) filters.contrast = plan.colorGrade.contrast;
        if (plan.colorGrade.saturation !== undefined) filters.saturation = plan.colorGrade.saturation;
        if (plan.colorGrade.temperature !== undefined) filters.temperature = plan.colorGrade.temperature;
    }

    return { subtitles: updatedSubtitles, filters };
}

