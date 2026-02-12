// AI integration for auto-suggesting overlays
// Uses Kimi 2.5 via the /api/suggest-overlays server-side route
// Falls back to local keyword matching if API fails
// Visual illustrations are the PRIMARY overlay type

import { SubtitleSegment, OverlayConfig } from './types';

// Comprehensive keyword → scene mapping for visual illustrations
const SCENE_KEYWORDS: { scene: string; keywords: string[]; color: string }[] = [
    { scene: 'solar-system', keywords: ['earth', 'sun', 'orbit', 'planet', 'solar', 'space', 'star', 'moon', 'universe', 'galaxy', 'sky', 'night', 'light', 'bright', 'shine'], color: '#6366f1' },
    { scene: 'growth-chart', keywords: ['growth', 'increase', 'revenue', 'rising', 'growing', 'progress', 'chart', 'better', 'improve', 'results', 'success', 'achieve', 'numbers', 'stats', 'data', 'percent', 'more'], color: '#22c55e' },
    { scene: 'globe', keywords: ['global', 'world', 'worldwide', 'international', 'country', 'countries', 'everyone', 'people', 'together', 'community', 'audience', 'viewers', 'welcome'], color: '#3b82f6' },
    { scene: 'rocket-launch', keywords: ['launch', 'rocket', 'blast', 'skyrocket', 'takeoff', 'fly', 'start', 'begin', 'exciting', 'amazing', 'incredible', 'awesome', 'insane', 'ready', 'go', 'let\'s'], color: '#ef4444' },
    { scene: 'brain-idea', keywords: ['brain', 'idea', 'think', 'creative', 'lightbulb', 'innovate', 'discover', 'learn', 'understand', 'insight', 'key', 'important', 'remember', 'tip', 'secret', 'know', 'realize'], color: '#a78bfa' },
    { scene: 'connections', keywords: ['network', 'connect', 'link', 'social', 'relationship', 'together', 'share', 'subscribe', 'follow', 'comment', 'like', 'join', 'build', 'piece'], color: '#6366f1' },
    { scene: 'clock-time', keywords: ['time', 'clock', 'deadline', 'hours', 'schedule', 'minutes', 'while', 'finally', 'wait', 'when', 'today', 'now', 'moment'], color: '#f59e0b' },
    { scene: 'heartbeat', keywords: ['health', 'heart', 'pulse', 'alive', 'energy', 'fitness', 'love', 'passion', 'care', 'feel', 'core', 'fundamental'], color: '#ef4444' },
    { scene: 'money-flow', keywords: ['money', 'dollar', 'invest', 'cost', 'budget', 'profit', 'expense', 'value', 'worth', 'pay', 'price', 'business', 'work', 'project'], color: '#22c55e' },
    { scene: 'lightning', keywords: ['fast', 'speed', 'instant', 'power', 'electric', 'quick', 'lightning', 'simple', 'easy', 'seamless', 'smooth', 'focus', 'sharp', 'works'], color: '#fbbf24' },
    { scene: 'shopping-cart', keywords: ['buy', 'shop', 'shopping', 'purchase', 'cart', 'store', 'retail', 'product', 'order', 'customer', 'sell', 'sale', 'market', 'commerce', 'orange', 'fruit', 'grocery'], color: '#f97316' },
    { scene: 'cooking', keywords: ['cook', 'food', 'recipe', 'kitchen', 'eat', 'meal', 'dinner', 'lunch', 'breakfast', 'restaurant', 'chef', 'bake', 'ingredient', 'taste', 'delicious'], color: '#f97316' },
    { scene: 'nature-tree', keywords: ['nature', 'tree', 'forest', 'garden', 'plant', 'environment', 'green', 'outdoor', 'park', 'leaf', 'flower', 'rain', 'river', 'mountain', 'organic', 'wild'], color: '#16a34a' },
    { scene: 'city-skyline', keywords: ['city', 'urban', 'building', 'downtown', 'skyline', 'office', 'company', 'corporate', 'tower', 'street', 'architecture', 'metropolitan'], color: '#3b82f6' },
    { scene: 'person-walking', keywords: ['walk', 'person', 'journey', 'travel', 'step', 'path', 'road', 'moving', 'forward', 'explore', 'adventure', 'trip', 'destination', 'man', 'woman', 'somebody'], color: '#8b5cf6' },
    { scene: 'celebration', keywords: ['celebrate', 'party', 'win', 'victory', 'achievement', 'congratulate', 'trophy', 'award', 'best', 'champion', 'happy', 'joy', 'cheer', 'fest'], color: '#fbbf24' },
    { scene: 'music-notes', keywords: ['music', 'song', 'sound', 'audio', 'listen', 'hear', 'beat', 'rhythm', 'melody', 'sing', 'instrument', 'concert', 'playlist', 'tune', 'podcast'], color: '#ec4899' },
    { scene: 'book-reading', keywords: ['book', 'read', 'study', 'education', 'school', 'library', 'page', 'chapter', 'write', 'author', 'knowledge', 'course', 'lesson', 'teach', 'class', 'research'], color: '#6366f1' },
    { scene: 'camera', keywords: ['camera', 'photo', 'picture', 'film', 'video', 'record', 'shoot', 'capture', 'image', 'visual', 'screen', 'watch', 'movie', 'cinema', 'content'], color: '#64748b' },
    { scene: 'code-terminal', keywords: ['code', 'program', 'software', 'developer', 'tech', 'computer', 'app', 'website', 'api', 'algorithm', 'digital', 'system', 'debug', 'tool', 'automate', 'script'], color: '#22d3ee' },
];

