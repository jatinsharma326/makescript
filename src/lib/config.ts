/**
 * Application configuration
 * Environment-based feature flags for production vs development
 */

// Check if we're in development mode
export const isDevelopment = process.env.NODE_ENV === 'development';

// Check if Supabase is properly configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const isSupabaseConfigured = 
    supabaseUrl.includes('supabase.co') && supabaseKey.length > 20;

// Feature flags
export const features = {
    // Enable dev mode (admin access button, dev user fallback)
    // Only true in development AND when Supabase is not configured
    enableDevMode: isDevelopment && !isSupabaseConfigured,
    
    // Require email verification before access
    requireEmailVerification: true,
    
    // Enable social logins
    enableGoogleLogin: isSupabaseConfigured,
    
    // Enable password reset
    enablePasswordReset: isSupabaseConfigured,
} as const;

// Helper functions for auth URLs
export function getCallbackUrl(): string {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/auth/callback`;
    }
    return '/auth/callback';
}

export function getResetPasswordUrl(): string {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/auth/reset-password`;
    }
    return '/auth/reset-password';
}

// Auth configuration
export const authConfig = {
    // Session timeout in seconds (7 days)
    sessionTimeout: 60 * 60 * 24 * 7,
    
    // Password requirements
    minPasswordLength: 6,
} as const;