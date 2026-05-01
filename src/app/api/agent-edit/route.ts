import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
//  /api/agent-edit — Agentic Editing Plan Generator
//  Single LLM call → complete editing plan like a pro video editor
// ═══════════════════════════════════════════════════════════════

function generatePollinationsUrl(prompt: string, seed: number): string {
  const shortPrompt = prompt.length > 120 ? prompt.substring(0, 120) : prompt;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`${shortPrompt}, cinematic`)}?width=768&height=512&nologo=true&seed=${seed}`;
}

interface VideoAnalysisData {
  overallSentiment: string;
  averageEngagement: number;
  moodProfile: {
    primary: string;
    secondary: string[];
    energyLevel: number;
    tempo: string;
    colorPalette: string[];
  };
  peakMomentIds: string[];
  hookSegmentIds: string[];
  segmentAnalysis: {
    id: string;
    sentiment: string;
    engagement: number;
    isPeak: boolean;
  }[];
  suggestedCuts: { segmentId: string; type: string; reason: string }[];
}

interface AgentEditRequest {
  subtitles: {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
  }[];
  videoDuration: number;
  videoWidth?: number;
  videoHeight?: number;
  editingStyle?: 'youtube' | 'tiktok' | 'documentary' | 'cinematic' | 'auto';
  model?: string;
  videoAnalysis?: VideoAnalysisData;
}

const SYSTEM_PROMPT = `You are a world-class professional video editor. You are given a video transcript with timestamps. Create a COMPLETE editing plan that turns a raw talking-head video into a polished, engaging final cut.

THINK LIKE A PROFESSIONAL EDITOR:
- Watch the pacing — identify natural topic changes, emphasis points, and dead air
- Add visual variety — don't let any 15-second stretch go without something interesting
- Use overlays SELECTIVELY (40-60% of segments, NOT every one)
- Add transitions ONLY at major topic shifts (not between every segment)
- Use zoom effects sparingly for emphasis moments (stats, key claims, reveals)
- Identify filler segments to speed up (ums, repeated phrases, dead air)
- Choose a color grade that matches the video's overall mood

AVAILABLE OVERLAY TYPES (choose the BEST type for each segment):

1. "visual-illustration" — ANIMATED SVG MOTION GRAPHIC. PREFER this when the transcript mentions a concrete concept. These render instantly and look premium.
  Props: { "scene": "<scene-name>", "label": "2-4 word label", "color": "<hex>", "transition": "fade-in" }
  AVAILABLE SCENES:
  - "money-flow" (money, revenue, profit, income, cash, price, earn, pay)
  - "growth-chart" (business, company, startup, stock, invest, market, growth)
  - "arrow-growth" (grow, increase, rise, scale, expand, boost)
  - "rocket-launch" (launch, start, begin, kick off, takeoff, moon, space)
  - "brain-idea" (brain, think, idea, smart, learn, knowledge, secret, tip, hack, AI)
  - "code-terminal" (code, programming, software, developer, app, website, tech)
  - "connections" (connect, network, social, internet, community, together, people)
  - "globe" (earth, world, global, country, international, travel)
  - "fire-blaze" (fire, hot, burn, passion, intense, trending)
  - "lightning" (electric, shock, fast, speed, quick, instant)
  - "explosion-burst" (explode, massive, huge, incredible, impact, disrupt, crazy)
  - "celebration" (win, champion, congratulations, celebrate, victory, awesome)
  - "target-bullseye" (goal, target, aim, focus, precise, strategy)
  - "crown-royal" (best, king, queen, top, leader, greatest)
  - "heartbeat" (love, heart, feel, care, emotion, health, life)
  - "shield-protect" (protect, safe, security, guard, defense, trust)
  - "clock-time" (time, hour, minute, schedule, deadline, wait)
  - "mountain-peak" (mountain, climb, challenge, overcome, journey, adventure)
  - "water-wave" (ocean, water, sea, wave, flow, calm, beach)
  - "diamond-gem" (luxury, premium, expensive, valuable, precious, rich)
  - "atom-science" (science, research, experiment, physics, chemistry, quantum)
  - "gear-system" (machine, system, engine, process, automate, mechanism, tool)
  - "eye-vision" (watch, see, look, discover, reveal, vision, insight)
  - "energy-pulse" (power, energy, force, strong, charge, activate)
  - "checkmark-success" (success, achieve, accomplish, done, complete, results)
  - "nature-tree" (tree, nature, forest, green, environment)
  - "solar-system" (sun, star, universe, galaxy, cosmic, space)
  - "city-skyline" (city, urban, downtown, building, skyline)
  - "music-notes" (music, song, sound, listen, audio, podcast)
  - "book-reading" (book, read, study, education, course, teach)
  - "camera" (video, photo, film, record, content, create)
  - "cooking" (food, eat, recipe, cook, meal, kitchen)
  - "shopping-cart" (sales, buy, shop, purchase, store, product)

