// AI-powered video analysis module
// Provides advanced ML features: sentiment analysis, engagement scoring, hook detection, smart cuts, thumbnail detection

import { SubtitleSegment } from './types';

// ==================== TYPES ====================

export interface SentimentResult {
    segmentId: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'excited' | 'serious' | 'humorous';
    confidence: number;
    intensity: number; // 0-1, how strong the emotion is
}

export interface EngagementScore {
    segmentId: string;
    score: number; // 0-100
    factors: {
        hasHook: boolean;
        hasQuestion: boolean;
        hasNumber: boolean;
        hasCallToAction: boolean;
        emotionalIntensity: number;
        keywordDensity: number;
    };
    isPeakMoment: boolean;
}

export interface SmartCutPoint {
    segmentId: string;
    type: 'filler' | 'pause' | 'repetition' | 'breath' | 'transition';
    confidence: number;
    suggestedAction: 'cut' | 'trim' | 'keep' | 'emphasize';
    reason: string;
}

export interface ThumbnailCandidate {
    segmentId: string;
    timestamp: number;
    score: number; // 0-100
    reasons: string[];
    textOnScreen: string;
}

export interface VideoAnalysisResult {
    overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    averageEngagement: number;
    peakMoments: SubtitleSegment[];
    hookSegments: SubtitleSegment[];
    suggestedCuts: SmartCutPoint[];
    thumbnailCandidates: ThumbnailCandidate[];
    moodProfile: MoodProfile;
    recommendedMusicGenre: string[];
}

export interface MoodProfile {
    primary: 'energetic' | 'calm' | 'dramatic' | 'informative' | 'entertaining' | 'emotional';
    secondary: string[];
    energyLevel: number; // 0-10
    tempo: 'fast' | 'medium' | 'slow';
    colorPalette: string[]; // hex colors that match the mood
}

// ==================== SENTIMENT ANALYSIS ====================

