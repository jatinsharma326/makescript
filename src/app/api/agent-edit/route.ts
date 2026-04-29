import { NextRequest, NextResponse } from 'next/server';
import { getApiEndpoint, getApiKey, getCustomApiConfig, CUSTOM_APIS } from '@/lib/apiKeys';
import { getUserSubscription, getModelForTier } from '@/lib/subscription';

// ═══════════════════════════════════════════════════════════════
//  /api/agent-edit — Agentic Editing Plan Generator
//  Single LLM call → complete editing plan like a pro video editor
// ═══════════════════════════════════════════════════════════════

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

const SYSTEM_PROMPT = `You are a world-class professional video editor with 15 years of experience editing for top YouTube creators, Netflix documentaries, and TikTok viral content. You are given a video's full transcript with timestamps. Your job is to create a COMPLETE editing plan that turns a raw talking-head video into a polished, engaging final cut.

THINK LIKE A PROFESSIONAL EDITOR:
- Watch the pacing — identify natural topic changes, emphasis points, and dead air
- Add visual variety — don't let any 15-second stretch go without something interesting
- Use overlays SELECTIVELY (40-60% of segments, NOT every one)
- Vary overlay types across the video — mix kinetic-text, visual-illustration, ai-generated-image, gif-reaction, emoji-reaction
- Add transitions ONLY at major topic shifts (not between every segment)
- Use zoom effects sparingly for emphasis moments (stats, key claims, reveals)
- Identify filler segments to speed up (ums, repeated phrases, dead air)
- Choose a color grade that matches the video's overall mood

AVAILABLE OVERLAY TYPES (use these exact type names):
- "kinetic-text" — animated text pop-in. Props: { "text": "KEY PHRASE", "color": "#hex", "style": "pop"|"slide"|"bounce", "position": "center"|"top"|"bottom", "fontSize": 42 }
- "ai-generated-image" — AI-generated B-roll image. Props: { "imagePrompt": "detailed visual description for image generation", "caption": "short label" }
- "gif-reaction" — contextual animated GIF. Props: { "keyword": "search term for GIF", "size": "medium"|"large"|"fullscreen", "position": "center"|"top-right"|"bottom-right" }
- "emoji-reaction" — pop-up emoji. Props: { "emoji": "🔥", "size": 70 }
- "visual-illustration" — animated SVG scene. Props: { "scene": "SCENE_NAME", "label": "optional label", "color": "#hex" }
  Available scenes: solar-system, growth-chart, globe, rocket-launch, brain-idea, connections, clock-time, heartbeat, money-flow, lightning, shopping-cart, celebration, music-notes, book-reading, camera, code-terminal, fire-blaze, water-wave, shield-protect, target-bullseye, explosion-burst, gear-system, energy-pulse, eye-vision, arrow-growth, checkmark-success, diamond-gem, crown-royal, atom-science, mountain-peak

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
- The VIDEO ANALYSIS section contains mood, energy level, color palette, per-segment sentiment/engagement, and peak moments
- USE THE COLOR PALETTE from the mood profile for kinetic-text colors, overlay accents, and to inform the colorGrade
- PUT YOUR BEST OVERLAYS on PEAK MOMENT segments — these are the highest-impact moments the audience will remember
- MATCH THE ENERGY: high energy (7-10) = more zoom effects, dynamic overlays, faster pacing. Low energy (1-4) = subtle ken-burns, minimal overlays, calm visual-illustrations
- SPEED UP segments flagged as filler/pause in suggested cuts
- For HOOK segments, use attention-grabbing overlays (kinetic-text with bold style, zoom-in effects)
- Match imagePrompt visual tone to the mood: dark/dramatic mood = moody cinematic lighting, energetic mood = bright vibrant scenes, calm mood = soft natural scenes

RULES:
1. Overlay 40-60% of segments — leave breathing room
2. Never overlay consecutive segments — always have at least 1 gap
3. Use transitions only 3-6 times in a typical 2-minute video
4. Effects should cover 20-30% of segments
5. Speed up filler segments (ums, pauses, repetitive content) with speedFactor 1.3-2.0
6. Do NOT cut segments unless they are completely empty/silence
7. PREFER colors from the mood palette when provided — fall back to: #6366f1, #8b5cf6, #06b6d4, #10b981, #f59e0b, #ef4444, #ec4899, #3b82f6
8. imagePrompt should be vivid and specific — describe the EXACT scene you want generated, matching the video's mood and visual tone

Return a SINGLE JSON object (no markdown, no explanation, just valid JSON):
{
  "editingPlan": {
    "mood": "energetic",
    "colorGrade": { "brightness": 105, "contrast": 110, "saturation": 115, "temperature": 3 },
    "segments": [
      {
        "segmentId": "seg_0",
        "action": "keep",
        "overlay": { "type": "kinetic-text", "props": { "text": "WELCOME", "color": "#6366f1", "style": "pop", "position": "center", "fontSize": 42 } },
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

    // Determine which model/provider to use
    const sub = await getUserSubscription();
    const activeModel = model || getModelForTier(sub.tier);

    console.log('[AgentEdit] Generating editing plan with model:', activeModel);
    console.log('[AgentEdit] Transcript has', subtitles.length, 'segments,', videoDuration.toFixed(1), 's');

    // Try the AI call
    const result = await callLLM(activeModel, SYSTEM_PROMPT, userPrompt);

    if (!result) {
      console.warn('[AgentEdit] LLM returned no result, using local fallback');
      const fallbackPlan = generateLocalEditingPlan(subtitles, videoDuration);
      return NextResponse.json({ ok: true, editingPlan: fallbackPlan, source: 'local' });
    }

    // Parse the JSON response
    try {
      let jsonStr = result;
      // Strip markdown code fencing if present
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);
      const plan = parsed.editingPlan || parsed;

      // Validate the plan structure
      if (!plan.segments || !Array.isArray(plan.segments)) {
        console.warn('[AgentEdit] Invalid plan structure, using local fallback');
        const fallbackPlan = generateLocalEditingPlan(subtitles, videoDuration);
        return NextResponse.json({ ok: true, editingPlan: fallbackPlan, source: 'local' });
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

      console.log('[AgentEdit] Success! Plan has', plan.segments.length, 'segment edits, mood:', plan.mood);
      return NextResponse.json({ ok: true, editingPlan: plan, source: 'ai' });
    } catch (parseError) {
      console.error('[AgentEdit] JSON parse error:', parseError);
      console.error('[AgentEdit] Raw response:', result.substring(0, 500));
      const fallbackPlan = generateLocalEditingPlan(subtitles, videoDuration);
      return NextResponse.json({ ok: true, editingPlan: fallbackPlan, source: 'local' });
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

async function callLLM(
  modelId: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  // Check for custom API first
  const customApi = getCustomApiConfig(modelId) || CUSTOM_APIS.find(api => api.model === modelId);

  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;

  if (customApi) {
    // Custom API (ModelScope, etc.)
    url = customApi.baseUrl;
    if (!url.includes('/chat/completions')) {
      url = url.endsWith('/') ? `${url}chat/completions` : `${url}/chat/completions`;
    }
    headers = { 'Content-Type': 'application/json' };
    if (customApi.authHeader && customApi.apiKey) {
      const authValue = customApi.authPrefix ? `${customApi.authPrefix} ${customApi.apiKey}` : customApi.apiKey;
      headers[customApi.authHeader] = authValue;
    }
    body = {
      model: customApi.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 8192,
      temperature: 0.7,
    };
  } else {
    // Determine provider
    let provider = 'lightning';
    if (modelId.startsWith('anthropic/')) provider = 'anthropic';
    else if (modelId.startsWith('openai/')) provider = 'openai';
    else if (modelId.startsWith('google/')) provider = 'google';
    else if (modelId.startsWith('deepseek/') || modelId === 'lightning-ai/DeepSeek-V3.1') provider = 'deepseek';

    const apiEndpoint = getApiEndpoint(provider);
    const apiKey = getApiKey(provider);

    if (!apiKey) {
      console.warn('[AgentEdit] No API key for provider:', provider);
      return null;
    }

    if (provider === 'anthropic') {
      const modelName = modelId.replace('anthropic/', '');
      url = apiEndpoint;
      headers = {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      };
      body = {
        model: modelName,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      };
    } else {
      url = apiEndpoint;
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: [{ type: 'text', text: userPrompt }] },
        ],
        max_tokens: 8192,
      };
    }
  }

  try {
    console.log('[AgentEdit] Calling LLM at:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AgentEdit] LLM error:', response.status, errorText.substring(0, 200));
      return null;
    }

    const data = await response.json();
    return extractContent(data);
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

      const hasVisualNoun = words.some(w => [
          'money', 'rocket', 'brain', 'fire', 'ocean', 'mountain', 'city',
          'star', 'earth', 'code', 'heart', 'clock', 'tree', 'food',
      ].includes(w));
      const hasEmotionWord = words.some(w => [
          'love', 'happy', 'amazing', 'incredible', 'awesome', 'fire', 'lit',
          'crazy', 'insane', 'wow', 'excited', 'cool', 'funny',
      ].includes(w));
      const hasNumbers = /\$[\d,.]+|\d+%|\d{3,}/.test(seg.text);
      const isQuestion = seg.text.includes('?');
      const textLen = seg.text.length;
      const hasStrongSceneKeyword = words.some(w => {
          const SCENE_KEYWORDS = new Set([
              'money', 'revenue', 'profit', 'growth', 'success', 'rocket', 'brain',
              'code', 'science', 'power', 'energy', 'fire', 'earth', 'world',
              'mountain', 'ocean', 'celebrate', 'love', 'protect', 'invest',
              'market', 'stock', 'launch', 'explode', 'scale', 'secret',
              'ai', 'data', 'cloud', 'digital', 'algorithm', 'machine', 'network',
          ]);
          return SCENE_KEYWORDS.has(w);
      });

      // Determine display mode: fullscreen for maximum impact
      const displayMode = (contentHash % 5 === 0) ? 'card' : 'fullscreen';

      let chosenType: 'ai-generated-image' | 'kinetic-text' | 'gif-reaction' | 'emoji-reaction' | 'visual-illustration';

      // HEAVILY favor AI-generated images (most eye-catching type)
      if (hasNumbers || hasVisualNoun || textLen > 30 || hasStrongSceneKeyword) {
          chosenType = 'ai-generated-image';
      } else if (hasEmotionWord && !hasNumbers) {
          chosenType = (contentHash % 3 === 0) ? 'gif-reaction' : 'ai-generated-image';
      } else if (isQuestion) {
          chosenType = 'ai-generated-image';
      } else {
          const pick = contentHash % 20;
          if (pick < 14) chosenType = 'ai-generated-image';
          else if (pick < 17) chosenType = 'visual-illustration';
          else if (pick < 19) chosenType = 'gif-reaction';
          else chosenType = 'emoji-reaction';
      }

      if (chosenType === 'ai-generated-image') {
        // AI-generated image — most impactful, fullscreen B-roll
        const keyPhrase = extractKeyPhrase(seg.text);
        segment.overlay = {
          type: 'ai-generated-image',
          props: {
            imagePrompt: `${seg.text.substring(0, 120)}, cinematic lighting, hyperrealistic, professional color grading, 8k, high detail`,
            caption: keyPhrase,
            displayMode,
          },
        };
      } else if (chosenType === 'gif-reaction') {
        // GIF reaction
        segment.overlay = {
          type: 'gif-reaction',
          props: {
            keyword: seg.text.substring(0, 60),
            size: 'large',
            position: 'center',
          },
        };
      } else if (chosenType === 'visual-illustration') {
        // Visual illustration (animated SVG)
        const sceneKeys = Object.keys(SCENE_MAP);
        let sceneName = 'globe';
        for (const w of words) {
          if (SCENE_MAP[w]) { sceneName = SCENE_MAP[w]; break; }
        }
        if (sceneName === 'globe') {
          // random fallback if no match
          sceneName = SCENE_MAP[sceneKeys[contentHash % sceneKeys.length]];
        }
        
        segment.overlay = {
          type: 'visual-illustration',
          props: {
            scene: sceneName,
            label: extractKeyPhrase(seg.text),
            color,
            transition: 'fade-in',
          },
        };
      } else {
        // Emoji
        let emoji = '🔥';
        for (const w of words) {
          if (EMOJI_MAP[w]) { emoji = EMOJI_MAP[w]; break; }
        }
        segment.overlay = {
          type: 'emoji-reaction',
          props: { emoji, size: 70 },
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
