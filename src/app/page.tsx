'use client';

import Link from 'next/link';
import React, { useEffect, useState, useRef, useCallback } from 'react';

/* ─── Color tokens ─── */
const C = {
  bg: '#0A0A0E',
  purple: '#9D4EDD',
  cyan: '#00F5D4',
  yellow: '#FEE440',
  white: '#F8F9FA',
};

/* ─── Section data ─── */
const ENGINE_CARDS = [
  {
    step: '1',
    title: 'Dump Raw',
    desc: 'Drop your messy, unedited footage into the void. We accept anything — Log, flat, shaky, noisy.',
    gradient: 'from-[#9D4EDD]/20 to-[#0A0A0E]',
    border: '#9D4EDD',
  },
  {
    step: '2',
    title: 'Neural Edit',
    desc: 'Our AI analyzes every frame, finds the rhythm, color-grades, and cuts like a seasoned editor.',
    gradient: 'from-[#00F5D4]/20 to-[#0A0A0E]',
    border: '#00F5D4',
  },
  {
    step: '3',
    title: 'Viral Output',
    desc: 'What comes out is retention-optimized, captioned, and formatted for any platform instantly.',
    gradient: 'from-[#FEE440]/20 to-[#0A0A0E]',
    border: '#FEE440',
  },
];

const FEATURES = [
  {
    title: 'Silence Shredder',
    desc: 'Dead air, umms, awkward pauses — the AI detects them on the timeline and physically collapses them. Your video tightens automatically.',
    tag: 'Timeline AI',
    gradient: 'linear-gradient(135deg, #9D4EDD 0%, #00F5D4 100%)',
    visual: 'waveform',
    image: `https://image.pollinations.ai/prompt/A_professional_video_editing_timeline_showing_audio_waveforms_with_gaps_collapsing_cyberpunk_UI_dark_purple?width=640&height=360&nologo=true&seed=410`,
  },
  {
    title: 'Auto B-Roll',
    desc: 'Say a place, a concept, or a mood — the AI instantly finds and punch-zooms into the perfect stock footage. No searching, no importing.',
    tag: 'Context Engine',
    gradient: 'linear-gradient(135deg, #00F5D4 0%, #FEE440 100%)',
    visual: 'zoom',
    image: `https://image.pollinations.ai/prompt/Cinematic_drone_shot_of_Manhattan_skyline_golden_hour_high_quality?width=640&height=360&nologo=true&seed=420`,
  },
  {
    title: 'Kinetic Captions',
    desc: 'Words don\'t just appear — they explode, bounce, and pulse in perfect sync with your voice. Every syllable lands like a punchline.',
    tag: 'Typography FX',
    gradient: 'linear-gradient(135deg, #FEE440 0%, #9D4EDD 100%)',
    visual: 'captions',
    image: `https://image.pollinations.ai/prompt/Animated_text_captions_exploding_on_screen_dark_background_neon_glow_purple_cyan?width=640&height=360&nologo=true&seed=430`,
  },
];

const CREATORS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  handle: ['@techreviewer', '@alexvisuals', '@motiondaily', '@filmbykai', '@editwiz', '@cliptok', '@studiopulse', '@cutmaster'][i],
  realName: ['Sarah Chen', 'Alex Rivera', 'Marcus Kim', 'Kai Yamamoto', 'Emma Torres', 'Liam O\'Brien', 'Priya Sharma', 'Jake Hudson'][i],
  color: ['#9D4EDD', '#00F5D4', '#FEE440', '#9D4EDD', '#00F5D4', '#FEE440', '#9D4EDD', '#00F5D4'][i],
  reaction: ['🤯', '🔥', '✨', '😱', '💜', '⚡', '🎯', '🚀'][i],
  avatar: `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${['Sarah+Chen', 'Alex+Rivera', 'Marcus+Kim', 'Kai+Yamamoto', 'Emma+Torres', 'Liam+OBrien', 'Priya+Sharma', 'Jake+Hudson'][i]}&backgroundColor=${['b58df1','00f5d4','fee440','b58df1','00f5d4','fee440','b58df1','00f5d4'][i]}`,
  thumbnail: `https://image.pollinations.ai/prompt/A_stunning_cinematic_video_thumbnail_with_dynamic_visuals_high_contrast_professional_youtube_style?width=320&height=568&nologo=true&seed=${600 + i}`,
  views: ['2.4M', '890K', '1.2M', '3.1M', '560K', '4.7M', '920K', '1.8M'][i],
  quote: [
    'MakeScript cut my editing time from 6 hours to 15 minutes. The silence shredder alone is worth it.',
    'I was skeptical until I saw the first auto-generated edit. Now I can\'t go back.',
    'The kinetic captions feature literally doubled my retention. Game changer for short-form.',
    'Finally, an AI that understands pacing. It doesn\'t just cut — it edits with intention.',
    'My entire workflow changed. I upload raw footage and get a broadcast-ready edit.',
    'We use it for all 12 of our client channels. The consistency is unreal.',
    'The auto B-roll feature understands context better than most human editors I\'ve worked with.',
    'I\'ve tested every AI video tool. MakeScript is the only one that actually delivers.',
  ][i],
}));

