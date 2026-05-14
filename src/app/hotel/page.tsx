'use client';

import Link from 'next/link';
import React, { useEffect, useState, useRef, useCallback } from 'react';

/* ─── Color tokens (Fuji Pro 400H palette) ─── */
const C = {
  pink: '#F4B6C2',
  mint: '#A8D5BA',
  mustard: '#F2C94C',
  cream: '#FFF5E1',
  navy: '#2C3E6B',
  bg: '#FFF5E1',
  text: '#2C3E6B',
  textMuted: 'rgba(44,62,107,0.5)',
};

/* ─── Tier data ─── */
const TIERS = [
  {
    id: 'stowaway',
    name: 'The Stowaway',
    price: 120,
    color: C.mint,
    bgGradient: 'linear-gradient(180deg, #A8D5BA 0%, #8ec5a0 100%)',
    items: [
      { label: '1 Brass Key', emoji: '🔑' },
      { label: 'Towel Stack (Neat)', emoji: '🧴' },
      { label: 'Black Coffee', emoji: '☕' },
    ],
    features: [
      { label: 'Single occupancy', ok: true },
      { label: 'Shared bath', ok: true },
      { label: 'Continental breakfast', ok: true },
      { label: 'Turndown service', ok: false },
      { label: 'Room upgrade', ok: false },
    ],
  },
  {
    id: 'grand',
    name: 'The Grand',
    price: 240,
    color: C.pink,
    bgGradient: 'linear-gradient(180deg, #F4B6C2 0%, #e8a0ae 100%)',
    items: [
      { label: '2 Brass Keys', emoji: '🔑🔑' },
      { label: 'Daisies (Symmetrical)', emoji: '💐' },
      { label: 'Silver Cloche Pastry', emoji: '🥐' },
    ],
    features: [
      { label: 'Double occupancy', ok: true },
      { label: 'Ensuite bath', ok: true },
      { label: 'Full breakfast', ok: true },
      { label: 'Turndown service', ok: true },
      { label: 'Room upgrade', ok: false },
    ],
  },
  {
    id: 'royal',
    name: 'The Royal',
    price: 420,
    color: C.mustard,
    bgGradient: 'linear-gradient(180deg, #F2C94C 0%, #e0b838 100%)',
    items: [
      { label: 'Ring of Keys', emoji: '🔐' },
      { label: 'Phonograph Spinning', emoji: '📀' },
      { label: 'Champagne Pop', emoji: '🍾' },
      { label: 'Velvet Pet Pillow', emoji: '🛏️' },
    ],
    features: [
      { label: 'Suite + sitting room', ok: true },
      { label: 'Ensuite bath + tub', ok: true },
      { label: 'Gourmet breakfast', ok: true },
      { label: 'Turndown + petit fours', ok: true },
      { label: 'Complimentary upgrade', ok: true },
    ],
  },
];

const ADDONS = [
  { id: 'bike', name: 'Bicycle Rental', price: 18, emoji: '🚲', desc: 'Cruise the promenade' },
  { id: 'tea', name: 'High Tea', price: 32, emoji: '🫖', desc: 'Earl Grey, precise' },
  { id: 'shoes', name: 'Shoeshine', price: 12, emoji: '👞', desc: 'Mirror finish' },
  { id: 'flowers', name: 'Flower Arrangement', price: 28, emoji: '🌻', desc: 'Daisies, of course' },
  { id: 'record', name: 'Vinyl Selection', price: 15, emoji: '🎵', desc: 'For your room' },
];

/* ─── Split-flap character ─── */
function SplitFlapChar({ char, target, delay }: { char: string; target: string; delay: number }) {
  const [display, setDisplay] = useState(char);

  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?. ';
    let frame = 0;
    const totalFrames = 8 + Math.floor(Math.random() * 6);
    const interval = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplay(target);
        clearInterval(interval);
      } else {
        setDisplay(chars[Math.floor(Math.random() * chars.length)]);
      }
    }, 80 + Math.random() * 40);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <span className="inline-flex items-center justify-center w-[0.7em] h-[1.1em] mx-px" style={{
      background: 'rgba(44,62,107,0.06)',
      borderRadius: '2px',
      fontFamily: "'Futura', 'Century Gothic', 'Trebuchet MS', sans-serif",
      fontWeight: 700,
      fontSize: 'clamp(2rem,5vw,3.5rem)',
      color: C.navy,
      transition: 'all 0.05s',
    }}>
      {display}
    </span>
  );
}