// Emotion keywords with intensity weights
const EMOTION_KEYWORDS: Record<string, { sentiment: SentimentResult['sentiment']; intensity: number }> = {
    // High intensity positive/excited
    'amazing': { sentiment: 'excited', intensity: 0.9 },
    'incredible': { sentiment: 'excited', intensity: 0.9 },
    'awesome': { sentiment: 'excited', intensity: 0.85 },
    'fantastic': { sentiment: 'excited', intensity: 0.85 },
    'mind-blowing': { sentiment: 'excited', intensity: 0.95 },
    'unbelievable': { sentiment: 'excited', intensity: 0.9 },
    'game-changer': { sentiment: 'excited', intensity: 0.9 },
    'revolutionary': { sentiment: 'excited', intensity: 0.85 },
    'explosive': { sentiment: 'excited', intensity: 0.8 },
    'fire': { sentiment: 'excited', intensity: 0.85 },
    'lit': { sentiment: 'excited', intensity: 0.8 },
    'insane': { sentiment: 'excited', intensity: 0.85 },
    'crazy': { sentiment: 'excited', intensity: 0.75 },
    'wow': { sentiment: 'excited', intensity: 0.8 },
    'boom': { sentiment: 'excited', intensity: 0.85 },
    
    // Moderate positive
    'great': { sentiment: 'positive', intensity: 0.6 },
    'good': { sentiment: 'positive', intensity: 0.5 },
    'nice': { sentiment: 'positive', intensity: 0.45 },
    'love': { sentiment: 'positive', intensity: 0.8 },
    'happy': { sentiment: 'positive', intensity: 0.7 },
    'excited': { sentiment: 'excited', intensity: 0.75 },
    'success': { sentiment: 'positive', intensity: 0.7 },
    'win': { sentiment: 'positive', intensity: 0.75 },
    'best': { sentiment: 'positive', intensity: 0.7 },
    'perfect': { sentiment: 'positive', intensity: 0.75 },
    'beautiful': { sentiment: 'positive', intensity: 0.65 },
    'brilliant': { sentiment: 'positive', intensity: 0.7 },
    'excellent': { sentiment: 'positive', intensity: 0.7 },
    
    // Serious/informative
    'important': { sentiment: 'serious', intensity: 0.6 },
    'critical': { sentiment: 'serious', intensity: 0.75 },
    'essential': { sentiment: 'serious', intensity: 0.65 },
    'serious': { sentiment: 'serious', intensity: 0.6 },
    'crucial': { sentiment: 'serious', intensity: 0.7 },
    'vital': { sentiment: 'serious', intensity: 0.65 },
    'key': { sentiment: 'serious', intensity: 0.5 },
    'secret': { sentiment: 'serious', intensity: 0.55 },
    'truth': { sentiment: 'serious', intensity: 0.6 },
    'fact': { sentiment: 'serious', intensity: 0.45 },
    'proof': { sentiment: 'serious', intensity: 0.6 },
    'evidence': { sentiment: 'serious', intensity: 0.55 },
    'research': { sentiment: 'serious', intensity: 0.5 },
    'study': { sentiment: 'serious', intensity: 0.45 },
    'data': { sentiment: 'serious', intensity: 0.4 },
    
    // Humorous
    'funny': { sentiment: 'humorous', intensity: 0.7 },
    'hilarious': { sentiment: 'humorous', intensity: 0.85 },
    'joke': { sentiment: 'humorous', intensity: 0.6 },
    'lol': { sentiment: 'humorous', intensity: 0.7 },
    'laugh': { sentiment: 'humorous', intensity: 0.65 },
    'comedy': { sentiment: 'humorous', intensity: 0.6 },
    'silly': { sentiment: 'humorous', intensity: 0.5 },
    'ridiculous': { sentiment: 'humorous', intensity: 0.6 },
    
    // Negative
    'bad': { sentiment: 'negative', intensity: 0.5 },
    'terrible': { sentiment: 'negative', intensity: 0.8 },
    'awful': { sentiment: 'negative', intensity: 0.75 },
    'worst': { sentiment: 'negative', intensity: 0.85 },
    'horrible': { sentiment: 'negative', intensity: 0.8 },
    'disappointing': { sentiment: 'negative', intensity: 0.65 },
    'fail': { sentiment: 'negative', intensity: 0.7 },
    'failure': { sentiment: 'negative', intensity: 0.7 },
    'wrong': { sentiment: 'negative', intensity: 0.55 },
    'mistake': { sentiment: 'negative', intensity: 0.6 },
    'problem': { sentiment: 'negative', intensity: 0.55 },
    'issue': { sentiment: 'negative', intensity: 0.45 },
    'difficult': { sentiment: 'negative', intensity: 0.5 },
    'hard': { sentiment: 'negative', intensity: 0.45 },
    'struggle': { sentiment: 'negative', intensity: 0.55 },
};

// Context modifiers that amplify or dampen sentiment
const CONTEXT_MODIFIERS: Record<string, number> = {
    'very': 1.3,
    'really': 1.25,
    'extremely': 1.5,
    'absolutely': 1.4,
    'totally': 1.3,
    'completely': 1.35,
    'so': 1.2,
    'super': 1.3,
    'kind of': 0.7,
    'sort of': 0.7,
    'somewhat': 0.75,
    'a bit': 0.65,
    'little': 0.6,
    'maybe': 0.5,
    'possibly': 0.55,
};

/**
 * Analyze sentiment of a text segment using keyword matching and context modifiers
 */
