// AI integration for auto-suggesting overlays
// Mock mode by default; plug in Kimi/Claude when ready

import { SubtitleSegment, OverlayConfig } from './types';

/**
 * Auto-suggest overlays for subtitle segments based on content analysis.
 * In mock mode, uses simple keyword matching.
 * In production, calls Kimi/Claude API.
 */
export function autoSuggestOverlays(subtitles: SubtitleSegment[]): SubtitleSegment[] {
    return subtitles.map((seg, index) => {
        const text = seg.text.toLowerCase();
        let overlay: OverlayConfig | undefined;

        // First segment: add lower-third intro
        if (index === 0) {
            overlay = {
                type: 'lower-third',
                props: { name: 'Creator', title: 'Welcome', color: '#6366f1' },
            };
        }
        // Excitement/emphasis keywords
        else if (text.includes('exciting') || text.includes('amazing') || text.includes('incredible')) {
            overlay = {
                type: 'emoji-reaction',
                props: { emoji: '🔥', size: 80 },
            };
        }
        // Key insight moments
        else if (text.includes('key') || text.includes('important') || text.includes('insight')) {
            overlay = {
                type: 'highlight-box',
                props: { color: '#f59e0b', style: 'glow' },
            };
        }
        // Step/transition moments
        else if (text.includes('first') || text.includes('then') || text.includes('next') || text.includes('step')) {
            overlay = {
                type: 'scene-transition',
                props: { style: 'fade', color: '#6366f1' },
            };
        }
        // Subscribe/like CTA
        else if (text.includes('subscribe') || text.includes('like') || text.includes('comment')) {
            overlay = {
                type: 'emoji-reaction',
                props: { emoji: '👍', size: 80 },
            };
        }
        // Zoom for interesting content
        else if (text.includes('interesting') || text.includes('watch') || text.includes('look')) {
            overlay = {
                type: 'zoom-effect',
                props: { scale: 1.3 },
            };
        }

        return { ...seg, overlay: seg.overlay || overlay };
    });
}