2. "ai-generated-image" — AI-GENERATED B-ROLL IMAGE, fullscreen cinematic. Use for descriptive/narrative content without a clear scene match.
  Props: { "imagePrompt": "detailed cinematic visual description", "caption": "short label" }
  Write RICH, SPECIFIC prompts with cinematic language:
  - Lighting: golden hour, chiaroscuro, volumetric, rim light, neon glow
  - Quality: "cinematic lighting, 8k, hyperrealistic, professional color grading"
  GOOD: "A dramatic upward-trending stock chart rendered as a glowing glass sculpture in a dark executive boardroom, golden hour, 8k"
  BAD: "business growth" (too vague)

3. "ai-motion-graphic" — LIVE AI-GENERATED ANIMATED SVG. Use for 2-3 PEAK MOMENTS per video — stats reveals, key claims, dramatic statements, or high-impact visuals that deserve a unique custom animation.
  Props: { "label": "2-4 word label", "color": "<hex>", "topic": "1-2 word topic keyword" }
  The system will auto-generate a custom animated SVG based on the segment content. Use sparingly for maximum impact.

OVERLAY SELECTION STRATEGY:
- PREFER "visual-illustration" (50-60% of overlays) — instant, animated, premium
- Use "ai-motion-graphic" (10-20% of overlays) — for 2-3 peak moments that deserve unique custom animation
- Use "ai-generated-image" (20-30% of overlays) — for narrative segments without a clear scene
- Match scenes PRECISELY to transcript content
- Use DIFFERENT scenes — never repeat the same scene twice in a row

AVAILABLE EFFECTS (applied to the base video layer):
- "zoom-in" — gradual scale up (1.0 → intensity). Good for emphasis.
- "zoom-out" — gradual scale down (intensity → 1.0). Good for reveals.
- "ken-burns" — slow pan + zoom. Classic documentary feel. Direction: "left"|"right"|"up"|"down"
- "shake" — subtle camera shake. For dramatic/impact moments. Intensity 0.5-2.0

AVAILABLE TRANSITIONS (between segments at topic changes):
- "fade" — classic cross-fade
- "slide-left" — slide new content from right
- "slide-right" — slide new content from left
- "glitch" — digital glitch effect (for tech/gaming content)
- "wipe" — horizontal wipe
- "zoom" — zoom transition

USING VIDEO ANALYSIS DATA (when provided):
- USE THE COLOR PALETTE from the mood profile for overlay colors and colorGrade
- PUT YOUR BEST OVERLAYS on PEAK MOMENT segments
- MATCH THE ENERGY: high energy = more zoom effects, dynamic overlays. Low energy = subtle ken-burns, calm motion graphics
- SPEED UP segments flagged as filler/pause
- For HOOK segments, use attention-grabbing visuals and zoom-in effects
- Match imagePrompt visual tone to the mood

