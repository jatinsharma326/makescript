// ═══════════════════════════════════════════════════════════════════════
//  AGENTIC EDITING ORCHESTRATOR
//  Multi-stage intelligent video editing — no human needed
// ═══════════════════════════════════════════════════════════════════════

import {
  SubtitleSegment,
  EditingPlan,
  EditingPlanSegment,
  SegmentEffect,
  SegmentTransition,
  VideoFilters,
} from './types';

// ═══════════════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface AgenticEditResult {
  originalDuration: number;
  newDuration: number;
  segmentsRemoved: number;
  segmentsSpedUp: number;
  overlaysAdded: number;
  effectsAdded: number;
  transitionsAdded: number;
  colorGrade: Partial<VideoFilters>;
  subtitles: SubtitleSegment[];
  plan: EditingPlan;
}

export interface AgenticOptions {
  editingStyle?: 'youtube' | 'tiktok' | 'documentary' | 'cinematic' | 'viral' | 'auto';
  aggressiveness?: 'gentle' | 'moderate' | 'aggressive'; // How much to cut
  autoApply?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
//  STAGE 1: SCRIPT ANALYZER — Deep content understanding
// ═══════════════════════════════════════════════════════════════════════

interface SegmentAnalysis {
  segmentId: string;
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
  wordCount: number;
  wpm: number; // words per minute
  sentiment: 'excited' | 'positive' | 'serious' | 'humorous' | 'negative' | 'neutral';
  sentimentIntensity: number;
  isHook: boolean;
  isPeakMoment: boolean;
  isFiller: boolean;
  isDeadAir: boolean;
  isRambling: boolean;
  isRepeated: boolean;
  engagementScore: number; // 0-100
  topicCluster: number; // which topic group this belongs to
  hasStats: boolean;
  hasQuestion: boolean;
  hasCTA: boolean;
}

// Emotion keyword map with intensity
const EMOTION_MAP: Record<string, { sentiment: SegmentAnalysis['sentiment']; weight: number }> = {
  amazing: { sentiment: 'excited', weight: 0.9 },
  incredible: { sentiment: 'excited', weight: 0.9 },
  awesome: { sentiment: 'excited', weight: 0.85 },
  fantastic: { sentiment: 'excited', weight: 0.85 },
  'mind-blowing': { sentiment: 'excited', weight: 0.95 },
  unbelievable: { sentiment: 'excited', weight: 0.9 },
  'game-changer': { sentiment: 'excited', weight: 0.9 },
  revolutionary: { sentiment: 'excited', weight: 0.85 },
  explosive: { sentiment: 'excited', weight: 0.8 },
  fire: { sentiment: 'excited', weight: 0.85 },
  lit: { sentiment: 'excited', weight: 0.8 },
  insane: { sentiment: 'excited', weight: 0.85 },
  crazy: { sentiment: 'excited', weight: 0.75 },
  wow: { sentiment: 'excited', weight: 0.8 },
  boom: { sentiment: 'excited', weight: 0.85 },
  great: { sentiment: 'positive', weight: 0.6 },
  good: { sentiment: 'positive', weight: 0.5 },
  nice: { sentiment: 'positive', weight: 0.45 },
  love: { sentiment: 'positive', weight: 0.8 },
  happy: { sentiment: 'positive', weight: 0.7 },
  excited: { sentiment: 'excited', weight: 0.75 },
  success: { sentiment: 'positive', weight: 0.7 },
  win: { sentiment: 'positive', weight: 0.75 },
  best: { sentiment: 'positive', weight: 0.7 },
  perfect: { sentiment: 'positive', weight: 0.75 },
  beautiful: { sentiment: 'positive', weight: 0.65 },
  brilliant: { sentiment: 'positive', weight: 0.7 },
  excellent: { sentiment: 'positive', weight: 0.7 },
  important: { sentiment: 'serious', weight: 0.6 },
  critical: { sentiment: 'serious', weight: 0.75 },
  essential: { sentiment: 'serious', weight: 0.65 },
  serious: { sentiment: 'serious', weight: 0.6 },
  crucial: { sentiment: 'serious', weight: 0.7 },
  vital: { sentiment: 'serious', weight: 0.65 },
  key: { sentiment: 'serious', weight: 0.5 },
  secret: { sentiment: 'serious', weight: 0.55 },
  truth: { sentiment: 'serious', weight: 0.6 },
  fact: { sentiment: 'serious', weight: 0.45 },
  proof: { sentiment: 'serious', weight: 0.6 },
  evidence: { sentiment: 'serious', weight: 0.55 },
  research: { sentiment: 'serious', weight: 0.5 },
  study: { sentiment: 'serious', weight: 0.45 },
  data: { sentiment: 'serious', weight: 0.4 },
  funny: { sentiment: 'humorous', weight: 0.7 },
  hilarious: { sentiment: 'humorous', weight: 0.85 },
  joke: { sentiment: 'humorous', weight: 0.6 },
  lol: { sentiment: 'humorous', weight: 0.7 },
  laugh: { sentiment: 'humorous', weight: 0.65 },
  comedy: { sentiment: 'humorous', weight: 0.6 },
  silly: { sentiment: 'humorous', weight: 0.5 },
  ridiculous: { sentiment: 'humorous', weight: 0.6 },
  bad: { sentiment: 'negative', weight: 0.5 },
  terrible: { sentiment: 'negative', weight: 0.8 },
  awful: { sentiment: 'negative', weight: 0.75 },
  worst: { sentiment: 'negative', weight: 0.85 },
  horrible: { sentiment: 'negative', weight: 0.8 },
  disappointing: { sentiment: 'negative', weight: 0.65 },
  fail: { sentiment: 'negative', weight: 0.7 },
  failure: { sentiment: 'negative', weight: 0.7 },
  wrong: { sentiment: 'negative', weight: 0.55 },
  mistake: { sentiment: 'negative', weight: 0.6 },
  problem: { sentiment: 'negative', weight: 0.55 },
  issue: { sentiment: 'negative', weight: 0.45 },
  difficult: { sentiment: 'negative', weight: 0.5 },
  hard: { sentiment: 'negative', weight: 0.45 },
  struggle: { sentiment: 'negative', weight: 0.55 },
};

const FILLER_WORDS = new Set([
  'um', 'uh', 'umm', 'uhh', 'er', 'err', 'ah', 'ahh', 'like', 'you know',
  'kind of', 'sort of', 'basically', 'literally', 'actually', 'so', 'okay',
  'right', 'yeah', 'well', 'anyway', 'honestly', 'seriously', 'obviously',
  'i mean', 'let me just say', 'long story short',
]);

const HOOK_PHRASES = [
  'what if', "here's the thing", 'the truth is', 'nobody talks about',
  'this is why', 'the secret to', 'how i', 'why you should', 'stop doing',
  'you need to', 'the problem is', 'most people', 'the real reason',
  "here's how", 'this changed', 'game changer', 'mind-blowing',
  'unbelievable', "you won't believe", 'shocking', 'the truth about',
  'secret', 'hidden', 'nobody knows', 'forbidden', 'banned',
  'revealed', 'exposed', 'leaked', 'ultimate', 'best',
  'top', 'number one', '1st', 'first time', 'never before',
];

const CTA_PHRASES = [
  'subscribe', 'follow', 'like', 'comment', 'share', 'click',
  'download', 'sign up', 'join', 'buy', 'get', 'try',
  'check out', 'link below', 'click the link', 'tap here',
];

const DEAD_AIR_THRESHOLD = 0.6; // seconds — segments shorter than this with few words = dead air
const RAMBLE_WPM_THRESHOLD = 80; // wpm below this in long segments = rambling
const RAMBLE_DURATION_THRESHOLD = 4.0; // seconds

function analyzeScript(subtitles: SubtitleSegment[]): SegmentAnalysis[] {
  const analyses: SegmentAnalysis[] = [];
  const texts = subtitles.map(s => s.text.toLowerCase());

  for (let i = 0; i < subtitles.length; i++) {
    const seg = subtitles[i];
    const text = seg.text;
    const lower = text.toLowerCase();
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    const duration = seg.endTime - seg.startTime;
    const wordCount = words.length;
    const wpm = duration > 0 ? (wordCount / duration) * 60 : 0;

    // Sentiment analysis
    let maxWeight = 0;
    let detectedSentiment: SegmentAnalysis['sentiment'] = 'neutral';
    for (const word of words) {
      if (EMOTION_MAP[word]) {
        const em = EMOTION_MAP[word];
        if (em.weight > maxWeight) {
          maxWeight = em.weight;
          detectedSentiment = em.sentiment;
        }
      }
    }
    // Check for exclamation (excitement)
    if (maxWeight < 0.3 && text.includes('!')) {
      detectedSentiment = 'excited';
      maxWeight = 0.5;
    }
    // Check for question (serious/informative)
    if (maxWeight < 0.3 && text.includes('?')) {
      detectedSentiment = 'serious';
      maxWeight = 0.4;
    }

    // Is hook?
    const isHook = HOOK_PHRASES.some(h => lower.includes(h)) || i < 3;

    // Has stats?
    const hasStats = /\$[\d,.]+|\d+%|\d{3,}|\d+x/.test(text);

    // Has question?
    const hasQuestion = text.includes('?');

    // Has CTA?
    const hasCTA = CTA_PHRASES.some(c => lower.includes(c));

    // Filler detection
    const fillerCount = words.filter(w => FILLER_WORDS.has(w)).length;
    const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;
    const isFiller = fillerRatio > 0.4 || (wordCount <= 2 && duration < DEAD_AIR_THRESHOLD);

    // Dead air detection
    const isDeadAir = wordCount <= 1 && duration < DEAD_AIR_THRESHOLD;

    // Rambling detection (slow speech, lots of filler words, long segment)
    const isRambling =
      duration > RAMBLE_DURATION_THRESHOLD &&
      wpm < RAMBLE_WPM_THRESHOLD &&
      fillerRatio > 0.2;

    // Repeated phrase detection
    let isRepeated = false;
    if (i > 0) {
      const prevText = texts[i - 1];
      const similarity = textSimilarity(lower, prevText);
      if (similarity > 0.6) isRepeated = true;
    }

    // Engagement scoring
    let engagement = 30;
    if (isHook) engagement += 25;
    if (hasStats) engagement += 20;
    if (hasQuestion) engagement += 15;
    if (hasCTA) engagement += 10;
    engagement += maxWeight * 15;
    if (i < 3) engagement += 10; // First segments matter
    if (i >= subtitles.length - 2) engagement += 5; // End matters
    engagement = Math.min(100, Math.max(0, engagement));

    analyses.push({
      segmentId: seg.id,
      text,
      startTime: seg.startTime,
      endTime: seg.endTime,
      duration,
      wordCount,
      wpm,
      sentiment: detectedSentiment,
      sentimentIntensity: maxWeight,
      isHook,
      isPeakMoment: engagement >= 65,
      isFiller,
      isDeadAir,
      isRambling,
      isRepeated,
      engagementScore: engagement,
      topicCluster: 0, // Will be set by topic clustering
      hasStats,
      hasQuestion,
      hasCTA,
    });
  }

  // Topic clustering — group similar segments
  const clusters = clusterTopics(analyses);
  for (let i = 0; i < analyses.length; i++) {
    analyses[i].topicCluster = clusters[i];
  }

  return analyses;
}

// Simple text similarity using word overlap
function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  return intersection.size / Math.max(wordsA.size, wordsB.size);
}

