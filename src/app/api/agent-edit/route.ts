import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

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

OVERLAY TYPES (choose the best type for each segment):

1. "ai-motion-graphic" u2014 LIVE AI-GENERATED REMOTION REACT CODE. Use this for 30-40% of overlays.
   Props: { "label": "2-4 word CAPITALIZED label", "color": "<hex>", "topic": "<topic-keyword>", "mood": "energetic|calm|dramatic|warm" }
   This generates a UNIQUE animated React component for each segment.

2. "kinetic-text" u2014 DYNAMIC ANIMATED TEXT. Use for quotes, numbers, or key phrases.
   Props: { "text": "Short phrase", "style": "pop|reveal|glitch|bounce", "color": "<hex>" }

3. "ai-generated-image" u2014 AI-GENERATED CINEMATIC IMAGE. Use for background scenery.
   Props: { "imagePrompt": "detailed cinematic image description, 50-100 words", "caption": "2-4 word label", "color": "<hex>" }

4. "visual-illustration" u2014 PREMIUM PRE-BUILT ANIMATED SVG SCENES.
   Props: { "scene": "globe|rocket-launch|money-flow|explosion-burst|brain-idea|connections|solar-system", "color": "<hex>", "label": "LABEL" }

OVERLAY STRATEGY:
- Overlay 50-70% of segments. Skip filler.
- Use a MIX of types: 40% ai-motion-graphic, 20% kinetic-text, 20% ai-generated-image, 20% visual-illustration.
- NEVER overlay consecutive segments u2014 minimum 1 segment gap.
- Every overlay MUST have a unique label/caption specific to the segment content.
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
7. imagePrompt should be vivid, specific, and cinematic

