// Usage tracking — per-user monthly video limits
// Limits are defined in models.ts TIERS[x].videoLimit

import { ModelTier, getVideoLimit } from './models';

const USAGE_KEY_PREFIX = 'makescript-usage';

interface UsageData {
    month: string;
    videoCount: number;
}

function getCurrentMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getUsageKey(userId?: string): string {
    return userId ? `${USAGE_KEY_PREFIX}:${userId}` : USAGE_KEY_PREFIX;
}

function getUsageData(userId?: string): UsageData {
    const key = getUsageKey(userId);
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            const data: UsageData = JSON.parse(raw);
            if (data.month !== getCurrentMonth()) {
                return { month: getCurrentMonth(), videoCount: 0 };
            }
            return data;
        }
    } catch { /* ignore */ }
    return { month: getCurrentMonth(), videoCount: 0 };
}

function saveUsageData(data: UsageData, userId?: string): void {
    const key = getUsageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
}

export function getUsage(planOverride?: ModelTier, userId?: string): { used: number; limit: number; plan: ModelTier } {
    const data = getUsageData(userId);
    let plan: ModelTier = planOverride || 'free';
    if (!planOverride) {
        const userRaw = localStorage.getItem('makescript-user');
        try {
            if (userRaw) plan = (JSON.parse(userRaw).plan || 'free') as ModelTier;
        } catch { /* ignore */ }
    }
    const limit = getVideoLimit(plan);
    return { used: data.videoCount, limit, plan };
}

export function canCreateProject(planOverride?: ModelTier, userId?: string): boolean {
    const { used, limit } = getUsage(planOverride, userId);
    return used < limit;
}

export function incrementUsage(userId?: string): void {
    const data = getUsageData(userId);
    data.videoCount += 1;
    saveUsageData(data, userId);
}

export function getUsageDisplay(planOverride?: ModelTier, userId?: string): { text: string; percent: number; isNearLimit: boolean; isAtLimit: boolean } {
    const { used, limit, plan } = getUsage(planOverride, userId);
    if (limit === Infinity) {
        return { text: `${used} videos (unlimited)`, percent: 0, isNearLimit: false, isAtLimit: false };
    }
    const percent = Math.round((used / limit) * 100);
    return {
        text: `${used} / ${limit} videos`,
        percent: Math.min(percent, 100),
        isNearLimit: percent >= 80,
        isAtLimit: used >= limit,
    };
}

export function clearLegacyUsage(): void {
    try {
        localStorage.removeItem(USAGE_KEY_PREFIX);
    } catch { /* ignore */ }
}