/* ─── Micro hook: cursor position for neon borders ─── */
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
}

/* ─── Section divider with glitch wipe ─── */
function GlitchDivider() {
  return (
    <div className="relative h-px w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#9D4EDD]/30 to-transparent" />
      <div className="absolute inset-0 opacity-20" style={{ animation: 'glitchStripe 3s ease-in-out infinite' }}>
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(157,78,221,0.3) 20px, rgba(157,78,221,0.3) 21px)' }} />
      </div>
    </div>
  );
}

/* ─── Neon cursor tracker ─── */
function NeonBorder({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouse = useMousePosition();
  const [gradient, setGradient] = useState('transparent');

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = mouse.x - rect.left;
    const y = mouse.y - rect.top;
    setGradient(`radial-gradient(circle 60px at ${x}px ${y}px, rgba(157,78,221,0.15), transparent 80%)`);
  }, [mouse]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-200" style={{ background: gradient }} />
      {children}
    </div>
  );
}

/* ─── Magnetic button ─── */
function MagneticButton({ children, href, className = '' }: { children: React.ReactNode; href: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 150;
    if (dist < maxDist) {
      const pull = 1 - dist / maxDist;
      setOffset({ x: dx * pull * 0.3, y: dy * pull * 0.3 });
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }, []);

  const handleLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-[15px] transition-transform duration-200 ease-out ${className}`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        background: `linear-gradient(135deg, ${C.purple}, #7c3aed)`,
        color: '#fff',
        boxShadow: `0 0 40px ${C.purple}66, 0 8px 32px rgba(0,0,0,0.4)`,
      }}
    >
      {children}
    </Link>
  );
}