const FALLBACK_SCENES = ['rocket-launch', 'brain-idea', 'growth-chart', 'lightning', 'connections', 'globe', 'clock-time', 'heartbeat', 'money-flow', 'solar-system', 'shopping-cart', 'cooking', 'nature-tree', 'city-skyline', 'person-walking', 'celebration', 'music-notes', 'book-reading', 'camera', 'code-terminal'];
const FALLBACK_COLORS = ['#ef4444', '#a78bfa', '#22c55e', '#fbbf24', '#6366f1', '#3b82f6', '#f59e0b', '#ef4444', '#22c55e', '#6366f1', '#f97316', '#f97316', '#16a34a', '#3b82f6', '#8b5cf6', '#fbbf24', '#ec4899', '#6366f1', '#64748b', '#22d3ee'];

/** Find the best matching visual scene for a given text */
function findBestScene(text: string): { scene: string; color: string } | null {
    const lower = text.toLowerCase();
    let bestScene = '';
    let bestColor = '#6366f1';
    let bestScore = 0;

    for (const entry of SCENE_KEYWORDS) {
        let score = 0;
        for (const keyword of entry.keywords) {
            if (lower.includes(keyword)) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestScene = entry.scene;
            bestColor = entry.color;
        }
    }

    return bestScore > 0 ? { scene: bestScene, color: bestColor } : null;
}

/**
 * Convert any text-based overlay to a visual illustration.
 * This post-processes ALL overlay suggestions to ensure visual illustrations dominate.
 */
function enforceVisualIllustrations(subtitles: SubtitleSegment[]): SubtitleSegment[] {
    return subtitles.map((seg, index) => {
        // Skip if no overlay, or if it's already a visual-illustration or emoji-reaction
        if (!seg.overlay) return seg;
        if (seg.overlay.type === 'visual-illustration') return seg;
        if (seg.overlay.type === 'emoji-reaction') return seg;

        // Convert text-based overlay → visual illustration
        const match = findBestScene(seg.text);
        if (match) {
            return {
                ...seg,
                overlay: {
                    type: 'visual-illustration' as const,
                    props: { scene: match.scene, label: seg.text.substring(0, 50), color: match.color },
                },
            };
        } else {
            const sceneIndex = index % FALLBACK_SCENES.length;
            return {
                ...seg,
                overlay: {
                    type: 'visual-illustration' as const,
                    props: { scene: FALLBACK_SCENES[sceneIndex], label: seg.text.substring(0, 50), color: FALLBACK_COLORS[sceneIndex] },
                },
            };
        }
    });
}