export function analyzeSentiment(text: string): SentimentResult {
    const lower = text.toLowerCase();
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/);
    
    let detectedSentiment: SentimentResult['sentiment'] = 'neutral';
    let maxIntensity = 0;
    let confidence = 0.3;
    let matchedKeywords = 0;
    
    // Check for emotion keywords
    for (const word of words) {
        if (EMOTION_KEYWORDS[word]) {
            const emotion = EMOTION_KEYWORDS[word];
            matchedKeywords++;
            
            // Apply context modifiers
            let adjustedIntensity = emotion.intensity;
            
            // Look for modifiers before this word
            const wordIndex = words.indexOf(word);
            if (wordIndex > 0) {
                const prevWord = words[wordIndex - 1];
                if (CONTEXT_MODIFIERS[prevWord]) {
                    adjustedIntensity *= CONTEXT_MODIFIERS[prevWord];
                }
                // Check for two-word modifiers
                if (wordIndex > 1) {
                    const twoWordModifier = `${words[wordIndex - 2]} ${prevWord}`;
                    if (CONTEXT_MODIFIERS[twoWordModifier]) {
                        adjustedIntensity *= CONTEXT_MODIFIERS[twoWordModifier];
                    }
                }
            }
            
            // Keep the highest intensity emotion
            if (adjustedIntensity > maxIntensity) {
                maxIntensity = Math.min(1, adjustedIntensity);
                detectedSentiment = emotion.sentiment;
            }
        }
    }
    
    // Calculate confidence based on number of matches and intensity
    if (matchedKeywords > 0) {
        confidence = 0.3 + (matchedKeywords * 0.15) + (maxIntensity * 0.25);
        confidence = Math.min(0.95, confidence);
    }
    
    // Check for punctuation that affects sentiment
    if (text.includes('!') || text.includes('!!!')) {
        maxIntensity = Math.min(1, maxIntensity + 0.15);
        if (detectedSentiment === 'neutral') detectedSentiment = 'excited';
    }
    
    if (text.includes('?')) {
        // Questions are often informative/serious
        if (detectedSentiment === 'neutral') detectedSentiment = 'serious';
    }
    
    return {
        segmentId: '', // Will be filled by caller
        sentiment: detectedSentiment,
        confidence,
        intensity: maxIntensity,
    };
}

/**
 * Analyze sentiment across all segments
 */
export function analyzeAllSentiments(subtitles: SubtitleSegment[]): SentimentResult[] {
    return subtitles.map(seg => {
        const result = analyzeSentiment(seg.text);
        result.segmentId = seg.id;
        return result;
    });
}

// ==================== ENGAGEMENT SCORING ====================

// Hook phrases that capture attention
const HOOK_PHRASES = [
    'what if', 'imagine', 'here\'s the thing', 'the truth is', 'nobody talks about',
    'this is why', 'the secret to', 'how i', 'why you should', 'stop doing',
    'you need to', 'the problem is', 'most people', 'the real reason',
    'here\'s how', 'this changed', 'game changer', 'mind-blowing',
    'unbelievable', 'you won\'t believe', 'shocking', 'the truth about',
    'secret', 'hidden', 'nobody knows', 'forbidden', 'banned',
    'revealed', 'exposed', 'leaked', 'ultimate', 'best',
    'top', 'number one', '1st', 'first time', 'never before',
];

// Call-to-action phrases
const CTA_PHRASES = [
    'subscribe', 'follow', 'like', 'comment', 'share', 'click',
    'download', 'sign up', 'join', 'buy', 'get', 'try',
    'check out', 'link below', 'click the link', 'tap here',
];

// High-value keywords that boost engagement
const HIGH_VALUE_KEYWORDS = new Set([
    'money', 'profit', 'income', 'revenue', 'million', 'billion', 'thousand',
    'growth', 'success', 'win', 'achieve', 'result', 'proof', 'evidence',
    'secret', 'hack', 'tip', 'trick', 'strategy', 'method', 'formula',
    'free', 'bonus', 'gift', 'discount', 'save', 'deal', 'offer',
    'new', 'latest', 'update', 'breaking', 'news', 'announcement',
    'exclusive', 'limited', 'rare', 'special', 'unique', 'only',
    'fast', 'quick', 'instant', 'immediate', 'now', 'today',
    'step by step', 'tutorial', 'guide', 'how to', 'learn',
]);

/**
 * Calculate engagement score for a segment
 */
