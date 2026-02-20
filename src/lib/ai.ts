// AI integration for auto-suggesting overlays
// Uses DeepSeek V3.1 via the /api/suggest-overlays server-side route
// Falls back to local keyword matching if API fails
// Now supports AI-generated images based on script content analysis

import { SubtitleSegment, OverlayConfig } from './types';

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

/**
 * Generate a dynamic image prompt based on text content using keyword analysis
 */
function generateDynamicPrompt(text: string): { prompt: string; style: string } | null {
    const lower = text.toLowerCase();

    // First, try to find a direct keyword match from our extended map
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);

    for (const word of words) {
        if (KEYWORD_MAP[word]) {
            const match = KEYWORD_MAP[word];
            // Add context from the text
            const contextualizedPrompt = `${match.prompt}, context: ${text.substring(0, 80)}`;
            return { prompt: contextualizedPrompt, style: match.style };
        }
    }

    // Check for multi-word phrases
    for (let i = 0; i < words.length - 1; i++) {
        const phrase = words[i] + ' ' + words[i + 1];
        if (KEYWORD_MAP[phrase]) {
            const match = KEYWORD_MAP[phrase];
            const contextualizedPrompt = `${match.prompt}, context: ${text.substring(0, 80)}`;
            return { prompt: contextualizedPrompt, style: match.style };
        }
    }

    // Fall back to SCENE_DESCRIPTORS for broader matching
    for (const descriptor of SCENE_DESCRIPTORS) {
        if (lower.includes(descriptor.concept)) {
            const contextualizedPrompt = `${descriptor.promptTemplate}, context: ${text.substring(0, 100)}`;
            return { prompt: contextualizedPrompt, style: descriptor.style };
        }
    }

    // For texts without matching keywords, generate a contextual prompt based on the content
    // Analyze what the text is about and create a relevant visualization
    const contentAnalysis = analyzeContent(text);
    if (contentAnalysis) {
        return contentAnalysis;
    }

    // Ultimate fallback: abstract professional visualization
    return {
        prompt: `Professional abstract visualization representing key message, modern minimalist design, clean composition, soft lighting, conceptual art style, corporate presentation background`,
        style: 'minimalist illustration'
    };
}

/**
 * Analyze text content and generate appropriate visualization
 */
