import { NextRequest, NextResponse } from 'next/server';

const CROF_API = 'https://crof.ai/v2/chat/completions';
const CROF_API_KEY = process.env.CROF_API_KEY || '';
const CROF_MODEL = 'kimi-k2.6-precision';

interface MotionReactRequest {
  text: string;
  mood: string;
  topic: string;
  color: string;
  label: string;
  durationInSeconds: number;
  fullTranscript?: string;
  title?: string;
}

export const maxDuration = 60; // Prevent Vercel timeouts for LLM code generation

export async function POST(request: NextRequest) {
  try {
    const { text, mood, topic, color, label, durationInSeconds = 2, fullTranscript = "" } = (await request.json()) as MotionReactRequest;

    if (!text) {
      return NextResponse.json({ reactCode: '', success: false, error: 'No text provided' });
    }

    const systemPrompt = `### SYSTEM INSTRUCTIONS ###
You are a creative Remotion developer who creates stunning motion graphics for ANY video topic.

YOUR FIRST TASK - DETECT THE TOPIC:

Read the title and script carefully. Determine what category the content falls into.

TITLE: ${title || "Video"}

SCRIPT CONTENT: ${fullTranscript?.substring(0, 1500) || text}

CATEGORIES:
News, War and Geopolitics, Entertainment, Anime, Gaming, Technology, Science, History, Nature, Sports, Music, Food, Travel, Business, Health, Education

VISUAL STYLE RULES:
- Match visuals to detected category
- Use cinematic, high-quality motion design
- Add particles relevant to topic (stars, pixels, petals, etc.)

TRANSITION BETWEEN SCENES & DURATION:
The total video duration MUST strictly match ${durationInSeconds} seconds.

CRITICAL:
- EXACTLY 6 scenes
- NO more, NO less

Use this math:
const totalFrames = ${durationInSeconds} * 30;
const framesPerScene = Math.floor(totalFrames / 6);
const sceneIndex = Math.floor(frame / framesPerScene);

TECHNICAL REQUIREMENTS:
- Use React + Remotion only
- Use AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img
- Component name: FocusMode
- Add 200–400 animated particles
- Use smooth transitions + 30-frame crossfade

OUTPUT RULES:
- Return ONLY valid, syntactically perfect JavaScript/React code.
- No explanations. No markdown fences.
- Provide only the raw code.`;

    const userPrompt = `### USER REQUEST ###
Create a Remotion animation for this video:

TITLE: ${title || "Video"}

SCRIPT CONTENT: ${fullTranscript?.substring(0, 1500) || text}

The video MUST:
- Have exactly 6 scenes
- Match ${durationInSeconds}s duration perfectly
- Be 1080x1920 vertical
- Use professional motion graphics
- Component name must be FocusMode

Return only the raw code.`;

    let aiResponse = '';
    
    console.log(`[GenerateLiveRemotion] Calling ${CROF_MODEL} via crof.ai`);
    
    const res = await fetch(CROF_API, {
      method: 'POST',
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
      throw new Error(`API failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    aiResponse = data.choices?.[0]?.message?.content || '';

    if (!aiResponse) {
      throw new Error('Empty response from AI');
    }

    // ========================================
    // PARSE AND FIX REMOTION CODE
    // ========================================

    // Clean markdown fences
    let code = aiResponse;
    code = code.replace(/```javascript\n?/gi, '');
    code = code.replace(/```jsx\n?/gi, '');
    code = code.replace(/```js\n?/gi, '');
    code = code.replace(/```typescript\n?/gi, '');
    code = code.replace(/```tsx\n?/gi, '');
    code = code.replace(/```\n?/g, '');
    code = code.trim();

    // Find where actual code starts (first import statement)
    const firstImportIndex = code.indexOf('import ');
    if (firstImportIndex > 0) {
      code = code.substring(firstImportIndex);
    }

    // Safe interpolate helper function
    const safeInterpolateHelper = `
const safeInterpolate = (value, inputRange, outputRange, options) => {
  if (!inputRange || !outputRange || inputRange.length < 2 || outputRange.length < 2) {
    return outputRange && outputRange[0] !== undefined ? outputRange[0] : 0;
  }
  const sortedPairs = inputRange.map((v, i) => ({ input: v, output: outputRange[i] }))
    .sort((a, b) => a.input - b.input);
  const uniquePairs = [];
  for (let i = 0; i < sortedPairs.length; i++) {
    if (i === sortedPairs.length - 1 || sortedPairs[i].input !== sortedPairs[i + 1].input) {
      uniquePairs.push(sortedPairs[i]);
    }
  }
  if (uniquePairs.length < 2) return outputRange[0] || 0;
  return interpolate(
    value,
    uniquePairs.map(p => p.input),
    uniquePairs.map(p => p.output),
    options || { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
};
`;

    // Insert helper after the last import statement
    const lastImportIndex = code.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = code.indexOf(';', lastImportIndex);
      const insertPos = endOfLastImport !== -1 ? endOfLastImport + 1 : code.indexOf('\n', lastImportIndex);
      if (insertPos !== -1) {
        code = code.slice(0, insertPos) + '\n' + safeInterpolateHelper + code.slice(insertPos);
      } else {
        code = safeInterpolateHelper + '\n' + code;
      }
    } else {
      code = safeInterpolateHelper + '\n' + code;
    }

    // Replace interpolate calls with safeInterpolate (except inside helper)
    const lines = code.split('\n');
    let inHelper = false;
    let helperBraceCount = 0;

    const fixedLines = lines.map((line) => {
      if (line.includes('const safeInterpolate')) {
        inHelper = true;
        helperBraceCount = 0;
      }

      if (inHelper) {
        helperBraceCount += (line.match(/\{/g) || []).length;
        helperBraceCount -= (line.match(/\}/g) || []).length;
        if (helperBraceCount <= 0 && line.includes('};')) {
          inHelper = false;
        }
        return line;
      }

      // Replace interpolate with safeInterpolate
      if (line.includes('interpolate(') && !line.includes('safeInterpolate')) {
        return line.replace(/\binterpolate\(/g, 'safeInterpolate(');
      }

      return line;
    });

    code = fixedLines.join('\n');

    // Fix common export issues
    if (!code.includes('export const LiveGraphic') && !code.includes('export default')) {
      if (code.includes('const LiveGraphic')) {
        code = code.replace('const LiveGraphic', 'export const LiveGraphic');
      }
    }

    // Add export default if only named export exists
    if (code.includes('export const LiveGraphic') && !code.includes('export default')) {
      code = code + '\n\nexport default LiveGraphic;';
    }

    console.log(`[GenerateLiveRemotion] Success via ${CROF_MODEL} (${code.length} chars)`);
    return NextResponse.json({ reactCode: code, success: true, source: CROF_MODEL });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error(`[GenerateLiveRemotion] Error: ${msg}`);
    return NextResponse.json({ reactCode: '', success: false, error: msg }, { status: 500 });
  }
}
