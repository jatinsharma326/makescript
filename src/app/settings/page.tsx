'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { getUsageDisplay, getUsage } from '../../lib/usage';
import { TIERS } from '../../lib/models';
import { Film, User, CreditCard, BarChart3, ArrowLeft, LogOut, Trash2, Shield, Sparkles, Crown, Zap } from 'lucide-react';
import type { ModelTier } from '../../lib/models';

export default function SettingsPage() {
    const [mounted, setMounted] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const { user, logout, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('theme');
        document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
    }, []);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (!mounted || isLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-[var(--lp-bg)]"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--lp-text-faint)]" /></div>;
    }

    const usage = getUsageDisplay(user?.plan, user?.id);
    const usageData = getUsage(undefined, user?.id);
    const tierInfo = TIERS[user.plan as ModelTier] || TIERS.free;
    const tierIcons: Record<string, React.ReactNode> = {
        free: <Sparkles className="w-4 h-4" />,
        creator: <Zap className="w-4 h-4" />,
        studio: <Crown className="w-4 h-4" />,
    };

    const handleSignOut = () => {
        logout();
        router.push('/');
    };

    const handleDeleteAccount = () => {
        // Clear all user data (legacy + per-user scoped)
        localStorage.removeItem('makescript-user');
        localStorage.removeItem('makescript-users');
        localStorage.removeItem('makescript-usage');
        if (user?.id) {
            localStorage.removeItem(`makescript-usage:${user.id}`);
        }
        localStorage.removeItem('makescript-onboarded');
        localStorage.removeItem('makescript-project-list');
        logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-[var(--lp-bg)] text-[var(--lp-text)]">
            {/* Header */}
            <header className="border-b border-[var(--lp-border)] py-4 px-6">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/editor" className="flex items-center gap-1.5 text-[13px] text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to editor
                        </Link>
                    </div>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Film className="w-3 h-3 text-white" />
                        </div>
                    </Link>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-[-0.03em] mb-1">Settings</h1>
                    <p className="text-[var(--lp-text-muted)] text-sm">Manage your account and subscription</p>
                </div>

                {/* Profile */}
                <div className="rounded-xl border border-[var(--lp-border-s)] bg-[var(--lp-s1)] p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <User className="w-4 h-4 text-[var(--lp-text-muted)]" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--lp-text-muted)]">Profile</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold" style={{ background: `linear-gradient(135deg, ${user.avatar || '#6366f1'}, ${user.avatar ? user.avatar + '88' : '#818cf8'})` }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold">{user.name}</p>
                            <p className="text-[13px] text-[var(--lp-text-muted)]">{user.email}</p>
                            <p className="text-[11px] text-[var(--lp-text-faint)] mt-0.5">Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Plan */}
                <div className="rounded-xl border border-[var(--lp-border-s)] bg-[var(--lp-s1)] p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <CreditCard className="w-4 h-4 text-[var(--lp-text-muted)]" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--lp-text-muted)]">Subscription</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: tierInfo.color + '15', color: tierInfo.color }}>
                                {tierIcons[user.plan] || tierIcons.free}
                            </div>
                            <div>
                                <p className="text-[15px] font-semibold">{tierInfo.name} Plan</p>
                                <p className="text-[13px] text-[var(--lp-text-muted)]">
                                    {tierInfo.price > 0 ? `$${tierInfo.price}/month` : 'Free forever'}
                                </p>
                            </div>
                        </div>
                        <Link href="/pricing" className="h-8 px-4 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-all">
                            {user.plan === 'free' ? 'Upgrade' : 'Change plan'}
                        </Link>
                    </div>
                </div>

                {/* Usage */}
                <div className="rounded-xl border border-[var(--lp-border-s)] bg-[var(--lp-s1)] p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 className="w-4 h-4 text-[var(--lp-text-muted)]" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--lp-text-muted)]">Usage This Month</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[13px] text-[var(--lp-text-sub)]">Videos created</span>
                                <span className="text-[13px] font-semibold">{usage.text}</span>
                            </div>
                            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${usage.percent}%`,
                                        background: usage.isAtLimit ? '#ef4444' : usage.isNearLimit ? '#f59e0b' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                    }}
                                />
                            </div>
                            {usage.isNearLimit && !usage.isAtLimit && (
                                <p className="text-[11px] text-amber-400 mt-1.5">You&apos;re approaching your monthly limit</p>
                            )}
                            {usage.isAtLimit && (
                                <p className="text-[11px] text-red-400 mt-1.5">
                                    Monthly limit reached.{' '}
                                    <Link href="/pricing" className="underline underline-offset-2">Upgrade</Link> for more.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Shield className="w-4 h-4 text-red-400/70" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-red-400/70">Danger Zone</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[13px] font-medium">Sign out</p>
                                <p className="text-[11px] text-[var(--lp-text-muted)]">Sign out of your account on this device</p>
                            </div>
                            <button onClick={handleSignOut} className="h-8 px-4 rounded-lg text-[12px] font-medium flex items-center gap-1.5 border border-[var(--lp-border-s)] text-[var(--lp-text-sub)] hover:bg-white/[0.04] transition-all">
                                <LogOut className="w-3.5 h-3.5" /> Sign out
                            </button>
                        </div>
                        <div className="h-px bg-red-500/10" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[13px] font-medium text-red-400">Delete account</p>
                                <p className="text-[11px] text-[var(--lp-text-muted)]">Permanently delete your account and all data</p>
                            </div>
                            {!confirmDelete ? (
                                <button onClick={() => setConfirmDelete(true)} className="h-8 px-4 rounded-lg text-[12px] font-medium flex items-center gap-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setConfirmDelete(false)} className="h-8 px-3 rounded-lg text-[12px] font-medium text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors">Cancel</button>
                                    <button onClick={handleDeleteAccount} className="h-8 px-4 rounded-lg text-[12px] font-bold bg-red-500 text-white hover:bg-red-600 transition-all">Confirm delete</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
