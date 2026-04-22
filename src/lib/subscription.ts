import { createClient } from './supabase/server';

export type UserTier = 'free' | 'pro' | 'max';

type ProfilePlan = 'free' | 'creator' | 'studio' | 'pro' | 'max';

export interface SubscriptionInfo {
    tier: UserTier;
    isPro: boolean;
    isMax: boolean;
    isAuthenticated: boolean;
}

export function normalizePlanToTier(plan: string | null | undefined): UserTier {
    const normalized = (plan ?? 'free').toLowerCase().trim() as ProfilePlan;

    switch (normalized) {
        case 'studio':
        case 'max':
            return 'max';
        case 'creator':
        case 'pro':
            return 'pro';
        case 'free':
        default:
            return 'free';
    }
}

export async function getUserSubscription(): Promise<SubscriptionInfo> {
    let supabase;
    try {
        supabase = await createClient();
    } catch {
        // Supabase unreachable — give full access in dev mode
        return { tier: 'max', isPro: true, isMax: true, isAuthenticated: true };
    }

    let user;
    try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
    } catch {
        // Supabase unreachable — give full access in dev mode
        return { tier: 'max', isPro: true, isMax: true, isAuthenticated: true };
    }

    if (!user) {
        return { tier: 'free', isPro: false, isMax: false, isAuthenticated: false };
    }

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();

        const tier = normalizePlanToTier(profile?.plan);

        return {
            tier,
            isPro: tier === 'pro' || tier === 'max',
            isMax: tier === 'max',
            isAuthenticated: true,
        };
    } catch (e) {
        console.error('Error fetching user subscription:', e);
        return { tier: 'free', isPro: false, isMax: false, isAuthenticated: true };
    }
}

// Maps the user's tier to an appropriate AI model ID
export function getModelForTier(tier: UserTier): string {
    switch (tier) {
        case 'max':
            // Best available model
            return 'anthropic/claude-sonnet-4-6';
        case 'pro':
            // High-quality model
            return 'lightning-ai/DeepSeek-V3.1';
        case 'free':
        default:
            // Fast, cheaper model for free tier
            return 'meta-llama/Meta-Llama-3.1-8B-Instruct';
    }
}
