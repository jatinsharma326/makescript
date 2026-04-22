'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import { features } from '../../lib/config';
import { Film, ArrowRight, Eye, EyeOff, Mail, Lock, User, Sparkles, Shield, CheckCircle } from 'lucide-react';

function Content() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    
    // Handle URL parameters for mode and errors
    useEffect(() => {
        const m = searchParams.get('mode');
        if (m === 'signup' || m === 'login') {
            setMode(m);
        }
        
        // Handle error codes from middleware
        const error = searchParams.get('error');
        if (error === 'verify_email') {
            const email = searchParams.get('email');
            if (email) {
                setEmail(email);
                setError('Please verify your email before accessing this page. Check your inbox for the verification link.');
                setMode('login');
            }
        } else if (error === 'configuration') {
            setError('Authentication service is not properly configured. Please contact support.');
        } else if (error === 'service_unavailable') {
            setError('Authentication service is temporarily unavailable. Please try again later.');
        } else if (error === 'auth-code-error') {
            setError('Authentication failed. Please try again.');
        }
    }, [searchParams]);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMsg, setForgotMsg] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);

    const { login, signup, loginWithProvider, isDevMode, isAuthenticated } = useAuth();
    const auth = useAuth();

    useEffect(() => {
        setMounted(true);
        document.documentElement.setAttribute('data-theme', 'dark');
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            const redirect = searchParams.get('redirect') || '/editor';
            router.push(redirect);
        }
    }, [isAuthenticated, router, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);
        setNeedsVerification(false);

        try {
            const result = mode === 'login'
                ? await login(email, password)
                : await signup(name, email, password);

            if (!result.success) {
                setError(result.error || 'Something went wrong.');
                if (result.needsVerification) {
                    setNeedsVerification(true);
                }
            } else if (result.needsVerification) {
                setSuccessMsg('Account created! Please check your email for a verification link to activate your account.');
                setNeedsVerification(true);
                setMode('login');
            }
        } catch {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setResendLoading(true);
        setSuccessMsg('');
        
        try {
            // Use Supabase's resend verification email
            const { supabase } = await import('../../lib/supabase');
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });
            
            if (error) {
                setError('Failed to resend verification email. Please try again.');
            } else {
                setSuccessMsg('Verification email sent! Check your inbox.');
            }
        } catch {
            setError('Failed to resend verification email.');
        } finally {
            setResendLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setForgotMsg('');
        if (!forgotEmail.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        setForgotLoading(true);
        try {
            const result = await auth.resetPassword(forgotEmail);
            if (!result.success) {
                setError(result.error || 'Failed to send reset email.');
            } else {
                setForgotMsg('Password reset email sent! Check your inbox for a link to reset your password.');
            }
        } catch {
            setError('An unexpected error occurred.');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleDevModeLogin = () => {
        if (!features.enableDevMode) return;
        
        const enableDevMode = (auth as any).enableDevMode;
        if (enableDevMode) {
            enableDevMode();
            router.push('/editor');
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0b' }}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#0a0a0b' }}>
            {/* Ambient background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)', filter: 'blur(80px)' }} />
                <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)', filter: 'blur(70px)' }} />
            </div>

            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                backgroundSize: '32px 32px',
            }} />

            <div className="w-full max-w-[420px] relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Film className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-[-0.02em] text-white">MakeScript</span>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-[-0.03em] text-white mb-2">
                        {showForgotPassword ? 'Reset your password' : mode === 'login' ? 'Welcome back' : 'Create your account'}
                    </h1>
                    <p className="text-sm text-zinc-500">
                        {showForgotPassword
                            ? 'Enter your email and we\'ll send you a reset link'
                            : mode === 'login'
                                ? 'Sign in to continue editing your videos'
                                : 'Start creating AI-powered videos for free'
                        }
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/[0.08] p-6" style={{ background: 'rgba(17,17,19,0.8)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 80px -20px rgba(0,0,0,0.8)' }}>
                    {showForgotPassword ? (
                        /* Forgot Password Form */
                        <>
                            <form onSubmit={handleForgotPassword} className="space-y-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                                        placeholder="Email address" required
                                        className="w-full h-11 pl-10 pr-4 rounded-xl text-[13px] bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>

                                {error && (
                                    <div className="px-3 py-2 rounded-lg text-[12px] text-red-400 bg-red-500/10 border border-red-500/20">
                                        {error}
                                    </div>
                                )}

                                {forgotMsg && (
                                    <div className="px-3 py-2 rounded-lg text-[12px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-center">
                                        {forgotMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={forgotLoading || !features.enablePasswordReset}
                                    className="w-full h-11 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)' }}
                                >
                                    {forgotLoading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    ) : (
                                        <>
                                            Send reset link
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                            <p className="text-center mt-4">
                                <button
                                    onClick={() => { setShowForgotPassword(false); setError(''); setForgotMsg(''); }}
                                    className="text-[12px] text-indigo-400/70 hover:text-indigo-400 transition-colors"
                                >
                                    ← Back to sign in
                                </button>
                            </p>
                        </>
                    ) : (
                        /* Login / Signup Form */
                        <>
                            {/* Tab switcher */}
                            <div className="flex bg-white/[0.04] rounded-xl p-1 mb-6">
                                <button
                                    onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); setNeedsVerification(false); }}
                                    className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all ${mode === 'login'
                                        ? 'bg-white/[0.08] text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Sign in
                                </button>
                                <button
                                    onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); setNeedsVerification(false); }}
                                    className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all ${mode === 'signup'
                                        ? 'bg-white/[0.08] text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    Sign up
                                </button>
                            </div>

                            {/* Social buttons - only show Google login if configured */}
                            {features.enableGoogleLogin && (
                                <div className="mb-5">
                                    <button
                                        type="button"
                                        onClick={() => loginWithProvider('google')}
                                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 hover:text-white text-[13px] font-medium transition-all"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                        Continue with Google
                                    </button>
                                </div>
                            )}

                            {/* Dev Mode button - only show in development */}
                            {features.enableDevMode && (
                                <div className="mb-5">
                                    <button
                                        type="button"
                                        onClick={handleDevModeLogin}
                                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 text-[13px] font-medium transition-all"
                                    >
                                        <Shield className="w-4 h-4" />
                                        Dev Mode (Skip Login)
                                    </button>
                                </div>
                            )}

                            {/* Divider - only show if social buttons or dev mode are present */}
                            {(features.enableGoogleLogin || features.enableDevMode) && (
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                    <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">or continue with email</span>
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-3">
                                {mode === 'signup' && (
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <input
                                            type="text" value={name} onChange={e => setName(e.target.value)}
                                            placeholder="Full name" required minLength={2}
                                            className="w-full h-11 pl-10 pr-4 rounded-xl text-[13px] bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                        />
                                    </div>
                                )}
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="Email address" required
                                        className="w-full h-11 pl-10 pr-4 rounded-xl text-[13px] bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder={mode === 'signup' ? 'Password (min 6 chars)' : 'Password'} required minLength={6}
                                        className="w-full h-11 pl-10 pr-10 rounded-xl text-[13px] bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {error && (
                                    <div className="px-3 py-2.5 rounded-lg text-[12px] text-red-400 bg-red-500/10 border border-red-500/20">
                                        {error}
                                        {needsVerification && (
                                            <button 
                                                type="button"
                                                onClick={handleResendVerification}
                                                disabled={resendLoading}
                                                className="ml-2 text-indigo-400 hover:text-indigo-300 underline underline-offset-1 disabled:opacity-50"
                                            >
                                                {resendLoading ? 'Sending...' : 'Resend email'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {successMsg && (
                                    <div className="px-3 py-2.5 rounded-lg text-[12px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-center flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        {successMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)' }}
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    ) : (
                                        <>
                                            {mode === 'login' ? 'Sign in' : 'Create account'}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {mode === 'login' && features.enablePasswordReset && (
                                <p className="text-center mt-3">
                                    <button
                                        onClick={() => { setShowForgotPassword(true); setError(''); setSuccessMsg(''); }}
                                        className="text-[12px] text-indigo-400/70 hover:text-indigo-400 transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Bottom text */}
                <p className="text-center text-[11px] text-zinc-600 mt-6">
                    By continuing, you agree to our{' '}
                    <Link href="/terms" className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2 transition-colors">Terms</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2 transition-colors">Privacy Policy</Link>
                </p>

                {/* Feature badges */}
                <div className="flex items-center justify-center gap-4 mt-6">
                    {['Free to start', 'No credit card', 'AI-powered'].map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                            <Sparkles className="w-3 h-3 text-indigo-500/50" />
                            {f}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0b]" />}>
            <Content />
        </Suspense>
    );
}