// Simple topic clustering
function clusterTopics(analyses: SegmentAnalysis[]): number[] {
  const clusters: number[] = [];
  let currentCluster = 0;
  clusters.push(currentCluster);

  for (let i = 1; i < analyses.length; i++) {
    const sim = textSimilarity(analyses[i].text.toLowerCase(), analyses[i - 1].text.toLowerCase());
    if (sim < 0.2) {
      // Topic shift detected
      currentCluster++;
    }
    clusters.push(currentCluster);
  }

  return clusters;
}

// ═══════════════════════════════════════════════════════════════════════
//  STAGE 2: CUT AGENT — Decide what to remove entirely
// ═══════════════════════════════════════════════════════════════════════

interface CutDecision {
  segmentId: string;
  shouldCut: boolean;
  reason: string;
  confidence: number; // 0-1
}

function runCutAgent(analyses: SegmentAnalysis[], aggressiveness: AgenticOptions['aggressiveness']): CutDecision[] {
  const aggressivenessMultiplier =
    aggressiveness === 'aggressive' ? 1.3 :
    aggressiveness === 'gentle' ? 0.6 : 1.0;

  const decisions: CutDecision[] = [];

  for (const a of analyses) {
    let cutScore = 0;
    let reasons: string[] = [];

    // Dead air — almost always cut
    if (a.isDeadAir) {
      cutScore += 0.95;
      reasons.push('Dead air/silence');
    }

    // Pure filler
    if (a.isFiller && a.wordCount <= 3) {
      cutScore += 0.9;
      reasons.push('Filler words');
    }

    // Rambling
    if (a.isRambling) {
      cutScore += 0.7;
      reasons.push('Rambling/low energy');
    }

    // Repeated content
    if (a.isRepeated) {
      cutScore += 0.6;
      reasons.push('Repeated phrase');
    }

    // Very low engagement segments in the middle
    if (a.engagementScore < 20 && !a.isHook && a.duration > 1.0) {
      cutScore += 0.5;
      reasons.push('Low engagement');
    }

    // End-of-video CTAs that drag on (skip redundant "like and subscribe" filler)
    const isEndCTA = a.hasCTA && a.engagementScore < 35;
    if (isEndCTA) {
      cutScore += 0.4;
      reasons.push('Weak CTA');
    }

    // Apply aggressiveness
    cutScore *= aggressivenessMultiplier;
    cutScore = Math.min(1, cutScore);

    const shouldCut = cutScore >= 0.5;

    decisions.push({
      segmentId: a.segmentId,
      shouldCut,
      reason: reasons.join(', ') || (shouldCut ? 'Low value segment' : 'Keep'),
      confidence: cutScore,
    });
  }

  // Don't cut too much — keep at least 60% of the video
  const totalDuration = analyses.reduce((sum, a) => sum + a.duration, 0);
  const cutDuration = decisions
    .filter((d, i) => d.shouldCut)
    .reduce((sum, d) => sum + analyses.find(a => a.segmentId === d.segmentId)!.duration, 0);

  if (cutDuration > totalDuration * 0.4) {
    // Too aggressive — restore some cuts, starting with lowest confidence
    const sortedCuts = decisions
      .map((d, i) => ({ ...d, idx: i }))
      .filter(d => d.shouldCut)
      .sort((a, b) => a.confidence - b.confidence);

    let restoredDuration = 0;
    for (const cut of sortedCuts) {
      if (cutDuration - restoredDuration <= totalDuration * 0.35) break;
      decisions[cut.idx].shouldCut = false;
      restoredDuration += analyses[cut.idx].duration;
    }
  }

  return decisions;
}