RULES:
1. Overlay 40-60% of segments — leave breathing room
2. Never overlay consecutive segments — always have at least 1 gap
3. Use transitions only 3-6 times in a typical 2-minute video
4. Effects should cover 20-30% of segments
5. Speed up filler segments with speedFactor 1.3-2.0
6. Do NOT cut segments unless they are completely empty/silence
7. imagePrompt should be vivid and specific

Return a SINGLE JSON object (no markdown, no explanation, just valid JSON):
{
  "editingPlan": {
    "mood": "energetic",
    "colorGrade": { "brightness": 105, "contrast": 110, "saturation": 115, "temperature": 3 },
    "segments": [
      {
        "segmentId": "seg_0",
        "action": "keep",
        "overlay": { "type": "visual-illustration", "props": { "scene": "rocket-launch", "label": "GETTING STARTED", "color": "#ef4444", "transition": "fade-in" } },
        "effect": { "type": "zoom-in", "intensity": 1.2 },
        "transition": null
      },
      {
        "segmentId": "seg_1",
        "action": "keep",
        "overlay": null,
        "effect": null,
        "transition": { "type": "fade", "duration": 0.5 }
      }
    ]
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const body: AgentEditRequest = await request.json();
    const { subtitles, videoDuration, videoWidth, videoHeight, editingStyle, model, videoAnalysis } = body;

    if (!subtitles || subtitles.length === 0) {
      return NextResponse.json({ ok: false, error: 'No subtitles provided' }, { status: 400 });
    }

    // Build the transcript with per-segment analysis annotations
    const transcriptText = subtitles
      .map(s => {
        const analysis = videoAnalysis?.segmentAnalysis?.find(a => a.id === s.id);
        const annotations = analysis
          ? ` [${analysis.sentiment}, engagement:${analysis.engagement}${analysis.isPeak ? ', PEAK' : ''}]`
          : '';
        return `[${s.id}] (${s.startTime.toFixed(1)}s - ${s.endTime.toFixed(1)}s) "${s.text}"${annotations}`;
      })
      .join('\n');

    const videoInfo = [
      `Duration: ${videoDuration.toFixed(1)}s`,
      `Resolution: ${videoWidth || 1920}x${videoHeight || 1080}`,
      `Total segments: ${subtitles.length}`,
      `Style preference: ${editingStyle || 'auto (pick the best style based on content)'}`,
    ].join('\n');

    let analysisSection = '';
    if (videoAnalysis) {
      const mp = videoAnalysis.moodProfile;
      analysisSection = `
VIDEO ANALYSIS:
Mood: ${mp.primary} (energy: ${mp.energyLevel}/10, tempo: ${mp.tempo})
Overall sentiment: ${videoAnalysis.overallSentiment}
Average engagement: ${Math.round(videoAnalysis.averageEngagement)}%
Color palette (USE THESE): ${mp.colorPalette.join(', ')}
Peak moments (give best overlays): ${videoAnalysis.peakMomentIds.join(', ') || 'none detected'}
Hook segments (attention-grabbers): ${videoAnalysis.hookSegmentIds.join(', ') || 'none detected'}
Filler to speed up: ${videoAnalysis.suggestedCuts.map(c => `${c.segmentId} (${c.type})`).join(', ') || 'none'}
`;
    }

    const userPrompt = `Here is the video's full transcript. Create a complete editing plan.

VIDEO INFO:
${videoInfo}
${analysisSection}
FULL TRANSCRIPT:
${transcriptText}

Remember: Return ONLY the JSON object, no markdown fencing, no explanation. The JSON must start with { and end with }.`;

    console.log('[AgentEdit] Generating editing plan via Lightning AI DeepSeek V4 Pro');
    console.log('[AgentEdit] Transcript has', subtitles.length, 'segments,', videoDuration.toFixed(1), 's');

    const usedModel = 'lightning-ai/deepseek-v4-pro';
    const result = await callLLM(usedModel, SYSTEM_PROMPT, userPrompt);

    if (!result) {
      console.error('[AgentEdit] Lightning AI DeepSeek V4 Pro returned no result');
      return NextResponse.json({ ok: false, error: 'AI model failed (Lightning AI DeepSeek V4 Pro). Check API key.' });
    }

    // Parse the JSON response
    try {
      let jsonStr = result;
      // Strip markdown code fencing if present
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      // DeepSeek sometimes injects Chinese/non-ASCII chars that corrupt JSON structure
      jsonStr = jsonStr.replace(/[^\x20-\x7E\n\r\t]/g, '');

      const parsed = JSON.parse(jsonStr);
      const plan = parsed.editingPlan || parsed;

      // Validate the plan structure
      if (!plan.segments || !Array.isArray(plan.segments)) {
        console.error('[AgentEdit] AI returned plan without segments array');
        return NextResponse.json({ ok: false, error: 'AI returned invalid plan structure (no segments array)' });
      }

      // Validate segment IDs exist
      const validSegmentIds = new Set(subtitles.map(s => s.id));
      plan.segments = plan.segments.filter(
        (seg: { segmentId: string; overlay?: { type: string; props?: Record<string, unknown> } }) => {
          if (!validSegmentIds.has(seg.segmentId)) return false;
          if (seg.overlay?.type === 'ai-generated-image' && seg.overlay.props) {
            delete seg.overlay.props.imageUrl;
            delete seg.overlay.props.seed;
          }
          return true;
        }
      );

      // ═══ POST-PROCESS OVERLAYS ═══
      const subtitleMap = new Map(subtitles.map(s => [s.id, s.text]));
      for (const seg of plan.segments as { segmentId: string; overlay?: { type: string; props?: Record<string, unknown> } }[]) {
        if (seg.overlay?.type === 'ai-generated-image') {
          const prompt = String(seg.overlay.props?.imagePrompt || '');
          const hash = Math.abs(seg.segmentId.split('').reduce((a: number, c: string) => ((a << 5) - a) + c.charCodeAt(0), 0));
          const seed = hash % 1000000;
          seg.overlay.props = {
            ...seg.overlay.props,
            imageUrl: generatePollinationsUrl(prompt, seed),
          };
        }
      }

      // ═══ GENERATE LIVE SVGs FOR AI MOTION GRAPHICS ═══
      const motionSegs = (plan.segments as { segmentId: string; overlay?: { type: string; props?: Record<string, unknown> } }[])
        .filter(seg => seg.overlay?.type === 'ai-motion-graphic')
        .slice(0, 5);

      if (motionSegs.length > 0) {
        console.log(`[AgentEdit] Generating ${motionSegs.length} live motion SVGs...`);
        const globalAbort = new AbortController();
        const globalTimer = setTimeout(() => globalAbort.abort(), 90000);

        const svgResults = await Promise.allSettled(
          motionSegs.map(async (seg) => {
            const text = subtitleMap.get(seg.segmentId) || '';
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 50000);
            globalAbort.signal.addEventListener('abort', () => controller.abort());
            try {
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
                || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
              const res = await fetch(`${baseUrl}/api/generate-motion-svg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text,
                  mood: plan.mood || 'energetic',
                  topic: String(seg.overlay?.props?.topic || 'general'),
                  color: String(seg.overlay?.props?.color || '#6366f1'),
                  label: String(seg.overlay?.props?.label || ''),
                }),
                signal: controller.signal,
              });
              clearTimeout(timer);
              const data = await res.json();
              return { segmentId: seg.segmentId, svgContent: data.svgContent || '', success: data.success };
            } catch {
              clearTimeout(timer);
              return { segmentId: seg.segmentId, svgContent: '', success: false };
            }
          })
        );

        clearTimeout(globalTimer);

        for (const result of svgResults) {
          if (result.status === 'fulfilled' && result.value.success && result.value.svgContent) {
            const seg = motionSegs.find(s => s.segmentId === result.value.segmentId);
            if (seg?.overlay?.props) {
              seg.overlay.props.svgContent = result.value.svgContent;
              console.log(`[AgentEdit] Live SVG generated for ${result.value.segmentId}`);
            }
          } else {
            // Downgrade to visual-illustration fallback
            const failedId = result.status === 'fulfilled' ? result.value.segmentId : '';
            const seg = motionSegs.find(s => s.segmentId === failedId);
            if (seg?.overlay) {
              const text = subtitleMap.get(seg.segmentId) || '';
              const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
              const sceneMap: Record<string, string> = { money: 'money-flow', growth: 'growth-chart', brain: 'brain-idea', fire: 'fire-blaze', rocket: 'rocket-launch', power: 'energy-pulse', success: 'checkmark-success' };
              let scene = 'energy-pulse';
              for (const w of words) { if (sceneMap[w]) { scene = sceneMap[w]; break; } }
              seg.overlay.type = 'visual-illustration';
              seg.overlay.props = { scene, label: seg.overlay.props?.label || '', color: seg.overlay.props?.color || '#6366f1', transition: 'fade-in' };
              console.log(`[AgentEdit] SVG generation failed for ${seg.segmentId}, downgraded to visual-illustration`);
            }
          }
        }

        const successCount = svgResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
        console.log(`[AgentEdit] Motion SVG generation: ${successCount}/${motionSegs.length} succeeded`);
      }

      console.log('[AgentEdit] Success! Plan has', plan.segments.length, 'segment edits, mood:', plan.mood, 'model:', usedModel);
      return NextResponse.json({ ok: true, editingPlan: plan, source: `ai:${usedModel}` });
    } catch (parseError) {
      console.error('[AgentEdit] JSON parse error:', parseError);
      console.error('[AgentEdit] Raw response (first 500 chars):', result.substring(0, 500));
      return NextResponse.json({ ok: false, error: `AI returned unparseable JSON: ${String(parseError).substring(0, 100)}` });
    }
  } catch (error) {
    console.error('[AgentEdit] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  LLM Call — tries the requested model via Lightning AI gateway
// ═══════════════════════════════════════════════════════════════

const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY || 'a136ad94-f05f-4431-b3ad-2148a0c72ac3/giggletales18/vision-model';

async function callLLM(
  modelId: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  const url = 'https://lightning.ai/api/v1/chat/completions';
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${LIGHTNING_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const body = {
    model: 'lightning-ai/deepseek-v4-pro',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 8192,
    temperature: 0.7,
  };

  try {
    console.log('[AgentEdit] Calling Lightning AI DeepSeek V4 Pro');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AgentEdit] LLM error:', response.status, errorText.substring(0, 200));
      return null;
    }

    const data = await response.json();
    const content = extractContent(data);
    if (!content) {
      console.error('[AgentEdit] LLM returned 200 but no usable content. Raw:', JSON.stringify(data).substring(0, 300));
    }
    return content;
  } catch (error) {
    console.error('[AgentEdit] LLM fetch error:', error);
    return null;
  }
}

function extractContent(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  // Anthropic format
  const anthropicContent = d.content as Array<{ type: string; text?: string }> | undefined;
  if (Array.isArray(anthropicContent)) {
    const textBlock = anthropicContent.find(block => block.type === 'text');
    if (textBlock?.text) return textBlock.text;
  }

  // OpenAI / Lightning / DeepSeek format
  const choices = d.choices as Array<{ message?: { content?: string } }> | undefined;
  if (Array.isArray(choices) && choices[0]?.message?.content) {
    return choices[0].message.content;
  }

  // Google Gemini format
  const candidates = d.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
  if (Array.isArray(candidates) && candidates[0]?.content?.parts?.[0]?.text) {
    return candidates[0].content.parts[0].text;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
//  Local fallback — generates a reasonable editing plan without AI
// ═══════════════════════════════════════════════════════════════

const OVERLAY_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

const STRONG_KEYWORDS = new Set([
  'money', 'revenue', 'profit', 'income', 'growth', 'success', 'rocket',
  'brain', 'technology', 'code', 'science', 'power', 'energy', 'fire',
  'earth', 'world', 'mountain', 'ocean', 'celebrate', 'love', 'protect',
  'invest', 'market', 'stock', 'launch', 'explode', 'scale', 'secret',
  'ai', 'data', 'cloud', 'digital', 'algorithm', 'machine', 'network',
]);

const FILLER_PATTERNS = [
  'thank you for watching', 'like and subscribe', 'please subscribe',
  'see you in the next', "don't forget", 'comment below', 'let me know',
  "that's it for", 'alright guys', 'anyway', 'moving on', 'so basically',
];

function scoreSegment(text: string): number {
  const lower = text.toLowerCase();
  if (lower.length < 8) return 0;
  if (FILLER_PATTERNS.some(p => lower.includes(p))) return -1;

  let score = 0;
  const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  for (const w of words) {
    if (STRONG_KEYWORDS.has(w)) score += 3;
  }
  if (/\$[\d,.]+|\d+%|\d{3,}/.test(text)) score += 4;
  if (text.includes('?')) score += 2;
  if (text.includes('!')) score += 1;
  return Math.max(0, score);
}

function extractKeyPhrase(text: string): string {
  const STOP_WORDS = new Set([
    'about', 'above', 'after', 'again', 'all', 'also', 'and', 'any', 'are', 'as',
    'at', 'be', 'been', 'being', 'but', 'by', 'can', 'could', 'did', 'do',
    'does', 'doing', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'here',
    'him', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just',
    'me', 'more', 'most', 'my', 'no', 'nor', 'not', 'now', 'of', 'on', 'or',
    'our', 'out', 'over', 'own', 'she', 'so', 'some', 'than', 'that', 'the',
    'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'too',
    'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
    'who', 'will', 'with', 'would', 'you', 'your',
  ]);
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  if (words.length === 0) return text.substring(0, 20);
  return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const EMOJI_MAP: Record<string, string> = {
  fire: '🔥', money: '💰', rocket: '🚀', brain: '🧠', love: '❤️',
  success: '✅', growth: '📈', star: '⭐', power: '⚡', celebrate: '🎉',
  goal: '🎯', idea: '💡', win: '🏆', code: '💻', world: '🌍',
};

const SCENE_MAP: Record<string, string> = {
  money: 'money-flow', revenue: 'money-flow', growth: 'arrow-growth',
  brain: 'brain-idea', code: 'code-terminal', tech: 'code-terminal',
  world: 'globe', earth: 'globe', rocket: 'rocket-launch', launch: 'rocket-launch',
  fire: 'fire-blaze', power: 'energy-pulse', celebrate: 'celebration',
  goal: 'target-bullseye', love: 'heartbeat', time: 'clock-time',
  protect: 'shield-protect', mountain: 'mountain-peak', ocean: 'water-wave',
};

function generateLocalEditingPlan(
  subtitles: { id: string; startTime: number; endTime: number; text: string }[],
  videoDuration: number
) {
  const scored = subtitles.map((seg, idx) => ({
    seg,
    idx,
    score: scoreSegment(seg.text),
  }));

  // Pick top 40-50% for overlays
  const maxOverlays = Math.max(2, Math.floor(subtitles.length * 0.45));
  const topSegs = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, maxOverlays);

  // Enforce minimum gap of 2
  const overlayIndices = new Set<number>();
  const sorted = topSegs.sort((a, b) => a.idx - b.idx);
  let lastIdx = -3;
  for (const entry of sorted) {
    if (entry.idx - lastIdx >= 2) {
      overlayIndices.add(entry.idx);
      lastIdx = entry.idx;
    }
  }

  // Detect topic changes for transitions (big text similarity drops)
  const transitionIndices = new Set<number>();
  let transitionCount = 0;
  const maxTransitions = Math.min(6, Math.floor(subtitles.length / 5));
  for (let i = 1; i < subtitles.length && transitionCount < maxTransitions; i++) {
    // Simple heuristic: transitions at roughly evenly-spaced intervals
    const interval = Math.floor(subtitles.length / (maxTransitions + 1));
    if (i % interval === 0 && i > 0) {
      transitionIndices.add(i);
      transitionCount++;
    }
  }

  // Build segments
  const segments: Array<{
    segmentId: string;
    action: string;
    speedFactor?: number;
    overlay?: { type: string; props: Record<string, unknown> } | null;
    effect?: { type: string; intensity?: number; direction?: string } | null;
    transition?: { type: string; duration: number } | null;
  }> = [];

  let overlayCount = 0;
  const transitionTypes = ['fade', 'wipe', 'slide-left', 'zoom', 'fade', 'slide-right'];

  for (let i = 0; i < subtitles.length; i++) {
    const seg = subtitles[i];
    const s = scored[i];

    const segment: typeof segments[0] = {
      segmentId: seg.id,
      action: 'keep',
      overlay: null,
      effect: null,
      transition: null,
    };

    // Filler detection → speed up
    if (s.score < 0) {
      segment.action = 'speed-up';
      segment.speedFactor = 1.5;
    }

    // Add overlays to selected segments
    if (overlayIndices.has(i)) {
      const lower = seg.text.toLowerCase();
      const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
      const contentHash = Math.abs(seg.text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
      const color = OVERLAY_COLORS[contentHash % OVERLAY_COLORS.length];

      // Content-driven type selection: visual-illustration for strong keyword matches
      const matchedScene = (() => {
          // Skip generic conversational words
          const SKIP = new Set(['guys', 'hello', 'welcome', 'right', 'true', 'real', 'tell', 'happen', 'finally', 'literally', 'actually', 'basically', 'definitely', 'probably', 'going', 'different', 'new', 'old', 'next', 'first', 'help', 'need', 'absolutely', 'exactly', 'because', 'why', 'question', 'answer', 'explain', 'reason', 'story', 'follow', 'free']);
          for (const w of words) {
              if (SKIP.has(w)) continue;
              if (SCENE_MAP[w]) return SCENE_MAP[w];
          }
          return null;
      })();

      if (matchedScene) {
          // Strong keyword match → animated SVG scene (instant, premium)
          segment.overlay = {
              type: 'visual-illustration',
              props: {
                  scene: matchedScene,
                  label: extractKeyPhrase(seg.text),
                  color,
                  transition: 'fade-in',
              },
          };
      } else {
          // No strong scene match → AI-generated image
          const keyPhrase = extractKeyPhrase(seg.text);
          const keyWords = words.filter(w => !new Set(['the','and','but','for','are','was','has','had','have','will','can','this','that','with','from','they','been','were','being','does','its','our','your']).has(w)).slice(0, 5).join(', ');
          segment.overlay = {
              type: 'ai-generated-image',
              props: {
                  imagePrompt: `A cinematic scene depicting: ${seg.text.substring(0, 100)}. Key elements: ${keyWords}. Dramatic composition, volumetric lighting, hyperrealistic, professional color grading, 8k, shallow depth of field`,
                  caption: keyPhrase,
                  displayMode: (contentHash % 5 === 0) ? 'card' : 'fullscreen',
              },
          };
      }

      // Add effects to some overlaid segments (every other one)
      if (overlayCount % 3 === 0) {
        const effectTypes = ['zoom-in', 'zoom-out', 'ken-burns', 'shake'] as const;
        const effectType = effectTypes[overlayCount % effectTypes.length];
        segment.effect = {
          type: effectType,
          intensity: effectType === 'shake' ? 0.8 : 1.2,
          ...(effectType === 'ken-burns' ? { direction: 'left' } : {}),
        };
      }

      overlayCount++;
    }

    // Add transitions at topic change points
    if (transitionIndices.has(i)) {
      segment.transition = {
        type: transitionTypes[transitionCount % transitionTypes.length],
        duration: 0.4,
      };
    }

    segments.push(segment);
  }

  return {
    mood: 'energetic',
    colorGrade: {
      brightness: 103,
      contrast: 110,
      saturation: 112,
      temperature: 2,
    },
    segments,
  };
}
