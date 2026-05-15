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

interface SceneEntry {
  text: string;
  color: string;
  label: string;
  particleType: 'circles' | 'diamonds' | 'stars' | 'hexagons' | 'pixels' | 'petals' | 'lines' | 'geometric';
  particleCount: number;
  backgroundType: 'gradient-tl' | 'gradient-tr' | 'gradient-center' | 'radial' | 'dark';
  animation: 'reveal' | 'slide-up' | 'slide-right' | 'zoom' | 'burst';
}

interface ScenePlan {
  title: string;
  topic: string;
  scenes: SceneEntry[];
  totalFrames: number;
  fps: number;
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MotionReactRequest;
    const { text, mood, topic, color, label, durationInSeconds = 2, fullTranscript = "", title = "" } = body;

    if (!text) {
      return NextResponse.json({ scenePlan: null, success: false, error: 'No text provided' });
    }

    if (!CROF_API_KEY) {
      console.error('[GenerateLiveRemotion] CROF_API_KEY is not set!');
      return NextResponse.json({ scenePlan: null, success: false, error: 'CROF_API_KEY not configured' });
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
You are a creative motion graphics director who creates CONTENT-AWARE scene plans for Remotion videos.

## YOUR CORE TASK
You will receive a video transcript. You MUST:
1. Parse the transcript and divide it into exactly 6 CONTENT-BASED scenes (each scene contains meaningful content from the transcript)
2. For EACH of the 6 scenes, define a UNIQUE visual configuration that:
   - Contains the ACTUAL TRANSCRIPT WORDS from that section to be displayed as text
   - Specifies a UNIQUE background gradient/style for that scene
   - Specifies UNIQUE particle type, color, and count for that scene
   - Specifies UNIQUE animation style for text entrance
   - Uses COLORS that match the mood/theme of that section's content
3. Return the complete scene plan as valid JSON matching the required schema

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

## SCENE VISUAL RULES (REQUIRED)
Each scene must have a unique visual identity:

Scene 1 (Intro): Centered title, slow reveal animation, soft gradient background, gentle particles
Scene 2: Text slides up from bottom, different gradient direction, brighter particles
Scene 3: Text zooms in, radial background, geometric particles
Scene 4: Text bursts outward, diagonal gradient, organic particles
Scene 5: Text pulses/scale animation, dark-to-light gradient, sparkle particles
Scene 6 (Conclusion): Centered text, grand finale animation, celebratory gradient, festive particles

For each scene's particles, choose a type RELEVANT TO THAT SCENE'S CONTENT:
- Technology: hexagon/pixel/code particles, blue/cyan colors
- Nature: leaf/floating petal particles, green/earth tones
- Science: atom/molecule particles, purple/blue colors
- Business: geometric/rising particles, gold/blue colors
- Music: note/equalizer particles, vibrant colors
- Sports: speed/energy particles, bold colors
- Entertainment: sparkle/starburst particles, bright colors
- News/War: data/pulse particles, serious tones
- Health/Education: organic/circle particles, calming colors
- Food: organic/steam particles, warm appetizing colors
- Travel: map/pin/wander particles, adventure colors
- Gaming: pixel/glitch particles, neon colors
- General: mix of geometric particles with the base color

## TIMING
Total duration: ${durationInSeconds} seconds at 30fps
Total frames: ${durationInSeconds} * 30 = ${Math.round(durationInSeconds * 30)}
Frames per scene: Math.floor(totalFrames / 6) = ${Math.floor(Math.round(durationInSeconds * 30) / 6)}

## REQUIRED JSON FORMAT
Your response must be valid JSON with this exact structure:
{
  "title": "string",
  "topic": "string", 
  "scenes": [
    {
      "text": "string (actual transcript words for this scene)",
      "label": "string (short keyword/phrase summarizing scene topic)",
      "color": "string (hex color code, e.g., '#6366f1')",
      "particleType": "circles | diamonds | stars | hexagons | pixels | petals | lines | geometric",
      "particleCount": integer (80-180),
      "backgroundType": "gradient-tl | gradient-tr | gradient-center | radial | dark",
      "animation": "reveal | slide-up | slide-right | zoom | burst"
    }
  ],
  "totalFrames": number (${durationInSeconds} * 30),
  "fps": 30
}

## TECHNICAL REQUIREMENTS
- Return ONLY valid JSON matching the schema above
- No explanations. No markdown fences. No comments before or after the JSON.
- The JSON must start with "{" and end with "}".
- All 6 scenes must be present in the scenes array
- Scene text must contain the actual spoken words from the transcript section
- Particle count must be between 80-180
- Colors must be valid hex strings (including #)
- Validate your JSON before responding

## OUTPUT RULES
- Return ONLY the JSON object — nothing else
- No preamble, no postscript, no markdown code fences
- Ensure the JSON is valid and parsable`;

    const userPrompt = `### USER REQUEST ###
Create a CONTENT-AWARE scene plan JSON for this video transcript.

The scene plan must visualize the actual transcript content — each scene displays its portion of the spoken words with visuals that match what is being discussed.

TITLE: ${title || "Video"}
TOPIC: ${topic || 'general'}
MOOD: ${mood || 'energetic'}
DURATION: ${durationInSeconds}s
DIMENSIONS: 1080x1920 (vertical)

FULL TRANSCRIPT:
${scriptContent}

CRITICAL REQUIREMENTS:
1. Parse the transcript into 6 CONTENT-BASED scenes (not arbitrary time splits)
2. Each scene displays its OWN portion of the transcript text
3. Each scene has UNIQUE background, particle type, color, count, and animation
4. Particle types must match the topic of each specific scene section
5. Return ONLY valid JSON in the exact format specified
6. Do not include any explanations or markdown
7. Validate your response before sending

Generate the complete scene plan JSON with all 6 scenes.`;

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

    if (!aiResponse || aiResponse.trim().length < 20) {
      console.error(`[GenerateLiveRemotion] AI response too short: ${aiResponse.length} chars`);
      throw new Error('AI response is empty or too short');
    }

    console.log(`[GenerateLiveRemotion] Got ${aiResponse.length} chars from AI`);

    // ========================================
    // PARSE AND VALIDATE SCENE PLAN JSON
    // ========================================

    // Clean markdown fences and extra text
    let jsonStr = aiResponse.trim();
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    jsonStr = jsonStr.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    jsonStr = jsonStr.trim();

    // Find JSON object boundaries
    let startIdx = jsonStr.indexOf('{');
    let endIdx = jsonStr.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      console.error(`[GenerateLiveRemotion] No JSON object found in response`);
      console.error(`[GenerateLiveRemotion] Response preview: ${aiResponse.substring(0, 200)}`);
      throw new Error('No valid JSON object found in AI response');
    }

    jsonStr = jsonStr.substring(startIdx, endIdx + 1);

    let scenePlan: ScenePlan | null = null;
    try {
      scenePlan = JSON.parse(jsonStr);
    } catch (parseError: any) {
      console.error(`[GenerateLiveRemotion] JSON parse error: ${parseError.message}`);
      console.error(`[GenerateLiveRemotion] Invalid JSON: ${jsonStr}`);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate scene plan structure
    if (!scenePlan || typeof scenePlan !== 'object') {
      throw new Error('Scene plan is not a valid object');
    }

    if (!scenePlan.title || typeof scenePlan.title !== 'string') {
      throw new Error('Scene plan missing or invalid title');
    }

    if (!scenePlan.topic || typeof scenePlan.topic !== 'string') {
      throw new Error('Scene plan missing or invalid topic');
    }

    if (!Array.isArray(scenePlan.scenes) || scenePlan.scenes.length !== 6) {
      throw new Error(`Scene plan must have exactly 6 scenes, got ${scenePlan.scenes?.length || 0}`);
    }

    const validParticleTypes = ['circles', 'diamonds', 'stars', 'hexagons', 'pixels', 'petals', 'lines', 'geometric'];
    const validBackgroundTypes = ['gradient-tl', 'gradient-tr', 'gradient-center', 'radial', 'dark'];
    const validAnimations = ['reveal', 'slide-up', 'slide-right', 'zoom', 'burst'];

    for (let i = 0; i < scenePlan.scenes.length; i++) {
      const scene = scenePlan.scenes[i];
      if (!scene || typeof scene !== 'object') {
        throw new Error(`Scene ${i} is not a valid object`);
      }
      
      if (!scene.text || typeof scene.text !== 'string' || scene.text.trim().length === 0) {
        throw new Error(`Scene ${i} missing or invalid text`);
      }
      
      if (!scene.label || typeof scene.label !== 'string') {
        scene.label = scene.text.substring(0, Math.min(30, scene.text.length));
      }
      
      if (!scene.color || typeof scene.color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(scene.color)) {
        scene.color = '#6366f1';
      }
      
      if (!scene.particleType || typeof scene.particleType !== 'string' || !validParticleTypes.includes(scene.particleType)) {
        scene.particleType = 'circles';
      }
      
      if (!scene.particleCount || typeof scene.particleCount !== 'number' || scene.particleCount < 80 || scene.particleCount > 180) {
        scene.particleCount = 120;
      }
      
      if (!scene.backgroundType || typeof scene.backgroundType !== 'string' || !validBackgroundTypes.includes(scene.backgroundType)) {
        scene.backgroundType = 'dark';
      }
      
      if (!scene.animation || typeof scene.animation !== 'string' || !validAnimations.includes(scene.animation)) {
        scene.animation = 'reveal';
      }
    }

    if (!scenePlan.totalFrames || typeof scenePlan.totalFrames !== 'number') {
      scenePlan.totalFrames = Math.round(durationInSeconds * 30);
    }
    
    if (!scenePlan.fps || typeof scenePlan.fps !== 'number') {
      scenePlan.fps = 30;
    }

    // Ensure totalFrames matches duration
    scenePlan.totalFrames = Math.round(durationInSeconds * 30);
    scenePlan.fps = 30;

    console.log(`[GenerateLiveRemotion] Success! Scene plan validated, title="${scenePlan.title}", ${scenePlan.scenes.length} scenes`);

    return NextResponse.json({
      scenePlan,
      success: true,
      codeLength: jsonStr.length,
      source: CROF_MODEL
    });

  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error(`[GenerateLiveRemotion] Error: ${msg}`);
    return NextResponse.json(
      { scenePlan: null, success: false, error: msg },
      { status: 500 }
    );
  }
}
