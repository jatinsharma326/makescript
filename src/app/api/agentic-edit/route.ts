import { NextRequest, NextResponse } from 'next/server';
import { runAgenticEdit, AgenticOptions } from '@/lib/agenticEdit';
import { SubtitleSegment } from '@/lib/types';

interface AgenticEditRequest {
  subtitles: SubtitleSegment[];
  videoDuration: number;
  options?: AgenticOptions;
}

/**
 * Generate a real AI image using the Ernie/PaddlePaddle API.
 * Returns a base64 data URL that loads instantly in the browser.
 */
async function generateErnieImage(prompt: string, seed: number): Promise<string | null> {
  const ERNIE_API_BASE = 'https://paddlepaddle-ernie-image.ms.fun';

  try {
    // Step 1: Initiate generation
    const initiateResponse = await fetch(`${ERNIE_API_BASE}/gradio_api/call/generate_image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [prompt, '', 1024, 768, seed, 8, 1],
      }),
    });

    if (!initiateResponse.ok) return null;

    const initiateText = await initiateResponse.text();
    let eventId: string;
    try {
      const data = JSON.parse(initiateText);
      eventId = data.event_id;
    } catch {
      const match = initiateText.match(/"event_id"\s*:\s*"([^"]+)"/);
      if (!match) return null;
      eventId = match[1];
    }

    if (!eventId) return null;

    // Step 2: Fetch result
    const resultUrl = `${ERNIE_API_BASE}/gradio_api/call/generate_image/${eventId}`;
    await new Promise(r => setTimeout(r, 1200));

    let imageUrl: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resultResponse = await fetch(resultUrl, {
          method: 'GET',
          headers: { Accept: 'text/event-stream' },
        });

        if (!resultResponse.ok) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        }

        const resultText = await resultResponse.text();

        if (resultText.includes('event: complete')) {
          const dataMatch = resultText.match(/data:\s*(\[.*\])/);
          if (dataMatch) {
            try {
              const jsonData = JSON.parse(dataMatch[1]);
              if (Array.isArray(jsonData) && jsonData[0]?.url) {
                imageUrl = jsonData[0].url;
                break;
              }
            } catch { /* ignore */ }
          }
          const urlMatch = resultText.match(/"url"\s*:\s*"([^"]+)"/);
          if (urlMatch) {
            imageUrl = urlMatch[1];
            break;
          }
        }
        await new Promise(r => setTimeout(r, 800));
      } catch {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    if (!imageUrl) return null;

    // Step 3: Download image and convert to base64 data URL
    try {
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/webp';
        return `data:${mimeType};base64,${base64}`;
      }
    } catch {
      // Fall through to return the URL directly
    }

    return imageUrl;
  } catch (error) {
    console.error('[Ernie] Image generation error:', error);
    return null;
  }
}

/**
 * Fallback to Pollinations.ai if Ernie fails.
 */
function generatePollinationsUrl(prompt: string, seed: number): string {
  const encodedPrompt = encodeURIComponent(`${prompt}, high quality, professional`);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${seed}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: AgenticEditRequest = await request.json();
    const { subtitles, videoDuration, options } = body;

    if (!subtitles || subtitles.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No subtitles provided' },
        { status: 400 }
      );
    }

    console.log('[AgenticEdit API] Starting full agentic pipeline...');
    console.log(`[AgenticEdit API] ${subtitles.length} segments, ${videoDuration.toFixed(1)}s`);

    // Run the full multi-agent pipeline
    const result = runAgenticEdit(subtitles, videoDuration, options || {});

    // ═══════════════════════════════════════════════════════════════
    //  PRE-GENERATE AI IMAGES — so they're ready when video plays
    // ═══════════════════════════════════════════════════════════════
    const imageGenerationTasks: Array<{
      segIndex: number;
      prompt: string;
      seed: number;
    }> = [];

    for (let i = 0; i < result.subtitles.length; i++) {
      const seg = result.subtitles[i];
      if (seg.overlay?.type === 'ai-generated-image') {
        const prompt = String(seg.overlay.props?.imagePrompt || seg.text);
        const seed = Number(seg.overlay.props?.seed) || Math.abs(seg.text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)) % 1000000;
        imageGenerationTasks.push({ segIndex: i, prompt, seed });
      }
    }

    if (imageGenerationTasks.length > 0) {
      console.log(`[AgenticEdit API] Pre-generating ${imageGenerationTasks.length} AI images...`);

      // Generate images in parallel with a timeout
      const imagePromises = imageGenerationTasks.map(async (task) => {
        try {
          const imageUrl = await Promise.race([
            generateErnieImage(task.prompt, task.seed),
            new Promise<string | null>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 8000)
            ),
          ]);

          if (imageUrl) {
            return { segIndex: task.segIndex, imageUrl };
          }
        } catch (e) {
          console.warn(`[AgenticEdit API] Image generation failed for segment ${task.segIndex}:`, e);
        }
        // Fallback to Pollinations URL
        return {
          segIndex: task.segIndex,
          imageUrl: generatePollinationsUrl(task.prompt, task.seed),
        };
      });

      const settledResults = await Promise.allSettled(imagePromises);

      for (const settled of settledResults) {
        if (settled.status === 'fulfilled' && settled.value.imageUrl) {
          const { segIndex, imageUrl } = settled.value;
          const seg = result.subtitles[segIndex];
          if (seg.overlay) {
            seg.overlay.props = {
              ...seg.overlay.props,
              imageUrl,
            };
          }
        }
      }

      const successfulCount = settledResults.filter(
        s => s.status === 'fulfilled' && s.value.imageUrl?.startsWith('data:')
      ).length;
      console.log(`[AgenticEdit API] Images: ${successfulCount}/${imageGenerationTasks.length} generated as base64 data URLs`);
    }

    console.log('[AgenticEdit API] Pipeline complete:', {
      segmentsRemoved: result.segmentsRemoved,
      segmentsSpedUp: result.segmentsSpedUp,
      overlaysAdded: result.overlaysAdded,
      effectsAdded: result.effectsAdded,
      transitionsAdded: result.transitionsAdded,
      durationBefore: result.originalDuration.toFixed(1),
      durationAfter: result.newDuration.toFixed(1),
    });

    return NextResponse.json({
      ok: true,
      result,
    });

  } catch (error) {
    console.error('[AgenticEdit API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
