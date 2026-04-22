// Usage tracking — free tier limits, monthly resets

export type PlanType = 'free' | 'creator' | 'studio';

const USAGE_KEY = 'makescript-usage';

interface UsageData {
    month: string; // "2026-02"
    videoCount: number;
}

const PLAN_LIMITS: Record<PlanType, number> = {
    free: 3,
    creator: 20,
    studio: Infinity,
};

function getCurrentMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getUsageData(): UsageData {
    try {
        const raw = localStorage.getItem(USAGE_KEY);
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

function saveUsageData(data: UsageData): void {
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
}

export function getUsage(planOverride?: PlanType): { used: number; limit: number; plan: PlanType } {
    const data = getUsageData();
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

export function canCreateProject(planOverride?: PlanType): boolean {
    const { used, limit } = getUsage(planOverride);
    return used < limit;
}

export function incrementUsage(): void {
    const data = getUsageData();
    data.videoCount += 1;
    saveUsageData(data);
}

export function getUsageDisplay(planOverride?: PlanType): { text: string; percent: number; isNearLimit: boolean; isAtLimit: boolean } {
    const { used, limit, plan } = getUsage(planOverride);
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
