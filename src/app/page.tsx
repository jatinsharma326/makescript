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
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [navScrolled, setNavScrolled] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') {
            setTheme(saved);
            document.documentElement.setAttribute('data-theme', saved);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        const handleScroll = () => setNavScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
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
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'py-2' : 'py-3'}`}>
                <div className={`max-w-5xl mx-auto px-2 ${navScrolled ? '' : ''}`}>
                    <div className={`flex items-center justify-between px-5 h-12 rounded-2xl border transition-all duration-500 ${navScrolled ? 'lp-nav-scrolled border-white/[0.06]' : 'bg-[var(--lp-nav)] border-[var(--lp-border)]'}`} style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                <Film className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-bold text-[15px] tracking-[-0.02em] text-[var(--lp-text)] group-hover:opacity-80 transition-opacity">MakeScript</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1 bg-[var(--lp-bg)]/30 rounded-xl px-1 py-1" style={{ backdropFilter: 'blur(10px)' }}>
                            <a href="#features" className="text-[12px] font-medium text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] px-3 py-1.5 rounded-lg hover:bg-[var(--lp-hover-s)] transition-all">Features</a>
                            <a href="#how-it-works" className="text-[12px] font-medium text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] px-3 py-1.5 rounded-lg hover:bg-[var(--lp-hover-s)] transition-all">How it works</a>
                            <a href="#pricing" className="text-[12px] font-medium text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] px-3 py-1.5 rounded-lg hover:bg-[var(--lp-hover-s)] transition-all">Pricing</a>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] hover:bg-[var(--lp-hover-s)] transition-all"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <Link href="/editor">
                                <Button className="h-8 px-4 text-[12px] font-semibold rounded-xl gap-1.5 transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}>
                                    Open Editor <ArrowRight className="w-3 h-3" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-32 md:pt-44 pb-16 px-6 relative overflow-hidden" style={{ minHeight: '85vh' }}>
                {/* Ambient gradient orbs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 65%)', filter: 'blur(80px)', opacity: 0.35, animation: 'orbFloat 8s ease-in-out infinite' }} />
                    <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)', filter: 'blur(70px)', opacity: 0.25, animation: 'orbFloat 12s ease-in-out infinite reverse' }} />
                    <div className="absolute bottom-0 left-[40%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 65%)', filter: 'blur(70px)', opacity: 0.15, animation: 'orbFloat 14s ease-in-out 4s infinite reverse' }} />
                </div>

                {/* ── 3D Rotating Wireframe Globe ── */}
                <div className="absolute pointer-events-none hidden md:block" style={{ top: '50%', left: '58%', transform: 'translate(-50%, -50%)' }}>
                    <div className="lp-globe-container" style={{ opacity: 0.6 }}>
                        {/* Glowing core */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)', animation: 'globePulse 5s ease-in-out infinite' }} />

                        {/* Wireframe sphere — multiple rings at different 3D angles */}
                        <div className="lp-globe">
                            {/* Latitude rings (horizontal planes) */}
                            <div className="lp-globe-ring" style={{ transform: 'rotateX(90deg) scale(1)' }} />
                            <div className="lp-globe-ring lp-globe-ring-bright" style={{ transform: 'rotateX(90deg) scale(0.85)' }} />
                            <div className="lp-globe-ring" style={{ transform: 'rotateX(90deg) scale(0.65)' }} />
                            <div className="lp-globe-ring" style={{ transform: 'rotateX(90deg) scale(0.4)' }} />

                            {/* Longitude rings (vertical planes) */}
                            <div className="lp-globe-ring lp-globe-ring-bright" style={{ transform: 'rotateY(0deg)' }} />
                            <div className="lp-globe-ring" style={{ transform: 'rotateY(45deg)' }} />
                            <div className="lp-globe-ring lp-globe-ring-bright" style={{ transform: 'rotateY(90deg)' }} />
                            <div className="lp-globe-ring" style={{ transform: 'rotateY(135deg)' }} />

                            {/* Tilted equator ring */}
                            <div className="lp-globe-ring" style={{ transform: 'rotateX(60deg) rotateZ(30deg)', borderColor: 'rgba(139, 92, 246, 0.2)' }} />
                        </div>

                        {/* Orbiting glowing dots */}
                        <div className="absolute top-1/2 left-1/2" style={{ transformStyle: 'preserve-3d' }}>
                            <div style={{ animation: 'orbitDot 12s linear infinite', transformStyle: 'preserve-3d' }}>
                                <div className="w-2 h-2 rounded-full" style={{ background: '#818cf8', boxShadow: '0 0 10px 2px rgba(129,140,248,0.6)' }} />
                            </div>
                        </div>
                        <div className="absolute top-1/2 left-1/2" style={{ transformStyle: 'preserve-3d' }}>
                            <div style={{ animation: 'orbitDot2 18s linear infinite', transformStyle: 'preserve-3d' }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 8px 2px rgba(167,139,250,0.5)' }} />
                            </div>
                        </div>
                        <div className="absolute top-1/2 left-1/2" style={{ transformStyle: 'preserve-3d' }}>
                            <div style={{ animation: 'orbitDot3 15s linear infinite reverse', transformStyle: 'preserve-3d' }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#06b6d4', boxShadow: '0 0 8px 2px rgba(6,182,212,0.5)' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dot grid pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
                    backgroundImage: 'radial-gradient(circle, var(--lp-text) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }} />

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    {/* Animated badge */}
                    <div className="lp-float-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 mb-8" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[12px] font-medium text-indigo-400">Now in beta — free to use</span>
                    </div>

                    <h1 className="lp-float-up lp-float-up-1 text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-[-0.04em] leading-[1.05] mb-6">
                        <span className="lp-shimmer-text">Motion graphics</span>
                        <br />for your videos,
                        <br /><span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>automated</span>
                    </h1>

                    <p className="lp-float-up lp-float-up-2 text-[17px] md:text-[19px] text-[var(--lp-text-sub)] max-w-xl mx-auto leading-relaxed mb-10">
                        Upload a video. AI transcribes it, finds the key moments,
                        and adds lower thirds, kinetic text, and particle effects — automatically.
                    </p>

                    <div className="lp-float-up lp-float-up-3 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/editor">
                            <Button className="h-12 px-8 text-[14px] font-semibold rounded-xl gap-2 transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', boxShadow: '0 4px 30px rgba(99, 102, 241, 0.4)' }}>
                                Try it free <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <a href="#how-it-works">
                            <Button variant="outline" className="h-12 px-8 text-[14px] font-medium border-[var(--lp-outline-border)] text-[var(--lp-text-sub)] hover:text-[var(--lp-text)] hover:border-[var(--lp-outline-hover)] rounded-xl gap-2 transition-all">
                                <Play className="w-3.5 h-3.5" /> Watch demo
                            </Button>
                        </a>
                    </div>

                    {/* Trusted by */}
                    <div className="lp-float-up lp-float-up-4 mt-12 flex items-center justify-center gap-3">
                        <div className="flex -space-x-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="w-7 h-7 rounded-full border-2" style={{ borderColor: 'var(--lp-bg)', background: `linear-gradient(135deg, ${['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'][i]}, ${['#818cf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa'][i]})` }} />
                            ))}
                        </div>
                        <span className="text-[12px] text-[var(--lp-text-muted)]">Trusted by <strong className="text-[var(--lp-text-sub)]">2,000+</strong> creators</span>
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
                                        {/* Animated gradient scene background — simulates a real video */}
                                        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f0b1e 0%, #1a1040 25%, #0d1b2a 50%, #162447 75%, #1a0e2e 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 12s ease infinite' }} />

                                        {/* Animated ambient light */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-0 left-1/4 w-[200px] h-[200px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'orbFloat 6s ease-in-out infinite' }} />
                                            <div className="absolute bottom-0 right-1/4 w-[160px] h-[160px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', filter: 'blur(30px)', animation: 'orbFloat 8s ease-in-out infinite reverse' }} />
                                            <div className="absolute top-1/3 right-0 w-[120px] h-[120px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)', filter: 'blur(25px)', animation: 'orbFloat 10s ease-in-out 2s infinite' }} />
                                        </div>

                                        {/* Perspective grid lines */}
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06]">
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <div key={i} className="absolute left-0 right-0" style={{ top: `${20 + i * 14}%`, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)' }} />
                                            ))}
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={`v${i}`} className="absolute top-0 bottom-0" style={{ left: `${15 + i * 18}%`, width: '1px', background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }} />
                                            ))}
                                        </div>

                                        {/* Bokeh circles */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            {[
                                                { x: '15%', y: '20%', size: 8, opacity: 0.15, delay: 0 },
                                                { x: '75%', y: '35%', size: 12, opacity: 0.1, delay: 2 },
                                                { x: '60%', y: '70%', size: 6, opacity: 0.12, delay: 4 },
                                                { x: '30%', y: '60%', size: 10, opacity: 0.08, delay: 1 },
                                                { x: '85%', y: '15%', size: 7, opacity: 0.1, delay: 3 },
                                            ].map((b, i) => (
                                                <div key={i} className="absolute rounded-full" style={{
                                                    left: b.x, top: b.y,
                                                    width: b.size, height: b.size,
                                                    background: 'rgba(255,255,255,0.9)',
                                                    opacity: b.opacity,
                                                    filter: 'blur(1px)',
                                                    animation: `orbFloat ${5 + i}s ease-in-out ${b.delay}s infinite`,
                                                }} />
                                            ))}
                                        </div>

                                        {/* Speaker silhouette — dark figure in center-left */}
                                        <div className="absolute bottom-0 left-[15%] pointer-events-none" style={{ width: '70px', height: '55%' }}>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[28px] h-[28px] rounded-full" style={{ background: 'linear-gradient(to bottom, rgba(40,40,60,0.9), rgba(30,30,50,0.95))' }} />
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40px] h-[70%] rounded-t-lg" style={{ background: 'linear-gradient(to bottom, rgba(35,35,55,0.85), rgba(25,25,45,0.95))', marginBottom: '24px' }} />
                                        </div>

                                        {/* Vignette overlay */}
                                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />

                                        {/* Subtle scanline effect */}
                                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                                            <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'white', animation: 'mgScanline 4s linear infinite' }} />
                                        </div>

                                        {/* Animated Lower Third — slides in from left */}
                                        <div className="absolute bottom-10 left-0" style={{ animation: 'mgSlideInLeft 8s ease-in-out infinite' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.95)', padding: '5px 14px 5px 10px', borderLeft: '3px solid #6366f1' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#111', letterSpacing: '-0.01em' }}>Jatin Sharma</div>
                                                <div style={{ fontSize: '8px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CEO & Founder</div>
                                            </div>
                                        </div>

                                        {/* Animated Highlight Box — top right, pops in */}
                                        <div className="absolute top-4 right-4" style={{ animation: 'mgPopIn 10s ease-in-out 2s infinite' }}>
                                            <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', padding: '6px 12px', borderRadius: '4px', animation: 'mgHighlightPulse 2s ease-in-out infinite' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.02em' }}>50K+</div>
                                                <div style={{ fontSize: '7px', fontWeight: 600, color: 'rgba(251,191,36,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Users</div>
                                            </div>
                                        </div>

                                        {/* Emoji Reaction — floats up from bottom right */}
                                        <div className="absolute bottom-12 right-6" style={{ fontSize: '22px', animation: 'mgEmojiFloat 6s ease-in-out 4s infinite' }}>🔥</div>
                                        <div className="absolute bottom-12 right-14" style={{ fontSize: '18px', animation: 'mgEmojiFloat 7s ease-in-out 5.5s infinite' }}>🚀</div>

                                        {/* Scrubbing progress bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ animation: 'mgTimelineScrub 12s linear infinite' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Animated waveform timeline */}
                                <div className="h-14 border-t border-white/[0.06] bg-[#0d0d0f] px-3 flex items-center gap-[2px]">
                                    {Array.from({ length: 48 }).map((_, i) => {
                                        const h = 6 + Math.sin(i * 0.55) * 10 + Math.abs(Math.sin(i * 1.3)) * 8;
                                        return (
                                            <div key={i} className="flex-1 flex items-end justify-center h-full py-2.5">
                                                <div
                                                    className={cn("w-[2px] rounded-full", i < 17 ? "bg-white/25" : "bg-zinc-800")}
                                                    style={{
                                                        height: `${h}px`,
                                                        animation: i < 17 ? `mgWaveBar ${0.4 + (i % 5) * 0.1}s ease-in-out ${i * 0.03}s infinite alternate` : undefined,
                                                    }}
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
            <section id="features" className="py-20 md:py-28 px-6 border-t border-[var(--lp-border)] relative overflow-hidden">
                {/* 3D Floating Polyhedra — decorative wireframe shapes */}
                <div className="absolute inset-0 pointer-events-none hidden md:block">
                    {/* Octahedron-style shape — top right */}
                    <div className="lp-poly-container" style={{ top: '10%', right: '8%', opacity: 0.4 }}>
                        <div style={{ width: '80px', height: '80px', transformStyle: 'preserve-3d', animation: 'polyFloat 20s linear infinite' }}>
                            <div className="lp-poly-face" style={{ width: '60px', height: '60px', transform: 'rotateX(45deg) rotateY(45deg) translateZ(30px)' }} />
                            <div className="lp-poly-face" style={{ width: '60px', height: '60px', transform: 'rotateX(45deg) rotateY(-45deg) translateZ(30px)' }} />
                            <div className="lp-poly-face" style={{ width: '60px', height: '60px', transform: 'rotateX(-45deg) rotateY(45deg) translateZ(30px)' }} />
                            <div className="lp-poly-face" style={{ width: '60px', height: '60px', transform: 'rotateX(-45deg) rotateY(-45deg) translateZ(30px)' }} />
                        </div>
                    </div>
                    {/* Tetrahedron-style shape — bottom left */}
                    <div className="lp-poly-container" style={{ bottom: '15%', left: '5%', opacity: 0.3 }}>
                        <div style={{ width: '70px', height: '70px', transformStyle: 'preserve-3d', animation: 'polyFloat2 25s linear infinite' }}>
                            <div className="lp-poly-face" style={{ width: '50px', height: '50px', transform: 'rotateX(30deg) translateZ(25px)', borderColor: 'rgba(139, 92, 246, 0.15)' }} />
                            <div className="lp-poly-face" style={{ width: '50px', height: '50px', transform: 'rotateY(120deg) rotateX(30deg) translateZ(25px)', borderColor: 'rgba(139, 92, 246, 0.15)' }} />
                            <div className="lp-poly-face" style={{ width: '50px', height: '50px', transform: 'rotateY(240deg) rotateX(30deg) translateZ(25px)', borderColor: 'rgba(139, 92, 246, 0.15)' }} />
                        </div>
                    </div>
                    {/* Small spinning cube — middle left */}
                    <div className="lp-poly-container" style={{ top: '45%', left: '12%', opacity: 0.25 }}>
                        <div style={{ width: '40px', height: '40px', transformStyle: 'preserve-3d', animation: 'polyFloat 18s linear infinite reverse' }}>
                            <div className="lp-poly-face" style={{ width: '35px', height: '35px', transform: 'translateZ(17px)', borderColor: 'rgba(6, 182, 212, 0.15)' }} />
                            <div className="lp-poly-face" style={{ width: '35px', height: '35px', transform: 'rotateY(90deg) translateZ(17px)', borderColor: 'rgba(6, 182, 212, 0.15)' }} />
                            <div className="lp-poly-face" style={{ width: '35px', height: '35px', transform: 'rotateX(90deg) translateZ(17px)', borderColor: 'rgba(6, 182, 212, 0.15)' }} />
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="max-w-2xl mb-14">
                        <h2 className="text-3xl md:text-[40px] font-bold tracking-[-0.025em] leading-[1.15] mb-4">
                            Built for speed,<br />not complexity
                        </h2>
                        <p className="text-[var(--lp-text-muted)] text-[16px] leading-relaxed">
                            Most video tools make you do the work. MakeScript reads your content
                            and makes the creative decisions for you.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            {
                                icon: Wand2,
                                title: 'AI overlay selection',
                                desc: 'Reads your transcript, identifies stats, names, and topics, then picks the right overlay for each moment.',
                                gradient: 'linear-gradient(135deg, #6366f1, #818cf8)'
                            },
                            {
                                icon: FileText,
                                title: 'Whisper transcription',
                                desc: 'Word-level accuracy from OpenAI Whisper. Auto-segments your video into chapters with timestamps.',
                                gradient: 'linear-gradient(135deg, #10b981, #34d399)'
                            },
                            {
                                icon: Layers,
                                title: '30+ overlay types',
                                desc: 'Lower thirds, kinetic text, highlight boxes, particle effects, scene transitions — all customizable.',
                                gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                            },
                            {
                                icon: Upload,
                                title: 'Drag and drop',
                                desc: 'Drop any MP4, WebM, or MOV into the editor. Processing starts immediately, no setup needed.',
                                gradient: 'linear-gradient(135deg, #ec4899, #f472b6)'
                            },
                            {
                                icon: Download,
                                title: '4K export',
                                desc: 'Preview overlays in real-time with Remotion, then export at 1080p or 4K with everything baked in.',
                                gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
                            },
                            {
                                icon: Sparkles,
                                title: 'Dynamic labels',
                                desc: 'AI generates contextual labels from your transcript — stats, quotes, key phrases — unique to each video.',
                                gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)'
                            },
                        ].map((feat, i) => (
                            <div key={i} className="lp-feature-card p-6 rounded-xl bg-[var(--lp-s1)] border border-[var(--lp-border-s)] group">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: feat.gradient }}>
                                    <feat.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-[15px] font-semibold text-[var(--lp-text)] mb-2">{feat.title}</h3>
                                <p className="text-[13px] text-[var(--lp-text-muted)] leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Social Proof ── */}
            <section className="py-16 px-6 border-t border-[var(--lp-border)]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-1 mb-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full -ml-2 first:ml-0 border-2" style={{
                                    borderColor: 'var(--lp-bg)',
                                    background: `linear-gradient(135deg, ${['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'][i]} 0%, ${['#818cf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#f87171', '#22d3ee', '#fb923c'][i]} 100%)`,
                                }} />
                            ))}
                        </div>
                        <p className="text-[15px] font-semibold text-[var(--lp-text)] mb-1">Trusted by 2,000+ creators</p>
                        <p className="text-[13px] text-[var(--lp-text-muted)]">From YouTube creators to startup founders</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            { name: 'Arjun M.', role: 'YouTuber, 450K subs', quote: 'Saved me 3 hours per video. The AI picks the perfect overlay every time — lower thirds for intros, kinetic text for stats.' },
                            { name: 'Sarah L.', role: 'Product Manager', quote: 'We use it for all our product demos. Upload, wait 30 seconds, and the video looks like it was edited by a pro team.' },
                            { name: 'David K.', role: 'Startup Founder', quote: 'The Whisper transcription is incredibly accurate. Motion graphics that actually match what I\'m saying — not random effects.' },
                        ].map((t, i) => (
                            <div key={i} className="lp-tilt-card">
                                <div className="lp-tilt-card-inner p-6 rounded-xl border border-[var(--lp-border-s)] bg-[var(--lp-s1)] hover:bg-[var(--lp-cell-hover)] transition-colors">
                                    <p className="text-[13px] text-[var(--lp-text-sub)] leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full" style={{
                                            background: `linear-gradient(135deg, ${['#6366f1', '#ec4899', '#10b981'][i]}, ${['#a78bfa', '#f472b6', '#34d399'][i]})`,
                                        }} />
                                        <div>
                                            <div className="text-[13px] font-semibold text-[var(--lp-text)]">{t.name}</div>
                                            <div className="text-[11px] text-[var(--lp-text-muted)]">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
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

                    <div className="grid md:grid-cols-4 gap-10 md:gap-6 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-7 left-[12%] right-[12%] h-px border-t-2 border-dashed border-[var(--lp-border-s)]" />
                        {[
                            { num: '1', title: 'Upload', desc: 'Drag a video file into the editor. MP4, WebM, MOV — up to 2GB.', color: '#6366f1', icon: '↑' },
                            { num: '2', title: 'Transcribe', desc: 'AI generates word-level captions and splits your video into segments.', color: '#10b981', icon: '¶' },
                            { num: '3', title: 'Enhance', desc: 'Each segment gets an overlay — lower third, highlight, particles — automatically.', color: '#f59e0b', icon: '✦' },
                            { num: '4', title: 'Export', desc: 'Preview everything in real-time, tweak what you want, then download.', color: '#ec4899', icon: '↓' },
                        ].map((step, i) => (
                            <div key={i} className="relative">
                                {/* 3D Rotating Cube */}
                                <div className="lp-cube-scene mb-4 relative z-10">
                                    <div className="lp-cube" style={{ animationDelay: `${i * -3}s` }}>
                                        <div className="lp-cube-face lp-cube-face--front" style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}88)`, boxShadow: `0 4px 20px ${step.color}33` }}>
                                            {step.num}
                                        </div>
                                        <div className="lp-cube-face lp-cube-face--back" style={{ background: `linear-gradient(135deg, ${step.color}88, ${step.color}44)` }}>
                                            {step.icon}
                                        </div>
                                        <div className="lp-cube-face lp-cube-face--right" style={{ background: `linear-gradient(135deg, ${step.color}66, ${step.color}33)` }}>
                                            {step.num}
                                        </div>
                                        <div className="lp-cube-face lp-cube-face--left" style={{ background: `linear-gradient(135deg, ${step.color}44, ${step.color}66)` }}>
                                            {step.icon}
                                        </div>
                                        <div className="lp-cube-face lp-cube-face--top" style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}66)` }}>
                                            {step.num}
                                        </div>
                                        <div className="lp-cube-face lp-cube-face--bottom" style={{ background: `linear-gradient(135deg, ${step.color}33, ${step.color})` }}>
                                            {step.icon}
                                        </div>
                                    </div>
                                </div>
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
                            Start free. Upgrade for premium AI models.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5 relative">
                        {/* 3D Floating Diamond behind Popular card — decorative */}
                        <div className="hidden md:block lp-diamond-container" style={{ top: '-30px', left: '50%', transform: 'translateX(-50%)', opacity: 0.35, zIndex: 0 }}>
                            <div className="lp-diamond">
                                <div className="lp-diamond-face" style={{ transform: 'translateZ(30px)' }} />
                                <div className="lp-diamond-face" style={{ transform: 'rotateY(90deg) translateZ(30px)' }} />
                                <div className="lp-diamond-face" style={{ transform: 'rotateY(180deg) translateZ(30px)' }} />
                                <div className="lp-diamond-face" style={{ transform: 'rotateY(270deg) translateZ(30px)' }} />
                                <div className="lp-diamond-face" style={{ transform: 'rotateX(90deg) translateZ(30px)' }} />
                                <div className="lp-diamond-face" style={{ transform: 'rotateX(-90deg) translateZ(30px)' }} />
                            </div>
                        </div>

                        {/* Free */}
                        <div className="lp-pricing-3d relative z-10">
                            <div className="lp-pricing-3d-inner p-7 rounded-xl border border-[var(--lp-border-s)] bg-[var(--lp-s1)]">
                                <div className="text-[13px] font-medium text-[var(--lp-text-muted)] mb-1">Free</div>
                                <div className="text-4xl font-bold text-[var(--lp-text)] mb-2">$0</div>
                                <p className="text-[12px] text-[var(--lp-text-muted)] mb-6">Get started with powerful open models</p>
                                <div className="space-y-2.5 mb-6">
                                    {['3 videos / month', 'AI transcription (Whisper)', '10 overlay types', '1080p export'].map(f => (
                                        <div key={f} className="flex items-center gap-2 text-[13px] text-[var(--lp-text-sub)]">
                                            <Check className="w-3.5 h-3.5 text-[var(--lp-check-free)] shrink-0" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold text-[var(--lp-text-muted)] uppercase tracking-wider mb-2">AI Models</p>
                                    <div className="space-y-1">
                                        {['DeepSeek V3.1', 'Llama 3.3 70B', 'GPT-5 Nano', 'Gemini 3 Flash'].map(m => (
                                            <div key={m} className="text-[11px] text-[var(--lp-text-sub)] flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-current opacity-40" />{m}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Link href="/editor" className="block">
                                    <Button variant="outline" className="w-full h-10 text-[13px] font-medium border-[var(--lp-outline-border)] hover:border-[var(--lp-outline-hover)] text-[var(--lp-text-sub)] rounded-lg transition-colors">
                                        Get started
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Creator */}
                        <div className="lp-pricing-3d relative z-10">
                            <div className="lp-pricing-3d-inner p-7 rounded-xl border-2 border-indigo-500/30 bg-[var(--lp-s2)] relative">
                                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>Popular</div>
                                <div className="text-[13px] font-medium text-indigo-400 mb-1">Creator</div>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-bold text-[var(--lp-text)]">$12</span>
                                    <span className="text-[var(--lp-text-faint)] text-sm">/mo</span>
                                </div>
                                <p className="text-[12px] text-[var(--lp-text-muted)] mb-6">Premium models for serious creators</p>
                                <div className="space-y-2.5 mb-6">
                                    {['20 videos / month', 'Priority processing', '4K export', 'No watermark', 'Brand kit'].map(f => (
                                        <div key={f} className="flex items-center gap-2 text-[13px] text-[var(--lp-text-2)]">
                                            <Check className="w-3.5 h-3.5 text-[var(--lp-check-pro)] shrink-0" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold text-[var(--lp-text-muted)] uppercase tracking-wider mb-2">AI Models (Free +)</p>
                                    <div className="space-y-1">
                                        {['GPT-5', 'Claude Sonnet 4', 'Gemini 3 Pro', 'Claude Haiku 4.5', 'Kimi K2.5'].map(m => (
                                            <div key={m} className="text-[11px] text-[var(--lp-text-2)] flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-indigo-400" />{m}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Link href="/editor" className="block">
                                    <Button className="w-full h-10 text-[13px] font-medium bg-[var(--lp-btn)] text-[var(--lp-btn-fg)] hover:bg-[var(--lp-btn-hover)] rounded-lg transition-colors">
                                        Start free trial
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Studio */}
                        <div className="lp-pricing-3d relative z-10">
                            <div className="lp-pricing-3d-inner p-7 rounded-xl border border-[var(--lp-border-s)] bg-[var(--lp-s1)]">
                                <div className="text-[13px] font-medium text-amber-400 mb-1">Studio</div>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-bold text-[var(--lp-text)]">$29</span>
                                    <span className="text-[var(--lp-text-faint)] text-sm">/mo</span>
                                </div>
                                <p className="text-[12px] text-[var(--lp-text-muted)] mb-6">The best AI models, unlimited access</p>
                                <div className="space-y-2.5 mb-6">
                                    {['Unlimited videos', 'All Creator features', 'Custom branding', 'API access', 'Team collaboration'].map(f => (
                                        <div key={f} className="flex items-center gap-2 text-[13px] text-[var(--lp-text-sub)]">
                                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold text-[var(--lp-text-muted)] uppercase tracking-wider mb-2">AI Models (All +)</p>
                                    <div className="space-y-1">
                                        {['GPT-5.2', 'Claude Opus 4.6', 'Claude Sonnet 4.6'].map(m => (
                                            <div key={m} className="text-[11px] text-[var(--lp-text-sub)] flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-amber-400" />{m}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Link href="/editor" className="block">
                                    <Button variant="outline" className="w-full h-10 text-[13px] font-medium border-amber-500/30 hover:border-amber-400/50 text-amber-400/80 hover:text-amber-400 rounded-lg transition-colors">
                                        Contact sales
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-20 md:py-28 px-6 border-t border-[var(--lp-border)]">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-[40px] font-bold tracking-[-0.025em] leading-[1.15] mb-12">
                        FAQ
                    </h2>

                    <div className="space-y-px rounded-xl overflow-hidden border border-[var(--lp-border-s)]">
                        {[
                            { q: 'What video formats are supported?', a: 'MP4, WebM, and MOV files up to 2GB. We recommend MP4 with H.264 encoding for the best compatibility and fastest processing.' },
                            { q: 'How does the AI choose which overlays to use?', a: 'Our AI analyzes each transcript segment for keywords, context, and sentiment. It scores all possible overlay types and picks the best match — stats get highlight boxes, names get lower thirds, transitions get particle effects.' },
                            { q: 'Can I export in 4K?', a: 'Yes! Free users can export at 1080p. Pro users unlock 4K exports with all overlays baked into the final video file.' },
                            { q: 'Is my video data private?', a: 'All processing happens in your browser. Videos are never uploaded to our servers — transcription uses a local Whisper model and overlay generation runs client-side.' },
                            { q: 'Can I customize the overlays after they\'re generated?', a: 'Absolutely. Click any segment in the transcript panel to change its overlay type, edit the text, adjust timing, or remove it entirely. You have full control.' },
                        ].map((faq, i) => (
                            <div key={i} className="bg-[var(--lp-s1)]">
                                <button
                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--lp-cell-hover)] transition-colors"
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    <span className="text-[14px] font-medium text-[var(--lp-text)] pr-4">{faq.q}</span>
                                    <span className={`text-[var(--lp-text-muted)] transition-transform duration-200 shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="px-6 pb-4 text-[13px] text-[var(--lp-text-muted)] leading-relaxed">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 md:py-28 px-6 border-t border-[var(--lp-border)] relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(100px)' }} />
                </div>

                {/* 3D Orbit Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block" style={{ perspective: '800px', transformStyle: 'preserve-3d' }}>
                    {/* Ring 1 — large, slow */}
                    <div className="lp-cta-ring" style={{ width: '400px', height: '400px', top: '-200px', left: '-200px', animation: 'ctaOrbit 25s linear infinite', opacity: 0.4 }} />
                    {/* Ring 2 — medium, tilted */}
                    <div className="lp-cta-ring" style={{ width: '320px', height: '320px', top: '-160px', left: '-160px', animation: 'ctaOrbit2 20s linear infinite', borderColor: 'rgba(139, 92, 246, 0.2)', opacity: 0.35 }} />
                    {/* Ring 3 — small, fast */}
                    <div className="lp-cta-ring" style={{ width: '240px', height: '240px', top: '-120px', left: '-120px', animation: 'ctaOrbit 15s linear infinite reverse', borderColor: 'rgba(6, 182, 212, 0.15)', opacity: 0.3 }} />

                    {/* Orbiting dots */}
                    <div className="absolute top-0 left-0" style={{ transformStyle: 'preserve-3d', animation: 'ctaOrbit 25s linear infinite' }}>
                        <div style={{ animation: 'ctaOrbitDot 10s linear infinite', '--orbit-radius': '200px' } as React.CSSProperties}>
                            <div className="w-2 h-2 rounded-full" style={{ background: '#818cf8', boxShadow: '0 0 10px 2px rgba(129,140,248,0.6)' }} />
                        </div>
                    </div>
                    <div className="absolute top-0 left-0" style={{ transformStyle: 'preserve-3d', animation: 'ctaOrbit2 20s linear infinite' }}>
                        <div style={{ animation: 'ctaOrbitDot 14s linear infinite reverse', '--orbit-radius': '160px' } as React.CSSProperties}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 8px 2px rgba(167,139,250,0.5)' }} />
                        </div>
                    </div>
                    <div className="absolute top-0 left-0" style={{ transformStyle: 'preserve-3d', animation: 'ctaOrbit 15s linear infinite reverse' }}>
                        <div style={{ animation: 'ctaOrbitDot 8s linear infinite', '--orbit-radius': '120px' } as React.CSSProperties}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#06b6d4', boxShadow: '0 0 8px 2px rgba(6,182,212,0.5)' }} />
                        </div>
                    </div>
                </div>

                <div className="max-w-xl mx-auto text-center relative z-10">
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
                        Ready to make your videos <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>stand out</span>?
                    </h2>
                    <p className="text-[var(--lp-text-muted)] mb-8 text-[16px]">
                        Join 2,000+ creators using AI-powered motion graphics.
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
                                className="flex-1 h-11 px-4 rounded-xl text-[13px] bg-[var(--lp-input-bg)] border border-[var(--lp-input-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-input-ph)] focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                            <Button type="submit" className="h-11 px-6 text-[13px] font-semibold rounded-xl shrink-0 transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)' }}>
                                Join waitlist
                            </Button>
                        </form>
                    )}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-[var(--lp-border)] py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Film className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[13px] font-medium text-[var(--lp-text-faint)]">MakeScript</span>
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
