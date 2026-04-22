import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Feature flag check - dev mode only allowed in development
const isDevelopment = process.env.NODE_ENV === 'development';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = 
    supabaseUrl.includes('supabase.co') && supabaseKey.length > 20;
const enableDevMode = isDevelopment && !isSupabaseConfigured;

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // Only allow dev_mode cookie in development mode without Supabase configured
    // This prevents users from bypassing auth in production by setting a cookie
    if (enableDevMode && request.cookies.get('dev_mode')?.value === 'true') {
        return supabaseResponse;
    }

    // Clear any stale dev_mode cookie if we're not in dev mode
    if (!enableDevMode && request.cookies.get('dev_mode')) {
        supabaseResponse.cookies.set('dev_mode', '', { 
            path: '/', 
            maxAge: 0,
            sameSite: 'strict',
        });
    }

    // If Supabase is not configured, allow all requests
    // This should only happen in development
    if (!isSupabaseConfigured) {
        if (isDevelopment) {
            return supabaseResponse;
        }
        // In production without Supabase, redirect to a setup page or show error
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'configuration');
        return NextResponse.redirect(url);
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Do NOT use getSession() here — it doesn't re-validate
    // the JWT from the auth server. getUser() does.
    // Add a timeout to prevent hanging when Supabase is unreachable.
    let user = null;
    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Supabase auth timeout')), 5000)
        );
        const authPromise = supabase.auth.getUser();
        const { data } = await Promise.race([authPromise, timeoutPromise]) as any;
        user = data?.user ?? null;
    } catch (error) {
        // Supabase is unreachable or timed out
        console.warn('Supabase auth check failed:', error);
        
        // In production, treat unreachable as unauthenticated (secure by default)
        // In development, allow access for debugging
        if (isDevelopment) {
            return supabaseResponse;
        }
        
        // Production: redirect to login with error
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'service_unavailable');
        return NextResponse.redirect(url);
    }

    // Protected routes: redirect to /login if not authenticated
    const protectedPaths = ['/editor', '/settings'];
    const isProtected = protectedPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (!user && isProtected) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        // Preserve the intended destination
        url.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // If user is already logged in and visits /login, redirect to /editor
    if (user && request.nextUrl.pathname === '/login') {
        const redirectPath = request.nextUrl.searchParams.get('redirect') || '/editor';
        const url = request.nextUrl.clone();
        url.pathname = redirectPath;
        url.searchParams.delete('redirect');
        return NextResponse.redirect(url);
    }

    // If user is logged in but email not verified, check if they're trying to access protected routes
    if (user && !user.email_confirmed_at && isProtected) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'verify_email');
        url.searchParams.set('email', user.email || '');
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         * - API routes (they handle their own auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};