// ═══════════════════════════════════════════════════════════════════════
//  STAGE 3: PACING AGENT — Speed up boring parts, emphasize peaks
// ═══════════════════════════════════════════════════════════════════════

interface PacingDecision {
  segmentId: string;
  speedFactor: number; // 1 = normal, >1 = faster, <1 = slower
  reason: string;
}

function runPacingAgent(
  analyses: SegmentAnalysis[],
  cutDecisions: CutDecision[],
  style: AgenticOptions['editingStyle']
): PacingDecision[] {
  const decisions: PacingDecision[] = [];

  const styleSpeeds = {
    youtube: { base: 1.0, fast: 1.4, slow: 0.85 },
    tiktok: { base: 1.1, fast: 1.6, slow: 0.8 },
    documentary: { base: 1.0, fast: 1.2, slow: 0.9 },
    cinematic: { base: 1.0, fast: 1.15, slow: 0.95 },
    viral: { base: 1.15, fast: 1.5, slow: 0.8 },
    auto: { base: 1.0, fast: 1.4, slow: 0.85 },
  };

  const speeds = styleSpeeds[style || 'auto'];

  for (const a of analyses) {
    const isCut = cutDecisions.find(d => d.segmentId === a.segmentId)?.shouldCut;
    if (isCut) {
      decisions.push({ segmentId: a.segmentId, speedFactor: 1, reason: 'Will be cut' });
      continue;
    }

    let speed = speeds.base;
    let reasons: string[] = [];

    // Speed up filler-heavy but not-cut segments
    if (a.isFiller && a.wordCount > 3) {
      speed = Math.max(speed, speeds.fast * 0.9);
      reasons.push('Filler content');
    }

    // Speed up low-engagement explanation/tutorial segments
    if (a.engagementScore < 35 && a.duration > 3 && !a.isPeakMoment) {
      speed = Math.max(speed, speeds.fast * 0.85);
      reasons.push('Low engagement section');
    }

    // Slow down peak moments for emphasis
    if (a.isPeakMoment && a.hasStats) {
      speed = Math.min(speed, speeds.slow);
      reasons.push('Key stats moment — slow for emphasis');
    }

    // Slow down hooks (opening)
    if (a.isHook && a.startTime < 10) {
      speed = Math.min(speed, speeds.slow);
      reasons.push('Opening hook');
    }

    // Slow down emotional/excited peaks
    if (a.sentiment === 'excited' && a.sentimentIntensity > 0.7) {
      speed = Math.min(speed, speeds.slow);
      reasons.push('High energy moment');
    }

    // Round to reasonable values
    speed = Math.round(speed * 10) / 10;
    speed = Math.max(0.5, Math.min(3.0, speed));

    decisions.push({
      segmentId: a.segmentId,
      speedFactor: speed,
      reason: reasons.join(', ') || 'Normal pacing',
    });
  }

  return decisions;
}

