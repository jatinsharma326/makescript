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

    // Use FULL transcript (up to 3000 chars) for better scene parsing
    const scriptContent = fullTranscript?.substring(0, 3000) || text;

    // Divide transcript into approximate sections (will be refined by AI)
    const transcriptWords = scriptContent.split(/\s+/);
    const wordsPerScene = Math.max(2, Math.floor(transcriptWords.length / 6));
    const sceneTexts = [];
    for (let i = 0; i < 6; i++) {
      const start = i * wordsPerScene;
      const end = i === 5 ? transcriptWords.length : (i + 1) * wordsPerScene;
      sceneTexts.push(transcriptWords.slice(start, end).join(' '));
    }

    const systemPrompt = `### SYSTEM INSTRUCTIONS ###
You are a creative Remotion developer who creates stunning, CONTENT-AWARE motion graphics.

## YOUR CORE TASK

You will receive a full video transcript. You MUST:
1. Parse the transcript and divide it into 6 CONTENT-BASED sections (each section is a meaningful part of the transcript)
2. For EACH of the 6 sections, create a UNIQUE visual scene that:
   - DISPLAYS THE ACTUAL TRANSCRIPT WORDS from that section as styled text on screen
   - Has a UNIQUE background (different gradient, pattern, or visual for each scene)
   - Has UNIQUE animated particles matching the TOPIC of that specific section
   - Uses COLORS that match the mood/theme of that section's content
   - Has its own animation style (different from other scenes)
3. Chain all 6 scenes together with smooth crossfade transitions

## TRANSCRIPT TO VISUALIZE

TITLE: ${title || "Video"}
TOPIC CATEGORY: ${topic || 'general'}
MOOD: ${mood || 'energetic'}
BASE COLOR: ${color || '#6366f1'}

FULL SCRIPT:
${scriptContent}

## APPROXIMATE SCENE DIVISION (use these as guide, re-split by content logic):
Scene 1: "${sceneTexts[0]?.substring(0, 150) || 'Introduction'}"
Scene 2: "${sceneTexts[1]?.substring(0, 150) || 'Main point 1'}"
Scene 3: "${sceneTexts[2]?.substring(0, 150) || 'Main point 2'}"
Scene 4: "${sceneTexts[3]?.substring(0, 150) || 'Main point 3'}"
Scene 5: "${sceneTexts[4]?.substring(0, 150) || 'Key insight'}"
Scene 6: "${sceneTexts[5]?.substring(0, 150) || 'Conclusion'}"

## SCENE VISUAL RULES (CRITICAL)
Each scene MUST be VISUALLY DISTINCT from the others:

Scene 1 (Intro): Large title/text centered, cinematic reveal animation, slow particles
Scene 2: Different background gradient, different particle type, text animates from one side
Scene 3: Different visual layout, different particle behavior, different text placement
Scene 4: Different color palette shift, unique shape animations orbiting text
Scene 5: Different particle system (burst/spiral), text with different animation
Scene 6 (Conclusion): Grand finale style, celebratory particles, strong typography

For each scene's particles, choose a type RELEVANT TO THAT SCENE'S CONTENT:
- Technology: hexagon/pixel/code particles, blue/cyan colors
- Nature: leaf/floating petal particles, green/earth tones
- Science: atom/molecule particles, purple/blue colors
- Business: geometric/rising particles, gold/blue colors
- Music: note/equalizer particles, vibrant colors
- Sports: speed/energy particles, bold colors
- History: vintage/parchment particles, warm tones
- Entertainment: sparkle/starburst particles, bright colors
- Health/Education: organic/circle particles, calming colors
- Food: organic/steam particles, warm appetizing colors
- Travel: map/pin/wander particles, adventure colors
- Gaming: pixel/glitch particles, neon colors
- News/War: data/pulse particles, serious tones
- General: mix of geometric particles with the base color

## TIMING
Total duration: ${durationInSeconds} seconds at 30fps
Total frames: ${durationInSeconds} * 30 = ${Math.round(durationInSeconds * 30)}
Frames per scene: Math.floor(totalFrames / 6) = ${Math.floor(Math.round(durationInSeconds * 30) / 6)}
Crossfade between scenes: 30 frames (1 second)

## REQUIRED CODE STRUCTURE
Your code MUST follow this pattern:
\`\`\`
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random } from 'remotion';

// Scene 1 content (first part of transcript displayed here)
const Scene1 = ({ frame, fps, totalFrames, text }) => (
  // UNIQUE background gradient
  // UNIQUE particle system (topic-relevant, 200-400 particles)
  // TRANSCRIPT TEXT displayed with animations
  // Smooth entrance animation
);

// Scene 2 - different visuals, different particles, different text
const Scene2 = ({ frame, fps, totalFrames, text }) => ( ... );

// Scene 3, 4, 5, 6 similarly...

const FocusMode = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = ${Math.round(durationInSeconds * 30)};
  const framesPerScene = Math.floor(totalFrames / 6);
  const sceneIndex = Math.min(5, Math.floor(frame / framesPerScene));
  const localFrame = frame - sceneIndex * framesPerScene;
  
  // Crossfade between scenes
  const showPrev = sceneIndex > 0 && localFrame < 30;
  const prevOpacity = showPrev ? interpolate(localFrame, [0, 30], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const currentOpacity = interpolate(localFrame, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{ background: '#0a0a0f' }}>
      {showPrev && (
        <div style={{ opacity: prevOpacity }}>
          <Scene{sceneIndex} frame={localFrame + framesPerScene} fps={fps} totalFrames={framesPerScene} text={\`${sceneTexts[sceneIndex - 1]?.substring(0, 100) || ''}\`} />
        </div>
      )}
      <div style={{ opacity: currentOpacity }}>
        <Scene{sceneIndex + 1} frame={localFrame} fps={fps} totalFrames={framesPerScene} text={\`${sceneTexts[sceneIndex]?.substring(0, 100) || ''}\`} />
      </div>
    </AbsoluteFill>
  );
};

export default FocusMode;
\`\`\`

IMPORTANT: Replace the placeholder text strings with the ACTUAL transcript text for each section.
Scene text should show the meaningful spoken words, not generic placeholders.

## TECHNICAL REQUIREMENTS
- Use React + Remotion only (React is global, no import needed)
- Use AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random from 'remotion'
- Component name: FocusMode
- Each scene: 200-400 animated particles
- Smooth 30-frame crossfade transitions between scenes
- Do NOT use TypeScript type annotations
- Do NOT use any external libraries
- Video is 1080x1920 (vertical / portrait format)
- Use the 'random' function from remotion for deterministic randomness per frame

## OUTPUT RULES
- Return ONLY valid, syntactically perfect JavaScript/JSX code
- No explanations. No markdown fences. No comments before the code.
- The code must start with "import { AbsoluteFill,"
- Provide only the raw code.`;

    const userPrompt = `### USER REQUEST ###
Create a CONTENT-AWARE Remotion animation for this video transcript.

The animation MUST visualize the actual transcript content — each scene displays its portion of the spoken words with visuals that match what is being discussed.

TITLE: ${title || "Video"}
TOPIC: ${topic || 'general'}
MOOD: ${mood || 'energetic'}
DURATION: ${durationInSeconds}s
DIMENSIONS: 1080x1920 (vertical)

FULL TRANSCRIPT:
${scriptContent}

CRITICAL REQUIREMENTS:
1. Parse the transcript into 6 CONTENT-BASED scenes (not arbitrary splits)
2. Each scene displays its OWN portion of the transcript text on screen
3. Each scene has UNIQUE background, particles, colors, and animations
4. Particle types must match the topic of each specific scene section
5. Smooth 30-frame crossfade between scenes
6. Component name: FocusMode, export default FocusMode
7. Code must start with: import { AbsoluteFill,
8. Video is 1080x1920 vertical
9. 200-400 particles per scene
10. Return ONLY the raw JavaScript/JSX code — no explanations, no markdown

Generate the full FocusMode component with all 6 unique scenes.`;

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
        temperature: 0.8,
        max_tokens: 8192,
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
    const hasRemotionImport = code.includes("from 'remotion'") || code.includes('from "remotion"');

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
