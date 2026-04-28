// AI Model registry with tier-based access control
import { CUSTOM_APIS } from './apiKeys';

export type ModelTier = 'free' | 'creator' | 'studio';

export interface AIModel {
    id: string;       // model ID sent to Lightning AI API
    label: string;    // display name
    provider: string; // provider badge (DeepSeek, OpenAI, etc.)
    tier: ModelTier;  // minimum tier required
    badge?: string;   // optional badge like "Fast", "Best"
}

export interface TierInfo {
    name: string;
    price: number;    // $/month
    color: string;    // accent color
    description: string;
}

export const TIERS: Record<ModelTier, TierInfo> = {
    free: {
        name: 'Free',
        price: 0,
        color: '#6b7280',
        description: 'Get started with powerful open models',
    },
    creator: {
        name: 'Creator',
        price: 12,
        color: '#6366f1',
        description: 'Premium models for serious creators',
    },
    studio: {
        name: 'Studio',
        price: 29,
        color: '#f59e0b',
        description: 'The best AI models, unlimited access',
    },
};

// Build AI models list from custom APIs + default models
// Deduplicate custom models by id to prevent React key collisions
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

// IDs already claimed by custom API entries
const customIds = new Set(customModels.map(m => m.id));

// Hardcoded models — entries whose id collides with a custom API are skipped
const hardcodedModels: AIModel[] = ([
    // ── Free Tier ──
    { id: 'lightning-ai/DeepSeek-V3.1', label: 'DeepSeek V3.1', provider: 'DeepSeek', tier: 'free' as ModelTier, badge: 'Default' },
    { id: 'lightning-ai/llama-3.3-70b', label: 'Llama 3.3 70B', provider: 'Meta', tier: 'free' as ModelTier },
    { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano', provider: 'OpenAI', tier: 'free' as ModelTier, badge: 'Fast' },
    { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', provider: 'Google', tier: 'free' as ModelTier },
    
    // ── Creator Tier ($12/mo) ──
    { id: 'lightning-ai/kimi-k2.5', label: 'Kimi K2.5', provider: 'Moonshot', tier: 'creator' as ModelTier },
    { id: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'Anthropic', tier: 'creator' as ModelTier, badge: 'Fast' },
    { id: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', provider: 'Google', tier: 'creator' as ModelTier },
    { id: 'anthropic/claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'Anthropic', tier: 'creator' as ModelTier },
    { id: 'openai/gpt-5', label: 'GPT-5', provider: 'OpenAI', tier: 'creator' as ModelTier, badge: 'Popular' },
    { id: 'glm-5-nvidia', label: 'GLM-5 NVIDIA', provider: 'Z-AI', tier: 'free' as ModelTier, badge: 'Motion' },
    { id: 'minimax-m2.7', label: 'MiniMax M2.7', provider: 'MiniMax', tier: 'free' as ModelTier, badge: 'Motion' },
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', provider: 'NVIDIA', tier: 'free' as ModelTier, badge: 'Motion' },
    
    // ── Studio Tier ($29/mo) ──
    { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'Anthropic', tier: 'studio' as ModelTier },
    { id: 'openai/gpt-5.2-2025-12-11', label: 'GPT-5.2', provider: 'OpenAI', tier: 'studio' as ModelTier, badge: 'Best' },
    { id: 'anthropic/claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'Anthropic', tier: 'studio' as ModelTier, badge: 'Best' },
] as AIModel[]).filter(m => !customIds.has(m.id));

export const AI_MODELS: AIModel[] = [
    ...customModels,
    ...hardcodedModels,
];

export const DEFAULT_MODEL = 'deepseekpro';

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