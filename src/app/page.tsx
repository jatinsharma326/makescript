'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
          padding: '16px 40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>🎬</span>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
            }}
          >
            Make<span className="gradient-text">Script</span>
          </span>
        </div>
        <Link href="/editor" className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
          Get Started →
        </Link>
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
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
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
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            fontSize: '13px',
            color: '#a5a6f6',
            marginBottom: '28px',
          }}
        >
          ✨ AI-Powered Video Enhancement
        </div>

        <h1
          className={mounted ? 'animate-fade-in stagger-1' : ''}
          style={{
            fontSize: 'clamp(36px, 5vw, 68px)',
            fontWeight: 900,
            lineHeight: 1.1,
            maxWidth: '800px',
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
            maxWidth: '560px',
            lineHeight: 1.7,
            marginTop: '24px',
          }}
        >
          Upload your video. Get instant transcripts. Select any subtitle and
          add stunning animated overlays — lower thirds, emoji reactions, highlights
          — all powered by AI.
        </p>

        <div
          className={mounted ? 'animate-fade-in stagger-3' : ''}
          style={{ display: 'flex', gap: '16px', marginTop: '40px' }}
        >
          <Link href="/editor" className="btn-primary" style={{ fontSize: '18px', padding: '16px 36px' }}>
            🎬 Start Creating — Free
          </Link>
        </div>

        {/* Demo preview card */}
        <div
          className={mounted ? 'animate-fade-in stagger-4' : ''}
          style={{
            marginTop: '60px',
            width: '90%',
            maxWidth: '900px',
            aspectRatio: '16 / 9',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Gradient border glow */}
          <div
            style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: 'inherit',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7, #6366f1)',
              opacity: 0.3,
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '1px',
              borderRadius: 'inherit',
              background: 'var(--bg-card)',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Mock editor preview */}
            <div style={{ display: 'flex', width: '90%', gap: '16px', height: '70%' }}>
              {/* Video area */}
              <div
                style={{
                  flex: 2,
                  background: '#0d0d14',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '48px' }}>🎥</div>
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
                      background: '#6366f1',
                      padding: '4px 14px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    Jatin
                  </div>
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      padding: '3px 14px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      color: '#aaa',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
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
                    background: 'rgba(0,0,0,0.5)',
                    padding: '4px 16px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                >
                  <span style={{ color: '#6366f1', fontWeight: 700 }}>Welcome</span> to my channel
                </div>
                {/* Emoji */}
                <div
                  className="animate-float"
                  style={{
                    position: 'absolute',
                    top: '15%',
                    right: '10%',
                    fontSize: '28px',
                  }}
                >
                  🔥
                </div>
              </div>

              {/* Sidebar */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {['0:00 - Welcome back...', '0:03 - Today we talk...', '0:06 - Let me show...', '0:09 - This is really...'].map(
                  (text, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px',
                        background: i === 0 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        fontSize: '10px',
                        color: i === 0 ? '#a5a6f6' : '#666',
                        border: i === 0 ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                      }}
                    >
                      {text}
                      {i === 0 && (
                        <span
                          style={{
                            display: 'block',
                            marginTop: '4px',
                            fontSize: '9px',
                            color: '#6366f1',
                          }}
                        >
                          📛 Lower Third
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '38px',
            fontWeight: 800,
            marginBottom: '60px',
            letterSpacing: '-1px',
          }}
        >
          How It <span className="gradient-text">Works</span>
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            maxWidth: '900px',
            width: '100%',
          }}
        >
          {[
            {
              step: '01',
              icon: '📤',
              title: 'Upload Video',
              desc: 'Drag & drop any MP4 video. We handle the rest.',
            },
            {
              step: '02',
              icon: '📝',
              title: 'Auto Transcript',
              desc: 'AI generates word-level subtitles with perfect timing.',
            },
            {
              step: '03',
              icon: '🎨',
              title: 'Add Motion Graphics',
              desc: 'Select any subtitle. Pick from overlays — lower thirds, emojis, highlights & more.',
            },
            {
              step: '04',
              icon: '⬇️',
              title: 'Preview & Download',
              desc: 'Preview in real-time. Download your enhanced video.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="card"
              style={{ padding: '32px', position: 'relative' }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '48px',
                  fontWeight: 900,
                  color: 'rgba(99, 102, 241, 0.08)',
                }}
              >
                {item.step}
              </span>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        style={{
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
        }}
      >
        <h2
          style={{
            fontSize: '38px',
            fontWeight: 800,
            marginBottom: '16px',
            letterSpacing: '-1px',
          }}
        >
          Overlay <span className="gradient-text">Templates</span>
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '48px',
            fontSize: '16px',
          }}
        >
          Professional motion graphics, one click away
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            maxWidth: '800px',
            width: '100%',
          }}
        >
          {[
            { icon: '📛', name: 'Lower Third', color: '#6366f1' },
            { icon: '🔲', name: 'Highlight Box', color: '#f59e0b' },
            { icon: '🔥', name: 'Emoji Reaction', color: '#ef4444' },
            { icon: '🔍', name: 'Zoom Effect', color: '#22c55e' },
            { icon: '✨', name: 'Scene Transition', color: '#8b5cf6' },
            { icon: '💬', name: 'Animated Subtitles', color: '#06b6d4' },
          ].map((feat, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${feat.color}15`,
                  border: `1px solid ${feat.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                }}
              >
                {feat.icon}
              </div>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{feat.name}</span>
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
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <h2 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '16px', letterSpacing: '-1px' }}>
          Ready to <span className="gradient-text">Transform</span> Your Videos?
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '36px',
            fontSize: '16px',
            maxWidth: '500px',
          }}
        >
          No editing skills needed. Upload, click, and download — it&apos;s that simple.
        </p>
        <Link href="/editor" className="btn-primary" style={{ fontSize: '18px', padding: '16px 40px' }}>
          🚀 Start Free — No Sign Up
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '24px 40px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}
      >
        <span>🎬 MakeScript © 2026</span>
        <span>Built with Remotion + Next.js</span>
      </footer>
    </div>
  );
}