// ═══════════════════════════════════════════════════════════════════════
//  STAGE 4: VISUAL AGENT — Overlays, effects, transitions
// ═══════════════════════════════════════════════════════════════════════

interface VisualDecision {
  segmentId: string;
  overlay?: EditingPlanSegment['overlay'];
  effect?: SegmentEffect | null;
  transition?: SegmentTransition | null;
}

const OVERLAY_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

const SCENE_MAP: Record<string, string> = {
  money: 'money-flow', revenue: 'money-flow', profit: 'money-flow', growth: 'arrow-growth',
  brain: 'brain-idea', code: 'code-terminal', tech: 'code-terminal',
  world: 'globe', earth: 'globe', rocket: 'rocket-launch', launch: 'rocket-launch',
  fire: 'fire-blaze', power: 'energy-pulse', celebrate: 'celebration',
  goal: 'target-bullseye', love: 'heartbeat', time: 'clock-time',
  protect: 'shield-protect', mountain: 'mountain-peak', ocean: 'water-wave',
};

const EMOJI_MAP: Record<string, string> = {
  fire: '🔥', money: '💰', rocket: '🚀', brain: '🧠', love: '❤️',
  success: '✅', growth: '📈', star: '⭐', power: '⚡', celebrate: '🎉',
  goal: '🎯', idea: '💡', win: '🏆', code: '💻', world: '🌍',
};