/* ─── Stop-motion flat-lay video simulation ─── */
function FlatLayVideo({ items, color, speedMultiplier = 1 }: { items: { label: string; emoji: string }[]; color: string; speedMultiplier?: number }) {
  return (
    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden" style={{ background: `${color}44` }}>
      {/* Animated items sliding into frame */}
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute text-[clamp(1.5rem,4vw,3rem)]"
          style={{
            ...({ '--delay': `${i * 0.4 / speedMultiplier}s`, '--dur': `${1.2 / speedMultiplier}s` } as React.CSSProperties),
            animation: `flatlaySlide var(--dur) ease-out var(--delay) forwards`,
            opacity: 0,
            transform: 'translateY(30px)',
            left: `${15 + i * (i === 2 && items.length > 3 ? 18 : 25)}%`,
            top: `${25 + i * 18}%`,
          }}
        >
          {item.emoji}
        </div>
      ))}
      {/* Subtle desk texture */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.02) 20px, rgba(0,0,0,0.02) 21px)' }} />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.08)' }} />
    </div>
  );
}

/* ─── Rubber stamp bullet ─── */
function StampBullet({ ok, delay }: { ok: boolean; delay: number }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 mr-2 rounded-sm overflow-hidden align-middle" style={{
      background: ok ? 'rgba(178,34,34,0.06)' : 'rgba(0,0,0,0.03)',
      border: `1px solid ${ok ? 'rgba(178,34,34,0.15)' : 'rgba(0,0,0,0.08)'}`,
      animation: `stampPop 0.3s ease-out ${delay}s forwards`,
      opacity: 0,
    }}>
      <span style={{
        fontFamily: "'Courier Prime', 'Courier New', monospace",
        fontSize: '9px',
        fontWeight: 700,
        color: ok ? '#b22222' : 'rgba(0,0,0,0.2)',
        animation: `stampInk 0.15s ease-out ${delay + 0.1}s forwards`,
        transform: 'scale(0) rotate(-5deg)',
      }}>
        {ok ? 'YES' : 'NO'}
      </span>
    </span>
  );
}

