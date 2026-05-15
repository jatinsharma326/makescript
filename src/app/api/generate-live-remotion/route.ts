import { NextRequest, NextResponse } from 'next/server';

const CROF_API = process.env.CROF_API_URL || 'https://crof.ai/v2/chat/completions';
const CROF_API_KEY = process.env.CROF_API_KEY || '';
const CROF_MODEL = process.env.CROF_MODEL || 'kimi-k2.6-precision';
const CROF_TIMEOUT_MS = 45000;

interface MotionReactRequest {
  text: string;
  mood?: string;
  topic?: string;
  color?: string;
  label?: string;
  durationInSeconds?: number;
  fullTranscript?: string;
  title?: string;
}

export const maxDuration = 60;

function shortLabel(text: string): string {
  const words = text
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 3);
  return words.join(' ') || 'AI GRAPHIC';
}

function motionGraphicPlan(text: string, topic = 'general', mood = 'energetic', label = ''): string {
  const lower = text.toLowerCase();
  const concepts: Array<[string[], string]> = [
    [['rocket', 'launch', 'liftoff', 'space', 'nasa'], 'launch-energy HUD with countdown digits, velocity bars, orbital paths, star-node fields, exhaust-like particle trails, but no single rocket object as the main subject'],
    [['money', 'dollar', 'billion', 'million', 'profit', 'revenue', 'economy'], 'finance analytics board with animated bars, trend line, percentage counters, coin-like data discs, transaction particles'],
    [['brain', 'think', 'mind', 'idea', 'neural', 'ai', 'intelligence'], 'AI neural network with pulsing nodes, synapse lines, scanning rings, data packets, glowing core'],
    [['code', 'software', 'program', 'tech', 'digital', 'data', 'computer'], 'tech interface with terminal panels, code fragments, circuit traces, blinking cursors, data nodes'],
    [['growth', 'grow', 'rise', 'increase', 'scale', 'expand'], 'growth dashboard with rising chart, expanding rings, milestone dots, momentum streaks'],
    [['war', 'battle', 'danger', 'warning', 'alert', 'crisis'], 'tactical alert HUD with radar sweep, reticles, red status panels, scanning borders, glitch lines'],
    [['heart', 'love', 'life', 'health'], 'bio-signal display with EKG waveform, pulse rings, vital-stat panels, soft glowing nodes'],
    [['music', 'song', 'audio', 'sound', 'frequency'], 'audio-reactive graphic with waveform bars, frequency rings, beat pulses, equalizer dots'],
    [['world', 'earth', 'global', 'planet', 'travel'], 'global network map with orbit rings, connected route lines, pulsing location nodes, data labels'],
    [['fast', 'quick', 'speed', 'velocity'], 'speed system with meter arcs, streak lines, acceleration ticks, frame-slice panels'],
  ];

  const matched = concepts.find(([keywords]) => keywords.some((keyword) => lower.includes(keyword)));
  const visualConcept = matched?.[1] || `abstract AI motion graphic for ${topic}: orbiting particles, gradient rings, connected nodes, scan lines, waveform paths, kinetic typography`;

  return [
    `Current segment: "${text.substring(0, 180)}"`,
    `Hero label: "${label || shortLabel(text)}"`,
    `Mood: ${mood}`,
    `Topic: ${topic}`,
    `Visual concept: ${visualConcept}`,
  ].join('\n');
}