export function calculateEngagementScore(segment: SubtitleSegment, sentiment: SentimentResult): EngagementScore {
    const text = segment.text.toLowerCase();
    const words = text.replace(/[^a-z\s]/g, '').split(/\s+/);
    
    // Check for hooks
    const hasHook = HOOK_PHRASES.some(hook => text.includes(hook));
    
    // Check for questions
    const hasQuestion = text.includes('?');
    
    // Check for numbers/stats (high engagement drivers)
    const hasNumber = /\$[\d,.]+|\d+%|\d{3,}|\d+x/.test(text);
    
    // Check for call-to-action
    const hasCallToAction = CTA_PHRASES.some(cta => text.includes(cta));
    
    // Calculate keyword density
    const highValueMatches = words.filter(w => HIGH_VALUE_KEYWORDS.has(w)).length;
    const keywordDensity = Math.min(1, highValueMatches / Math.max(1, words.length) * 5);
    
    // Emotional intensity from sentiment
    const emotionalIntensity = sentiment.intensity;
    
    // Calculate base score
    let score = 30; // Base score
    
    // Hook bonus (biggest engagement driver)
    if (hasHook) score += 25;
    
    // Number/stat bonus
    if (hasNumber) score += 20;
    
    // Question bonus (creates curiosity)
    if (hasQuestion) score += 15;
    
    // CTA bonus
    if (hasCallToAction) score += 10;
    
    // Emotional intensity bonus
    score += emotionalIntensity * 15;
    
    // Keyword density bonus
    score += keywordDensity * 10;
    
    // Position bonus - first and last segments are more important
    // (Caller can adjust based on position)
    
    // Cap at 100
    score = Math.min(100, Math.max(0, score));
    
    return {
        segmentId: segment.id,
        score,
        factors: {
            hasHook,
            hasQuestion,
            hasNumber,
            hasCallToAction,
            emotionalIntensity,
            keywordDensity,
        },
        isPeakMoment: false, // Will be determined by analyzeFullVideo
    };
}

/**
 * Calculate engagement scores for all segments
 */
export function calculateAllEngagementScores(subtitles: SubtitleSegment[]): EngagementScore[] {
    const sentiments = analyzeAllSentiments(subtitles);
    return subtitles.map((seg, index) => {
        const score = calculateEngagementScore(seg, sentiments[index]);
        
        // Position bonus: first 3 segments and last 2 get extra points
        if (index < 3) {
            score.score = Math.min(100, score.score + 10);
        }
        if (index >= subtitles.length - 2) {
            score.score = Math.min(100, score.score + 5);
        }
        
        return score;
    });
}

// ==================== SMART CUT DETECTION ====================

// Filler words and phrases that can be cut
const FILLER_WORDS = new Set([
    'um', 'uh', 'umm', 'uhh', 'er', 'err', 'ah', 'ahh',
    'like', 'you know', 'kind of', 'sort of', 'basically',
    'literally', 'actually', 'so', 'okay', 'right', 'yeah',
    'well', 'anyway', 'honestly', 'seriously', 'obviously',
    'i mean', 'let me just say', 'long story short',
]);

// Transition phrases that may be redundant
const TRANSITION_PHRASES = [
    'moving on', 'next up', 'now let\'s', 'let\'s talk about',
    'another thing', 'one more thing', 'so next', 'okay so',
    'alright', 'anyway', 'back to', 'as i mentioned',
];

// Repetition indicators
const REPETITION_INDICATORS = [
    'i said', 'i mentioned', 'as i said', 'like i said',
    'again', 'once again', 'to repeat', 'repeating',
];

/**
 * Detect smart cut points in segments
 */
