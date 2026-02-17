'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import {
    Film, ArrowRight, FileText, Sparkles, Download, Upload,
    Layers, Wand2, Play, Check, Moon, Sun
} from 'lucide-react';

export default function LandingPage() {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [email, setEmail] = useState('');
    const [emailSubmitted, setEmailSubmitted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') {
            setTheme(saved);
            document.documentElement.setAttribute('data-theme', saved);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--lp-bg)]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--lp-text-faint)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--lp-bg)] text-[var(--lp-text)] transition-colors duration-300">

            {/* ── Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--lp-nav)] backdrop-blur-md border-b border-[var(--lp-border)]">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Film className="w-5 h-5 text-[var(--lp-text)]" />
                        <span className="font-semibold text-[15px] tracking-[-0.01em]">MakeScript</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-6">
                            <a href="#features" className="text-[13px] text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors">Features</a>
                            <a href="#how-it-works" className="text-[13px] text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors">How it works</a>
                            <a href="#pricing" className="text-[13px] text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors">Pricing</a>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] hover:bg-[var(--lp-hover-s)] transition-all"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <Link href="/editor">
                            <Button className="h-8 px-4 text-[13px] font-medium bg-[var(--lp-btn)] text-[var(--lp-btn-fg)] hover:bg-[var(--lp-btn-hover)] rounded-lg transition-colors">
                                Open Editor
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-32 md:pt-40 pb-4 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-[13px] text-[var(--lp-text-muted)] font-medium mb-6 tracking-wide">
                        Currently in beta &mdash; free to use
                    </p>

                    <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-[-0.035em] leading-[1.08] text-[var(--lp-text)] mb-6">
                        Motion graphics for{'\u00A0'}your videos, automated
                    </h1>

                    <p className="text-[17px] md:text-[19px] text-[var(--lp-text-sub)] max-w-xl mx-auto leading-relaxed mb-10">
                        Upload a video. AI transcribes it, finds the key moments,
                        and adds lower thirds, kinetic text, and particle effects — automatically.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/editor">
                            <Button className="h-11 px-7 text-[14px] font-medium bg-[var(--lp-btn)] text-[var(--lp-btn-fg)] hover:bg-[var(--lp-btn-hover)] rounded-lg gap-2 transition-colors">
                                Try it free <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <a href="#how-it-works">
                            <Button variant="outline" className="h-11 px-7 text-[14px] font-medium border-[var(--lp-outline-border)] text-[var(--lp-text-sub)] hover:text-[var(--lp-text)] hover:border-[var(--lp-outline-hover)] rounded-lg gap-2 transition-colors">
                                See how it works
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Editor Mockup (stays dark in both themes — it's showing the product) ── */}
            <section className="px-6 pt-16 pb-24">
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-xl overflow-hidden border border-[var(--lp-border-s)] bg-[#111113]" style={{ boxShadow: 'var(--lp-shadow)' }}>
                        {/* Title bar */}
                        <div className="h-10 bg-[#161618] border-b border-white/[0.06] flex items-center px-4">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-[11px] font-mono text-zinc-600">MakeScript Editor</span>
                            </div>
                            <div className="w-12" />
                        </div>

                        {/* Editor body */}
                        <div className="flex" style={{ height: '420px' }}>
                            {/* Left: Segments */}
                            <div className="w-56 shrink-0 hidden lg:flex flex-col border-r border-white/[0.06] bg-[#0d0d0f]">
                                <div className="p-3 border-b border-white/[0.06]">
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">Transcript</div>
                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-emerald-500/60 rounded-full" />
                                    </div>
                                    <div className="text-[9px] text-zinc-700 mt-1">6 segments detected</div>
                                </div>
                                <div className="flex-1 p-2 space-y-0.5 overflow-hidden">
                                    {[
                                        { time: '0:00', text: 'Welcome to our product...', overlay: 'Lower Third', color: 'bg-blue-400' },
                                        { time: '0:05', text: '50K users in 6 months', overlay: 'Highlight', color: 'bg-amber-400' },
                                        { time: '0:12', text: 'Let me show the numbers', overlay: 'Kinetic Text', color: 'bg-rose-400' },
                                        { time: '0:18', text: 'Revenue hit $2M ARR', overlay: 'Particles', color: 'bg-violet-400' },
                                        { time: '0:25', text: 'Here is the growth chart', overlay: 'Scene Cut', color: 'bg-emerald-400' },
                                        { time: '0:31', text: 'Thanks for watching', overlay: null, color: '' },
                                    ].map((seg, i) => (
                                        <div key={i} className={cn(
                                            "px-2.5 py-2 rounded-md text-[11px]",
                                            i === 1 ? "bg-white/[0.04] ring-1 ring-white/[0.08]" : "hover:bg-white/[0.02]"
                                        )}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono text-zinc-700 w-5 shrink-0">{seg.time}</span>
                                                <span className={cn("truncate", i === 1 ? "text-zinc-200" : "text-zinc-500")}>{seg.text}</span>
                                            </div>
                                            {seg.overlay && (
                                                <div className="ml-7 mt-1 flex items-center gap-1.5">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", seg.color)} />
                                                    <span className="text-[9px] text-zinc-600 font-medium">{seg.overlay}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Center: Video canvas */}
                            <div className="flex-1 flex flex-col bg-black">
                                <div className="flex-1 flex items-center justify-center p-6 md:p-8 relative">
                                    <div className="relative w-full max-w-[520px] aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-white/[0.04]">
                                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/40 via-zinc-900 to-black" />

                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                            </div>
                                        </div>

                                        <div className="absolute bottom-8 left-4">
                                            <div className="bg-white text-black px-3 py-1 text-[11px] font-semibold rounded-sm">
                                                Jatin Sharma
                                            </div>
                                            <div className="bg-zinc-900 text-zinc-400 px-3 py-0.5 text-[9px] font-medium uppercase tracking-wider">
                                                CEO &amp; Founder
                                            </div>
                                        </div>

                                        <div className="absolute top-4 right-4 bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded">
                                            50K Users
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800">
                                            <div className="h-full w-[35%] bg-white/70" />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-14 border-t border-white/[0.06] bg-[#0d0d0f] px-3 flex items-center gap-[2px]">
                                    {Array.from({ length: 48 }).map((_, i) => {
                                        const h = 6 + Math.sin(i * 0.55) * 10 + Math.abs(Math.sin(i * 1.3)) * 8;
                                        return (
                                            <div key={i} className="flex-1 flex items-end justify-center h-full py-2.5">
                                                <div
                                                    className={cn("w-[2px] rounded-full", i < 17 ? "bg-white/25" : "bg-zinc-800")}
                                                    style={{ height: `${h}px` }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Properties */}
                            <div className="w-52 shrink-0 hidden xl:flex flex-col border-l border-white/[0.06] bg-[#0d0d0f] p-3">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-3">Properties</div>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Type', value: 'Highlight Box' },
                                        { label: 'Start', value: '0:05.200' },
                                        { label: 'End', value: '0:11.800' },
                                        { label: 'Text', value: '50K Users' },
                                    ].map((prop, i) => (
                                        <div key={i} className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                                            <div className="text-[9px] text-zinc-600 mb-0.5">{prop.label}</div>
                                            <div className="text-[11px] text-zinc-300 font-medium font-mono">{prop.value}</div>
                                        </div>
                                    ))}
                                    <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                                        <div className="text-[9px] text-zinc-600 mb-2">Opacity</div>
                                        <div className="h-1 bg-zinc-800 rounded-full">
                                            <div className="h-full w-[80%] bg-white/30 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                                        <div className="text-[9px] text-zinc-600 mb-2">Scale</div>
                                        <div className="h-1 bg-zinc-800 rounded-full">
                                            <div className="h-full w-[100%] bg-white/30 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section id="features" className="py-20 md:py-28 px-6 border-t border-[var(--lp-border)]">
                <div className="max-w-5xl mx-auto">
                    <div className="max-w-2xl mb-14">
                        <h2 className="text-3xl md:text-[40px] font-bold tracking-[-0.025em] leading-[1.15] mb-4">
                            Built for speed,<br />not complexity
                        </h2>
                        <p className="text-[var(--lp-text-muted)] text-[16px] leading-relaxed">
                            Most video tools make you do the work. MakeScript reads your content
                            and makes the creative decisions for you.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-px bg-[var(--lp-border-s)] rounded-xl overflow-hidden border border-[var(--lp-border-s)]">
                        {[
                            {
                                icon: Wand2,
                                title: 'AI overlay selection',
                                desc: 'Reads your transcript, identifies stats, names, and topics, then picks the right overlay for each moment.'
                            },
                            {
                                icon: FileText,
                                title: 'Whisper transcription',
                                desc: 'Word-level accuracy from OpenAI Whisper. Auto-segments your video into chapters with timestamps.'
                            },
                            {
                                icon: Layers,
                                title: '30+ overlay types',
                                desc: 'Lower thirds, kinetic text, highlight boxes, particle effects, scene transitions — all customizable.'
                            },
                            {
                                icon: Upload,
                                title: 'Drag and drop',
                                desc: 'Drop any MP4, WebM, or MOV into the editor. Processing starts immediately, no setup needed.'
                            },
                            {
                                icon: Download,
                                title: '4K export',
                                desc: 'Preview overlays in real-time with Remotion, then export at 1080p or 4K with everything baked in.'
                            },
                            {
                                icon: Sparkles,
                                title: 'Dynamic labels',
                                desc: 'AI generates contextual labels from your transcript — stats, quotes, key phrases — unique to each video.'
                            },
                        ].map((feat, i) => (
                            <div key={i} className="p-7 bg-[var(--lp-s1)] hover:bg-[var(--lp-cell-hover)] transition-colors group">
                                <feat.icon className="w-[18px] h-[18px] text-[var(--lp-text-faint)] mb-4 group-hover:text-[var(--lp-text-sub)] transition-colors" />
                                <h3 className="text-[14px] font-semibold text-[var(--lp-text)] mb-2">{feat.title}</h3>
                                <p className="text-[13px] text-[var(--lp-text-muted)] leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how-it-works" className="py-20 md:py-28 px-6 border-t border-[var(--lp-border)]">
                <div className="max-w-5xl mx-auto">
                    <div className="max-w-2xl mb-16">
                        <h2 className="text-3xl md:text-[40px] font-bold tracking-[-0.025em] leading-[1.15] mb-4">
                            Upload to export<br />in four steps
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-10 md:gap-8">
                        {[
                            { num: '1', title: 'Upload', desc: 'Drag a video file into the editor. MP4, WebM, MOV — up to 2GB.' },
                            { num: '2', title: 'Transcribe', desc: 'AI generates word-level captions and splits your video into segments.' },
                            { num: '3', title: 'Enhance', desc: 'Each segment gets an overlay — lower third, highlight, particles — automatically.' },
                            { num: '4', title: 'Export', desc: 'Preview everything in real-time, tweak what you want, then download.' },
                        ].map((step, i) => (
                            <div key={i}>
                                <div className="text-[56px] font-bold text-[var(--lp-step-num)] leading-none mb-3 tracking-tight">{step.num}</div>
                                <h3 className="text-[15px] font-semibold text-[var(--lp-text)] mb-2">{step.title}</h3>
                                <p className="text-[13px] text-[var(--lp-text-muted)] leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
            <section id="pricing" className="py-20 md:py-28 px-6 border-t border-[var(--lp-border)]">
                <div className="max-w-5xl mx-auto">
                    <div className="max-w-2xl mb-14">
                        <h2 className="text-3xl md:text-[40px] font-bold tracking-[-0.025em] leading-[1.15] mb-4">
                            Simple pricing
                        </h2>
                        <p className="text-[var(--lp-text-muted)] text-[16px]">
                            Start free. No credit card required.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-px bg-[var(--lp-border-s)] rounded-xl overflow-hidden border border-[var(--lp-border-s)] max-w-2xl">
                        {/* Free */}
                        <div className="p-8 bg-[var(--lp-s1)]">
                            <div className="text-[13px] font-medium text-[var(--lp-text-muted)] mb-1">Free</div>
                            <div className="text-4xl font-bold text-[var(--lp-text)] mb-6">$0</div>
                            <div className="space-y-3 mb-8">
                                {['3 videos / month', 'AI transcription', '10 overlay types', '1080p export'].map(f => (
                                    <div key={f} className="flex items-center gap-2.5 text-[13px] text-[var(--lp-text-sub)]">
                                        <Check className="w-3.5 h-3.5 text-[var(--lp-check-free)] shrink-0" />
                                        {f}
                                    </div>
                                ))}
                            </div>
                            <Link href="/editor" className="block">
                                <Button variant="outline" className="w-full h-10 text-[13px] font-medium border-[var(--lp-outline-border)] hover:border-[var(--lp-outline-hover)] text-[var(--lp-text-sub)] rounded-lg transition-colors">
                                    Get started
                                </Button>
                            </Link>
                        </div>

                        {/* Pro */}
                        <div className="p-8 bg-[var(--lp-s2)]">
                            <div className="text-[13px] font-medium text-[var(--lp-text-muted)] mb-1">Pro</div>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-[var(--lp-text)]">$29</span>
                                <span className="text-[var(--lp-text-faint)] text-sm">/mo</span>
                            </div>
                            <div className="space-y-3 mb-8">
                                {['Unlimited videos', 'Priority processing', '30+ overlay types', '4K export', 'Custom branding', 'API access'].map(f => (
                                    <div key={f} className="flex items-center gap-2.5 text-[13px] text-[var(--lp-text-2)]">
                                        <Check className="w-3.5 h-3.5 text-[var(--lp-check-pro)] shrink-0" />
                                        {f}
                                    </div>
                                ))}
                            </div>
                            <Link href="/editor" className="block">
                                <Button className="w-full h-10 text-[13px] font-medium bg-[var(--lp-btn)] text-[var(--lp-btn-fg)] hover:bg-[var(--lp-btn-hover)] rounded-lg transition-colors">
                                    Start free trial
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 md:py-28 px-6 border-t border-[var(--lp-border)]">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                        Try MakeScript today
                    </h2>
                    <p className="text-[var(--lp-text-muted)] mb-8">
                        Free to start. No watermarks, no limits on preview.
                    </p>

                    {emailSubmitted ? (
                        <div className="inline-flex items-center gap-2 text-sm text-[var(--lp-text-sub)]">
                            <Check className="w-4 h-4 text-emerald-500" />
                            You&apos;re on the list.
                        </div>
                    ) : (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (!email.includes('@')) return;
                            const list = JSON.parse(localStorage.getItem('makescript-waitlist') || '[]');
                            list.push({ email, date: new Date().toISOString() });
                            localStorage.setItem('makescript-waitlist', JSON.stringify(list));
                            setEmailSubmitted(true);
                        }} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="you@email.com" required
                                className="flex-1 h-10 px-3 rounded-lg text-[13px] bg-[var(--lp-input-bg)] border border-[var(--lp-input-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-input-ph)] focus:outline-none focus:border-[var(--lp-input-focus)] transition-colors"
                            />
                            <Button type="submit" className="h-10 px-5 text-[13px] font-medium bg-[var(--lp-btn)] text-[var(--lp-btn-fg)] hover:bg-[var(--lp-btn-hover)] rounded-lg shrink-0 transition-colors">
                                Join waitlist
                            </Button>
                        </form>
                    )}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-[var(--lp-border)] py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-[var(--lp-text-faint)]" />
                        <span className="text-[13px] text-[var(--lp-text-faint)]">MakeScript</span>
                    </div>
                    <div className="flex items-center gap-6 text-[12px] text-[var(--lp-text-dim)]">
                        <a href="#" className="hover:text-[var(--lp-text-sub)] transition-colors">Privacy</a>
                        <a href="#" className="hover:text-[var(--lp-text-sub)] transition-colors">Terms</a>
                        <a href="#" className="hover:text-[var(--lp-text-sub)] transition-colors">Contact</a>
                        <span>&copy; 2026</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