/**
 * Suggest overlays using Kimi 2.5 AI via the server-side API route.
 * Falls back to local keyword matching if the API is unavailable.
 * ALL results are post-processed to use visual illustrations as the dominant overlay type.
 */
export async function suggestOverlaysWithAI(
    subtitles: SubtitleSegment[]
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

            // Post-process: convert text-based overlays → visual illustrations
            return enforceVisualIllustrations(withAISuggestions);
        }

        // API returned no suggestions, fall back to local
        console.warn('Kimi 2.5 returned no suggestions, using local fallback');
        return autoSuggestOverlays(subtitles);
    } catch (error) {
        console.error('AI suggestion API failed:', error);
        return autoSuggestOverlays(subtitles);
    }
}

/**
 * Local keyword-matching fallback for overlay suggestions.
 * Used when Kimi 2.5 API is unavailable.
 * Visual illustrations are the PRIMARY overlay type.
 */
export function autoSuggestOverlays(subtitles: SubtitleSegment[]): SubtitleSegment[] {
    let lastOverlayIndex = -10; // Track spacing between overlays

    return subtitles.map((seg, index) => {
        const text = seg.text.toLowerCase();
        let overlay: OverlayConfig | undefined;

        // Enforce spacing: at least 2 segments between overlays
        const tooClose = (index - lastOverlayIndex) < 2;

        // VISUAL ILLUSTRATION (dominant overlay type)
        if (!tooClose) {
            const match = findBestScene(text);
            if (match) {
                overlay = {
                    type: 'visual-illustration',
                    props: { scene: match.scene, label: '', color: match.color, displayMode: 'full', transition: 'fade-in', soundEffect: 'none' },
                };
            } else {
                // Even when no keywords match, still use a visual illustration with a rotating scene
                const sceneIndex = index % FALLBACK_SCENES.length;
                overlay = {
                    type: 'visual-illustration',
                    props: { scene: FALLBACK_SCENES[sceneIndex], label: '', color: FALLBACK_COLORS[sceneIndex], displayMode: 'full', transition: 'fade-in', soundEffect: 'none' },
                };
            }
        }

        if (overlay) {
            lastOverlayIndex = index;
        }

        return { ...seg, overlay: seg.overlay || overlay };
    });
}

/**
 * Suggest a single overlay for one segment using AI, based on user's custom text prompt.
 * Falls back to local keyword matching if the API fails.
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

        // Fallback: use local keyword matching on combined text
        console.warn('AI single overlay failed, using local fallback');
        return localFallbackFromPrompt(segmentText, userPrompt);
    } catch (error) {
        console.error('Single overlay suggestion failed:', error);
        return localFallbackFromPrompt(segmentText, userPrompt);
    }
}

/** Local fallback: match keywords from combined segment text + user prompt */
function localFallbackFromPrompt(
    segmentText: string,
    userPrompt: string
): OverlayConfig | null {
    const combined = `${segmentText} ${userPrompt}`;
    const match = findBestScene(combined);
    if (match) {
        return {
            type: 'visual-illustration',
            props: { scene: match.scene, label: '', color: match.color, displayMode: 'full', transition: 'fade-in', soundEffect: 'none' },
        };
    }
    // Check for emoji-related keywords
    const lower = userPrompt.toLowerCase();
    if (lower.includes('emoji') || lower.includes('reaction') || lower.includes('fire') || lower.includes('🔥')) {
        return { type: 'emoji-reaction', props: { emoji: '🔥', size: 80 } };
    }

    // Default to visual illustration with brain-idea
    return {
        type: 'visual-illustration',
        props: { scene: 'brain-idea', label: '', color: '#a78bfa', displayMode: 'full', transition: 'fade-in', soundEffect: 'none' },
    };
}
