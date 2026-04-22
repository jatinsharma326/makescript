import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/editor';

    if (code) {
        try {
            const supabase = await createClient();
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error) {
                return NextResponse.redirect(`${origin}${next}`);
            }
        } catch (e) {
            console.warn('Auth callback failed (Supabase unreachable):', e);
        }
    }

    // Return the user to the login page with an error
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