export function detectSmartCutPoints(subtitles: SubtitleSegment[]): SmartCutPoint[] {
    const cutPoints: SmartCutPoint[] = [];
    
    for (const seg of subtitles) {
        const text = seg.text.toLowerCase().trim();
        const words = text.replace(/[^a-z\s]/g, '').split(/\s+/);
        
        // Check for filler words
        const fillerMatches = words.filter(w => FILLER_WORDS.has(w));
        if (fillerMatches.length > 0) {
            const fillerRatio = fillerMatches.length / words.length;
            if (fillerRatio > 0.3) {
                cutPoints.push({
                    segmentId: seg.id,
                    type: 'filler',
                    confidence: Math.min(0.95, 0.5 + fillerRatio),
                    suggestedAction: fillerRatio > 0.5 ? 'cut' : 'trim',
                    reason: `Contains ${fillerMatches.length} filler words: "${fillerMatches.slice(0, 3).join(', ')}"`,
                });
            }
        }
        
        // Check for transition phrases that may be skippable
        for (const transition of TRANSITION_PHRASES) {
            if (text.includes(transition)) {
                cutPoints.push({
                    segmentId: seg.id,
                    type: 'transition',
                    confidence: 0.7,
                    suggestedAction: 'trim',
                    reason: `Contains transition phrase: "${transition}"`,
                });
                break;
            }
        }
        
        // Check for short segments that might be breaths/pauses
        if (words.length <= 2 && text.length < 10) {
            const duration = seg.endTime - seg.startTime;
            if (duration < 0.5) {
                cutPoints.push({
                    segmentId: seg.id,
                    type: 'breath',
                    confidence: 0.85,
                    suggestedAction: 'cut',
                    reason: 'Very short segment, likely a breath or pause',
                });
            }
        }
        
        // Check for repetition
        for (const indicator of REPETITION_INDICATORS) {
            if (text.includes(indicator)) {
                cutPoints.push({
                    segmentId: seg.id,
                    type: 'repetition',
                    confidence: 0.6,
                    suggestedAction: 'trim',
                    reason: `Possible repetition: "${indicator}"`,
                });
                break;
            }
        }
        
        // Check for empty or near-empty segments
        if (text.trim().length < 3) {
            cutPoints.push({
                segmentId: seg.id,
                type: 'pause',
                confidence: 0.9,
                suggestedAction: 'cut',
                reason: 'Empty or near-empty segment (silence)',
            });
        }
    }
    
    return cutPoints;
}

// ==================== THUMBNAIL DETECTION ====================

/**
 * Find best thumbnail candidates from segments
 */
