import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { features, isDevelopment } from './config';

export interface User {
    id: string;
    name: string;
    email: string;
    plan: 'free' | 'creator' | 'studio';
    createdAt: number;
    avatar?: string;
    emailVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
    loginWithProvider: (provider: 'google') => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    updatePlan: (plan: User['plan']) => void;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
    /** true when running in dev mode without Supabase configured */
    isDevMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(u: SupabaseUser, profile?: any): User {
    return {
        id: u.id,
        name: u.user_metadata.full_name || u.email?.split('@')[0] || 'User',
        email: u.email || '',
        plan: profile?.plan || 'free',
        createdAt: new Date(u.created_at).getTime(),
        avatar: u.user_metadata.avatar_url,
        emailVerified: !!u.email_confirmed_at,
    };
}

// A fake "dev" user used only in development mode without Supabase
const DEV_USER: User = {
    id: 'dev-local-user',
    name: 'Dev User',
    email: 'dev@localhost',
    plan: 'studio',
    createdAt: Date.now(),
    emailVerified: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDevMode, setIsDevMode] = useState(false);

    const refreshUser = useCallback(async (sessionUser: SupabaseUser) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            setUser(mapSupabaseUser(sessionUser, profile));
        } catch (e) {
            console.error('Error fetching profile', e);
            setUser(mapSupabaseUser(sessionUser));
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function init() {
            // Only allow dev mode in development environment when Supabase is not configured
            if (features.enableDevMode) {
                // Check if dev mode was previously activated
                if (typeof window !== 'undefined' && localStorage.getItem('dev_mode') === 'true') {
                    setIsDevMode(true);
                    setUser(DEV_USER);
                    setIsLoading(false);
                    return;
                }
            }

            // Clear any stale dev mode cookies in production
            if (!features.enableDevMode && typeof window !== 'undefined') {
                localStorage.removeItem('dev_mode');
                document.cookie = 'dev_mode=; path=/; max-age=0';
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (cancelled) return;
                if (session?.user) {
                    await refreshUser(session.user);
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        init();

        // Listen for auth changes
        let subscription: any;
        try {
            const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
                if (session?.user) {
                    refreshUser(session.user);
                } else if (!isDevMode) {
                    setUser(null);
                    setIsLoading(false);
                }
            });
            subscription = data?.subscription;
        } catch {
            // ignore — offline mode
        }

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, [refreshUser, isDevMode]);

    const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) {
                // Handle specific error cases
                if (error.message.includes('Email not confirmed')) {
                    return { success: false, error: 'Please check your email and click the verification link to activate your account.', needsVerification: true };
                }
                if (error.message.includes('Invalid login credentials')) {
                    return { success: false, error: 'Invalid email or password. Please try again.' };
                }
                if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many requests') || (error as any).status === 429) {
                    return { success: false, error: 'Too many attempts. Please wait a few minutes and try again.' };
                }
                return { success: false, error: error.message };
            }
            
            // Check if email is verified
            if (data.user && !data.user.email_confirmed_at && features.requireEmailVerification) {
                return { 
                    success: false, 
                    error: 'Please check your email and click the verification link to activate your account.',
                    needsVerification: true 
                };
            }
            
            return { success: true };
        } catch (err: any) {
            console.error('Login error:', err);
            // Handle network errors (Failed to fetch, NetworkError, etc.)
            if (err?.message?.includes('fetch') || err?.message?.includes('network') || err?.message?.includes('ECONNREFUSED') || err?.name === 'TypeError') {
                return { success: false, error: 'Unable to connect to the authentication server. Please check your internet connection and try again.' };
            }
            return { success: false, error: 'An unexpected error occurred. Please try again.' };
        }
    }, []);

    const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> => {
        // Client-side validation
        if (!name.trim()) {
            return { success: false, error: 'Name is required.' };
        }
        if (name.trim().length < 2) {
            return { success: false, error: 'Name must be at least 2 characters.' };
        }
        if (!email.includes('@') || !email.includes('.')) {
            return { success: false, error: 'Please enter a valid email address.' };
        }
        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters.' };
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name.trim(),
                    },
                },
            });

            if (error) {
                // Handle specific error cases
                if (error.message.includes('already registered')) {
                    return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
                }
                if (error.message.includes('Password')) {
                    return { success: false, error: 'Password does not meet requirements. Please use at least 6 characters.' };
                }
                if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many requests') || error.status === 429) {
                    return { success: false, error: 'Too many attempts. Please wait a few minutes and try again.' };
                }
                return { success: false, error: error.message };
            }

            // Check if user was created and needs verification
            if (data.user) {
                if (!data.user.email_confirmed_at) {
                    return { 
                        success: true, 
                        needsVerification: true 
                    };
                }
            }

            return { success: true };
        } catch (err: any) {
            console.error('Signup error:', err);
            // Handle network errors (Failed to fetch, NetworkError, etc.)
            if (err?.message?.includes('fetch') || err?.message?.includes('network') || err?.message?.includes('ECONNREFUSED') || err?.name === 'TypeError') {
                return { success: false, error: 'Unable to connect to the authentication server. Please check your internet connection and try again.' };
            }
            return { success: false, error: 'An unexpected error occurred. Please try again.' };
        }
    }, []);

    const loginWithProvider = useCallback(async (provider: 'google') => {
        if (!features.enableGoogleLogin) {
            return { error: 'Social login is not configured. Please use email and password.' };
        }

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) {
                console.error('OAuth error:', error);
                return { error: error.message || 'Failed to initiate Google login. Please try again.' };
            }
            return {};
        } catch (err: any) {
            console.error('OAuth login error:', err);
            if (err?.message?.includes('fetch') || err?.message?.includes('network') || err?.name === 'TypeError') {
                return { error: 'Unable to connect to the authentication server. Please check your internet connection and try again.' };
            }
            return { error: 'Failed to initiate login. Please try again.' };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } catch {
            // ignore
        }
        setUser(null);
        setIsDevMode(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('dev_mode');
            document.cookie = 'dev_mode=; path=/; max-age=0';
        }
    }, []);

    const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
        if (!features.enablePasswordReset) {
            return { success: false, error: 'Password reset is not available. Please contact support.' };
        }

        if (!email.includes('@') || !email.includes('.')) {
            return { success: false, error: 'Please enter a valid email address.' };
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            if (error) {
                if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many requests') || (error as any).status === 429) {
                    return { success: false, error: 'Too many attempts. Please wait a few minutes and try again.' };
                }
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch {
            return { success: false, error: 'Failed to send reset email. Please try again.' };
        }
    }, []);

    const updatePassword = useCallback(async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (newPassword.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters.' };
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch {
            return { success: false, error: 'Failed to update password. Please try again.' };
        }
    }, []);

    const updatePlan = useCallback(async (plan: User['plan']) => {
        if (!user) return;

        // Optimistic update
        setUser(prev => prev ? { ...prev, plan } : null);

        if (!isDevMode) {
            try {
                // Update DB
                const { error } = await supabase
                    .from('profiles')
                    .update({ plan })
                    .eq('id', user.id);

                if (error) {
                    console.error('Failed to update plan', error);
                }
            } catch (err) {
                console.error('Failed to update plan', err);
            }
        }
    }, [user, isDevMode]);

    const enableDevMode = useCallback(() => {
        if (!features.enableDevMode) {
            console.warn('Dev mode is disabled in production');
            return;
        }
        setIsDevMode(true);
        setUser(DEV_USER);
        localStorage.setItem('dev_mode', 'true');
        // Set cookie so middleware can read it
        document.cookie = 'dev_mode=true; path=/; max-age=86400; SameSite=Strict';
    }, []);

    // Expose dev mode enable function only in development
    const authValue: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginWithProvider,
        logout,
        updatePlan,
        resetPassword,
        updatePassword,
        isDevMode,
    };

    // Add dev mode method in development
    if (features.enableDevMode) {
        (authValue as any).enableDevMode = enableDevMode;
    }

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

// Export for development use only
export const useDevMode = () => {
    const { isDevMode } = useAuth();
    const enableDevMode = useCallback(() => {
        if (features.enableDevMode && typeof window !== 'undefined') {
            localStorage.setItem('dev_mode', 'true');
            window.location.reload();
        }
    }, []);
    
    return { isDevMode, enableDevMode, isAvailable: features.enableDevMode };
};