import { createClient } from './supabase/server';
import { ModelTier } from './models';

export type UserTier = 'free' | 'creator' | 'studio';

export interface SubscriptionInfo {
    tier: UserTier;
    isCreator: boolean;
    isStudio: boolean;
    isAuthenticated: boolean;
}

export function normalizePlanToTier(plan: string | null | undefined): UserTier {
    const normalized = (plan ?? 'free').toLowerCase().trim();

    switch (normalized) {
        case 'studio':
        case 'max':
            return 'studio';
        case 'creator':
        case 'pro':
            return 'creator';
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
        return { tier: 'studio', isCreator: true, isStudio: true, isAuthenticated: true };
    }

    let user;
    try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
    } catch {
        return { tier: 'studio', isCreator: true, isStudio: true, isAuthenticated: true };
    }

    if (!user) {
        return { tier: 'free', isCreator: false, isStudio: false, isAuthenticated: false };
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
            isCreator: tier === 'creator' || tier === 'studio',
            isStudio: tier === 'studio',
            isAuthenticated: true,
        };
    } catch (e) {
        console.error('Error fetching user subscription:', e);
        return { tier: 'free', isCreator: false, isStudio: false, isAuthenticated: true };
    }
}

// Map user tier to the best AI model ID for overlay generation
export function getModelForTier(tier: UserTier): string {
    switch (tier) {
        case 'studio':
            return 'anthropic/claude-opus-4-6';
        case 'creator':
            return 'anthropic/claude-sonnet-4-20250514';
        case 'free':
        default:
            return 'minimax-m2.7';
    }
}

// Get the Stripe price ID for a given tier
export function getStripePriceId(tier: UserTier): string | null {
    switch (tier) {
        case 'creator':
            return process.env.STRIPE_PRICE_CREATOR || '';
        case 'studio':
            return process.env.STRIPE_PRICE_STUDIO || '';
        default:
            return null;
    }
}
