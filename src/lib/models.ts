// Simplified AI Model registry — lightweight model picker

export type ModelTier = 'free' | 'creator' | 'studio';

export interface AIModel {
    id: string;
    label: string;
    provider: string;
    tier: ModelTier;
    badge?: string;
}

export interface TierInfo {
    name: string;
    price: number;
    color: string;
    description: string;
    videoLimit: number;
    highlights: string[];
}

export const TIERS: Record<ModelTier, TierInfo> = {
    free: {
        name: 'Free',
        price: 0,
        color: '#6b7280',
        description: 'Kimi AI via CROF',
        videoLimit: 10,
        highlights: ['10 videos / month', 'Kimi AI (CROF)', 'Basic motion graphics', '1080p export'],
    },
    creator: {
        name: 'Creator',
        price: 20,
        color: '#9d4edd',
        description: 'Claude Sonnet + ChatGPT',
        videoLimit: 60,
        highlights: ['60 videos / month', 'Claude Sonnet + ChatGPT', 'AI motion graphics + images', '4K export'],
    },
    studio: {
        name: 'Studio',
        price: 50,
        color: '#00f5d4',
        description: 'Claude Opus + ChatGPT Codex',
        videoLimit: Infinity,
        highlights: ['Unlimited videos', 'Claude Opus + ChatGPT Codex', 'All AI features', 'Priority support'],
    },
};

export const AI_MODELS: AIModel[] = [
    // Free
    { id: 'crof-kimi', label: 'Kimi', provider: 'CROF', tier: 'free', badge: 'Free' },
    // Creator
    { id: 'claude-sonnet', label: 'Claude Sonnet', provider: 'Anthropic', tier: 'creator', badge: 'Popular' },
    { id: 'chatgpt', label: 'ChatGPT', provider: 'OpenAI', tier: 'creator' },
    // Studio
    { id: 'claude-opus', label: 'Claude Opus', provider: 'Anthropic', tier: 'studio', badge: 'Best' },
    { id: 'chatgpt-codex', label: 'ChatGPT Codex', provider: 'OpenAI', tier: 'studio', badge: 'Pro' },
];

export const DEFAULT_MODEL = 'crof-kimi';

const TIER_ORDER: ModelTier[] = ['free', 'creator', 'studio'];

export function getModelsForTier(tier: ModelTier): AIModel[] {
    const tierIdx = TIER_ORDER.indexOf(tier);
    return AI_MODELS.filter(m => TIER_ORDER.indexOf(m.tier) <= tierIdx);
}

export function isModelAccessible(modelId: string, userTier: ModelTier): boolean {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model) return false;
    return TIER_ORDER.indexOf(model.tier) <= TIER_ORDER.indexOf(userTier);
}

export function getRequiredTier(modelId: string): ModelTier | null {
    const model = AI_MODELS.find(m => m.id === modelId);
    return model?.tier ?? null;
}

export function getVideoLimit(tier: ModelTier): number {
    return TIERS[tier].videoLimit;
}

export function canCreateVideo(used: number, userTier: ModelTier): boolean {
    const limit = getVideoLimit(userTier);
    if (limit === Infinity) return true;
    return used < limit;
}