function extractKeyPhrase(text: string): string {
  const STOP_WORDS = new Set([
    'about', 'above', 'after', 'again', 'all', 'also', 'and', 'any', 'are', 'as',
    'at', 'be', 'been', 'being', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
    'doing', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'here', 'him', 'his',
    'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'me', 'more', 'most',
    'my', 'no', 'nor', 'not', 'now', 'of', 'on', 'or', 'our', 'out', 'over', 'own',
    'she', 'so', 'some', 'than', 'that', 'the', 'their', 'them', 'then', 'there',
    'these', 'they', 'this', 'to', 'too', 'very', 'was', 'we', 'were', 'what', 'when',
    'where', 'which', 'while', 'who', 'will', 'with', 'would', 'you', 'your',
  ]);

  // Try numbers/stats first
  const numberPatterns = text.match(/\$[\d,.]+[MBKmk]?|\d+[%x×]|\d{2,}[+]?/g);
  if (numberPatterns && numberPatterns.length >= 1) {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));
    const prefix = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Key';
    return `${prefix}: ${numberPatterns[0]}`;
  }

  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  if (words.length === 0) return text.substring(0, 20);
  return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function runVisualAgent(
  analyses: SegmentAnalysis[],
  cutDecisions: CutDecision[],
  pacingDecisions: PacingDecision[],
  style: AgenticOptions['editingStyle']
): VisualDecision[] {
  const decisions: VisualDecision[] = [];

  // Determine which segments get overlays
  const nonCutAnalyses = analyses.filter(a => !cutDecisions.find(d => d.segmentId === a.segmentId)?.shouldCut);
  const maxOverlays = Math.max(3, Math.floor(nonCutAnalyses.length * 0.5));

  // Score segments for visual treatment
  const scored = nonCutAnalyses.map(a => ({
    ...a,
    visualScore: a.engagementScore + (a.hasStats ? 15 : 0) + (a.isPeakMoment ? 20 : 0),
  })).sort((a, b) => b.visualScore - a.visualScore);

  const overlayIds = new Set(scored.slice(0, maxOverlays).map(s => s.segmentId));

  // Determine transition points (topic changes that aren't cut)
  const transitionIds = new Set<string>();
  const maxTransitions = Math.min(6, Math.floor(nonCutAnalyses.length / 4));
  let transitionCount = 0;

  for (let i = 1; i < analyses.length && transitionCount < maxTransitions; i++) {
    const prev = analyses[i - 1];
    const curr = analyses[i];

    // Skip if either is cut
    const prevCut = cutDecisions.find(d => d.segmentId === prev.segmentId)?.shouldCut;
    const currCut = cutDecisions.find(d => d.segmentId === curr.segmentId)?.shouldCut;
    if (prevCut || currCut) continue;

    // Topic change
    if (curr.topicCluster !== prev.topicCluster) {
      transitionIds.add(curr.segmentId);
      transitionCount++;
    }
  }

  let overlayCount = 0;

  for (const a of analyses) {
    const isCut = cutDecisions.find(d => d.segmentId === a.segmentId)?.shouldCut;
    if (isCut) {
      decisions.push({ segmentId: a.segmentId });
      continue;
    }

    const decision: VisualDecision = { segmentId: a.segmentId };

    // Overlay
    if (overlayIds.has(a.segmentId)) {
      const color = OVERLAY_COLORS[overlayCount % OVERLAY_COLORS.length];
      const slot = overlayCount % 10;

      switch (slot) {
        case 0:
        case 3:
        case 6: {
          // AI-generated image B-roll
          const keyPhrase = extractKeyPhrase(a.text);
          decision.overlay = {
            type: 'ai-generated-image',
            props: {
              imagePrompt: `${a.text.substring(0, 120)}, cinematic, professional, high quality`,
              caption: keyPhrase,
            },
          };
          break;
        }
        case 1:
        case 4:
        case 7: {
          // Dynamic B-roll — animated motion graphic driven by transcript
          decision.overlay = {
            type: 'dynamic-broll',
            props: {
              keywords: a.text.substring(0, 60),
              color,
              style: 'abstract',
            },
          };
          break;
        }
        case 2:
        case 5: {
          // Visual illustration (animated SVG scene)
          const words = a.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
          let scene = 'globe';
          for (const w of words) {
            if (SCENE_MAP[w]) { scene = SCENE_MAP[w]; break; }
          }
          decision.overlay = {
            type: 'visual-illustration',
            props: {
              scene,
              label: extractKeyPhrase(a.text),
              color,
              transition: 'fade-in',
            },
          };
          break;
        }
        case 8: {
          // GIF reaction
          decision.overlay = {
            type: 'gif-reaction',
            props: {
              keyword: a.text.substring(0, 60),
              size: 'large',
              position: 'center',
            },
          };
          break;
        }
        default: {
          // Emoji
          const words = a.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
          let emoji = '🔥';
          for (const w of words) {
            if (EMOJI_MAP[w]) { emoji = EMOJI_MAP[w]; break; }
          }
          decision.overlay = {
            type: 'emoji-reaction',
            props: { emoji, size: 70 },
          };
        }
      }

      // Effect for peak moments (zoom/ken-burns/shake)
      if (a.isPeakMoment || a.hasStats) {
        const effects: Array<{ type: SegmentEffect['type']; intensity: number; direction?: string }> = [
          { type: 'zoom-in', intensity: 1.25 },
          { type: 'ken-burns', intensity: 1.15, direction: 'left' },
          { type: 'zoom-in', intensity: 1.2 },
          { type: 'shake', intensity: 0.6 },
        ];
        const fx = effects[overlayCount % effects.length];
        decision.effect = {
          type: fx.type,
          intensity: fx.intensity,
          ...(fx.direction ? { direction: fx.direction } : {}),
        };
      }

      overlayCount++;
    }

    // Transition
    if (transitionIds.has(a.segmentId)) {
      const types: SegmentTransition['type'][] = ['fade', 'wipe', 'slide-left', 'zoom', 'slide-right', 'glitch'];
      decision.transition = {
        type: types[transitionCount % types.length],
        duration: style === 'tiktok' || style === 'viral' ? 0.25 : 0.5,
      };
      transitionCount++;
    }

    decisions.push(decision);
  }

  return decisions;
}

