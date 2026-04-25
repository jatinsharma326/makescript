// Usage tracking — free tier limits, monthly resets (per-user)

export type PlanType = 'free' | 'creator' | 'studio';

const USAGE_KEY_PREFIX = 'makescript-usage';

interface UsageData {
    month: string; // "2026-02"
    videoCount: number;
}

const PLAN_LIMITS: Record<PlanType, number> = {
    free: 10,
    creator: 20,
    studio: Infinity,
};

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
            // Reset if different month
            if (data.month !== getCurrentMonth()) {
                return { month: getCurrentMonth(), videoCount: 0 };
            }
            return data;
        }
    } catch {
        // ignore
    }
    return { month: getCurrentMonth(), videoCount: 0 };
}

function saveUsageData(data: UsageData, userId?: string): void {
    const key = getUsageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
}

export function getUsage(planOverride?: PlanType, userId?: string): { used: number; limit: number; plan: PlanType } {
    const data = getUsageData(userId);
    let plan: PlanType = planOverride || 'free';
    if (!planOverride) {
        // Fallback: try localStorage if no plan passed
        const userRaw = localStorage.getItem('makescript-user');
        try {
            if (userRaw) plan = JSON.parse(userRaw).plan || 'free';
        } catch { /* ignore */ }
    }
    return {
        used: data.videoCount,
        limit: PLAN_LIMITS[plan],
        plan,
    };
}

export function canCreateProject(planOverride?: PlanType, userId?: string): boolean {
    const { used, limit } = getUsage(planOverride, userId);
    return used < limit;
}

export function incrementUsage(userId?: string): void {
    const data = getUsageData(userId);
    data.videoCount += 1;
    saveUsageData(data, userId);
}

export function getUsageDisplay(planOverride?: PlanType, userId?: string): { text: string; percent: number; isNearLimit: boolean; isAtLimit: boolean } {
    const { used, limit, plan } = getUsage(planOverride, userId);
    if (plan === 'studio') {
        return { text: `${used} videos`, percent: 0, isNearLimit: false, isAtLimit: false };
    }
    const percent = Math.round((used / limit) * 100);
    return {
        text: `${used} / ${limit} videos`,
        percent: Math.min(percent, 100),
        isNearLimit: percent >= 80,
        isAtLimit: used >= limit,
    };
}

/** Clear all legacy/global usage keys so old unscoped data stops interfering */
export function clearLegacyUsage(): void {
    try {
        localStorage.removeItem(USAGE_KEY_PREFIX);
    } catch { /* ignore */ }
}