/* ─── Snap button ─── */
function SnapButton({ children, onClick, variant = 'primary', className = '' }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; className?: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const handleClick = useCallback((e: React.MouseEvent) => {
    const el = btnRef.current;
    if (!el) return;
    el.style.transform = 'scale(0.92)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 120);
    onClick?.();
  }, [onClick]);

  const isPrimary = variant === 'primary';
  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className={`relative overflow-hidden rounded-xl font-semibold text-[13px] px-6 py-3 transition-all duration-100 ${className}`}
      style={{
        background: isPrimary ? `linear-gradient(135deg, ${C.purple}, #7c3aed)` : 'transparent',
        color: isPrimary ? '#fff' : C.white,
        border: isPrimary ? 'none' : `1px solid rgba(255,255,255,0.1)`,
        boxShadow: isPrimary ? `0 0 30px ${C.purple}44` : 'none',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Playhead scrollbar ─── */
function PlayheadScrollbar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return (
    <div className="fixed right-0 top-0 bottom-0 w-1 z-[9999] pointer-events-none">
      <div className="absolute inset-0 bg-white/[0.03]" />
      <div
        className="absolute left-0 right-0 transition-all duration-150"
        style={{
          top: `${progress * 100}%`,
          height: '4px',
          background: `linear-gradient(90deg, ${C.purple}, ${C.cyan})`,
          boxShadow: `0 0 12px ${C.purple}`,
        }}
      />
      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{ top: `${progress * 100}%`, transform: 'translateY(-50%)' }}
      >
        <div
          className="w-3 h-3 rounded-full border-2"
          style={{
            background: C.bg,
            borderColor: C.purple,
            boxShadow: `0 0 10px ${C.purple}`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Particle background ─── */
function ParticleField({ count = 30, color = C.purple }: { count?: number; color?: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            background: color,
            opacity: 0.1 + Math.random() * 0.3,
            animation: `particleFloat ${5 + Math.random() * 10}s linear ${Math.random() * 5}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [laserPos, setLaserPos] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [beforeAfter, setBeforeAfter] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Laser sweep animation loop */
  useEffect(() => {
    if (!mounted) return;
    let start: number | null = null;
    const duration = 4000;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % duration;
      setLaserPos(elapsed / duration);
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  /* Before/after slider drag */
  const handleSlider = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setBeforeAfter(pct);
  }, []);

  /* File drag events for footer */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent" style={{ borderColor: `${C.purple} transparent ${C.purple} ${C.purple}`, animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.white, fontFamily: "'Inter', sans-serif" }}>
      <PlayheadScrollbar />

      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="flex items-center justify-between px-6 h-12 rounded-2xl border transition-all duration-300"
            style={{
              background: 'rgba(10,10,14,0.75)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.cyan})` }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
              </div>
                            <span className="font-bold text-[15px] tracking-[-0.02em]" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.white }}>MakeScript</span>
            </Link>

            <div className="hidden md:flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '2px' }}>
              {['Features', 'Engine', 'Pricing'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all" style={{ color: 'rgba(248,249,250,0.5)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.white; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(248,249,250,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                >{item}</a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-[13px] transition-all duration-100 hover:scale-95 active:scale-90"
                style={{
                  background: `linear-gradient(135deg, ${C.purple}, #7c3aed)`,
                  color: '#fff',
                  boxShadow: `0 0 30px ${C.purple}44`,
                }}
              >
                Open Editor →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20"
        style={{ background: C.bg }}
      >
        <ParticleField count={40} color={C.purple} />

        {/* Glassmorphism drop zone */}
        <div
          className="relative w-full max-w-6xl mx-auto rounded-3xl overflow-hidden"
          style={{
            minHeight: '70vh',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Laser scanning line */}
          <div
            className="absolute top-0 bottom-0 w-[3px] z-20 pointer-events-none"
            style={{
              left: `${laserPos * 100}%`,
              background: `linear-gradient(180deg, transparent, ${C.cyan}, ${C.yellow}, ${C.cyan}, transparent)`,
              boxShadow: `0 0 24px ${C.cyan}, 0 0 60px ${C.cyan}44`,
              animation: 'laserGlow 0.5s ease-in-out infinite alternate',
            }}
          >
            {/* Laser glow flare */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-[30px] w-[66px] h-[66px] rounded-full" style={{ background: `radial-gradient(circle, ${C.cyan}33, transparent 70%)` }} />
          </div>

          {/* Left side: raw footage */}
          <div className="absolute inset-0 z-10 overflow-hidden">
            <div
              className="absolute inset-0 transition-all duration-100"
              style={{ clipPath: `inset(0 ${100 - laserPos * 100}% 0 0)` }}
            >
              {/* Raw footage simulation */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} />
              {/* Shake overlays */}
              <div className="absolute inset-0" style={{ animation: 'cameraShake 0.15s infinite' }}>
                <div className="absolute top-[15%] left-[10%] w-[70%] h-[55%] rounded-lg border border-red-500/20" style={{ background: 'rgba(0,0,0,0.4)', animation: 'shakeInner 0.3s infinite alternate' }}>
                  {/* Bad waveform */}
                  <div className="absolute bottom-2 left-2 right-2 h-8 flex items-end gap-[2px]">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ background: '#ef444466', height: `${4 + Math.random() * 20}px`, animation: `waveformBad ${0.2 + Math.random() * 0.3}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="absolute bottom-8 left-8 px-3 py-1 rounded border border-red-500/30" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <span className="text-[10px] font-mono text-red-400">LOG PROFILE · 29.97fps · UNSHARP</span>
              </div>
            </div>

            {/* Right side: polished edit */}
            <div
              className="absolute inset-0 transition-all duration-100"
              style={{ clipPath: `inset(0 0 0 ${laserPos * 100}%)` }}
            >
              {/* Polished footage simulation */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d0221 0%, #1a0533 30%, #240046 60%, #10002b 100%)' }} />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(157,78,221,0.1) 0%, transparent 60%)' }} />
              {/* Color graded scene */}
              <div className="absolute top-[15%] left-[10%] w-[70%] h-[55%] rounded-lg overflow-hidden" style={{ border: '1px solid rgba(157,78,221,0.2)', boxShadow: '0 0 40px rgba(157,78,221,0.1), inset 0 0 40px rgba(0,0,0,0.3)' }}>
                {/* Cinematic scene */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #16213e 100%)' }} />
                {/* Cinematic bars */}
                <div className="absolute top-0 left-0 right-0 h-[15%]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent)' }} />
                <div className="absolute bottom-0 left-0 right-0 h-[15%]" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.6), transparent)' }} />
                {/* Glowing title text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[clamp(18px,3vw,36px)] font-bold tracking-[-0.02em] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.white, textShadow: `0 0 40px ${C.purple}, 0 0 80px ${C.purple}44` }}>
                      {['NEW YORK', 'THE VISION', 'BEYOND'][Math.floor(Math.random() * 3)]}
                    </div>
                    {/* Kinetic caption bounce */}
                    <div className="h-6 flex items-center justify-center gap-1">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <span key={i} className="text-[11px] font-bold" style={{ color: C.cyan, animation: `captionBounce ${0.4 + Math.random() * 0.3}s ease-in-out ${i * 0.08}s infinite alternate` }}>▌</span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Zoom effect overlay */}
                <div className="absolute inset-0" style={{ animation: 'cinematicZoom 6s ease-in-out infinite' }} />
              </div>
              {/* Label */}
              <div className="absolute bottom-8 left-8 px-3 py-1 rounded border border-emerald-500/30" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <span className="text-[10px] font-mono text-emerald-400">COLOR GRADED · 4K HDR · CAPTIONS SYNCED</span>
              </div>
            </div>
          </div>

          {/* Center headline (always on top) */}
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none" style={{ textShadow: '0 4px 32px rgba(0,0,0,0.6)' }}>
            <h1
              className="text-[clamp(3rem,10vw,7rem)] font-bold tracking-[-0.06em] leading-[0.95] text-center mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.white }}
            >
              MakeScript
            </h1>
            <p className="text-[clamp(1.2rem,3vw,2rem)] font-semibold tracking-[0.15em] uppercase" style={{ color: C.yellow, fontFamily: "'Space Grotesk', sans-serif" }}>
              Drop. Done. Viral.
            </p>
          </div>

          {/* CTA */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
            <MagneticButton href="/editor">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              Drop Your Video
            </MagneticButton>
          </div>
        </div>
      </section>

      <GlitchDivider />

      {/* ═══════════════════ PRICING ═══════════════════ */}
      <section id="pricing" className="py-28 px-6 relative overflow-hidden">
        <ParticleField count={25} color={C.purple} />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full" style={{ color: C.purple, border: `1px solid ${C.purple}33`, fontFamily: "'JetBrains Mono', monospace" }}>PRICING</span>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] mt-6 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              One price. <span style={{ color: C.cyan }}>Everything included.</span>
            </h2>
            <p className="text-[14px] max-w-xl mx-auto" style={{ color: 'rgba(248,249,250,0.5)' }}>
              No hidden fees, no per-video charges. All AI models are included in your plan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Free */}
            <div className="relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'rgba(107,114,128,0.15)', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>Free</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[40px] font-black tracking-[-0.03em]" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.white }}>$0</span>
                <span className="text-[13px]" style={{ color: 'rgba(248,249,250,0.3)' }}>/mo</span>
              </div>
              <p className="text-[12px] mb-6" style={{ color: 'rgba(248,249,250,0.4)' }}>Get started with powerful open models</p>
              <div className="flex-1 space-y-3 mb-8">
                {[
                  { label: '10 videos / month', included: true },
                  { label: 'Open-source AI models', included: true },
                  { label: 'Basic motion graphics', included: true },
                  { label: '1080p export', included: true },
                  { label: 'Claude Sonnet 4 & Gemini Pro', included: false },
                  { label: 'AI image generation', included: false },
                  { label: '4K export', included: false },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-[12px]">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${f.included ? 'opacity-100' : 'opacity-20'}`}>
                      {f.included ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      )}
                    </div>
                    <span style={{ color: f.included ? 'rgba(248,249,250,0.6)' : 'rgba(248,249,250,0.2)' }}>{f.label}</span>
                  </div>
                ))}
              </div>
              <a href="/editor" className="block w-full text-center py-3 rounded-xl text-[13px] font-semibold transition-all hover:brightness-110" style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                Get Started
              </a>
            </div>

            {/* Creator — $20/mo */}
            <div className="relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:scale-[1.02]" style={{ background: `linear-gradient(180deg, ${C.purple}08, rgba(10,10,14,1))`, border: `1px solid ${C.purple}22`, boxShadow: `0 0 40px ${C.purple}11` }}>
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: `linear-gradient(135deg, ${C.purple}, #7c3aed)`, color: '#fff' }}>Most Popular</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: `${C.purple}22`, color: C.purple, fontFamily: "'JetBrains Mono', monospace" }}>Creator</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[40px] font-black tracking-[-0.03em]" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.white }}>$20</span>
                <span className="text-[13px]" style={{ color: 'rgba(248,249,250,0.3)' }}>/mo</span>
              </div>
              <p className="text-[12px] mb-6" style={{ color: 'rgba(248,249,250,0.4)' }}>Premium AI — motion graphics, images, captions</p>
              <div className="flex-1 space-y-3 mb-8">
                {[
                  { label: '60 videos / month', included: true, accent: true },
                  { label: 'Claude Sonnet 4 & GPT-5', included: true },
                  { label: 'AI motion graphics + B-roll', included: true },
                  { label: 'Google Imagen + Seedance models', included: true },
                  { label: '4K export & priority queue', included: true },
                  { label: 'Claude Opus 4.6 & GPT-5.2', included: false },
                  { label: 'Unlimited videos', included: false },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-[12px]">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0`}>
                      {f.included ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={f.accent ? C.purple : '#6b7280'} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      )}
                    </div>
                    <span style={{ color: f.included ? 'rgba(248,249,250,0.6)' : 'rgba(248,249,250,0.2)' }}>{f.label}</span>
                  </div>
                ))}
              </div>
              <a href="/editor" className="block w-full text-center py-3 rounded-xl text-[13px] font-semibold transition-all" style={{ background: `linear-gradient(135deg, ${C.purple}, #7c3aed)`, color: '#fff', boxShadow: `0 0 24px ${C.purple}33` }}>
                Start Free Trial →
              </a>
            </div>

            {/* Studio — $50/mo */}
            <div className="relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cyan}22` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: `${C.cyan}22`, color: C.cyan, fontFamily: "'JetBrains Mono', monospace" }}>Studio</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[40px] font-black tracking-[-0.03em]" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.white }}>$50</span>
                <span className="text-[13px]" style={{ color: 'rgba(248,249,250,0.3)' }}>/mo</span>
              </div>
              <p className="text-[12px] mb-6" style={{ color: 'rgba(248,249,250,0.4)' }}>Unlimited access — the absolute best AI</p>
              <div className="flex-1 space-y-3 mb-8">
                {[
                  { label: 'Unlimited videos', included: true, accent: true },
                  { label: 'Claude Opus 4.6 & GPT-5.2', included: true, accent: true },
                  { label: 'All image/video generation models', included: true },
                  { label: 'Google Veo 3 + Runway Gen-4', included: true },
                  { label: 'Priority processing queue', included: true },
                  { label: 'Early access to new features', included: true },
                  { label: 'Dedicated support', included: true },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-[12px]">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0`}>
                      {f.included ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={f.accent ? C.cyan : '#6b7280'} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      )}
                    </div>
                    <span style={{ color: f.included ? 'rgba(248,249,250,0.6)' : 'rgba(248,249,250,0.2)' }}>{f.label}</span>
                  </div>
                ))}
              </div>
              <a href="/editor" className="block w-full text-center py-3 rounded-xl text-[13px] font-semibold transition-all" style={{ border: `1px solid ${C.cyan}33`, color: C.cyan }}>
                Start Free Trial →
              </a>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] mt-8" style={{ color: 'rgba(248,249,250,0.2)' }}>
            All plans include a 7-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      <GlitchDivider />

      <GlitchDivider />

      {/* ═══════════════════ LIVE DEMO ═══════════════════ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <ParticleField count={25} color={C.purple} />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full" style={{ color: C.purple, border: `1px solid ${C.purple}33`, fontFamily: "'JetBrains Mono', monospace" }}>LIVE DEMO</span>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] mt-6 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              See it <span style={{ color: C.cyan }}>in action</span>
            </h2>
          </div>

          {/* Editor mockup */}
          <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {/* Title bar */}
            <div className="h-11 flex items-center px-4 gap-2" style={{ background: '#0d0d0f', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>MakeScript Editor</span>
              </div>
            </div>

            {/* Editor body */}
            <div className="flex flex-col lg:flex-row" style={{ background: C.bg }}>
              {/* Left: Transcript panel */}
              <div className="w-full lg:w-56 shrink-0 border-r p-3" style={{ borderColor: 'rgba(255,255,255,0.04)', background: '#0d0d0f' }}>
                <div className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>Transcript</div>
                <div className="space-y-1">
                  {[
                    { time: '0:00', text: 'Welcome to MakeScript...', active: false },
                    { time: '0:05', text: '50K users in 6 months', active: true },
                    { time: '0:12', text: 'Let me show the numbers', active: false },
                    { time: '0:18', text: 'Revenue hit $2M ARR', active: false },
                    { time: '0:25', text: 'Here is the growth chart', active: false },
                  ].map((s, j) => (
                    <div key={j} className="px-2 py-1.5 rounded-md text-[10px]" style={{
                      background: s.active ? 'rgba(157,78,221,0.1)' : 'transparent',
                      borderLeft: s.active ? `2px solid ${C.purple}` : '2px solid transparent',
                    }}>
                      <span className="font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.time}</span>
                      <span className="ml-2" style={{ color: s.active ? C.white : 'rgba(255,255,255,0.4)' }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center: Video canvas */}
              <div className="flex-1 aspect-video relative bg-black">
                {/* Demo video image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://image.pollinations.ai/prompt/A_professional_video_editing_interface_showing_a_talking_head_video_with_overlays_and_effects_modern_dark_UI?width=960&height=540&nologo=true&seed=500"
                  alt="MakeScript Editor Demo"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Animated lower third overlay */}
                <div className="absolute bottom-8 left-4" style={{ animation: 'demoLowerThird 4s ease-in-out infinite' }}>
                  <div style={{ background: 'rgba(10,10,14,0.8)', backdropFilter: 'blur(12px)', padding: '8px 16px 8px 12px', borderLeft: `3px solid ${C.purple}`, borderRadius: '0 8px 8px 0' }}>
                    <div className="text-[14px] font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.white }}>Sarah Chen</div>
                    <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.purple }}>Product Designer · MakeScript</div>
                  </div>
                </div>
                {/* Floating caption */}
                <div className="absolute top-6 right-4" style={{ animation: 'demoCaption 5s ease-in-out 1s infinite' }}>
                  <div style={{ background: 'rgba(0,245,212,0.12)', border: `1px solid ${C.cyan}33`, padding: '6px 12px', borderRadius: '8px' }}>
                    <span className="text-[20px] font-black" style={{ color: C.cyan, fontFamily: "'Space Grotesk', sans-serif" }}>50K+</span>
                    <div className="text-[7px] font-semibold uppercase tracking-widest" style={{ color: C.cyan + '99' }}>Active Users</div>
                  </div>
                </div>
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110" style={{ background: 'rgba(157,78,221,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(157,78,221,0.3)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={C.white}><polygon points="6 3 20 12 6 21 6 3" /></svg>
                  </div>
                </div>
                {/* Scrubbing progress */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                  <div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${C.purple}, ${C.cyan})`, width: '35%' }} />
                </div>
              </div>

              {/* Right: Properties */}
              <div className="w-full lg:w-48 shrink-0 border-l p-3" style={{ borderColor: 'rgba(255,255,255,0.04)', background: '#0d0d0f' }}>
                <div className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>Properties</div>
                <div className="space-y-2">
                  {[
                    { label: 'Overlay', value: 'Lower Third' },
                    { label: 'Style', value: 'Purple Accent' },
                    { label: 'Duration', value: '0:03.200' },
                  ].map((p, j) => (
                    <div key={j} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="text-[8px] mb-0.5" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>{p.label}</div>
                      <div className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>{p.value}</div>
                    </div>
                  ))}
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="text-[8px] mb-1.5" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>Opacity</div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-3/4 rounded-full" style={{ background: `linear-gradient(90deg, ${C.purple}, ${C.cyan})` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Waveform timeline */}
            <div className="h-12 flex items-center px-4 gap-[2px]" style={{ background: '#0d0d0f', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {Array.from({ length: 60 }).map((_, j) => (
                <div key={j} className="flex-1 flex items-end justify-center h-full py-2">
                  <div className="w-[2px] rounded-full" style={{
                    height: `${6 + Math.sin(j * 0.4) * 8 + Math.abs(Math.sin(j * 1.1)) * 6}px`,
                    background: j < 22 ? `linear-gradient(to top, ${C.purple}, ${C.cyan})` : 'rgba(255,255,255,0.08)',
                    animation: j < 22 ? `waveformPulseShort ${0.4 + (j % 4) * 0.08}s ease-in-out ${j * 0.02}s infinite alternate` : undefined,
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* CTA below demo */}
          <div className="text-center mt-10">
            <MagneticButton href="/editor">
              Try the Editor Free →
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ═══════════════════ MAGIC FEATURES ═══════════════════ */}
      <section id="features" className="py-28 px-6 relative overflow-hidden">
        <ParticleField count={25} color={C.yellow} />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full" style={{ color: C.yellow, border: `1px solid ${C.yellow}33`, fontFamily: "'JetBrains Mono', monospace" }}>MAGIC FEATURES</span>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] mt-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              It knows <span style={{ color: C.cyan }}>what to do.</span>
            </h2>
          </div>

          <div className="space-y-16">
            {FEATURES.map((feat, i) => (
              <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-10 items-center`}>
                {/* Visual side */}
                <div className="flex-1 w-full">
                  <div
                    className="relative rounded-2xl overflow-hidden aspect-video"
                    style={{
                      border: `1px solid rgba(255,255,255,0.06)`,
                      background: i === 0
                        ? 'linear-gradient(135deg, #0d0221, #1a0533)'
                        : i === 1
                        ? 'linear-gradient(135deg, #001a1a, #002222)'
                        : 'linear-gradient(135deg, #1a1200, #2a1f00)',
                    }}
                  >
                    {/* Feature demo image with animated overlay */}
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={feat.image}
                        alt={feat.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8s]"
                        style={{ animation: 'slowZoom 10s ease-in-out infinite alternate' }}
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(10,10,14,0.8) 100%)' }} />
                      <div className="absolute inset-0" style={{ background: i === 0 ? 'linear-gradient(135deg, rgba(157,78,221,0.08), transparent)' : i === 1 ? 'linear-gradient(135deg, rgba(0,245,212,0.08), transparent)' : 'linear-gradient(135deg, rgba(254,228,64,0.08), transparent)' }} />
                      {/* Animated badge */}
                      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full" style={{ background: 'rgba(10,10,14,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="text-[10px] font-mono font-semibold" style={{ color: i === 0 ? C.purple : i === 1 ? C.cyan : C.yellow }}>
                          {feat.tag}
                        </span>
                      </div>
                      {/* Animated status bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ background: feat.gradient, width: '60%', animation: 'mgTimelineScrub 4s ease-in-out infinite' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text side */}
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-1 rounded" style={{ color: i === 0 ? C.purple : i === 1 ? C.cyan : C.yellow, background: `${i === 0 ? C.purple : i === 1 ? C.cyan : C.yellow}11`, fontFamily: "'JetBrains Mono', monospace" }}>
                    {feat.tag}
                  </span>
                  <h3 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold tracking-[-0.02em] mt-4 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {feat.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(248,249,250,0.55)' }}>
                    {feat.desc}
                  </p>
                  <div className="mt-6 flex gap-3">
                    {['Try it', 'Watch'].map((label, j) => (
                      <SnapButton key={label} variant={j === 0 ? 'primary' : 'ghost'}>{label} →</SnapButton>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GlitchDivider />

      {/* ═══════════════════ BEFORE / AFTER ═══════════════════ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <ParticleField count={20} color={C.purple} />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full" style={{ color: C.purple, border: `1px solid ${C.purple}33`, fontFamily: "'JetBrains Mono', monospace" }}>THE PROOF</span>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] mt-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Before <span style={{ color: '#ef4444' }}>→</span> After
            </h2>
          </div>

          {/* Interactive slider */}
          <div
            ref={sliderRef}
            className="relative rounded-2xl overflow-hidden aspect-video cursor-ew-resize select-none"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseMove={handleSlider}
            onTouchMove={handleSlider}
          >
            {/* Before (left) — raw unedited footage */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
              {/* Shake effect overlay */}
              <div className="absolute inset-0" style={{ animation: 'cameraShake 0.15s infinite' }}>
                {/* Dull video frame */}
                <div className="absolute top-[12%] left-[8%] right-[8%] bottom-[18%] rounded-lg overflow-hidden" style={{ background: 'linear-gradient(180deg, #2a2a3e 0%, #1e1e32 100%)', border: '1px solid rgba(239,68,68,0.1)' }}>
                  {/* Badly lit subject silhouette */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[30%] h-[75%] rounded-t-full" style={{ background: 'linear-gradient(180deg, #3a3a4e 0%, #2a2a3e 100%)' }} />
                  {/* Terrible waveform */}
                  <div className="absolute bottom-2 left-2 right-2 h-6 flex items-end gap-[2px]">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{
                        background: '#ef444433',
                        height: `${3 + Math.sin(i * 0.8) * 6 + Math.abs(Math.sin(i * 1.5)) * 4}px`,
                        animation: `waveformBad ${0.2 + (i % 3) * 0.1}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
                {/* Exposure warning icon */}
                <div className="absolute top-[15%] right-[12%] w-6 h-6 rounded-full border-2 border-red-400/30 flex items-center justify-center" style={{ animation: 'fadeInOut 1s ease-in-out infinite' }}>
                  <span className="text-[10px]">!</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', backdropFilter: 'blur(8px)' }}>
                <span className="text-[10px] font-mono text-red-400 font-semibold">BEFORE · RAW LOG</span>
              </div>
            </div>

            {/* After (right) — color graded */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - beforeAfter}% 0 0)` }}
            >
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d0221 0%, #1a0533 30%, #240046 60%, #10002b 100%)' }}>
                {/* Polished video frame */}
                <div className="absolute top-[12%] left-[8%] right-[8%] bottom-[18%] rounded-lg overflow-hidden" style={{ border: '1px solid rgba(157,78,221,0.15)', boxShadow: 'inset 0 0 40px rgba(157,78,221,0.1)' }}>
                  {/* Well-lit subject */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[30%] h-[75%] rounded-t-full" style={{ background: 'linear-gradient(180deg, #4a3a5e 0%, #3a2a4e 100%)' }} />
                  {/* Color grade glow */}
                  <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60%] h-[40%]" style={{ background: 'radial-gradient(ellipse, rgba(157,78,221,0.08) 0%, transparent 70%)' }} />
                  {/* Cinematic bars */}
                  <div className="absolute top-0 left-0 right-0 h-[12%]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)' }} />
                  <div className="absolute bottom-0 left-0 right-0 h-[12%]" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.5), transparent)' }} />
                  {/* Caption text */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <span className="text-[11px] font-bold tracking-wide" style={{ color: C.cyan, fontFamily: "'Space Grotesk', sans-serif" }}>THIS IS HIGH RETENTION</span>
                  </div>
                </div>
                {/* Engagement metrics */}
                <div className="absolute top-[14%] right-[12%] flex items-center gap-2">
                  <span style={{ animation: 'reactionPop 1.5s ease-in-out infinite' }}>🔥</span>
                  <span className="text-[9px] font-mono text-white/40">2.4K</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.2)', backdropFilter: 'blur(8px)' }}>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">AFTER · AI GRADED</span>
              </div>
            </div>

            {/* Neon slider handle */}
            <div
              className="absolute top-0 bottom-0 w-1 z-10 pointer-events-none"
              style={{ left: `${beforeAfter}%` }}
            >
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent, ${C.yellow}, ${C.purple}, transparent)` }} />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.bg, border: `2px solid ${C.yellow}`, boxShadow: `0 0 20px ${C.yellow}66` }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GlitchDivider />

      {/* ═══════════════════ CREATOR WALL ═══════════════════ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <ParticleField count={30} color={C.yellow} />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full" style={{ color: C.yellow, border: `1px solid ${C.yellow}33`, fontFamily: "'JetBrains Mono', monospace" }}>CREATOR WALL</span>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] mt-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Loved by <span style={{ color: C.purple }}>creators</span>
            </h2>
          </div>

          {/* Testimonial cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREATORS.map((c) => (
              <div
                key={c.id}
                className="group relative rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02]"
                style={{
                  background: `${c.color}06`,
                  border: `1px solid ${c.color}15`,
                }}
              >
                {/* Video thumbnail */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.thumbnail}
                    alt={`${c.realName}'s video`}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,14,0.95) 100%)' }} />
                  {/* Avatar + identity */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ boxShadow: `0 0 0 2px ${c.color}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.avatar}
                        alt={c.realName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {/* Name + handle */}
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold leading-tight text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.realName}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px]" style={{ color: `${c.color}bb`, fontFamily: "'JetBrains Mono', monospace" }}>{c.handle}</span>
                        <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${C.yellow}22`, color: C.yellow }}>{c.views}</span>
                      </div>
                    </div>
                  </div>
                  {/* Play button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${c.color}44`, backdropFilter: 'blur(8px)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={c.color}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      </div>
                      <span className="text-[22px]">{c.reaction}</span>
                    </div>
                  </div>
                </div>

                {/* Testimonial quote */}
                <div className="p-4">
                  <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(248,249,250,0.6)' }}>
                    &ldquo;{c.quote}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GlitchDivider />

      {/* ═══════════════════ FINAL DROP ═══════════════════ */}
      <footer
        className="relative py-28 px-6 transition-all duration-500"
        style={{
          background: dragOver
            ? `radial-gradient(ellipse at center, ${C.purple}22 0%, ${C.bg} 70%)`
            : C.bg,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDragOver}
      >
        {/* Particle suck effect */}
        {dragOver && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                  background: C.purple,
                  animation: `suckToCenter ${1 + Math.random() * 1.5}s ease-in forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Upload icon */}
          <div
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-8 transition-all duration-500"
            style={{
              background: dragOver ? C.purple : `${C.purple}15`,
              border: `2px dashed ${dragOver ? C.cyan : `${C.purple}33`}`,
              transform: dragOver ? 'scale(1.15)' : 'scale(1)',
              boxShadow: dragOver ? `0 0 80px ${C.purple}44` : 'none',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.cyan : C.purple} strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Upload your worst.<br />
            <span style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              We'll make it your best.
            </span>
          </h2>
          <p className="text-[14px] mb-8" style={{ color: 'rgba(248,249,250,0.5)' }}>
            Drag any video file onto this page. No sign-up, no credit card.
          </p>

          <MagneticButton href="/editor">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
            Start Editing Free
          </MagneticButton>

          {/* Footer bottom */}
          <div className="mt-16 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]" style={{ color: 'rgba(248,249,250,0.25)' }}>
              <span>© 2026 MakeScript</span>
              <span>·</span>
              <span>Built with Remotion & Next.js</span>
              <span>·</span>
              <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
              <span>·</span>
              <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════ GLOBAL STYLES (injected once) ═══════════════════ */}
      <style jsx global>{`
        /* ─── Smooth scroll ─── */
        html { scroll-behavior: smooth; }

        /* ─── Animations ─── */
        @keyframes laserGlow {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        @keyframes cameraShake {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-2px, 1px) rotate(-0.5deg); }
          50% { transform: translate(1px, -1px) rotate(0.5deg); }
          75% { transform: translate(-1px, 2px) rotate(-0.3deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes shakeInner {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(3px, -2px) scale(1.01); }
        }

        @keyframes waveformBad {
          0% { height: 4px; }
          100% { height: 28px; }
        }

        @keyframes captionBounce {
          0% { transform: translateY(0); opacity: 0.4; }
          100% { transform: translateY(-8px); opacity: 1; }
        }

        @keyframes cinematicZoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.1; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }

        @keyframes particleRise {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: translateY(-60px) scale(1.5); opacity: 0; }
        }

        @keyframes orbit3d {
          0% { transform: rotate(0deg) scale(1); }
          100% { transform: rotate(360deg) scale(1); }
        }

        @keyframes orbit3dReverse {
          0% { transform: rotate(360deg) scale(1); }
          100% { transform: rotate(0deg) scale(1); }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes slowZoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        @keyframes zoomBurst {
          0% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.3; }
        }

        @keyframes captionExplode {
          0% { opacity: 0; transform: scale(0) translateY(20px); filter: blur(4px); }
          60% { opacity: 1; transform: scale(1.2) translateY(-2px); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        @keyframes waveformPulse {
          0% { height: 5%; }
          100% { height: 70%; }
        }

        @keyframes waveformPulseShort {
          0% { height: 3px; }
          100% { height: 16px; }
        }

        @keyframes reactionPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        @keyframes suckToCenter {
          0% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          100% { transform: translate(var(--suck-x, 0), var(--suck-y, 0)) scale(0); opacity: 0; }
        }

        @keyframes glitchStripe {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes mgTimelineScrub {
          0% { width: 0%; }
          50% { width: 85%; }
          100% { width: 0%; }
        }

        @keyframes demoLowerThird {
          0% { transform: translateX(-120%); opacity: 0; }
          15% { transform: translateX(0); opacity: 1; }
          85% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-120%); opacity: 0; }
        }

        @keyframes demoCaption {
          0% { transform: translateY(-20px); opacity: 0; }
          20% { transform: translateY(0); opacity: 1; }
          80% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
