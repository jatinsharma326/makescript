import { NextRequest, NextResponse } from 'next/server';

const CROF_API = process.env.CROF_API_URL || 'https://crof.ai/v2/chat/completions';
const CROF_API_KEY = process.env.CROF_API_KEY || '';
const CROF_MODEL = process.env.CROF_MODEL || 'kimi-k2.6-precision';
const CROF_TIMEOUT_MS = 20000;

interface MotionSvgRequest {
  text: string;
  mood: string;
  topic: string;
  color: string;
  label: string;
}

const SYSTEM_PROMPT = `You are a professional motion graphics artist. Create a stunning animated SVG overlay for a video segment.

OUTPUT: ONLY the <svg>...</svg> element. No markdown, no explanation, no code fences.

TECHNICAL:
- viewBox="0 0 400 300", xmlns="http://www.w3.org/2000/svg"
- Under 4KB. NO <script>, <foreignObject>, or on* attributes.
- Transparent background (no background rect).

ANIMATION (CSS @keyframes in <style>):
- Stagger with animation-delay for a "building up" feel
- Use ease-out for entrances, ease-in-out for loops
- Combine: rise-up + fade-in, scale-bounce + glow, draw + pulse
- 0.5s-3s durations

DESIGN QUALITY (match After Effects level):
- <linearGradient>/<radialGradient> in <defs> — NEVER flat fills
- 15-30 animated background particles (small circles with random positions, slow float/drift animation, low opacity)
- Glow effects using feGaussianBlur filters
- Bold headline text: font-family="sans-serif", font-weight="800", large size
- Depth: layered semi-transparent shapes, subtle shadows

TOPIC-SPECIFIC VISUALS:
- Space/Astronomy: stars, planet rings, orbital paths, nebula gradients, cosmic dust particles
- Technology: circuit lines, data nodes, binary rain, holographic blue tones
- Business/Finance: chart bars, rising arrows, coin symbols, growth lines
- Nature: leaves, water ripples, organic curves, earth tones
- Science: atom orbits, molecular bonds, wave functions, lab aesthetics
- General: geometric shapes, abstract particles, clean modern look

The LABEL text must be the HERO element — biggest, boldest, center of attention.`;

function sanitizeSvg(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:');
}

function extractSvgFromResponse(content: string): string {
  let text = content.trim();
  text = text.replace(/^```(?:svg|xml|html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  const match = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (match) return match[0];
  const openMatch = text.match(/<svg[\s\S]*/i);
  if (openMatch) return openMatch[0] + '</svg>';
  return '';
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[MotionSVG] Calling ${CROF_MODEL} via crof.ai (attempt ${attempt}/2)`);
      const res = await fetch(CROF_API, {
        method: 'POST',
        signal: AbortSignal.timeout(CROF_TIMEOUT_MS),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CROF_API_KEY}`,
        },
        body: JSON.stringify({
          model: CROF_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`[MotionSVG] crof.ai failed: ${res.status} ${errText.substring(0, 200)} (attempt ${attempt})`);
        if (attempt < 2) { await new Promise(r => setTimeout(r, 1000)); continue; }
        return null;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || null;
      if (!content) {
        console.warn(`[MotionSVG] crof.ai: empty content (attempt ${attempt})`);
        if (attempt < 2) continue;
      }
      return content;
    } catch (err) {
      console.warn(`[MotionSVG] crof.ai attempt ${attempt} error:`, err);
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { text, mood, topic, color, label } = (await request.json()) as MotionSvgRequest;

    if (!text) {
      return NextResponse.json({ svgContent: '', success: false, error: 'No text provided' });
    }

    const userPrompt = `Create an animated SVG for this video overlay:

TEXT: "${text}"
MOOD: ${mood || 'energetic'}
TOPIC: ${topic || 'general'}
PRIMARY COLOR: ${color || '#6366f1'}
LABEL: "${label || ''}"

Generate a UNIQUE animated SVG that:
1. Has 15-20 animated background particles matching the topic
2. Uses "${color}" as primary with gradient variations
3. Shows "${label}" as a bold animated headline
4. Matches the "${mood}" mood through animation speed
5. Is visually specific to the topic "${topic}"

Output ONLY <svg>...</svg>.`;

    console.log(`[MotionSVG] Generating via ${CROF_MODEL} for: "${label}"`);

    const content = await callLLM(SYSTEM_PROMPT, userPrompt);

    if (!content) {
      console.warn('[MotionSVG] crof.ai returned no content');
      return NextResponse.json({ svgContent: '', success: false, error: 'Empty response' });
    }

    const rawSvg = extractSvgFromResponse(content);
    if (!rawSvg) {
      console.warn('[MotionSVG] No SVG in crof.ai response');
      return NextResponse.json({ svgContent: '', success: false, error: 'No SVG in response' });
    }

    const svgContent = sanitizeSvg(rawSvg);
    if (!svgContent.includes('<svg')) {
      return NextResponse.json({ svgContent: '', success: false, error: 'Invalid SVG' });
    }

    console.log(`[MotionSVG] Success via ${CROF_MODEL} (${svgContent.length} chars)`);
    return NextResponse.json({ svgContent, success: true, source: CROF_MODEL });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error(`[MotionSVG] Error: ${msg}`);
    return NextResponse.json({ svgContent: '', success: false, error: msg }, { status: 500 });
  }
}