export function detectThumbnailCandidates(subtitles: SubtitleSegment[], engagementScores: EngagementScore[]): ThumbnailCandidate[] {
    const candidates: ThumbnailCandidate[] = [];
    
    // Get top engagement segments
    const topSegments = engagementScores
        .filter(s => s.score > 60)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    
    for (const scoreResult of topSegments) {
        const segment = subtitles.find(s => s.id === scoreResult.segmentId);
        if (!segment) continue;
        
        const reasons: string[] = [];
        let thumbnailScore = scoreResult.score;
        
        // Add reasons based on factors
        if (scoreResult.factors.hasHook) reasons.push('Contains hook phrase');
        if (scoreResult.factors.hasNumber) reasons.push('Has stats/numbers');
        if (scoreResult.factors.hasQuestion) reasons.push('Provokes curiosity');
        if (scoreResult.factors.emotionalIntensity > 0.7) reasons.push('High emotional moment');
        
        // Prefer shorter, punchy text for thumbnails
        const textLength = segment.text.length;
        if (textLength < 30) {
            thumbnailScore += 10;
            reasons.push('Short, punchy text');
        } else if (textLength > 80) {
            thumbnailScore -= 5;
        }
        
        // Prefer segments with clear statements
        if (segment.text.includes('!')) {
            thumbnailScore += 5;
            reasons.push('Emphatic statement');
        }
        
        // Prefer first 30% of video for thumbnails (hook territory)
        const position = subtitles.indexOf(segment) / subtitles.length;
        if (position < 0.3) {
            thumbnailScore += 15;
            reasons.push('Early hook position');
        }
        
        candidates.push({
            segmentId: segment.id,
            timestamp: segment.startTime,
            score: Math.min(100, thumbnailScore),
            reasons,
            textOnScreen: segment.text.substring(0, 50),
        });
    }
    
    // Sort by score and return top 5
    return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ==================== MOOD PROFILE ====================

// Mood mapping based on sentiment
const SENTIMENT_TO_MOOD: Record<string, MoodProfile['primary']> = {
    'excited': 'energetic',
    'positive': 'entertaining',
    'serious': 'informative',
    'humorous': 'entertaining',
    'negative': 'emotional',
    'neutral': 'calm',
};

// Music genre recommendations based on mood
const MOOD_TO_MUSIC: Record<MoodProfile['primary'], string[]> = {
    'energetic': ['upbeat pop', 'electronic dance', 'hip-hop', 'rock', 'energetic synth'],
    'calm': ['ambient', 'soft piano', 'lo-fi', 'acoustic', 'nature sounds'],
    'dramatic': ['cinematic orchestral', 'epic drums', 'dramatic strings', 'trailer music'],
    'informative': ['light corporate', 'minimal tech', 'soft background', 'documentary style'],
    'entertaining': ['fun pop', 'quirky comedy', 'upbeat indie', 'lighthearted jazz'],
    'emotional': ['emotional piano', 'sad strings', 'melancholic', 'heartfelt acoustic'],
};

// Color palettes based on mood
const MOOD_TO_COLORS: Record<MoodProfile['primary'], string[]> = {
    'energetic': ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8E53', '#6C5CE7'],
    'calm': ['#74B9FF', '#A8E6CF', '#DFE6E9', '#B8E994', '#778BEB'],
    'dramatic': ['#2C3E50', '#E74C3C', '#8E44AD', '#34495E', '#C0392B'],
    'informative': ['#3498DB', '#2ECC71', '#9B59B6', '#1ABC9C', '#34495E'],
    'entertaining': ['#F39C12', '#E91E63', '#9C27B0', '#FF9800', '#00BCD4'],
    'emotional': ['#5D4E60', '#8E7CC3', '#C8A2C8', '#B0A8B9', '#9B7E6F'],
};

/**
 * Generate mood profile from sentiment analysis
 */
export function generateMoodProfile(sentiments: SentimentResult[], subtitles: SubtitleSegment[]): MoodProfile {
    // Count sentiment occurrences
    const sentimentCounts: Record<string, number> = {};
    let totalIntensity = 0;
    
    for (const s of sentiments) {
        sentimentCounts[s.sentiment] = (sentimentCounts[s.sentiment] || 0) + 1;
        totalIntensity += s.intensity;
    }
    
    // Find dominant sentiment
    const sortedSentiments = Object.entries(sentimentCounts)
        .sort((a, b) => b[1] - a[1]);
    
    const dominantSentiment = sortedSentiments[0]?.[0] || 'neutral';
    const primary = SENTIMENT_TO_MOOD[dominantSentiment] || 'calm';
    
    // Secondary moods
    const secondary = sortedSentiments.slice(1, 3)
        .map(([s]) => SENTIMENT_TO_MOOD[s])
        .filter(Boolean) as string[];
    
    // Calculate energy level (0-10)
    const avgIntensity = sentiments.length > 0 ? totalIntensity / sentiments.length : 0;
    const energyLevel = Math.round(avgIntensity * 10);
    
    // Determine tempo based on segment density and duration
    const avgSegmentDuration = subtitles.length > 0 
        ? subtitles.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / subtitles.length 
        : 2;
    
    let tempo: MoodProfile['tempo'];
    if (avgSegmentDuration < 1.5) tempo = 'fast';
    else if (avgSegmentDuration > 3) tempo = 'slow';
    else tempo = 'medium';
    
    return {
        primary,
        secondary,
        energyLevel,
        tempo,
        colorPalette: MOOD_TO_COLORS[primary],
    };
}

// ==================== FULL VIDEO ANALYSIS ====================

/**
 * Perform comprehensive AI analysis on video transcript
 */
export function analyzeFullVideo(subtitles: SubtitleSegment[]): VideoAnalysisResult {
    if (subtitles.length === 0) {
        return {
            overallSentiment: 'neutral',
            averageEngagement: 0,
            peakMoments: [],
            hookSegments: [],
            suggestedCuts: [],
            thumbnailCandidates: [],
            moodProfile: {
                primary: 'calm',
                secondary: [],
                energyLevel: 0,
                tempo: 'medium',
                colorPalette: MOOD_TO_COLORS['calm'],
            },
            recommendedMusicGenre: MOOD_TO_MUSIC['calm'],
        };
    }
    
    // Analyze sentiments
    const sentiments = analyzeAllSentiments(subtitles);
    
    // Calculate engagement scores
    const engagementScores = calculateAllEngagementScores(subtitles);
    
    // Detect smart cut points
    const suggestedCuts = detectSmartCutPoints(subtitles);
    
    // Detect thumbnail candidates
    const thumbnailCandidates = detectThumbnailCandidates(subtitles, engagementScores);
    
    // Generate mood profile
    const moodProfile = generateMoodProfile(sentiments, subtitles);
    
    // Calculate overall sentiment
    const positiveCount = sentiments.filter(s => s.sentiment === 'positive' || s.sentiment === 'excited').length;
    const negativeCount = sentiments.filter(s => s.sentiment === 'negative').length;
    const ratio = positiveCount / (positiveCount + negativeCount + 1);
    
    let overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    if (ratio > 0.7) overallSentiment = 'positive';
    else if (ratio < 0.3) overallSentiment = 'negative';
    else if (Math.abs(positiveCount - negativeCount) < subtitles.length * 0.1) overallSentiment = 'mixed';
    else overallSentiment = 'neutral';
    
    // Calculate average engagement
    const averageEngagement = engagementScores.reduce((sum, s) => sum + s.score, 0) / engagementScores.length;
    
    // Find peak moments (segments with highest engagement)
    const peakThreshold = averageEngagement + 20;
    engagementScores.forEach(s => {
        s.isPeakMoment = s.score >= peakThreshold;
    });
    
    const peakMoments = subtitles.filter(seg => 
        engagementScores.find(s => s.segmentId === seg.id && s.isPeakMoment)
    );
    
    // Find hook segments (first 3 segments with hook phrases or high engagement)
    const hookSegments = subtitles.slice(0, Math.min(5, subtitles.length)).filter(seg => {
        const score = engagementScores.find(s => s.segmentId === seg.id);
        const text = seg.text.toLowerCase();
        return score?.factors.hasHook || HOOK_PHRASES.some(h => text.includes(h));
    });
    
    return {
        overallSentiment,
        averageEngagement,
        peakMoments,
        hookSegments,
        suggestedCuts,
        thumbnailCandidates,
        moodProfile,
        recommendedMusicGenre: MOOD_TO_MUSIC[moodProfile.primary],
    };
}

// ==================== EXPORT HELPER ====================

/**
 * Get a human-readable summary of the video analysis
 */
export function getAnalysisSummary(result: VideoAnalysisResult): string {
    const lines = [
        `📊 Video Analysis Summary`,
        ``,
        `Overall Mood: ${result.moodProfile.primary} (${result.moodProfile.energyLevel}/10 energy)`,
        `Average Engagement: ${Math.round(result.averageEngagement)}%`,
        `Peak Moments: ${result.peakMoments.length} high-engagement segments found`,
        `Hooks Detected: ${result.hookSegments.length} hook phrases`,
        `Suggested Cuts: ${result.suggestedCuts.length} filler/pause segments`,
        ``,
        `🎵 Recommended Music: ${result.recommendedMusicGenre.slice(0, 3).join(', ')}`,
        `🎨 Color Palette: ${result.moodProfile.colorPalette.slice(0, 3).join(', ')}`,
        ``,
        `🏆 Best Thumbnail Moments:`,
        ...result.thumbnailCandidates.slice(0, 3).map((t, i) => 
            `   ${i + 1}. "${t.textOnScreen}" (${t.score}% score)`
        ),
    ];
    
    return lines.join('\n');
}