// ═══════════════════════════════════════════════════════════════════════
//  STAGE 5: COLOR GRADE AGENT — Match mood to content
// ═══════════════════════════════════════════════════════════════════════

function runColorGradeAgent(analyses: SegmentAnalysis[]): Partial<VideoFilters> {
  const sentiments = analyses.map(a => a.sentiment);
  const excitedCount = sentiments.filter(s => s === 'excited').length;
  const seriousCount = sentiments.filter(s => s === 'serious').length;
  const negativeCount = sentiments.filter(s => s === 'negative').length;
  const total = sentiments.length;

  if (total === 0) return {};

  const excitedRatio = excitedCount / total;
  const seriousRatio = seriousCount / total;
  const negativeRatio = negativeCount / total;

  let grade: Partial<VideoFilters> = {};

  if (excitedRatio > 0.3) {
    // Energetic/Viral — punchy, saturated
    grade = {
      brightness: 105,
      contrast: 115,
      saturation: 120,
      temperature: 5,
    };
  } else if (seriousRatio > 0.3) {
    // Informative/Documentary — clean, slightly cool
    grade = {
      brightness: 102,
      contrast: 108,
      saturation: 95,
      temperature: -3,
    };
  } else if (negativeRatio > 0.2) {
    // Emotional/Dramatic — desaturated, moody
    grade = {
      brightness: 98,
      contrast: 112,
      saturation: 85,
      temperature: 2,
    };
  } else {
    // Balanced
    grade = {
      brightness: 103,
      contrast: 110,
      saturation: 110,
      temperature: 2,
    };
  }

  return grade;
}

