// AI Model registry with tier-based access control
import { CUSTOM_APIS } from './apiKeys';

export type ModelTier = 'free' | 'creator' | 'studio';

export interface AIModel {
    id: string;       // model ID sent to Lightning AI API
    label: string;    // display name
    provider: string; // provider badge
    tier: ModelTier;  // minimum tier required
    badge?: string;   // optional badge like "Fast", "Best", "Vision", "Audio"
    category?: 'text' | 'vision' | 'image' | 'video' | 'audio' | 'motion';
}

export interface TierInfo {
    name: string;
    price: number;    // $/month
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
        description: 'Get started with powerful open models',
        videoLimit: 10,
        highlights: [
            '10 videos / month',
            'Open-source AI models',
            'Basic motion graphics',
            '1080p export',
        ],
    },
    creator: {
        name: 'Creator',
        price: 20,
        color: '#9d4edd',
        description: 'Premium AI — motion graphics, images, captions',
        videoLimit: 60,
        highlights: [
            '60 videos / month',
            'Claude Sonnet 4 · GPT-5 · Gemini Pro',
            'AI motion graphics + B-roll images',
            'Google Imagen + Seedance models',
            '4K export · Priority queue',
        ],
    },
    studio: {
        name: 'Studio',
        price: 50,
        color: '#00f5d4',
        description: 'Unlimited access — the absolute best AI',
        videoLimit: Infinity,
        highlights: [
            'Unlimited videos',
            'Claude Opus 4.6 · GPT-5.2',
            'All image/video generation models',
            '4K export · Priority queue',
            'Early access to new features',
            'Dedicated support',
        ],
    },
};

// Build AI models list from custom APIs + default models
const customModelMap = new Map<string, AIModel>();
for (const api of CUSTOM_APIS) {
    if (!customModelMap.has(api.id)) {
        customModelMap.set(api.id, {
            id: api.id,
            label: api.name,
            provider: 'ModelScope',
            tier: 'free' as ModelTier,
            badge: 'Custom',
        });
    }
}
const customModels: AIModel[] = Array.from(customModelMap.values());
const customIds = new Set(customModels.map(m => m.id));

const hardcodedModels: AIModel[] = ([
    // ── Free Tier ($0) ──
    { id: 'lightning-ai/DeepSeek-V3.1', label: 'DeepSeek V3.1', provider: 'DeepSeek', tier: 'free', badge: 'Default', category: 'text' },
    { id: 'lightning-ai/llama-3.3-70b', label: 'Llama 3.3 70B', provider: 'Meta', tier: 'free' },
    { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano', provider: 'OpenAI', tier: 'free', badge: 'Fast' },
    { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', provider: 'Google', tier: 'free' },
    { id: 'minimax-m2.7', label: 'MiniMax M2.7', provider: 'MiniMax', tier: 'free', badge: 'Motion', category: 'motion' },

    // ── Creator Tier ($20/mo) ──
    { id: 'anthropic/claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'Anthropic', tier: 'creator', badge: 'Popular', category: 'text' },
    { id: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'Anthropic', tier: 'creator', badge: 'Fast' },
    { id: 'openai/gpt-5', label: 'GPT-5', provider: 'OpenAI', tier: 'creator' },
    { id: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', provider: 'Google', tier: 'creator' },
    { id: 'lightning-ai/kimi-k2.5', label: 'Kimi K2.5', provider: 'Moonshot', tier: 'creator' },
    { id: 'lightning-ai/deepseek-v4-pro', label: 'DeepSeek V4 Pro', provider: 'Lightning AI', tier: 'creator', badge: 'Motion', category: 'motion' },
    { id: 'glm-5-nvidia', label: 'GLM-5 NVIDIA', provider: 'Z-AI', tier: 'creator', badge: 'Motion', category: 'motion' },
    // Image generation models
    { id: 'google-imagen', label: 'Google Imagen 3', provider: 'Google', tier: 'creator', badge: 'Image', category: 'image' },
    { id: 'seedance-v1', label: 'Seedance V1', provider: 'Seedance', tier: 'creator', badge: 'Image', category: 'image' },
    { id: 'seedance-v2-pro', label: 'Seedance V2 Pro', provider: 'Seedance', tier: 'creator', badge: 'Image+', category: 'image' },

    // ── Studio Tier ($50/mo) ──
    { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'Anthropic', tier: 'studio' },
    { id: 'anthropic/claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'Anthropic', tier: 'studio', badge: 'Best', category: 'text' },
    { id: 'openai/gpt-5.2-2025-12-11', label: 'GPT-5.2', provider: 'OpenAI', tier: 'studio', badge: 'Best' },
    { id: 'seedance-v3-ultra', label: 'Seedance V3 Ultra', provider: 'Seedance', tier: 'studio', badge: 'Image Pro', category: 'image' },
    { id: 'google-veo-3', label: 'Google Veo 3', provider: 'Google', tier: 'studio', badge: 'Video', category: 'video' },
    { id: 'runway-gen-4', label: 'Runway Gen-4', provider: 'Runway', tier: 'studio', badge: 'Video Pro', category: 'video' },
] as AIModel[]).filter(m => !customIds.has(m.id));

export const AI_MODELS: AIModel[] = [
    ...customModels,
    ...hardcodedModels,
];

export const DEFAULT_MODEL = 'minimax-m2.7';

const TIER_ORDER: ModelTier[] = ['free', 'creator', 'studio'];

/** Get all models available at a given tier (includes lower tiers) */
export function getModelsForTier(tier: ModelTier): AIModel[] {
    const tierIdx = TIER_ORDER.indexOf(tier);
    return AI_MODELS.filter(m => TIER_ORDER.indexOf(m.tier) <= tierIdx);
}

/** Check if a model is accessible at a given tier */
export function isModelAccessible(modelId: string, userTier: ModelTier): boolean {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model) return false;
    return TIER_ORDER.indexOf(model.tier) <= TIER_ORDER.indexOf(userTier);
}

/** Get the required tier for a model */
export function getRequiredTier(modelId: string): ModelTier | null {
    const model = AI_MODELS.find(m => m.id === modelId);
    return model?.tier ?? null;
}

/** Get monthly video limit for a tier */
export function getVideoLimit(tier: ModelTier): number {
    return TIERS[tier].videoLimit;
}

/** Check if user can create a video project based on tier and current usage */
export function canCreateVideo(used: number, userTier: ModelTier): boolean {
    const limit = getVideoLimit(userTier);
    if (limit === Infinity) return true;
    return used < limit;
}