Return a SINGLE JSON object (no markdown, no explanation, just valid JSON):
{
  "editingPlan": {
    "mood": "energetic",
    "colorGrade": { "brightness": 105, "contrast": 110, "saturation": 115, "temperature": 3 },
    "segments": [
      {
        "segmentId": "seg_0",
        "action": "keep",
        "overlay": { "type": "ai-motion-graphic", "props": { "label": "GETTING STARTED", "color": "#ef4444", "topic": "launch", "mood": "energetic" } },
        "effect": { "type": "zoom-in", "intensity": 1.2 },
        "transition": null
      },
      {
        "segmentId": "seg_1",
        "action": "keep",
        "overlay": null,
        "effect": null,
        "transition": { "type": "fade", "duration": 0.5 }
      },
      {
        "segmentId": "seg_4",
        "action": "keep",
        "overlay": { "type": "ai-motion-graphic", "props": { "label": "CITY GROWTH", "color": "#f59e0b", "topic": "growth", "mood": "energetic" } },
        "effect": { "type": "ken-burns", "intensity": 1.15, "direction": "left" },
        "transition": null
      }
    ]
  }
}`;

/**
 * Aggressively repair common LLM JSON malformations.
 * Tries multiple strategies until valid JSON is produced.
 */
function repairJson(raw: string): string {
  let str = raw;

  // 1. Strip markdown code fencing
  str = str.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // 2. Extract the outermost JSON object or array
  const objMatch = str.match(/\{[\s\S]*\}/);
  const arrMatch = str.match(/\[[\s\S]*\]/);
  if (objMatch && (!arrMatch || objMatch[0].length >= arrMatch[0].length)) {
    str = objMatch[0];
  } else if (arrMatch) {
    str = arrMatch[0];
  }

  // 3. Remove control characters (but keep tabs/newlines)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 4. Remove reasoning/thinking tags that some models inject
  str = str.replace(/<think>[\s\S]*?<\/think>/gi, '');
  str = str.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

  // 5. Fix trailing commas before } or ]
  str = str.replace(/,\s*([}\]])/g, '$1');

  // 6. Fix missing commas between object properties:
  //    "key": "val"\n  "key2":  →  "key": "val",\n  "key2":
  str = str.replace(/("[^"]*"\s*:\s*(?:"[^"]*"|\[[^\]]*\]|\{[^}]*\}|\d+(?:\.\d+)?|true|false|null))\s*\n\s*(?="[^"]*"\s*:)/g, '$1,\n');

  // 7. Fix missing commas between array elements:
  //    }\n  {  →  },\n  {
  str = str.replace(/(\}|\])\s*\n\s*(\{|\[)/g, '$1,\n$2');

  // 8. Replace single-quoted strings with double-quoted (conservative)
  //    Only for simple cases: 'word' → "word"
  str = str.replace(/'([^'\n\r]*)'/g, '"$1"');

  // 9. Remove C-style comments
  str = str.replace(/\/\/[^\n\r]*/g, '');
  str = str.replace(/\/\*[\s\S]*?\*\//g, '');

  return str;
}

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

    console.log('[AgentEdit] Generating editing plan via kimi-k2.6-precision');
    console.log('[AgentEdit] Transcript has', subtitles.length, 'segments,', videoDuration.toFixed(1), 's');

    const usedModel = 'kimi-k2.6-precision';
    const result = await callLLM(usedModel, SYSTEM_PROMPT, userPrompt);

    if (!result) {
      console.error('[AgentEdit] kimi-k2.6-precision returned no result');
      return NextResponse.json({ ok: false, error: 'AI model failed (kimi-k2.6-precision). Try again.' });
    }

    // Parse the JSON response
    try {
      let jsonStr = repairJson(result);

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
          return true;
        }
      );

      // POST-PROCESS: ensure overlays have proper props
      const subtitleMap = new Map(subtitles.map(s => [s.id, s.text]));
      for (const seg of plan.segments as { segmentId: string; overlay?: { type: string; props?: Record<string, unknown> } }[]) {
        if (!seg.overlay) continue;
        const text = subtitleMap.get(seg.segmentId) || '';

        if (seg.overlay.type === 'ai-generated-image') {
          // Ensure ai-generated-image has imagePrompt and caption
          const seed = Math.abs(text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)) % 1000000;
          const prompt = String(seg.overlay.props?.imagePrompt || text);
          seg.overlay.props = {
            ...seg.overlay.props,
            imagePrompt: prompt,
            caption: seg.overlay.props?.caption || extractKeyPhrase(text),
            color: seg.overlay.props?.color || '#6366f1',
            seed,
            imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt.substring(0, 120)}, cinematic`)}?width=768&height=512&nologo=true&seed=${seed}`,
          };
        } else if (seg.overlay.type === 'kinetic-text') {
          seg.overlay.props = {
            ...seg.overlay.props,
            text: seg.overlay.props?.text || extractKeyPhrase(text),
            style: seg.overlay.props?.style || 'pop',
            color: seg.overlay.props?.color || '#6366f1',
          };
        } else if (seg.overlay.type === 'visual-illustration') {
          seg.overlay.props = {
            ...seg.overlay.props,
            scene: seg.overlay.props?.scene || 'connections',
            label: seg.overlay.props?.label || extractKeyPhrase(text),
            color: seg.overlay.props?.color || '#6366f1',
          };
        } else if (seg.overlay.type === 'ai-motion-graphic') {
          // Keep ai-motion-graphic with proper props
          seg.overlay.props = {
            ...seg.overlay.props,
            label: seg.overlay.props?.label || extractKeyPhrase(text),
            color: seg.overlay.props?.color || '#6366f1',
            topic: seg.overlay.props?.topic || 'general',
            mood: seg.overlay.props?.mood || 'energetic',
          };
        } else {
          // AI returned an unknown overlay type - convert to ai-motion-graphic
          seg.overlay.type = 'ai-motion-graphic';
          seg.overlay.props = {
            ...seg.overlay.props,
            label: seg.overlay.props?.label || extractKeyPhrase(text),
            color: seg.overlay.props?.color || '#6366f1',
            topic: seg.overlay.props?.topic || 'general',
            mood: seg.overlay.props?.mood || 'energetic',
          };
        }
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
//  LLM Call — uses kimi-k2.6-precision via crof.ai (OpenAI-compatible)
// ═══════════════════════════════════════════════════════════════

const CROF_API = 'https://crof.ai/v2/chat/completions';
const CROF_API_KEY = process.env.CROF_API_KEY || '';
const CROF_MODEL = 'kimi-k2.6-precision';

async function callLLM(
  _modelId: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[AgentEdit] Calling ${CROF_MODEL} via crof.ai (attempt ${attempt}/3)`);

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
        console.warn(`[AgentEdit] crof.ai failed: ${res.status} ${errText.substring(0, 200)}`);
        if (attempt < 3) { await new Promise(r => setTimeout(r, 1500)); continue; }
        return null;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) {
        console.warn('[AgentEdit] crof.ai: empty content');
        if (attempt < 3) continue;
        return null;
      }

      console.log(`[AgentEdit] ${CROF_MODEL} response: ${content.length} chars`);
      return content;
    } catch (error) {
      console.warn(`[AgentEdit] crof.ai attempt ${attempt} error:`, error);
      if (attempt < 3) { await new Promise(r => setTimeout(r, 1500)); continue; }
    }
  }

  console.error('[AgentEdit] All crof.ai attempts failed');
  return null;
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

  // ONLY keyword matches from SCENE_MAP count — no generic number/question bonuses
  let score = 0;
  const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  for (const w of words) {
    if (SCENE_MAP[w]) score += 3;
  }
  return score;
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
  money: 'money-flow', revenue: 'money-flow', profit: 'money-flow', income: 'money-flow',
  dollar: 'money-flow', cash: 'money-flow', price: 'money-flow', cost: 'money-flow',
  earn: 'money-flow', pay: 'money-flow', salary: 'money-flow',
  sales: 'shopping-cart', buy: 'shopping-cart', shop: 'shopping-cart', purchase: 'shopping-cart',
  store: 'shopping-cart', product: 'shopping-cart', order: 'shopping-cart', deal: 'shopping-cart',
  business: 'growth-chart', company: 'growth-chart', startup: 'growth-chart',
  stock: 'growth-chart', invest: 'growth-chart', market: 'growth-chart',
  billion: 'growth-chart', million: 'growth-chart',
  luxury: 'diamond-gem', premium: 'diamond-gem', expensive: 'diamond-gem',
  growth: 'arrow-growth', grow: 'arrow-growth', increase: 'arrow-growth',
  rise: 'arrow-growth', scale: 'arrow-growth', expand: 'arrow-growth',
  success: 'checkmark-success', achieve: 'checkmark-success', accomplish: 'checkmark-success',
  win: 'celebration', champion: 'celebration', winner: 'celebration',
  celebrate: 'celebration', victory: 'celebration', awesome: 'celebration', amazing: 'celebration',
  goal: 'target-bullseye', target: 'target-bullseye', aim: 'target-bullseye',
  focus: 'target-bullseye', strategy: 'target-bullseye', plan: 'target-bullseye',
  best: 'crown-royal', top: 'crown-royal', leader: 'crown-royal', greatest: 'crown-royal',
  brain: 'brain-idea', think: 'brain-idea', idea: 'brain-idea',
  smart: 'brain-idea', mind: 'brain-idea', learn: 'brain-idea',
  secret: 'brain-idea', tip: 'brain-idea', trick: 'brain-idea', hack: 'brain-idea',
  code: 'code-terminal', programming: 'code-terminal', software: 'code-terminal',
  developer: 'code-terminal', app: 'code-terminal', website: 'code-terminal',
  tech: 'code-terminal', digital: 'code-terminal', computer: 'code-terminal',
  connect: 'connections', network: 'connections', social: 'connections',
  internet: 'connections', online: 'connections', community: 'connections',
  together: 'connections', collaborate: 'connections', share: 'connections',
  people: 'connections', friends: 'connections', relationship: 'connections',
  science: 'atom-science', research: 'atom-science', experiment: 'atom-science',
  physics: 'atom-science', chemistry: 'atom-science', quantum: 'atom-science',
  machine: 'gear-system', system: 'gear-system', engine: 'gear-system',
  process: 'gear-system', automate: 'gear-system', build: 'gear-system',
  tool: 'gear-system', work: 'gear-system', method: 'gear-system',
  watch: 'eye-vision', see: 'eye-vision', look: 'eye-vision',
  observe: 'eye-vision', view: 'eye-vision', discover: 'eye-vision',
  reveal: 'eye-vision', vision: 'eye-vision', insight: 'eye-vision',
  show: 'eye-vision', check: 'eye-vision', notice: 'eye-vision',
  power: 'energy-pulse', energy: 'energy-pulse', force: 'energy-pulse',
  strong: 'energy-pulse', charge: 'energy-pulse', activate: 'energy-pulse',
  electric: 'lightning', shock: 'lightning', bolt: 'lightning',
  fast: 'lightning', speed: 'lightning', quick: 'lightning', instant: 'lightning',
  explode: 'explosion-burst', boom: 'explosion-burst', blast: 'explosion-burst',
  massive: 'explosion-burst', huge: 'explosion-burst', incredible: 'explosion-burst',
  impact: 'explosion-burst', crazy: 'explosion-burst', insane: 'explosion-burst',
  launch: 'rocket-launch', rocket: 'rocket-launch', fly: 'rocket-launch',
  moon: 'rocket-launch', space: 'rocket-launch', sky: 'rocket-launch',
  start: 'rocket-launch', begin: 'rocket-launch', kick: 'rocket-launch',
  fire: 'fire-blaze', hot: 'fire-blaze', burn: 'fire-blaze',
  flame: 'fire-blaze', heat: 'fire-blaze', lit: 'fire-blaze',
  passion: 'fire-blaze', intense: 'fire-blaze', trending: 'fire-blaze',
  attract: 'magnet-attract', pull: 'magnet-attract', draw: 'magnet-attract',
  earth: 'globe', world: 'globe', global: 'globe',
  country: 'globe', international: 'globe', planet: 'globe',
  travel: 'globe', worldwide: 'globe',
  tree: 'nature-tree', nature: 'nature-tree', forest: 'nature-tree',
  green: 'nature-tree', environment: 'nature-tree',
  ocean: 'water-wave', water: 'water-wave', sea: 'water-wave',
  wave: 'water-wave', flow: 'water-wave', river: 'water-wave',
  mountain: 'mountain-peak', climb: 'mountain-peak', summit: 'mountain-peak',
  peak: 'mountain-peak', challenge: 'mountain-peak', overcome: 'mountain-peak',
  journey: 'mountain-peak', adventure: 'mountain-peak', effort: 'mountain-peak',
  sun: 'solar-system', star: 'solar-system', universe: 'solar-system',
  galaxy: 'solar-system', cosmic: 'solar-system',
  city: 'city-skyline', urban: 'city-skyline', downtown: 'city-skyline',
  building: 'city-skyline', skyline: 'city-skyline',
  love: 'heartbeat', heart: 'heartbeat', feel: 'heartbeat',
  care: 'heartbeat', emotion: 'heartbeat', life: 'heartbeat',
  health: 'heartbeat', dream: 'heartbeat',
  protect: 'shield-protect', safe: 'shield-protect', security: 'shield-protect',
  guard: 'shield-protect', defense: 'shield-protect', trust: 'shield-protect',
  walk: 'person-walking', step: 'person-walking', move: 'person-walking',
  run: 'person-walking', exercise: 'person-walking', fitness: 'person-walking',
  time: 'clock-time', hour: 'clock-time', minute: 'clock-time',
  schedule: 'clock-time', deadline: 'clock-time', wait: 'clock-time',
  today: 'clock-time', tomorrow: 'clock-time', years: 'clock-time',
  music: 'music-notes', song: 'music-notes', sound: 'music-notes',
  listen: 'music-notes', audio: 'music-notes', podcast: 'music-notes',
  book: 'book-reading', read: 'book-reading', study: 'book-reading',
  education: 'book-reading', course: 'book-reading', teach: 'book-reading',
  video: 'camera', photo: 'camera', film: 'camera',
  record: 'camera', content: 'camera', create: 'camera',
  food: 'cooking', eat: 'cooking', recipe: 'cooking',
  cook: 'cooking', meal: 'cooking', kitchen: 'cooking',
};

