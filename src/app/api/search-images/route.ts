import { NextRequest, NextResponse } from 'next/server';

// Pexels API - free, generous rate limit, high quality stock photos
// Get your free API key at https://www.pexels.com/api/
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    };
    alt: string;
}

interface PexelsResponse {
    photos: PexelsPhoto[];
    total_results: number;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const count = Math.min(Number(searchParams.get('count') || '6'), 15);

    if (!query) {
        return NextResponse.json({ images: [], error: 'Missing query parameter' }, { status: 400 });
    }

    try {
        // Try Pexels API first if key present
        if (PEXELS_API_KEY) {
            const pexelsImages = await searchPexels(query, count);
            if (pexelsImages.length > 0) {
                return NextResponse.json({ images: pexelsImages, source: 'pexels' });
            }
        }

        // Fallback: use Picsum with keyword-seeded images (always works, no API key)
        const fallbackImages = generatePicsumImages(query, count);
        return NextResponse.json({ images: fallbackImages, source: 'picsum' });
    } catch (error) {
        console.error('[Search Images] Error:', error);
        // Ultimate fallback
        const fallbackImages = generatePicsumImages(query, count);
        return NextResponse.json({ images: fallbackImages, source: 'picsum' });
    }
}

async function searchPexels(query: string, count: number) {
    const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&size=medium`,
        {
            headers: { Authorization: PEXELS_API_KEY },
        }
    );

    if (!response.ok) {
        console.error('[Pexels] API error:', response.status);
        return [];
    }

    const data: PexelsResponse = await response.json();

    return data.photos.map((photo) => ({
        id: String(photo.id),
        url: photo.src.medium,
        thumb: photo.src.small,
        alt: photo.alt || query,
        photographer: photo.photographer,
        width: photo.width,
        height: photo.height,
        source: 'pexels' as const,
    }));
}

function generatePicsumImages(query: string, count: number) {
    // Use keyword as seed for deterministic but varied images
    return Array.from({ length: count }, (_, i) => {
        const seed = `${query}-${i}`;
        const id = hashString(seed) % 1000;
        return {
            id: `picsum-${id}-${i}`,
            url: `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`,
            thumb: `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/300`,
            alt: query,
            photographer: 'Lorem Picsum',
            width: 800,
            height: 600,
            source: 'picsum' as const,
        };
    });
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