function cleanAiCode(aiResponse: string): string {
  let code = aiResponse
    .replace(/```(?:javascript|jsx|js|typescript|tsx)?\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  const firstImportIndex = code.indexOf('import ');
  if (firstImportIndex > 0) code = code.substring(firstImportIndex);

  code = code.replace(/:\s*React\.FC\b(<[^>]*>)?/g, '');
  code = code.replace(/:\s*React\.CSSProperties/g, '');
  code = code.replace(/:\s*\{\s*\w+:\s*\w+[^}]*\}\s*(?=\)|\s*=>)/g, '');

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

  const lastImportIndex = code.lastIndexOf('import ');
  if (lastImportIndex !== -1) {
    const endOfLastImport = code.indexOf(';', lastImportIndex);
    const insertPos = endOfLastImport !== -1 ? endOfLastImport + 1 : code.indexOf('\n', lastImportIndex);
    code = insertPos !== -1
      ? code.slice(0, insertPos) + '\n' + safeInterpolateHelper + code.slice(insertPos)
      : safeInterpolateHelper + '\n' + code;
  } else {
    code = safeInterpolateHelper + '\n' + code;
  }

  let inHelper = false;
  let helperBraceCount = 0;
  code = code.split('\n').map((line) => {
    if (line.includes('const safeInterpolate')) {
      inHelper = true;
      helperBraceCount = 0;
    }
    if (inHelper) {
      helperBraceCount += (line.match(/\{/g) || []).length;
      helperBraceCount -= (line.match(/\}/g) || []).length;
      if (helperBraceCount <= 0 && line.includes('};')) inHelper = false;
      return line;
    }
    return line.includes('interpolate(') && !line.includes('safeInterpolate')
      ? line.replace(/\binterpolate\(/g, 'safeInterpolate(')
      : line;
  }).join('\n');

  const hasFocusMode = code.includes('const FocusMode');
  const hasLiveGraphic = code.includes('const LiveGraphic');
  const hasExportDefault = code.includes('export default');

  if (hasFocusMode && !hasExportDefault) {
    if (!code.includes('export const FocusMode')) code = code.replace('const FocusMode', 'export const FocusMode');
    code += '\n\nexport default FocusMode;';
  } else if (hasLiveGraphic && !hasExportDefault) {
    if (!code.includes('export const LiveGraphic')) code = code.replace('const LiveGraphic', 'export const LiveGraphic');
    code += '\n\nexport default LiveGraphic;';
  } else if (!hasExportDefault) {
    const componentMatch = code.match(/const\s+(\w+)\s*=\s*\(/);
    if (componentMatch) code += `\n\nexport default ${componentMatch[1]};`;
  }

  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MotionReactRequest;
    const {
      text,
      mood = 'energetic',
      topic = 'general',
      color = '#6366f1',
      label = '',
      durationInSeconds = 2,
      fullTranscript = '',
      title = '',
    } = body;

    if (!text) {
      return NextResponse.json({ reactCode: '', success: false, error: 'No text provided' });
    }

    if (!CROF_API_KEY) {
      console.error('[GenerateLiveRemotion] CROF_API_KEY is not set');
      return NextResponse.json({ reactCode: '', success: false, error: 'CROF_API_KEY not configured' });
    }

    const plan = motionGraphicPlan(text, topic, mood, label);
    const contextTranscript = fullTranscript.substring(0, 900);

    const systemPrompt = `You are an expert Remotion motion designer. Generate premium AI MOTION GRAPHICS, not literal cartoon illustrations.

STYLE RULES:
- The result must look like a modern broadcast HUD / data visualization / kinetic graphic overlay.
- Build at least 5 animated visual systems: particles, rings, bars, paths, labels, scan lines, icons, waveforms, counters, or nodes.
- Do not create one simple object moving around. If the segment mentions rocket/launch, do NOT just draw a rocket moving upward.
- Use SVG shapes, gradients, filters, masks, text, and animation math. Avoid clip-art.
- The video underneath must remain visible, so use transparent or semi-transparent backgrounds only.

TITLE: ${title || 'Video'}
CURRENT SEGMENT: ${text}
FULL TRANSCRIPT CONTEXT: ${contextTranscript}
MOOD: ${mood}
TOPIC: ${topic}
PRIMARY COLOR: ${color}

MOTION GRAPHIC PLAN:
${plan}

TECHNICAL RULES:
- Component name: FocusMode
- Use: AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate from "remotion"
- Canvas: 1080x1920 vertical
- Duration: exactly ${durationInSeconds} seconds at 30fps
- Do NOT use TypeScript annotations
- Do NOT import React separately
- Export: export const FocusMode = () => { ... }; export default FocusMode;
- Return ONLY raw JavaScript code, no markdown, no explanations
- Code must start with: import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";`;

    const userPrompt = `Create the Remotion component now. Make it a layered AI motion graphic based on the current segment, not a literal illustration. Return only raw JavaScript code.`;

    console.log(`[GenerateLiveRemotion] Calling ${CROF_MODEL} for ${durationInSeconds}s motion graphic`);
    console.log(`[GenerateLiveRemotion] Plan:\n${plan}`);

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
        temperature: 0.85,
        max_tokens: 8192,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`API failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    if (!aiResponse || aiResponse.trim().length < 50) throw new Error('AI response is empty or too short');

    const code = cleanAiCode(aiResponse);
    const hasImport = code.includes('import');
    const hasExport = code.includes('export default') || code.includes('export const');
    const hasAbsoluteFill = code.includes('AbsoluteFill');
    const hasUseCurrentFrame = code.includes('useCurrentFrame');
    const hasSvg = code.includes('<svg') || code.includes('<circle') || code.includes('<rect') || code.includes('<path') || code.includes('<polygon');

    if (!hasImport || !hasExport || !hasAbsoluteFill || !hasUseCurrentFrame || !hasSvg) {
      throw new Error(`Invalid motion code: import=${hasImport}, export=${hasExport}, AbsoluteFill=${hasAbsoluteFill}, useCurrentFrame=${hasUseCurrentFrame}, svg=${hasSvg}`);
    }

    return NextResponse.json({
      reactCode: code,
      success: true,
      codeLength: code.length,
      hasSvg,
      source: CROF_MODEL,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[GenerateLiveRemotion] Error: ${msg}`);
    return NextResponse.json({ reactCode: '', success: false, error: msg }, { status: 500 });
  }
}
