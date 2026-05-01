import { NextRequest, NextResponse } from 'next/server';

interface MotionSvgRequest {
  text: string;
  mood: string;
  topic: string;
  color: string;
  label: string;
}

const SYSTEM_PROMPT = `You are a motion graphics artist who creates animated SVGs. Given a video segment's text, mood, and topic, generate a SINGLE self-contained animated SVG that visually represents the content.

STRICT OUTPUT RULES:
- Output ONLY the <svg>...</svg> element. No markdown, no explanation, no code fences.
- The SVG must start with <svg and end with </svg>
- Use viewBox="0 0 400 300" and xmlns="http://www.w3.org/2000/svg"
- Keep total output under 3KB
- NEVER include <script>, <foreignObject>, or on* event attributes

ANIMATION TECHNIQUES (use CSS @keyframes inside <style>):
- fade-in: opacity 0 → 1
- rise-up: translateY(30px) → translateY(0)
- pulse: opacity or scale oscillating
- draw: stroke-dashoffset animation for line drawing effect
- rotate: transform: rotate() for spinning elements
- scale-bounce: scale(0) → scale(1.1) → scale(1)

VISUAL QUALITY:
- Use <linearGradient> or <radialGradient> in <defs> for rich colors
- Use the provided color as the PRIMARY color, derive secondary colors from it
- Add text labels using <text> with font-family="sans-serif"
- Use rounded rectangles (rx), circles, and paths for modern look
- Add subtle glow via filter or semi-transparent shapes
- Keep backgrounds TRANSPARENT (no background rect)

CONTENT MAPPING:
- Read the segment text carefully and create visuals that ILLUSTRATE the specific content
- For numbers/stats: animated bar charts, counters, or percentage circles
- For actions/verbs: motion-based animations (arrows, movement, transitions)
- For concepts: iconic representations with animation
- For emotions: expressive colors and dynamic movement
- The label text should appear as an animated text element in the SVG`;

