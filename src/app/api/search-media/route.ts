import { NextRequest, NextResponse } from 'next/server';

// API keys for various media providers
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'dc6zaTOxFygZc'; // Public beta key
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || '';

interface MediaResult {
    id: string;
    type: 'gif' | 'image' | 'video';
    url: string;
    thumbnailUrl: string;
    source: string;
    title?: string;
    width?: number;
    height?: number;
    duration?: number; // For videos
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'gif', 'image', 'video', or 'all'
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!query) {
        return NextResponse.json({ results: [], error: 'No search query provided' });
    }

    try {
        const results: MediaResult[] = [];

        // Search GIFs from Giphy
        if (type === 'all' || type === 'gif') {
            const gifResults = await searchGiphy(query, limit);
            results.push(...gifResults);
        }

        // Search images from Pexels
        if (type === 'all' || type === 'image') {
            const imageResults = await searchPexels(query, limit);
            results.push(...imageResults);
        }

        // Search videos from Pexels
        if (type === 'all' || type === 'video') {
            const videoResults = await searchPexelsVideos(query, Math.floor(limit / 2));
            results.push(...videoResults);
        }

        // If no API keys, use Pixabay as fallback (free API)
        if (results.length === 0) {
            const pixabayResults = await searchPixabay(query, type, limit);
            results.push(...pixabayResults);
        }

        return NextResponse.json({ results, total: results.length });
    } catch (error) {
        console.error('[Search Media] Error:', error);
        return NextResponse.json({ results: [], error: 'Search failed' });
    }
}

// Giphy API for GIFs
async function searchGiphy(query: string, limit: number): Promise<MediaResult[]> {
    try {
        const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=pg&lang=en`;
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn('[Giphy] API failed:', response.status);
            return [];
        }

        const data = await response.json();
        
        return data.data.map((gif: any) => ({
            id: `giphy-${gif.id}`,
            type: 'gif',
            url: gif.images.original?.url || gif.images.downsized?.url || gif.url,
            thumbnailUrl: gif.images.fixed_height_small?.url || gif.images.preview?.url || gif.images.downsized?.url,
            source: 'giphy',
            title: gif.title || query,
            width: parseInt(gif.images.original?.width || '0', 10),
            height: parseInt(gif.images.original?.height || '0', 10),
        }));
    } catch (error) {
        console.warn('[Giphy] Error:', error);
        return [];
    }
}

// Pexels API for images
async function searchPexels(query: string, limit: number): Promise<MediaResult[]> {
    if (!PEXELS_API_KEY) {
        console.warn('[Pexels] No API key configured');
        return [];
    }

    try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': PEXELS_API_KEY,
            },
        });

        if (!response.ok) {
            console.warn('[Pexels] API failed:', response.status);
            return [];
        }

        const data = await response.json();
        
        return data.photos.map((photo: any) => ({
            id: `pexels-${photo.id}`,
            type: 'image',
            url: photo.src?.large || photo.src?.medium || photo.src?.original,
            thumbnailUrl: photo.src?.small || photo.src?.tiny || photo.src?.medium,
            source: 'pexels',
            title: photo.alt || query,
            width: photo.width,
            height: photo.height,
        }));
    } catch (error) {
        console.warn('[Pexels] Error:', error);
        return [];
    }
}

// Pexels API for videos
async function searchPexelsVideos(query: string, limit: number): Promise<MediaResult[]> {
    if (!PEXELS_API_KEY) {
        console.warn('[Pexels Videos] No API key configured');
        return [];
    }

    try {
        const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': PEXELS_API_KEY,
            },
        });

        if (!response.ok) {
            console.warn('[Pexels Videos] API failed:', response.status);
            return [];
        }

        const data = await response.json();
        
        return data.videos.map((video: any) => ({
            id: `pexels-video-${video.id}`,
            type: 'video',
            url: video.video_files?.[0]?.link || video.url,
            thumbnailUrl: video.image || video.video_pictures?.[0]?.picture || '',
            source: 'pexels',
            title: video.alt || query,
            width: video.width,
            height: video.height,
            duration: video.duration,
        }));
    } catch (error) {
        console.warn('[Pexels Videos] Error:', error);
        return [];
    }
}

// Pixabay fallback (free API with generous limits)
async function searchPixabay(query: string, type: string, limit: number): Promise<MediaResult[]> {
    if (!PIXABAY_API_KEY) {
        // Use public demo mode - returns limited results
        console.warn('[Pixabay] Using demo mode - limited results');
    }

    try {
        const apiKey = PIXABAY_API_KEY || '43684696-08e1e4b6fa6d48d83b27a7c8c'; // Public demo key
        const typeParam = type === 'gif' ? 'animation' : type === 'video' ? 'videos' : 'photo';
        
        const allResults: MediaResult[] = [];
        
        // Images API
        if (type === 'all' || type === 'image' || type === 'gif') {
            const imageUrl = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=${type === 'gif' ? 'animation' : 'photo'}&per_page=${limit}&orientation=horizontal&safesearch=true`;
            
            const imageResponse = await fetch(imageUrl);
            const imageData = await imageResponse.json();
            
            const parsedImageResults = (imageData.hits || []).map((hit: any) => ({
                id: `pixabay-${hit.id}`,
                type: type === 'gif' ? 'gif' as const : 'image' as const,
                url: hit.largeImageURL || hit.webformatURL,
                thumbnailUrl: hit.previewURL || hit.webformatURL,
                source: 'pixabay',
                title: hit.tags || query,
                width: hit.imageWidth,
                height: hit.imageHeight,
            }));
            allResults.push(...parsedImageResults);
        }

        // Videos API (separate check to avoid TypeScript narrowing issue)
        if (type === 'all' || type === 'video') {
            const videoUrl = `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=${Math.floor(limit/2)}&orientation=horizontal&safesearch=true`;
            
            const videoResponse = await fetch(videoUrl);
            const videoData = await videoResponse.json();
            
            const videoResults = (videoData.hits || []).map((hit: any) => ({
                id: `pixabay-video-${hit.id}`,
                type: 'video' as const,
                url: hit.videos?.large?.url || hit.videos?.medium?.url || hit.videos?.small?.url,
                thumbnailUrl: hit.picture_id ? `https://i.vimeocdn.com/video/${hit.picture_id}_640x360.jpg` : '',
                source: 'pixabay',
                title: hit.tags || query,
                width: hit.videos?.large?.width || hit.videos?.medium?.width,
                height: hit.videos?.large?.height || hit.videos?.medium?.height,
                duration: hit.duration,
            }));
            allResults.push(...videoResults);
        }

        return allResults;
    } catch (error) {
        console.warn('[Pixabay] Error:', error);
        return [];
    }
}