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

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MotionReactRequest;
    const { text, mood, topic, color, label, durationInSeconds = 2, fullTranscript = "", title = "" } = body;

    if (!text) {
      return NextResponse.json({ reactCode: '', success: false, error: 'No text provided' });
    }

    if (!CROF_API_KEY) {
      console.error('[GenerateLiveRemotion] CROF_API_KEY is not set!');
      return NextResponse.json({ reactCode: '', success: false, error: 'CROF_API_KEY not configured' });
    }

    const scriptContent = fullTranscript?.substring(0, 1500) || text;

    const systemPrompt = `### SYSTEM INSTRUCTIONS ###
You are a creative Remotion developer who creates stunning motion graphics for ANY video topic.

YOUR FIRST TASK - DETECT THE TOPIC:

Read the title and script carefully. Determine what category the content falls into.

TITLE: ${title || "Video"}

SCRIPT CONTENT: ${scriptContent}

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
- Use AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate
- Component name: FocusMode
- Add 200-400 animated particles
- Use smooth transitions + 30-frame crossfade
- Do NOT use any external libraries
- Do NOT use TypeScript type annotations (no React.FC, no : string, etc.)
- Do NOT import React separately, it is available globally

OUTPUT RULES:
- Return ONLY valid, syntactically perfect JavaScript/JSX code
- No explanations. No markdown fences. No comments before the code.
- The code must start with an import statement
- Provide only the raw code.`;

    const userPrompt = `### USER REQUEST ###
Create a Remotion animation for this video:

TITLE: ${title || "Video"}

SCRIPT CONTENT: ${scriptContent}

The video MUST:
- Have exactly 6 scenes
- Match ${durationInSeconds}s duration perfectly
- Be 1080x1920 vertical
- Use professional motion graphics
- Component name must be FocusMode
- Export it as default: export default FocusMode;

Return only the raw code.`;

    console.log(`[GenerateLiveRemotion] Calling ${CROF_MODEL} via crof.ai for ${durationInSeconds}s video`);

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
      console.error(`[GenerateLiveRemotion] API returned ${res.status}: ${errText}`);
      throw new Error(`API failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    if (!aiResponse || aiResponse.trim().length < 50) {
      console.error(`[GenerateLiveRemotion] AI response too short: ${aiResponse.length} chars`);
      throw new Error('AI response is empty or too short');
    }

    console.log(`[GenerateLiveRemotion] Got ${aiResponse.length} chars from AI`);

    // ========================================
    // PARSE AND FIX REMOTION CODE
    // Mirrors the n8n "Parse and Fix Code" node
    // ========================================

    let code = aiResponse;

    // Clean markdown fences
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

    // Remove TypeScript annotations that Kimi sometimes adds
    code = code.replace(/:\s*React\.FC\b(<[^>]*>)?/g, '');
    code = code.replace(/:\s*React\.CSSProperties/g, '');
    code = code.replace(/:\s*\{\s*\w+:\s*\w+[^}]*\}\s*(?=\)|\s*=>)/g, '');

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

    const fixedLines = lines.map((line: string) => {
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

    // ========================================
    // FIX EXPORTS - Handle both FocusMode AND LiveGraphic
    // ========================================

    const hasFocusMode = code.includes('const FocusMode');
    const hasLiveGraphic = code.includes('const LiveGraphic');
    const hasExportDefault = code.includes('export default');

    if (hasFocusMode && !hasExportDefault) {
      // Add export default for FocusMode
      if (!code.includes('export const FocusMode')) {
        code = code.replace('const FocusMode', 'export const FocusMode');
      }
      code = code + '\n\nexport default FocusMode;';
    } else if (hasLiveGraphic && !hasExportDefault) {
      if (!code.includes('export const LiveGraphic')) {
        code = code.replace('const LiveGraphic', 'export const LiveGraphic');
      }
      code = code + '\n\nexport default LiveGraphic;';
    } else if (!hasExportDefault) {
      // Last resort: find any component-like const and export it
      const componentMatch = code.match(/const\s+(\w+)\s*=\s*\(/);
      if (componentMatch) {
        code = code + `\n\nexport default ${componentMatch[1]};`;
      }
    }

    // ========================================
    // VALIDATION
    // ========================================

    const hasImport = code.includes('import');
    const hasExport = code.includes('export default') || code.includes('export const');
    const hasAbsoluteFill = code.includes('AbsoluteFill');
    const hasUseCurrentFrame = code.includes('useCurrentFrame');

    if (!hasImport || !hasExport || !hasAbsoluteFill || !hasUseCurrentFrame) {
      console.error(`[GenerateLiveRemotion] Validation failed: import=${hasImport}, export=${hasExport}, AbsoluteFill=${hasAbsoluteFill}, useCurrentFrame=${hasUseCurrentFrame}`);
      console.error(`[GenerateLiveRemotion] Code preview: ${code.substring(0, 300)}`);
      throw new Error(
        `Invalid code: import=${hasImport}, export=${hasExport}, AbsoluteFill=${hasAbsoluteFill}, useCurrentFrame=${hasUseCurrentFrame}`
      );
    }

    console.log(`[GenerateLiveRemotion] Success! Code length: ${code.length} chars, hasFocusMode=${hasFocusMode}, hasLiveGraphic=${hasLiveGraphic}`);

    return NextResponse.json({
      reactCode: code,
      success: true,
      codeLength: code.length,
      source: CROF_MODEL
    });

  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error(`[GenerateLiveRemotion] Error: ${msg}`);
    return NextResponse.json(
      { reactCode: '', success: false, error: msg },
      { status: 500 }
    );
  }
}