const ALL_SCENES = [
  'solar-system', 'growth-chart', 'globe', 'rocket-launch', 'brain-idea',
  'connections', 'clock-time', 'heartbeat', 'money-flow', 'lightning',
  'shopping-cart', 'cooking', 'nature-tree', 'city-skyline', 'person-walking',
  'celebration', 'music-notes', 'book-reading', 'camera', 'code-terminal',
  'fire-blaze', 'water-wave', 'shield-protect', 'target-bullseye',
  'explosion-burst', 'magnet-attract', 'gear-system', 'energy-pulse',
  'eye-vision', 'arrow-growth', 'checkmark-success', 'diamond-gem',
  'crown-royal', 'atom-science', 'mountain-peak',
];

/**
 * Score-based scene picker for agent-edit local fallback.
 */
function pickBestSceneForTextAgent(text: string, lastScene?: string): { scene: string; score: number } | null {
  const lower = text.toLowerCase();
  const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length >= 2);
  const SKIP_GENERIC = new Set([
    'guys', 'everybody', 'hello', 'welcome', 'right', 'true', 'real',
    'tell', 'happen', 'finally', 'literally', 'actually', 'basically',
    'definitely', 'probably', 'going', 'different', 'new', 'old', 'next',
    'first', 'help', 'need', 'absolutely', 'exactly', 'because', 'why',
    'question', 'answer', 'explain', 'reason', 'story', 'follow', 'free',
  ]);

  const sceneScores: Record<string, number> = {};
  for (const word of words) {
    if (SKIP_GENERIC.has(word)) continue;
    const scene = SCENE_MAP[word];
    if (scene) {
      sceneScores[scene] = (sceneScores[scene] || 0) + 1;
    }
  }

  if (Object.keys(sceneScores).length === 0) return null;

  const sorted = Object.entries(sceneScores).sort((a, b) => b[1] - a[1]);
  const bestScore = sorted[0][1];
  const topScenes = sorted.filter(([, score]) => score === bestScore).map(([scene]) => scene);
  const chosen = topScenes.find(s => s !== lastScene) || topScenes[0];

  return { scene: chosen, score: bestScore };
}

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
  let lastUsedScene = '';
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

    // Add overlays to selected segments — ONLY visual-illustration for keyword matches
    if (overlayIndices.has(i)) {
      const bestScene = pickBestSceneForTextAgent(seg.text, lastUsedScene);

      if (bestScene) {
          const contentHash = Math.abs(seg.text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
          const color = OVERLAY_COLORS[contentHash % OVERLAY_COLORS.length];
          lastUsedScene = bestScene.scene;
          segment.overlay = {
              type: 'visual-illustration',
              props: {
                  scene: bestScene.scene,
                  label: extractKeyPhrase(seg.text),
                  color,
                  transition: 'fade-in',
              },
          };

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
      // No keyword match = NO overlay (no generic fallbacks)
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