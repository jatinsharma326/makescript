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

/**
 * Extract key visual moments from transcript text.
 * Returns an array of scene descriptions that tell the AI WHAT to draw.
 */
function extractVisualScenes(transcript: string, title: string): string[] {
  const sentences = transcript
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 5);

  // Split into 6 roughly equal chunks for 6 scenes
  const chunkSize = Math.max(1, Math.ceil(sentences.length / 6));
  const scenes: string[] = [];

  for (let i = 0; i < 6; i++) {
    const chunk = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
    const text = chunk.join(' ') || title || 'Introduction';
    const visual = analyzeVisualContent(text, i);
    scenes.push(`Scene ${i + 1}: "${text.substring(0, 80)}" → DRAW: ${visual}`);
  }

  return scenes;
}

/**
 * Analyze text and suggest what SVG shapes/visuals to draw
 */
function analyzeVisualContent(text: string, sceneIndex: number): string {
  const lower = text.toLowerCase();

  // Map keywords to visual descriptions
  const visualMap: [string[], string][] = [
    [['explod', 'blast', 'bomb', 'nuclear', 'detona', 'destroy'], 'Expanding shockwave rings (concentric circles growing outward), debris particles flying in all directions, bright orange/red flash, mushroom cloud shape using SVG paths'],
    [['rocket', 'launch', 'liftoff', 'space', 'nasa'], 'Rocket ship SVG (triangle nose + rectangle body + flame at bottom), rising upward with speed lines, star field background, exhaust trail particles'],
    [['war', 'battle', 'military', 'army', 'soldier', 'weapon', 'attack', 'missile'], 'Radar sweep animation (rotating line in circle), crosshair target, warning symbols, red alert pulses, military grid lines'],
    [['planet', 'earth', 'world', 'globe', 'orbit'], 'Rotating globe (circle with meridian ellipses that shift), orbiting dots, star field, atmospheric glow ring'],
    [['ocean', 'water', 'sea', 'wave', 'tsunami', 'flood'], 'Animated sine-wave water surface, rising water level, foam particles, deep blue gradient background'],
    [['fire', 'burn', 'flame', 'hot', 'heat', 'inferno'], 'Flickering flame shapes (teardrop SVG paths oscillating), ember particles rising, orange-to-red gradient, heat shimmer distortion'],
    [['money', 'dollar', 'billion', 'million', 'cost', 'profit', 'revenue', 'economy'], 'Rising bar chart animation, floating dollar sign symbols, gold coin circles with $ text, green upward arrow'],
    [['brain', 'think', 'mind', 'idea', 'neural', 'ai', 'intelligence'], 'Brain outline SVG with pulsing neural connection lines between nodes, lightbulb glow, synapse spark particles'],
    [['star', 'galaxy', 'universe', 'cosmic', 'nebula', 'black hole'], 'Spiral galaxy shape (dots arranged in spiral pattern rotating), twinkling stars at random positions, nebula glow clouds'],
    [['city', 'building', 'skyline', 'urban', 'tower'], 'City skyline silhouette (rectangles of varying heights), lit windows (small yellow dots), night sky gradient'],
    [['mountain', 'peak', 'climb', 'summit', 'everest'], 'Mountain range triangles with snow-capped peaks (white tops), sunrise gradient behind, cloud wisps'],
    [['lightning', 'thunder', 'storm', 'electric', 'shock', 'power'], 'Zigzag lightning bolt SVG path, flash pulse, rain particles falling, dark cloud shapes'],
    [['heart', 'love', 'life', 'health', 'alive'], 'Pulsing heart SVG path (scaling up and down), EKG heartbeat line animation, pulse rings expanding'],
    [['speed', 'fast', 'quick', 'velocity', 'accelerat'], 'Speed lines (horizontal lines stretching), motion blur effect, speedometer arc with moving needle'],
    [['grow', 'growth', 'rise', 'increase', 'scale', 'expand'], 'Animated line chart going upward, growing tree SVG (trunk + expanding branches), upward arrow with trail'],
    [['death', 'die', 'kill', 'dead', 'casualt'], 'Fading crosses/markers, dimming circles, dark vignette closing in, somber particle drift downward'],
    [['sun', 'solar', 'light', 'bright', 'dawn', 'sunrise'], 'Rising sun circle from bottom, radiating ray lines, warm gradient background, lens flare circles'],
    [['rain', 'cloud', 'weather', 'snow', 'wind'], 'Cloud shapes (overlapping circles), falling raindrops/snowflakes as small animated lines/circles'],
    [['computer', 'code', 'software', 'program', 'tech', 'digital', 'data'], 'Matrix-style falling code characters, terminal window rectangle, blinking cursor, circuit board lines'],
    [['music', 'song', 'sound', 'audio', 'frequency'], 'Audio waveform bars (rectangles oscillating), musical note symbols, equalizer visualization'],
    [['people', 'crowd', 'population', 'human', 'person', 'million'], 'Grid of small circles representing people, some highlighted/animated, connected by faint lines'],
    [['danger', 'warning', 'alert', 'emergency', 'crisis'], 'Pulsing warning triangle with exclamation mark, red flashing border, alarm ring animation'],
    [['shield', 'protect', 'safe', 'security', 'defense'], 'Shield SVG shape with checkmark, protective dome circle expanding, guard lines'],
    [['time', 'clock', 'history', 'year', 'century', 'decade', 'ancient'], 'Clock face with rotating hands, timeline horizontal line with event dots, hourglass shape'],
    [['food', 'eat', 'cook', 'recipe', 'meal'], 'Plate circle with utensil shapes, steam rising curves, ingredient circles arranged artfully'],
  ];

  for (const [keywords, visual] of visualMap) {
    if (keywords.some(k => lower.includes(k))) {
      return visual;
    }
  }

  // Fallback: generic scene based on index
  const fallbacks = [
    'Cinematic title reveal with glowing text, expanding light rings, floating particles',
    'Abstract geometric shapes (triangles, hexagons) assembling and rotating, connected by thin lines',
    'Data visualization: animated dots flowing along curved paths, pulsing nodes',
    'Particle system forming shapes related to the topic, with glow and trails',
    'Waveform visualization: multiple sine waves overlapping with different frequencies and colors',
    'Outro scene: elements dissolving into particles, fading with elegant light trails',
  ];
  return fallbacks[sceneIndex % fallbacks.length];
}

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

    // Pre-analyze transcript to extract visual scene descriptions
    const visualScenes = extractVisualScenes(scriptContent, title || label || 'Video');
    const scenePlan = visualScenes.join('\n');

    const systemPrompt = `You are an expert Remotion developer who creates VISUAL MOTION GRAPHICS using SVG shapes, not just text.

CRITICAL RULE: You must draw ACTUAL VISUAL SCENES using SVG elements (<svg>, <circle>, <rect>, <path>, <polygon>, <line>, <ellipse>, <text>). 
DO NOT just show colored text on a background. Each scene must have recognizable visual elements that ILLUSTRATE what the transcript is talking about.

TITLE: ${title || "Video"}
TRANSCRIPT: ${scriptContent}

=== VISUAL SCENE PLAN (FOLLOW THIS) ===
${scenePlan}

=== HOW TO DRAW SCENES WITH SVG ===

Example - Drawing an EXPLOSION scene:
<svg viewBox="0 0 1080 1920" style={{width:'100%',height:'100%',position:'absolute'}}>
  {/* Shockwave rings */}
  <circle cx={540} cy={960} r={50 + localFrame * 4} fill="none" stroke="#ff6600" strokeWidth={3} opacity={Math.max(0, 1 - localFrame/40)} />
  <circle cx={540} cy={960} r={30 + localFrame * 6} fill="none" stroke="#ff4400" strokeWidth={2} opacity={Math.max(0, 1 - localFrame/35)} />
  {/* Central flash */}
  <circle cx={540} cy={960} r={Math.max(0, 80 - localFrame * 2)} fill="#ffcc00" opacity={Math.max(0, 0.8 - localFrame/30)} />
  {/* Debris particles */}
  {Array.from({length:40}).map((_,i) => {
    const angle = (i/40) * Math.PI * 2;
    const dist = localFrame * (3 + (i%5));
    return <circle key={i} cx={540+Math.cos(angle)*dist} cy={960+Math.sin(angle)*dist} r={2+i%3} fill={i%2===0?"#ff6600":"#ffaa00"} opacity={Math.max(0,1-dist/400)} />;
  })}
</svg>

Example - Drawing a ROCKET scene:
<svg viewBox="0 0 1080 1920" style={{width:'100%',height:'100%',position:'absolute'}}>
  {/* Stars */}
  {Array.from({length:60}).map((_,i) => <circle key={i} cx={(i*173)%1080} cy={(i*97)%1920} r={1+i%2} fill="#fff" opacity={0.3+Math.sin(frame*0.1+i)*0.3} />)}
  {/* Rocket body */}
  <g transform={\`translate(540, \${1200 - localFrame * 8})\`}>
    <polygon points="0,-50 -20,10 20,10" fill="#e53e3e" />
    <rect x={-15} y={10} width={30} height={50} rx={3} fill="#e2e8f0" />
    <polygon points="-15,55 -25,70 -15,60" fill="#e53e3e" />
    <polygon points="15,55 25,70 15,60" fill="#e53e3e" />
    <ellipse cx={0} cy={70} rx={10} ry={20+Math.sin(frame*0.8)*5} fill="#f97316" opacity={0.8} />
    <ellipse cx={0} cy={68} rx={6} ry={14+Math.sin(frame*0.6)*3} fill="#fbbf24" />
  </g>
</svg>

Example - Drawing a GLOBE scene:
<svg viewBox="0 0 1080 1920" style={{width:'100%',height:'100%',position:'absolute'}}>
  <circle cx={540} cy={960} r={200} fill="#1e3a5f" />
  <circle cx={540} cy={960} r={200} fill="none" stroke="#60a5fa" strokeWidth={2} opacity={0.5} />
  {/* Meridian lines rotating */}
  {[-60,-20,20,60].map((off,i) => <ellipse key={i} cx={540+off+Math.sin(frame*0.03)*30} cy={960} rx={15} ry={200} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />)}
  {/* Continents (circles) */}
  <circle cx={500+Math.sin(frame*0.03)*40} cy={920} r={30} fill="#22c55e" opacity={0.4} />
  <circle cx={560+Math.sin(frame*0.03)*40} cy={980} r={20} fill="#22c55e" opacity={0.3} />
</svg>

=== STRUCTURE ===
const totalFrames = ${durationInSeconds} * 30;
const framesPerScene = Math.floor(totalFrames / 6);
const sceneIndex = Math.floor(frame / framesPerScene);
const localFrame = frame - sceneIndex * framesPerScene;
const sceneProgress = localFrame / framesPerScene;

Each scene MUST render SVG shapes that visually depict the transcript content for that time segment.
Add 30-frame crossfade between scenes using opacity interpolation.
Add 100-200 background particles (small circles) that match the scene mood.

=== TECHNICAL RULES ===
- Component name: FocusMode
- Use: AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate from "remotion"
- Canvas: 1080x1920 vertical
- Duration: exactly ${durationInSeconds} seconds at 30fps
- EXACTLY 6 scenes, each with DIFFERENT SVG visuals matching the transcript
- Do NOT use TypeScript annotations
- Do NOT import React separately
- Export: export const FocusMode = () => { ... }; export default FocusMode;
- Return ONLY raw JavaScript code, no markdown, no explanations
- Code must start with: import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";`;

    const userPrompt = `Create the Remotion component now. Each of the 6 scenes MUST have SVG shapes that visually illustrate the transcript content (not just text).

Follow the Visual Scene Plan above. For each scene, draw the described SVG elements.

Return ONLY the raw JavaScript code starting with the import statement.`;

    console.log(`[GenerateLiveRemotion] Calling ${CROF_MODEL} via crof.ai for ${durationInSeconds}s video`);
    console.log(`[GenerateLiveRemotion] Visual scene plan:\n${scenePlan}`);

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

    // Check if code actually contains SVG elements (quality check)
    const hasSvg = code.includes('<svg') || code.includes('<circle') || code.includes('<rect') || code.includes('<path') || code.includes('<polygon');
    console.log(`[GenerateLiveRemotion] Success! Code length: ${code.length} chars, hasSVG=${hasSvg}, hasFocusMode=${hasFocusMode}, hasLiveGraphic=${hasLiveGraphic}`);

    return NextResponse.json({
      reactCode: code,
      success: true,
      codeLength: code.length,
      hasSvg,
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