/* ─── Elevator dial scroll indicator ─── */
function ElevatorDial() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handler = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? window.scrollY / docHeight : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:block">
      <div className="relative w-8 h-32 rounded-full" style={{ background: 'rgba(44,62,107,0.04)', border: '1px solid rgba(44,62,107,0.08)' }}>
        <div
          className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            top: `${progress * 85 + 7.5}%`,
            background: C.navy,
            color: C.cream,
            fontSize: '10px',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.cream} strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
        {/* Tick marks */}
        {[0, 1, 2, 3].map((t) => (
          <div key={t} className="absolute left-1/2 -translate-x-1/2 w-2 h-px" style={{ top: `${20 + t * 22}%`, background: 'rgba(44,62,107,0.08)' }} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */
export default function HotelPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [addons, setAddons] = useState<string[]>([]);
  const [speedBoost, setSpeedBoost] = useState<string | null>(null);
  const [showBell, setShowBell] = useState(false);
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState('2');
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const toggleAddon = useCallback((id: string) => {
    setAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }, []);

  const handleConfirm = useCallback(() => {
    setShowBell(true);
    setTimeout(() => setShowBell(false), 1500);
  }, []);

  const totalNights = 3; // default for display
  const tierPrice = TIERS.find(t => t.id === selectedTier)?.price || 0;
  const addonTotal = ADDONS.filter(a => addons.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const grandTotal = tierPrice * totalNights + addonTotal;

  /* Hero title */
  const heroTitle = 'THE TARIFF';

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}>
        <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: `${C.navy} transparent ${C.navy} ${C.navy}`, animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.cream, color: C.text, fontFamily: "'Courier Prime', 'Courier New', monospace" }}>
      <ElevatorDial />

      {/* ═══════════════════ NAV ═══════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4" style={{ background: 'rgba(255,245,229,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: C.navy }}>
              <span className="text-[10px] font-bold" style={{ color: C.cream, fontFamily: "'Futura', sans-serif" }}>T&H</span>
            </div>
            <span className="text-[13px] font-bold tracking-[0.15em]" style={{ fontFamily: "'Futura', sans-serif", color: C.navy }}>THE & HOTEL</span>
          </div>
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.1em]" style={{ color: C.textMuted }}>
            <a href="#quarters" className="hover:opacity-80 transition-opacity">Quarters</a>
            <a href="#provisions" className="hover:opacity-80 transition-opacity">Provisions</a>
            <Link href="/" className="hover:opacity-80 transition-opacity">→ Back</Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Split-flap board */}
        <div className="relative mb-8">
          {/* Board frame */}
          <div className="relative rounded-lg p-6 pb-8" style={{
            background: 'rgba(44,62,107,0.03)',
            border: '2px solid rgba(44,62,107,0.08)',
            minWidth: 'min(90vw, 500px)',
          }}>
            {/* Flap mechanism top bar */}
            <div className="absolute -top-1 left-0 right-0 h-1" style={{ background: 'repeating-linear-gradient(90deg, rgba(44,62,107,0.1) 0px, rgba(44,62,107,0.1) 2px, transparent 2px, transparent 4px)' }} />

            {/* Title text with split-flap simulation */}
            <div className="flex items-center justify-center flex-wrap py-4">
              {heroTitle.split('').map((ch, i) => (
                <SplitFlapChar key={i} char=" " target={ch} delay={i * 0.12} />
              ))}
            </div>

            {/* Clacking sound dots */}
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                  background: C.navy,
                  animation: `clackDot ${0.6 + i * 0.1}s ease-in-out ${i * 0.15}s infinite alternate`,
                  opacity: 0.2,
                }} />
              ))}
            </div>
          </div>
        </div>

        <p className="text-[14px] tracking-[0.2em] uppercase mb-4" style={{ color: C.textMuted, fontFamily: "'Courier Prime', monospace" }}>
          Honest Rates for Peculiar Guests
        </p>

        {/* Decorative brass divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px" style={{ background: C.textMuted }} />
          <span style={{ color: C.textMuted }}>✦</span>
          <div className="w-8 h-px" style={{ background: C.textMuted }} />
        </div>

        {/* Scroll indicator */}
        <div className="animate-bounce mt-4" style={{ color: C.textMuted }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </section>

      {/* ═══════════════════ THE QUARTERS ═══════════════════ */}
      <section id="quarters" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5" style={{ color: C.textMuted, border: `1px solid ${C.textMuted}33` }}>The Quarters</span>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold mt-6 mb-3" style={{ fontFamily: "'Futura', sans-serif", color: C.navy }}>
              Choose Your Chamber
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${selectedTier === tier.id ? 'ring-2' : 'ring-0'}`}
                style={{
                  background: C.cream,
                  border: `1px solid ${tier.color}44`,
                  boxShadow: selectedTier === tier.id ? `0 0 0 2px ${tier.color}` : 'none',
                }}
                onMouseEnter={() => setSpeedBoost(tier.id)}
                onMouseLeave={() => setSpeedBoost(null)}
                onClick={() => setSelectedTier(tier.id)}
              >
                {/* Flat-lay stop-motion video */}
                <FlatLayVideo
                  items={tier.items}
                  color={tier.color}
                  speedMultiplier={speedBoost === tier.id ? 1.5 : 1}
                />

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[16px] font-bold" style={{ fontFamily: "'Futura', sans-serif", color: C.navy }}>{tier.name}</h3>
                    <div className="text-right">
                      <span className="text-[20px] font-bold" style={{ fontFamily: "'Futura', sans-serif", color: tier.color === C.mustard ? C.navy : tier.color }}>${tier.price}</span>
                      <span className="text-[10px]" style={{ color: C.textMuted }}>/night</span>
                    </div>
                  </div>

                  {/* Feature checklist with stamp bullets */}
                  <div className="space-y-2 mt-4">
                    {tier.features.map((f, i) => (
                      <div key={i} className="flex items-center text-[12px]">
                        <StampBullet ok={f.ok} delay={i * 0.1} />
                        <span style={{ color: f.ok ? C.text : C.textMuted }}>{f.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Select indicator */}
                  <div className="mt-4 pt-3 border-t" style={{ borderColor: `${tier.color}22` }}>
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: selectedTier === tier.id ? tier.color : C.textMuted }}>
                      {selectedTier === tier.id ? '✓ Selected' : 'Click to select'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ A LA CARTE PROVISIONS ═══════════════════ */}
      <section id="provisions" className="py-24 px-6" style={{ background: 'rgba(44,62,107,0.02)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5" style={{ color: C.textMuted, border: `1px solid ${C.textMuted}33` }}>À La Carte Provisions</span>
            <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold mt-6" style={{ fontFamily: "'Futura', sans-serif", color: C.navy }}>
              Extras, Discreetly
            </h2>
          </div>

          {/* Horizontal carousel */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {ADDONS.map((addon) => (
              <div
                key={addon.id}
                className={`snap-start shrink-0 w-48 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${addons.includes(addon.id) ? 'ring-2' : ''}`}
                style={{
                  background: C.cream,
                  border: `1px solid rgba(44,62,107,0.08)`,
                  boxShadow: addons.includes(addon.id) ? `0 0 0 2px ${C.navy}` : 'none',
                }}
                onClick={() => toggleAddon(addon.id)}
              >
                {/* Square looping video simulation */}
                <div className="aspect-square relative overflow-hidden flex items-center justify-center" style={{ background: `${C.pink}22` }}>
                  <span className="text-[2.5rem]" style={{ animation: 'addonFloat 3s ease-in-out infinite' }}>
                    {addon.emoji}
                  </span>
                  {/* Spinning record / wheel animation */}
                  <div className="absolute inset-0 pointer-events-none" style={{ animation: addon.id === 'record' ? 'recordSpin 4s linear infinite' : 'none' }}>
                    {addon.id === 'record' && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2" style={{ borderColor: 'rgba(44,62,107,0.06)' }} />
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold" style={{ fontFamily: "'Futura', sans-serif", color: C.navy }}>{addon.name}</span>
                    <span className="text-[12px] font-bold" style={{ color: C.navy }}>${addon.price}</span>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: C.textMuted }}>{addon.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ THE LEDGER ═══════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5" style={{ color: C.textMuted, border: `1px solid ${C.textMuted}33` }}>The Ledger</span>
            <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold mt-6" style={{ fontFamily: "'Futura', sans-serif", color: C.navy }}>
              Settle Your Account
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: Adding machine animation */}
            <div className="rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center" style={{ background: 'rgba(44,62,107,0.03)', border: '1px solid rgba(44,62,107,0.06)' }}>
              {/* Adding machine / hand animation */}
              <div className="text-center">
                <div style={{ animation: 'addMachine 4s ease-in-out infinite' }}>
                  <span className="text-[3rem]">🖐️</span>
                </div>
                <div className="mt-2 font-mono text-[13px]" style={{ color: C.textMuted }}>
                  <div style={{ animation: 'addNumbers 0.5s steps(1) infinite' }}>
                    {`$${(selectedTier ? tierPrice * totalNights : 0) + addonTotal}.00`}
                  </div>
                </div>
                {/* Crank pull animation */}
                <div className="mt-4 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center" style={{ borderColor: C.navy, animation: 'crankPull 3s ease-in-out infinite' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Booking form */}
            <div className="space-y-6">
              {/* Selected tier */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: C.textMuted }}>Quarter</label>
                <div className="mt-1 text-[20px] font-bold" style={{ fontFamily: "'Futura', sans-serif", color: C.navy }}>
                  {selectedTier ? TIERS.find(t => t.id === selectedTier)?.name : '— None selected'}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: C.textMuted }}>Check-In</label>
                  <input
                    type="date"
                    value={checkin}
                    onChange={(e) => setCheckin(e.target.value)}
                    className="block w-full mt-1 pb-1 text-[15px] bg-transparent border-b-2 outline-none transition-colors"
                    style={{ borderColor: 'rgba(44,62,107,0.15)', color: C.navy, fontFamily: "'Courier Prime', monospace" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: C.textMuted }}>Check-Out</label>
                  <input
                    type="date"
                    value={checkout}
                    onChange={(e) => setCheckout(e.target.value)}
                    className="block w-full mt-1 pb-1 text-[15px] bg-transparent border-b-2 outline-none transition-colors"
                    style={{ borderColor: 'rgba(44,62,107,0.15)', color: C.navy, fontFamily: "'Courier Prime', monospace" }}
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: C.textMuted }}>Guests</label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="block w-full mt-1 pb-1 text-[15px] bg-transparent border-b-2 outline-none transition-colors"
                  style={{ borderColor: 'rgba(44,62,107,0.15)', color: C.navy, fontFamily: "'Courier Prime', monospace" }}
                />
              </div>

              {/* Add-ons summary */}
              {addons.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: 'rgba(44,62,107,0.06)' }}>
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2 block" style={{ color: C.textMuted }}>Provisions Selected</label>
                  <div className="space-y-1">
                    {ADDONS.filter(a => addons.includes(a.id)).map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-[12px]">
                        <span>{a.emoji} {a.name}</span>
                        <span style={{ color: C.textMuted }}>${a.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grand total */}
              <div className="pt-4 border-t-2" style={{ borderColor: C.navy }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: "'Futura', sans-serif" }}>Grand Total</span>
                  <span className="text-[24px] font-bold" style={{ fontFamily: "'Futura', 'sans-serif'", color: C.navy }}>
                    ${grandTotal}
                  </span>
                </div>
                {selectedTier && (
                  <div className="text-[10px] mt-1 text-right" style={{ color: C.textMuted }}>
                    ${tierPrice}/night × {totalNights} nights{addonTotal > 0 ? ` + $${addonTotal} provisions` : ''}
                  </div>
                )}
              </div>

              {/* Concierge bell CTA */}
              <button
                onClick={handleConfirm}
                disabled={!selectedTier}
                className={`relative w-full py-4 rounded-xl text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 overflow-hidden ${!selectedTier ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                style={{
                  background: C.navy,
                  color: C.cream,
                  fontFamily: "'Futura', sans-serif",
                  boxShadow: `0 4px 16px ${C.navy}33`,
                }}
              >
                {/* Bell icon */}
                <span className="inline-flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Confirm Stay
                </span>

                {/* Bell ring flash overlay */}
                {showBell && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{
                    background: C.cream,
                    animation: 'bellRing 0.8s ease-out forwards',
                  }}>
                    <span className="text-[28px]" style={{ animation: 'bellDing 0.3s ease-out' }}>🔔</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: 'rgba(44,62,107,0.06)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: C.navy }}>
              <span className="text-[8px] font-bold" style={{ color: C.cream, fontFamily: "'Futura', sans-serif" }}>T&H</span>
            </div>
            <span className="text-[11px] font-bold tracking-[0.15em]" style={{ fontFamily: "'Futura', sans-serif", color: C.navy }}>THE & HOTEL</span>
          </div>
          <p className="text-[11px] mb-2" style={{ color: C.textMuted }}>
            221B Baker Street · London · England
          </p>
          <p className="text-[10px]" style={{ color: C.textMuted }}>
            © 2026 · Established MMXXIV
          </p>
        </div>
      </footer>

      {/* ═══════════════════ GLOBAL STYLES ═══════════════════ */}
      <style jsx global>{`
        html { scroll-behavior: smooth; }

        @keyframes clackDot {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0.3); }
        }

        @keyframes flatlaySlide {
          0% { opacity: 0; transform: translateY(30px) scale(0.9); }
          60% { opacity: 1; transform: translateY(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes stampPop {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes stampInk {
          0% { transform: scale(0) rotate(-5deg); }
          50% { transform: scale(1.2) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        @keyframes addonFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes recordSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes addMachine {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(-5deg); }
          75% { transform: translateY(0) rotate(5deg); }
        }

        @keyframes addNumbers {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes crankPull {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-30deg); }
        }

        @keyframes bellRing {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1.1); }
          40% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }

        @keyframes bellDing {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
