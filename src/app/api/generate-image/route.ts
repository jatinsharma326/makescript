import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to generate images using PaddlePaddle Ernie Image API
 * Workflow:
 * 1. POST to get an event_id
 * 2. GET the result using that event_id
 */

const ERNIE_API_BASE = 'https://paddlepaddle-ernie-image.ms.fun';

interface GenerateImageRequest {
    prompt: string;
    width?: number;
    height?: number;
    seed?: number;
    steps?: number;
    guidanceScale?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: GenerateImageRequest = await request.json();
        
        const { prompt, width = 1024, height = 1024, seed = -1, steps = 8, guidanceScale = 1 } = body;
        
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Step 1: Call the Gradio API to get an event_id
        const initiateResponse = await fetch(`${ERNIE_API_BASE}/gradio_api/call/generate_image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: [
                    prompt,  // First parameter - the image prompt
                    "",  // Second parameter (negative prompt - keep empty)
                    width,
                    height,
                    seed,
                    steps,
                    guidanceScale
                ]
            }),
        });

        if (!initiateResponse.ok) {
            console.error('Failed to initiate image generation:', initiateResponse.status);
            return NextResponse.json({ 
                error: 'Failed to initiate image generation',
                fallbackUrl: generateFallbackUrl(prompt, width, height, seed)
            }, { status: 500 });
        }

        const initiateText = await initiateResponse.text();
        
        // Parse the response to get event_id
        // Response format: {"event_id":"xxxxx"}
        let eventId: string;
        try {
            const initiateData = JSON.parse(initiateText);
            eventId = initiateData.event_id;
        } catch {
            // Try to extract event_id from the response text using awk-like parsing
            const match = initiateText.match(/"event_id"\s*:\s*"([^"]+)"/);
            if (match) {
                eventId = match[1];
            } else {
                console.error('Could not parse event_id from response:', initiateText);
                return NextResponse.json({ 
                    error: 'Could not parse event_id',
                    fallbackUrl: generateFallbackUrl(prompt, width, height, seed)
                }, { status: 500 });
            }
        }

        if (!eventId) {
            console.error('No event_id received');
            return NextResponse.json({ 
                error: 'No event_id received from API',
                fallbackUrl: generateFallbackUrl(prompt, width, height, seed)
            }, { status: 500 });
        }

        // Step 2: Fetch the result - Ernie returns result quickly (within 1-2 seconds)
        // The SSE response format is:
        // event: complete
        // data: [{"path": "...", "url": "...", ...}]
        const resultUrl = `${ERNIE_API_BASE}/gradio_api/call/generate_image/${eventId}`;
        
        // Wait just 1 second for the image to be generated
        console.log('[Ernie] Waiting 1 second for generation...');
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

        // If we found an image URL, download the image content
        // Remotion needs the actual image data, not just a URL (CORS issues)
        if (imageUrl) {
            console.log('[Ernie] Success! Got image URL:', imageUrl.substring(0, 80));
            
            // Download the actual image from Ernie
            console.log('[Ernie] Downloading image content...');
            const imageResponse = await fetch(imageUrl);
            
            if (!imageResponse.ok) {
                console.warn('[Ernie] Failed to download image:', imageResponse.status);
                const fallbackUrl = generateFallbackUrl(prompt, width, height, seed);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to download generated image',
                    fallbackUrl,
                    prompt,
                });
            }
            
            // Convert to base64 data URL for Remotion
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(imageBuffer).toString('base64');
            const mimeType = imageResponse.headers.get('content-type') || 'image/webp';
            const dataUrl = `data:${mimeType};base64,${base64}`;
            
            console.log('[Ernie] Image downloaded, size:', imageBuffer.byteLength, 'bytes');
            
            return NextResponse.json({
                success: true,
                imageUrl: dataUrl,  // Return base64 data URL instead of external URL
                originalUrl: imageUrl,
                eventId,
                prompt,
                width,
                height,
            });
        }

        // If no URL found, return fallback with Pollinations
        console.warn('[Ernie] No image URL found, using Pollinations fallback');
        const fallbackUrl = generateFallbackUrl(prompt, width, height, seed);
        
        return NextResponse.json({
            success: false,
            error: 'Could not extract image URL from Ernie response',
            fallbackUrl,
            prompt,
        });

    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            fallbackUrl: generateFallbackUrl('abstract visual', 1024, 1024, Date.now())
        }, { status: 500 });
    }
}

/**
 * Generate a fallback URL using Pollinations.ai if Ernie fails
 */
function generateFallbackUrl(prompt: string, width: number, height: number, seed: number): string {
    const encodedPrompt = encodeURIComponent(`${prompt}, high quality, professional`);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
}