const EXAMPLE_1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
<style>
@keyframes rise{0%{transform:translateY(40px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes glow{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes countUp{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}
.bar{animation:rise .7s ease-out forwards}
.lbl{animation:glow 2.5s ease-in-out infinite;fill:#fff;font-family:sans-serif;font-weight:700}
.num{animation:countUp .5s ease-out 1s forwards;opacity:0;fill:#fff;font-family:sans-serif}
</style>
<defs><linearGradient id="g1" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs>
<rect class="bar" x="60" y="160" width="50" height="100" rx="6" fill="url(#g1)" style="animation-delay:0s"/>
<rect class="bar" x="130" y="110" width="50" height="150" rx="6" fill="url(#g1)" style="animation-delay:.15s"/>
<rect class="bar" x="200" y="70" width="50" height="190" rx="6" fill="url(#g1)" style="animation-delay:.3s"/>
<rect class="bar" x="270" y="40" width="50" height="220" rx="6" fill="url(#g1)" style="animation-delay:.45s"/>
<text class="lbl" x="200" y="28" text-anchor="middle" font-size="22">REVENUE GROWTH</text>
<text class="num" x="295" y="35" text-anchor="middle" font-size="16">+340%</text>
</svg>`;

const EXAMPLE_2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
<style>
@keyframes orbit{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{r:8;opacity:.7}50%{r:12;opacity:1}}
@keyframes fadeUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.orb{transform-origin:200px 150px;animation:orbit 6s linear infinite}
.core{animation:pulse 2s ease-in-out infinite}
.title{animation:fadeUp .8s ease-out forwards;fill:#fff;font-family:sans-serif;font-weight:700}
</style>
<defs><radialGradient id="rg"><stop offset="0%" stop-color="#f59e0b" stop-opacity=".9"/><stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/></radialGradient></defs>
<circle cx="200" cy="150" r="50" fill="url(#rg)"/>
<circle class="core" cx="200" cy="150" r="8" fill="#fbbf24"/>
<g class="orb"><circle cx="280" cy="150" r="6" fill="#60a5fa"/></g>
<g class="orb" style="animation-delay:-2s"><circle cx="200" cy="80" r="5" fill="#34d399"/></g>
<g class="orb" style="animation-delay:-4s"><circle cx="130" cy="180" r="4" fill="#f472b6"/></g>
<text class="title" x="200" y="260" text-anchor="middle" font-size="20">AI NEURAL NETWORK</text>
</svg>`;

function sanitizeSvg(raw: string): string {
  let svg = raw;
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
  svg = svg.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  svg = svg.replace(/\bon\w+\s*=\s*[^\s>]+/gi, '');
  svg = svg.replace(/javascript\s*:/gi, 'blocked:');
  svg = svg.replace(/data\s*:\s*text\/html/gi, 'blocked:');
  return svg;
}

function extractSvgFromResponse(content: string): string {
  let text = content.trim();
  // Strip non-ASCII chars DeepSeek sometimes injects
  text = text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  // Strip markdown code fences
  text = text.replace(/^```(?:svg|xml|html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  // Extract the SVG element
  const match = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (match) return match[0];
  // If SVG was truncated (starts but no closing tag), try to close it
  const openMatch = text.match(/<svg[\s\S]*/i);
  if (openMatch) return openMatch[0] + '</svg>';
  return '';
}

interface LLMConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

function getLLMConfigs(): LLMConfig[] {
  // Use Lightning AI DeepSeek V4 Pro exclusively for SVG generation
  return [{
    name: 'DeepSeek V4 Pro (Lightning)',
    baseUrl: 'https://lightning.ai/api/v1',
    apiKey: process.env.LIGHTNING_API_KEY || 'a136ad94-f05f-4431-b3ad-2148a0c72ac3/giggletales18/vision-model',
    model: 'lightning-ai/deepseek-v4-pro',
  }];
}

export async function POST(request: NextRequest) {
  try {
    const { text, mood, topic, color, label } = (await request.json()) as MotionSvgRequest;

    if (!text) {
      return NextResponse.json({ svgContent: '', success: false, error: 'No text provided' });
    }

    const userPrompt = `Create an animated SVG for this video segment:

TEXT: "${text}"
MOOD: ${mood || 'energetic'}
TOPIC: ${topic || 'general'}
PRIMARY COLOR: ${color || '#6366f1'}
LABEL: "${label || ''}"

Here are two examples of the quality and style expected:

EXAMPLE 1 (bar chart with rising animation):
${EXAMPLE_1}

EXAMPLE 2 (orbital/network animation):
${EXAMPLE_2}

Now generate a NEW, UNIQUE animated SVG that visually represents the TEXT above. Use the PRIMARY COLOR as the main color. Include the LABEL as animated text. Match the MOOD through animation speed and visual intensity. Output ONLY the <svg>...</svg> element.`;

    const configs = getLLMConfigs();
    if (configs.length === 0) {
      console.warn('[MotionSVG] No LLM configs available');
      return NextResponse.json({ svgContent: '', success: false, error: 'No AI models configured' });
    }

    for (const config of configs) {
      try {
        console.log(`[MotionSVG] Trying ${config.name}...`);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 35000);

        const url = config.baseUrl.includes('/chat/completions')
          ? config.baseUrl
          : `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 2500,
            temperature: 0.6,
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
          console.warn(`[MotionSVG] ${config.name} failed: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content || typeof content !== 'string') {
          console.warn(`[MotionSVG] ${config.name} returned empty content`);
          continue;
        }

        const rawSvg = extractSvgFromResponse(content);
        if (!rawSvg) {
          console.warn(`[MotionSVG] ${config.name} response had no valid SVG`);
          continue;
        }

        const svgContent = sanitizeSvg(rawSvg);

        if (!svgContent.includes('<svg')) {
          console.warn(`[MotionSVG] ${config.name} SVG invalid after sanitization`);
          continue;
        }

        console.log(`[MotionSVG] Success via ${config.name} (${svgContent.length} chars)`);
        return NextResponse.json({ svgContent, success: true, source: config.name });

      } catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown';
        console.warn(`[MotionSVG] ${config.name} error: ${msg}`);
        continue;
      }
    }

    console.warn('[MotionSVG] All models failed');
    return NextResponse.json({ svgContent: '', success: false, error: 'All AI models failed' });

  } catch (error) {
    console.error('[MotionSVG] Route error:', error);
    return NextResponse.json({ svgContent: '', success: false, error: 'Internal error' }, { status: 500 });
  }
}
