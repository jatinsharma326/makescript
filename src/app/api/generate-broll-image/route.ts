import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate B-roll images from transcript text
 * Tries multiple free image sources in order until one works:
 * 1. Pollinations.ai (AI-generated, content-specific)
 * 2. Unsplash Source (keyword-based stock photos)
 * 3. Picsum (random but reliable fallback)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt') || 'abstract visual';
    const width = Number(searchParams.get('w') || '1280');
    const height = Number(searchParams.get('h') || '720');

    // Extract clean keywords from the prompt for image search
    const keywords = extractKeywords(prompt);
    const keywordStr = keywords.join(' ');

    // Try sources in order
    const sources = [
        // 1. Pollinations AI (best quality, AI-generated)
        () => tryPollinations(prompt, width, height),
        // 2. Unsplash Source (good stock photos by keyword)
        () => tryUnsplash(keywordStr, width, height),
        // 3. Picsum (always works, random photos)
        () => tryPicsum(prompt, width, height),
    ];

    for (const trySource of sources) {
        try {
            const result = await trySource();
            if (result) {
                return NextResponse.json({ imageUrl: result.url, source: result.source });
            }
        } catch (error) {
            console.error('[B-Roll Image] Source failed:', error);
            continue;
        }
    }

    // Ultimate fallback - always works
    const seed = hashString(prompt);
    return NextResponse.json({
        imageUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`,
        source: 'picsum-fallback',
    });
}

async function tryPollinations(prompt: string, w: number, h: number) {
    const cleanPrompt = prompt
        .replace(/[^a-zA-Z0-9\s,.-]/g, '')
        .trim()
        .substring(0, 200);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt + ', cinematic, professional, 4k')}?width=${w}&height=${h}&nologo=true`;

    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    if (response.ok) {
        return { url, source: 'pollinations' };
    }
    return null;
}

async function tryUnsplash(keywords: string, w: number, h: number) {
    // Unsplash Source API - free, no API key needed, returns photos by keyword
    const url = `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(keywords)}`;
    const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
        // Unsplash redirects to the actual image URL
        return { url: response.url || url, source: 'unsplash' };
    }
    return null;
}

async function tryPicsum(prompt: string, w: number, h: number) {
    const seed = hashString(prompt);
    const url = `https://picsum.photos/seed/${seed}/${w}/${h}`;
    return { url, source: 'picsum' };
}

function extractKeywords(text: string): string[] {
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'shall', 'can', 'need', 'to', 'of', 'in',
        'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
        'so', 'just', 'like', 'about', 'up', 'down', 'very', 'really',
        'and', 'or', 'but', 'if', 'that', 'this', 'it', 'its', 'you',
        'your', 'we', 'our', 'they', 'their', 'he', 'she', 'him', 'her',
        'my', 'me', 'i', 'also', 'only', 'some', 'all', 'both', 'each',
    ]);
    return text.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .slice(0, 5);
}

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}
