import { createClient as createBrowserClient } from './supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Check if Supabase is actually configured with valid-looking credentials.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
    supabaseUrl.includes('supabase.co') && supabaseKey.length > 20;

// Lazy-initialize the Supabase client to avoid immediate network calls on import.
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
    if (!_supabase) {
        _supabase = createBrowserClient();
    }
    return _supabase;
}

// Mock auth methods for when Supabase is not configured
const mockAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.') }),
    signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    updateUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
    resetPasswordForEmail: async () => ({ data: {}, error: new Error('Supabase not configured') }),
    signInWithOAuth: async () => ({ data: { url: '' }, error: new Error('Supabase not configured') }),
    exchangeCodeForSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
    resend: async () => ({ data: {}, error: new Error('Supabase not configured') }),
};

// Mock database methods
const mockFrom = () => ({
    select: () => ({ 
        data: null, 
        error: new Error('Supabase not configured'), 
        single: async () => ({ data: null, error: new Error('Supabase not configured') }),
        eq: () => ({ 
            update: async () => ({ error: null }), 
            data: null,
            single: async () => ({ data: null, error: new Error('Supabase not configured') })
        })
    }),
});

// Re-export a proxy that handles the case when Supabase is not configured.
// All existing code that does `import { supabase } from './supabase'` keeps working.
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        if (!isSupabaseConfigured) {
            // Return mock objects when Supabase is not configured
            if (prop === 'auth') {
                return mockAuth;
            }
            if (prop === 'from') {
                return mockFrom;
            }
            return () => {};
        }
        
        const client = getSupabaseClient();
        if (!client) {
            // Fallback to mocks if client creation failed
            if (prop === 'auth') {
                return mockAuth;
            }
            if (prop === 'from') {
                return mockFrom;
            }
            return () => {};
        }
        
        return (client as any)[prop];
    },
});