'use client';

import { createBrowserClient } from '@supabase/ssr';

// Check if Supabase has valid-looking configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
    supabaseUrl.includes('supabase.co') && supabaseKey.length > 20;

export function createClient() {
    // Only create client if Supabase is properly configured
    if (!isSupabaseConfigured) {
        // Return a mock client that won't make network requests
        return {
            auth: {
                getSession: async () => ({ data: { session: null }, error: null }),
                getUser: async () => ({ data: { user: null }, error: null }),
                signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
                signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
                signOut: async () => ({ error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                updateUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
                resetPasswordForEmail: async () => ({ data: {}, error: new Error('Supabase not configured') }),
                signInWithOAuth: async () => ({ data: { url: '' }, error: new Error('Supabase not configured') }),
                exchangeCodeForSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
                resend: async () => ({ data: {}, error: new Error('Supabase not configured') }),
            },
            from: () => ({
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
            }),
        } as any;
    }

    return createBrowserClient(supabaseUrl, supabaseKey, {
        auth: {
            // Use localStorage with custom storage to avoid Navigator LockManager issues
            storage: {
                getItem: (key: string) => {
                    if (typeof window === 'undefined') return null;
                    try {
                        return localStorage.getItem(key);
                    } catch {
                        return null;
                    }
                },
                setItem: (key: string, value: string) => {
                    if (typeof window === 'undefined') return;
                    try {
                        localStorage.setItem(key, value);
                    } catch {
                        // Storage might be full or blocked
                    }
                },
                removeItem: (key: string) => {
                    if (typeof window === 'undefined') return;
                    try {
                        localStorage.removeItem(key);
                    } catch {
                        // Ignore errors
                    }
                },
            },
            // Disable auto-refresh in background tabs to prevent lock contention
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    });
}