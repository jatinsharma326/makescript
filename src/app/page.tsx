'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

/* ===== Inline SVG Icons ===== */
const Icons = {
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  Sun: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
  Moon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  Wand: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M17.8 11.8L19 13" /><path d="M15 9h0" /><path d="M17.8 6.2L19 5" /><path d="M11.2 6.2L10 5" /><path d="M6.5 12.5L3 16l2 2 3.5-3.5" /><path d="m3 16 2 2" /><path d="M12.2 11.8L2 22" /></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Play: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  Layers: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  Type: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>,
  Smile: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
  ZoomIn: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
  Repeat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
  MessageSquare: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  Github: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>,
  Twitter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Sparkles: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>,
};

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}>
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  const features = [
    { icon: <Icons.Layers />, name: 'Lower Third', desc: 'Professional name tags & titles' },
    { icon: <Icons.Type />, name: 'Highlight', desc: 'Emphasize key text on screen' },
    { icon: <Icons.Smile />, name: 'Emoji Burst', desc: 'Animated reaction overlays' },
    { icon: <Icons.ZoomIn />, name: 'Zoom Effect', desc: 'Dynamic zoom into action' },
    { icon: <Icons.Repeat />, name: 'Transitions', desc: 'Cinematic scene changes' },
    { icon: <Icons.MessageSquare />, name: 'Captions', desc: 'Animated subtitle overlays' },
  ];

  const steps = [
    { num: '01', icon: <Icons.Upload />, title: 'Upload', desc: 'Drag & drop any video file. MP4, WebM supported up to 50MB.' },
    { num: '02', icon: <Icons.FileText />, title: 'Transcribe', desc: 'Whisper AI generates word-level subtitles with millisecond accuracy.' },
    { num: '03', icon: <Icons.Wand />, title: 'Enhance', desc: 'AI suggests motion graphics or pick from our template library manually.' },
    { num: '04', icon: <Icons.Download />, title: 'Export', desc: 'Preview in real-time and download your enhanced video in full quality.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden noise">

      {/* ===== Navigation ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              M
            </div>
            <span className="text-lg font-bold tracking-tight">
              Make<span className="gradient-text">Script</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="btn-ghost text-xs">Features</a>
            <a href="#how-it-works" className="btn-ghost text-xs">How It Works</a>
            <a href="#pricing" className="btn-ghost text-xs">Pricing</a>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost p-2" title="Toggle theme">
              {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
            </button>
            <Link href="/editor" className="btn-primary text-xs py-2 px-5 hidden sm:inline-flex">
              Open Editor <Icons.ArrowRight />
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-24 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Ambient orbs */}
        <div className="orb w-[600px] h-[600px] -top-40 left-1/2 -translate-x-1/2"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12), transparent 70%)' }} />
        <div className="orb w-[400px] h-[400px] top-20 -right-32"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08), transparent 70%)', animationDelay: '4s' }} />
        <div className="orb w-[300px] h-[300px] top-60 -left-20"
          style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06), transparent 70%)', animationDelay: '8s' }} />

        <div className="relative z-10 max-w-4xl">
          <div className="badge mb-8 animate-fade-in">
            <Icons.Sparkles />
            AI-Powered Video Enhancement
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 text-balance animate-fade-in stagger-1 leading-[1.05]">
            <span className="gradient-text-hero">Add Motion Graphics</span>
            <br />
            <span className="gradient-text-hero">to Any Video</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10 animate-fade-in stagger-2">
            Upload a video, get instant AI transcripts, and add stunning animated overlays — lower thirds, emoji bursts, zoom effects, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in stagger-3">
            <Link href="/editor" className="btn-primary text-sm px-8 py-3.5 rounded-xl">
              <Icons.Sparkles /> Start Creating — Free
            </Link>
            <a href="#how-it-works" className="btn-secondary text-sm px-8 py-3.5 rounded-xl">
              See How It Works
            </a>
          </div>
        </div>

        {/* ===== Demo Preview ===== */}
        <div className="relative mt-16 md:mt-20 w-full max-w-5xl animate-fade-in stagger-4">
          {/* Glow behind card */}
          <div className="absolute -inset-4 rounded-3xl opacity-60" style={{ background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1), transparent 70%)' }} />

          <div className="card-premium p-1 rounded-2xl relative">
            <div className="rounded-xl overflow-hidden bg-background/50">
              <div className="flex h-full aspect-[16/9.5] gap-0">
                {/* Video Preview Area */}
                <div className="flex-[2.5] relative flex items-center justify-center overflow-hidden grid-bg p-4">
                  <Icons.Play />

                  {/* Mockup lower third */}
                  <div className="absolute bottom-14 left-8 flex flex-col gap-1 animate-slide-in" style={{ animationDelay: '1s' }}>
                    <div className="px-3 py-1.5 rounded-md text-sm font-bold text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      Jatin Sharma
                    </div>
                    <div className="bg-background/80 backdrop-blur text-muted-foreground text-[10px] px-3 py-0.5 rounded border border-border uppercase tracking-widest font-semibold">
                      CEO & Founder
                    </div>
                  </div>

                  {/* Floating emoji */}
                  <div className="absolute top-10 right-10 animate-float" style={{ animationDelay: '0.5s' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)' }}>
                      🔥
                    </div>
                  </div>

                  {/* Caption bar */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card px-5 py-2 rounded-lg text-sm">
                    <span className="gradient-text font-bold">Welcome</span>
                    <span className="text-foreground/80"> to my channel</span>
                  </div>
                </div>

                {/* Sidebar mockup */}
                <div className="hidden md:flex flex-1 flex-col gap-1.5 p-3 border-l border-border/40">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest px-2 py-1.5">Transcript</div>
                  {[
                    { time: '0:00', text: 'Welcome back everyone...', active: true },
                    { time: '0:03', text: 'Today we\'re going to...', active: false },
                    { time: '0:06', text: 'Let me show you how...', active: false },
                    { time: '0:09', text: 'This is really exciting...', active: false },
                  ].map((item, i) => (
                    <div key={i} className={`p-2.5 rounded-lg text-[11px] leading-relaxed transition-all border ${item.active
                      ? 'glass-card border-indigo-500/20 text-foreground'
                      : 'border-transparent text-muted-foreground/70 hover:bg-white/[0.02]'
                      }`}>
                      <span className="font-mono text-[9px] opacity-40 mr-1.5">{item.time}</span>
                      {item.text}
                      {item.active && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-indigo-400" />
                          <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Lower Third</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex flex-col items-center gap-3 animate-fade-in stagger-5">
          <div className="flex -space-x-2.5">
            {['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e'].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-white text-[10px] font-bold" style={{ background: c }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Trusted by <span className="text-foreground font-semibold">500+</span> creators worldwide
          </p>
        </div>
      </section>

      {/* ===== Features Grid ===== */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight gradient-text-hero">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Professional motion graphics, one click away. No After Effects knowledge required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat, i) => (
              <div key={i} className="card-premium p-6 flex flex-col gap-3 group" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 transition-colors"
                  style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{feat.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider max-w-5xl mx-auto" />

      {/* ===== How It Works ===== */}
      <section id="how-it-works" className="py-24 px-6 relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06), transparent 70%)' }} />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight gradient-text-hero">How It Works</h2>
            <p className="text-muted-foreground text-base">Four steps to transform your content.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {steps.map((item, i) => (
              <div key={i} className="card-premium p-8 relative group">
                <div className="absolute top-6 right-6 text-5xl font-black select-none"
                  style={{ color: 'rgba(99, 102, 241, 0.06)' }}>
                  {item.num}
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 text-indigo-400"
                  style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider max-w-5xl mx-auto" />

      {/* ===== Pricing/CTA ===== */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="max-w-lg mx-auto text-center relative">
          <div className="orb w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent 70%)' }} />

          <div className="card-premium p-10 md:p-14 relative z-10">
            <div className="badge mb-6 mx-auto">
              Free during beta
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight gradient-text-hero">
              Start Creating Today
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              No account needed. No watermarks. Just upload and go.
            </p>

            <div className="flex flex-col gap-3 mb-8 text-left mx-auto max-w-xs">
              {['Unlimited video uploads', 'AI-powered transcription', 'All motion graphic templates', 'Full quality export'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                    <Icons.Check />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>

            <Link href="/editor" className="btn-primary w-full py-3.5 rounded-xl text-sm">
              Open Editor — It&apos;s Free <Icons.ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-5xl mx-auto" />

      {/* ===== Suggestions Row ===== */}
      <section id="suggestions" className="py-24 px-6 relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] top-1/2 -right-40"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.07), transparent 70%)', animationDelay: '3s' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight gradient-text-hero">
              What You Can Build
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Explore creative possibilities with MakeScript — perfect for every content format.
            </p>
          </div>

          {/* Horizontal scrollable row */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              {
                icon: '🎬',
                gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                title: 'YouTube Intros',
                desc: 'Create eye-catching animated intros with lower thirds, name tags, and dynamic text overlays for your YouTube videos.',
              },
              {
                icon: '📱',
                gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                title: 'Social Reels',
                desc: 'Transform clips into scroll-stopping Instagram Reels and TikToks with emoji reactions, captions, and zoom effects.',
              },
              {
                icon: '🎙️',
                gradient: 'linear-gradient(135deg, #f97316, #eab308)',
                title: 'Podcast Clips',
                desc: 'Turn podcast audio into shareable video clips with animated transcripts, speaker labels, and highlight moments.',
              },
              {
                icon: '📊',
                gradient: 'linear-gradient(135deg, #22c55e, #14b8a6)',
                title: 'Product Demos',
                desc: 'Enhance product walkthroughs with callout boxes, step indicators, and professional scene transitions.',
              },
              {
                icon: '🎓',
                gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                title: 'Course Content',
                desc: 'Add chapter markers, key-point highlights, and animated subtitles to educational videos automatically.',
              },
              {
                icon: '📰',
                gradient: 'linear-gradient(135deg, #a855f7, #6366f1)',
                title: 'News & Updates',
                desc: 'Create branded update videos with lower thirds, ticker overlays, and dynamic text for company announcements.',
              },
            ].map((item, i) => (
              <div key={i}
                className="card-premium p-6 min-w-[280px] md:min-w-[300px] flex-shrink-0 snap-center group cursor-default"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg"
                  style={{ background: item.gradient }}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-base mb-2 group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Scroll hint */}
          <div className="flex justify-center mt-6 gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === 0 ? '#6366f1' : 'rgba(99, 102, 241, 0.2)' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-8 px-6 border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>M</div>
            <span className="font-medium">MakeScript © 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <span className="w-px h-3 bg-border" />
            <a href="#" className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"><Icons.Twitter /> Twitter</a>
            <a href="#" className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"><Icons.Github /> GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