// ═══════════════════════════════════════════════════════════════════════
//  ORCHESTRATOR — Merge all agent decisions into final output
// ═══════════════════════════════════════════════════════════════════════

export function runAgenticEdit(
  subtitles: SubtitleSegment[],
  videoDuration: number,
  options: AgenticOptions = {}
): AgenticEditResult {
  const { editingStyle = 'auto', aggressiveness = 'moderate' } = options;

  console.log('[AgenticEdit] Starting pipeline...');
  console.log(`[AgenticEdit] Style: ${editingStyle}, Aggressiveness: ${aggressiveness}`);
  console.log(`[AgenticEdit] Input: ${subtitles.length} segments, ${videoDuration.toFixed(1)}s`);

  // Stage 1: Analyze
  const analyses = analyzeScript(subtitles);
  console.log(`[AgenticEdit] Analysis complete: ${analyses.filter(a => a.isPeakMoment).length} peaks, ${analyses.filter(a => a.isFiller).length} filler`);

  // Stage 2: Cut
  const cutDecisions = runCutAgent(analyses, aggressiveness);
  const segmentsToCut = cutDecisions.filter(d => d.shouldCut);
  console.log(`[AgenticEdit] Cut Agent: ${segmentsToCut.length} segments to remove`);

  // Stage 3: Pacing
  const pacingDecisions = runPacingAgent(analyses, cutDecisions, editingStyle);
  const spedSegments = pacingDecisions.filter(p => p.speedFactor !== 1);
  console.log(`[AgenticEdit] Pacing Agent: ${spedSegments.length} segments with speed changes`);

  // Stage 4: Visual
  const visualDecisions = runVisualAgent(analyses, cutDecisions, pacingDecisions, editingStyle);
  const withOverlays = visualDecisions.filter(v => v.overlay);
  const withEffects = visualDecisions.filter(v => v.effect);
  const withTransitions = visualDecisions.filter(v => v.transition);
  console.log(`[AgenticEdit] Visual Agent: ${withOverlays.length} overlays, ${withEffects.length} effects, ${withTransitions.length} transitions`);

  // Stage 5: Color
  const colorGrade = runColorGradeAgent(analyses);
  console.log(`[AgenticEdit] Color grade:`, colorGrade);

  // Build the filtered subtitle list (removing cut segments)
  const keptSubtitles: SubtitleSegment[] = [];
  const cutIds = new Set(segmentsToCut.map(d => d.segmentId));

  for (const seg of subtitles) {
    if (cutIds.has(seg.id)) continue;

    const visual = visualDecisions.find(v => v.segmentId === seg.id);
    const pacing = pacingDecisions.find(p => p.segmentId === seg.id);

    const updated: SubtitleSegment = { ...seg };

    if (visual?.overlay) {
      updated.overlay = {
        type: visual.overlay.type as SubtitleSegment['overlay'] extends undefined ? never : NonNullable<SubtitleSegment['overlay']>['type'],
        props: visual.overlay.props || {},
      };

      // Generate image URL for ai-generated-image overlays
      if (visual.overlay.type === 'ai-generated-image') {
        const prompt = String(visual.overlay.props?.imagePrompt || seg.text);
        const seed = Math.abs(seg.text.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)) % 1000000;
        updated.overlay.props = {
          ...updated.overlay.props,
          imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}, cinematic, professional`)}?width=1280&height=720&nologo=true&seed=${seed}`,
          caption: String(visual.overlay.props?.caption || extractKeyPhrase(seg.text)),
          seed,
          imagePrompt: prompt,
        };
      }
    }

    if (visual?.effect) {
      updated.effect = visual.effect;
    }

    if (visual?.transition) {
      updated.transition = visual.transition;
    }

    if (pacing && pacing.speedFactor !== 1) {
      updated.speedFactor = pacing.speedFactor;
    }

    keptSubtitles.push(updated);
  }

  // Recalculate timestamps after cuts and speed changes
  const recalculated = recalculateTimestamps(keptSubtitles);

  // Build editing plan for reference
  const planSegments: EditingPlanSegment[] = [];
  for (const seg of recalculated) {
    const original = subtitles.find(s => s.id === seg.id);
    if (!original) continue;

    planSegments.push({
      segmentId: seg.id,
      action: 'keep',
      speedFactor: seg.speedFactor,
      overlay: seg.overlay || null,
      effect: seg.effect || null,
      transition: seg.transition || null,
    });
  }

  const newDuration = recalculated.length > 0
    ? recalculated[recalculated.length - 1].endTime
    : 0;

  const plan: EditingPlan = {
    mood: editingStyle === 'viral' || editingStyle === 'tiktok' ? 'energetic' :
          editingStyle === 'documentary' ? 'calm' : 'entertaining',
    colorGrade,
    segments: planSegments,
  };

  const result: AgenticEditResult = {
    originalDuration: videoDuration,
    newDuration,
    segmentsRemoved: segmentsToCut.length,
    segmentsSpedUp: spedSegments.length,
    overlaysAdded: withOverlays.length,
    effectsAdded: withEffects.length,
    transitionsAdded: withTransitions.length,
    colorGrade,
    subtitles: recalculated,
    plan,
  };

  console.log(`[AgenticEdit] Complete! Removed ${result.segmentsRemoved} segments, added ${result.overlaysAdded} overlays`);
  console.log(`[AgenticEdit] Duration: ${result.originalDuration.toFixed(1)}s → ${result.newDuration.toFixed(1)}s`);

  return result;
}

/**
 * Recalculate timestamps after cuts and speed changes.
 * This ensures segments flow continuously without gaps.
 */
function recalculateTimestamps(subtitles: SubtitleSegment[]): SubtitleSegment[] {
  if (subtitles.length === 0) return [];

  let currentTime = subtitles[0].startTime;
  const result: SubtitleSegment[] = [];

  for (const seg of subtitles) {
    const originalDuration = seg.endTime - seg.startTime;
    const speed = seg.speedFactor || 1;
    const adjustedDuration = originalDuration / speed;

    const updated: SubtitleSegment = {
      ...seg,
      startTime: currentTime,
      endTime: currentTime + adjustedDuration,
    };

    result.push(updated);
    currentTime += adjustedDuration;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
//  API WRAPPER — Server-side route can call this
// ═══════════════════════════════════════════════════════════════════════

export async function generateAgenticEditingPlan(
  subtitles: SubtitleSegment[],
  videoDuration: number,
  options: AgenticOptions = {}
): Promise<AgenticEditResult> {
  return runAgenticEdit(subtitles, videoDuration, options);
}
