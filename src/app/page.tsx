'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setMounted(true);
    // Check for saved or OS preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Navigation */}
      <nav
        className="glass"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#fff',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            }}
          >
            M
          </div>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
            }}
          >
            Make<span className="gradient-text">Script</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <Link href="/editor" className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
            Get Started →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          paddingTop: '140px',
          paddingBottom: '100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          className={mounted ? 'animate-fade-in' : ''}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'var(--accent-light)',
            border: '1px solid var(--accent-primary)',
            borderColor: 'rgba(37, 99, 235, 0.25)',
            fontSize: '13px',
            color: 'var(--accent-primary)',
            fontWeight: 500,
            marginBottom: '28px',
          }}
        >
          ✨ AI-Powered Video Enhancement
        </div>

        <h1
          className={mounted ? 'animate-fade-in stagger-1' : ''}
          style={{
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 900,
            lineHeight: 1.1,
            maxWidth: '780px',
            letterSpacing: '-2px',
          }}
        >
          Add <span className="gradient-text">Motion Graphics</span>
          <br />
          to Any Video
        </h1>

        <p
          className={mounted ? 'animate-fade-in stagger-2' : ''}
          style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '540px',
            lineHeight: 1.7,
            marginTop: '24px',
          }}
        >
          Upload your video. Get instant transcripts. Select any subtitle and
          add stunning animated overlays — all powered by AI.
        </p>

        <div
          className={mounted ? 'animate-fade-in stagger-3' : ''}
          style={{ display: 'flex', gap: '12px', marginTop: '36px' }}
        >
          <Link href="/editor" className="btn-primary" style={{ fontSize: '17px', padding: '14px 32px' }}>
            🎬 Start Creating — Free
          </Link>
          <a href="#how-it-works" className="btn-secondary" style={{ fontSize: '17px', padding: '14px 32px' }}>
            How It Works
          </a>
        </div>

        {/* Demo preview card */}
        <div
          className={mounted ? 'animate-fade-in stagger-4' : ''}
          style={{
            marginTop: '56px',
            width: '90%',
            maxWidth: '880px',
            aspectRatio: '16 / 9',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Mock editor preview */}
          <div style={{ display: 'flex', width: '90%', gap: '16px', height: '70%' }}>
            {/* Video area */}
            <div
              style={{
                flex: 2,
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '48px', opacity: 0.5 }}>🎥</div>
              {/* Lower third preview */}
              <div
                className="animate-slide-in"
                style={{
                  position: 'absolute',
                  bottom: '15%',
                  left: '10%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div
                  style={{
                    background: 'var(--accent-primary)',
                    padding: '4px 14px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  Jatin
                </div>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    padding: '3px 14px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    color: 'var(--text-secondary)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  Founder
                </div>
              </div>
              {/* Subtitle preview */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '5%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-card)',
                  padding: '4px 16px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>Welcome</span> to my channel
              </div>
              {/* Emoji */}
              <div
                className="animate-float"
                style={{ position: 'absolute', top: '15%', right: '10%', fontSize: '28px' }}
              >
                🔥
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['0:00 - Welcome back...', '0:03 - Today we talk...', '0:06 - Let me show...', '0:09 - This is really...'].map(
                (text, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px',
                      background: i === 0 ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      borderRadius: '8px',
                      fontSize: '10px',
                      color: i === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      border: i === 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      borderColor: i === 0 ? 'rgba(37, 99, 235, 0.3)' : 'var(--border-color)',
                    }}
                  >
                    {text}
                    {i === 0 && (
                      <span style={{ display: 'block', marginTop: '4px', fontSize: '9px', color: 'var(--accent-primary)' }}>
                        📛 Lower Third
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        style={{
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>
          How It <span className="gradient-text">Works</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '16px' }}>
          Four simple steps to transform any video
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            maxWidth: '920px',
            width: '100%',
          }}
        >
          {[
            { step: '01', icon: '📤', title: 'Upload Video', desc: 'Drag & drop any MP4 video. We handle the rest.' },
            { step: '02', icon: '📝', title: 'Auto Transcript', desc: 'AI generates word-level subtitles with perfect timing.' },
            { step: '03', icon: '🎨', title: 'Add Motion Graphics', desc: 'Select any subtitle. Pick from overlays — lower thirds, emojis & more.' },
            { step: '04', icon: '⬇️', title: 'Preview & Download', desc: 'Preview in real-time. Download your enhanced video.' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ padding: '28px', position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  fontSize: '44px',
                  fontWeight: 900,
                  color: 'var(--accent-primary)',
                  opacity: 0.08,
                }}
              >
                {item.step}
              </span>
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features / Templates */}
      <section
        style={{
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
        }}
      >
        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px' }}>
          Overlay <span className="gradient-text">Templates</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '44px', fontSize: '16px' }}>
          Professional motion graphics, one click away
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            maxWidth: '800px',
            width: '100%',
          }}
        >
          {[
            { icon: '📛', name: 'Lower Third', color: '#2563eb' },
            { icon: '🔲', name: 'Highlight Box', color: '#d97706' },
            { icon: '🔥', name: 'Emoji Reaction', color: '#dc2626' },
            { icon: '🔍', name: 'Zoom Effect', color: '#16a34a' },
            { icon: '✨', name: 'Scene Transition', color: '#7c3aed' },
            { icon: '💬', name: 'Animated Subtitles', color: '#0891b2' },
          ].map((feat, i) => (
            <div
              key={i}
              className="card"
              style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: `${feat.color}12`,
                  border: `1px solid ${feat.color}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                {feat.icon}
              </div>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{feat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '100px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '500px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '14px', letterSpacing: '-1px' }}>
          Ready to <span className="gradient-text">Transform</span> Your Videos?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px', maxWidth: '480px' }}>
          No editing skills needed. Upload, click, and download — it&apos;s that simple.
        </p>
        <Link href="/editor" className="btn-primary" style={{ fontSize: '17px', padding: '14px 36px' }}>
          🚀 Start Free — No Sign Up
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '20px 40px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: '#fff',
              fontWeight: 800,
            }}
          >
            M
          </div>
          <span>MakeScript © 2026</span>
        </div>
        <span>Built with Remotion + Next.js</span>
      </footer>
    </div>
  );
}