function analyzeContent(text: string): { prompt: string; style: string } | null {
    const lower = text.toLowerCase();

    // Check for question patterns
    if (lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('why')) {
        return {
            prompt: 'Question mark transforming to lightbulb, answer revelation concept, inspiring visualization with soft glow, professional lighting',
            style: 'digital art'
        };
    }

    // Check for instruction/command patterns (imperative mood)
    if (lower.startsWith('click') || lower.startsWith('tap') || lower.startsWith('press')) {
        return {
            prompt: 'Touch screen interaction with glowing finger tap, digital button press, modern UI concept with blue glow',
            style: 'digital art'
        };
    }

    // Check for promise/guarantee language
    if (lower.includes('guarantee') || lower.includes('promise') || lower.includes('ensure')) {
        return {
            prompt: 'Shield with glowing checkmark, security and trust concept, professional blue background with light rays',
            style: 'minimalist illustration'
        };
    }

    // Check for comparison/contrast
    if (lower.includes('vs') || lower.includes('versus') || lower.includes('compare')) {
        return {
            prompt: 'Two options with comparison visual, choice decision concept, modern professional visualization',
            style: 'minimalist illustration'
        };
    }

    // Check for list/enumeration
    const bulletMatch = text.match(/^(\d+\.|\•|\-)\s*/m);
    if (bulletMatch) {
        return {
            prompt: 'Numbered list with glowing checkmarks, organized checklist concept, productivity visualization',
            style: 'minimalist illustration'
        };
    }

    // Check for urgency
    if (lower.includes('limited') || lower.includes('only') || lower.includes('today') || lower.includes('hurry')) {
        return {
            prompt: 'Countdown timer with urgency, limited time offer concept, red and gold warning colors',
            style: 'digital art'
        };
    }

    // Check for exclusive content
    if (lower.includes('exclusive') || lower.includes('private') || lower.includes('members')) {
        return {
            prompt: 'VIP exclusive access with golden glow, premium membership concept, luxurious dark background',
            style: 'digital art'
        };
    }

    // Check for value proposition
    if (lower.includes('free') || lower.includes('discount') || lower.includes('save')) {
        return {
            prompt: 'Sale discount tag with golden glow, savings concept, promotional offer visualization',
            style: 'digital art'
        };
    }

    // Check for transformation/change
    if (lower.includes('transform') || lower.includes('change') || lower.includes('improve')) {
        return {
            prompt: 'Transformation arrow with glowing particles, before and after concept, improvement visualization',
            style: 'digital art'
        };
    }

    // Check for problem/solution
    if (lower.includes('problem') || lower.includes('solve') || lower.includes('solution')) {
        return {
            prompt: 'Puzzle pieces coming together, problem solving concept, solution with light bulb moment',
            style: 'digital art'
        };
    }

    // Check for testimonials/social proof
    if (lower.includes('review') || lower.includes('testimonial') || lower.includes('customer said')) {
        return {
            prompt: 'Customer testimonial with star ratings, review concept, social proof visualization',
            style: 'minimalist illustration'
        };
    }

    // Check for bio/creator introduction
    if (lower.includes('i am') || lower.includes('my name') || lower.includes('creator')) {
        return {
            prompt: 'Professional portrait silhouette, creator introduction, warm welcoming lighting',
            style: 'cinematic photography'
        };
    }

    // Check for call to action
    if (lower.includes('subscribe') || lower.includes('follow') || lower.includes('like') || lower.includes('comment')) {
        return {
            prompt: 'Social media engagement concept with glowing icons, subscriber growth visualization',
            style: 'digital art'
        };
    }

    return null;
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
 * Generate AI image URL using Pollinations.ai
 */
function generateAIImageUrl(prompt: string, seed: number): string {
    const encodedPrompt = encodeURIComponent(`${prompt}, high quality, professional`);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${seed}`;
}

/**
 * Suggest overlays using DeepSeek V3.1 AI via the server-side API route.
 * Falls back to local dynamic prompt generation if the API is unavailable.
 * Now generates custom AI images based on script content.
 */
export async function suggestOverlaysWithAI(
    subtitles: SubtitleSegment[],
    model?: string
): Promise<SubtitleSegment[]> {
    try {
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
            }),
        });

        const data = await response.json();

        if (data.suggestions && data.suggestions.length > 0) {
            // Apply AI suggestions to the subtitle segments
            const withAISuggestions = subtitles.map((seg) => {
                const suggestion = data.suggestions.find(
                    (s: { segmentId: string; type: string; props: Record<string, unknown> }) =>
                        s.segmentId === seg.id
                );
                if (suggestion && !seg.overlay) {
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

        // API returned no suggestions, fall back to local dynamic generation
        console.warn('AI returned no suggestions, using local dynamic generation');
        return generateDynamicOverlays(subtitles);
    } catch (error) {
        console.error('AI suggestion API failed:', error);
        return generateDynamicOverlays(subtitles);
    }
}

/**
 * Local dynamic overlay generation with AI-generated images
 * Creates custom prompts and image URLs based on content analysis
 */
export function generateDynamicOverlays(subtitles: SubtitleSegment[]): SubtitleSegment[] {
    // Reset module-level tracking so each video gets fresh scene selection
    lastUsedScene = '';

    return subtitles.map((seg, index) => {
        // Always try to add a motion graphic - be more aggressive with overlays
        // Skip only truly generic/filler text
        if (isGenericFiller(seg.text)) {
            return seg; // No overlay for filler text
        }

        const overlayType = selectProOverlay(seg.text, index);

        return {
            ...seg,
            overlay: overlayType,
        };
    });
}

function isGenericFiller(text: string): boolean {
    const lower = text.toLowerCase();
    const fillerPatterns = [
        'thank you for watching',
        'like and subscribe',
        'please subscribe',
        'see you in the next',
        'don\'t forget',
        'comment below',
        'let me know',
        'that\'s it for',
    ];
    return fillerPatterns.some(p => lower.includes(p));
}

function hasVisualKeyword(text: string): boolean {
    const lower = text.toLowerCase();
    // Check for any meaningful words - be more lenient
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);

    // If no words of length > 2, check for shorter meaningful words
    if (words.length === 0) {
        const shortWords = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 1);
        return shortWords.some(w => CONTENT_SCENE_MAP[w] !== undefined);
    }

    // Check if any word matches
    const hasMatch = words.some(w => CONTENT_SCENE_MAP[w] !== undefined);

    // Also check for important business/tech terms that might be compound
    const importantTerms = ['welcome', 'new', 'show', 'talk', 'going', 'really', 'video', 'here', 'today', 'going', 'going to'];
    const hasImportant = words.some(w => importantTerms.includes(w));

    return hasMatch || hasImportant;
}

/**
 * Content → scene mapping for smart visual selection
 */
const CONTENT_SCENE_MAP: Record<string, string> = {
    // Money & Business
    money: 'money-flow', revenue: 'money-flow', profit: 'money-flow', income: 'money-flow',
    dollar: 'money-flow', cash: 'money-flow', price: 'money-flow', cost: 'money-flow',
    sales: 'shopping-cart', buy: 'shopping-cart', shop: 'shopping-cart', purchase: 'shopping-cart',
    store: 'shopping-cart', product: 'shopping-cart',
    business: 'growth-chart', company: 'growth-chart', startup: 'growth-chart',
    stock: 'growth-chart', invest: 'growth-chart', market: 'growth-chart',
    luxury: 'diamond-gem', premium: 'diamond-gem', expensive: 'diamond-gem',
    valuable: 'diamond-gem', precious: 'diamond-gem', rich: 'diamond-gem',
    // Growth & Success
    growth: 'arrow-growth', grow: 'arrow-growth', increase: 'arrow-growth',
    rise: 'arrow-growth', scale: 'arrow-growth', expand: 'arrow-growth',
    boost: 'arrow-growth', skyrocket: 'arrow-growth',
    success: 'checkmark-success', achieve: 'checkmark-success', accomplish: 'checkmark-success',
    done: 'checkmark-success', complete: 'checkmark-success', finish: 'checkmark-success',
    win: 'celebration', champion: 'celebration', winner: 'celebration',
    congratulations: 'celebration', celebrate: 'celebration', victory: 'celebration',
    goal: 'target-bullseye', target: 'target-bullseye', aim: 'target-bullseye',
    focus: 'target-bullseye', precise: 'target-bullseye',
    best: 'crown-royal', king: 'crown-royal', queen: 'crown-royal',
    top: 'crown-royal', leader: 'crown-royal',
    // Technology & Science
    brain: 'brain-idea', think: 'brain-idea', idea: 'brain-idea',
    smart: 'brain-idea', mind: 'brain-idea', learn: 'brain-idea',
    knowledge: 'brain-idea', understand: 'brain-idea',
    code: 'code-terminal', programming: 'code-terminal', software: 'code-terminal',
    developer: 'code-terminal', app: 'code-terminal', website: 'code-terminal',
    tech: 'code-terminal', digital: 'code-terminal', computer: 'code-terminal',
    connect: 'connections', network: 'connections', social: 'connections',
    internet: 'connections', online: 'connections', community: 'connections',
    together: 'connections', collaborate: 'connections',
    science: 'atom-science', research: 'atom-science', experiment: 'atom-science',
    physics: 'atom-science', chemistry: 'atom-science', quantum: 'atom-science',
    machine: 'gear-system', system: 'gear-system', engine: 'gear-system',
    process: 'gear-system', automate: 'gear-system', build: 'gear-system',
    tool: 'gear-system', work: 'gear-system',
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
    passion: 'fire-blaze', intense: 'fire-blaze',
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
    calm: 'water-wave', beach: 'water-wave',
    mountain: 'mountain-peak', climb: 'mountain-peak', summit: 'mountain-peak',
    peak: 'mountain-peak', challenge: 'mountain-peak', overcome: 'mountain-peak',
    journey: 'mountain-peak', adventure: 'mountain-peak', effort: 'mountain-peak',
    sun: 'solar-system', star: 'solar-system', universe: 'solar-system',
    galaxy: 'solar-system', cosmic: 'solar-system',
    city: 'city-skyline', urban: 'city-skyline', downtown: 'city-skyline',
    building: 'city-skyline', skyline: 'city-skyline',
    // Emotions & Actions
    love: 'heartbeat', heart: 'heartbeat', feel: 'heartbeat',
    care: 'heartbeat', emotion: 'heartbeat', life: 'heartbeat',
    health: 'heartbeat', alive: 'heartbeat',
    protect: 'shield-protect', safe: 'shield-protect', security: 'shield-protect',
    guard: 'shield-protect', defense: 'shield-protect', trust: 'shield-protect',
    guarantee: 'shield-protect', reliable: 'shield-protect',
    walk: 'person-walking', step: 'person-walking', move: 'person-walking',
    run: 'person-walking', exercise: 'person-walking',
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

// Track last used scene to avoid repeats
let lastUsedScene = '';

/**
 * Select the best overlay type based on content analysis.
 * Generates contextual on-screen overlays (emoji, kinetic text, highlight boxes)
 * that appear ON TOP of the video — NOT full-screen replacements.
 */
function selectProOverlay(text: string, count: number): OverlayConfig {
    const lower = text.toLowerCase();
    const color = getProColor(count);

    // --- Emoji reactions for emotional / reaction content ---
    const emojiMatch = pickEmoji(lower);
    if (emojiMatch && count % 3 !== 0) {
        return {
            type: 'emoji-reaction',
            props: {
                emoji: emojiMatch,
                size: 70,
            },
        };
    }

    // --- Kinetic text for key statements, stats, and impactful phrases ---
    const label = extractLabelFromText(text);
    if (label && label.length > 2 && count % 4 !== 0) {
        const kineticStyles = ['pop', 'slide', 'bounce'] as const;
        const positions = ['center', 'top', 'bottom'] as const;
        return {
            type: 'kinetic-text',
            props: {
                text: label,
                color,
                style: kineticStyles[count % kineticStyles.length],
                position: positions[count % positions.length],
                fontSize: 42,
            },
        };
    }

    // --- Highlight box for emphasis ---
    if (count % 3 === 0) {
        const highlightStyles = ['glow', 'underline', 'box'] as const;
        return {
            type: 'highlight-box',
            props: {
                text: label || text.substring(0, 30),
                color,
                style: highlightStyles[count % highlightStyles.length],
            },
        };
    }

    // --- Default: emoji reaction fallback ---
    const fallbackEmojis = ['✨', '💡', '🎯', '🔥', '⚡', '💎', '🚀', '🌟'];
    return {
        type: 'emoji-reaction',
        props: {
            emoji: fallbackEmojis[count % fallbackEmojis.length],
            size: 70,
        },
    };
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

