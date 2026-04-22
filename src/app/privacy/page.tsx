'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Film, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('theme');
        document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
    }, []);

    if (!mounted) return <div className="min-h-screen flex items-center justify-center bg-[var(--lp-bg)]"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--lp-text-faint)]" /></div>;

    return (
        <div className="min-h-screen bg-[var(--lp-bg)] text-[var(--lp-text)]">
            <header className="border-b border-[var(--lp-border)] py-4 px-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Film className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-bold text-[15px] tracking-[-0.02em]">MakeScript</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-1.5 text-[13px] text-[var(--lp-text-muted)] hover:text-[var(--lp-text)] transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-16">
                <h1 className="text-3xl font-bold tracking-[-0.03em] mb-2">Privacy Policy</h1>
                <p className="text-[var(--lp-text-muted)] text-sm mb-10">Last updated: February 25, 2026</p>

                <div className="prose-custom space-y-8">
                    <section>
                        <h2>1. Overview</h2>
                        <p>At MakeScript, your privacy is a core priority. This Privacy Policy explains what information we collect, how we use it, and what choices you have. We are committed to transparency and protecting your data.</p>
                    </section>

                    <section>
                        <h2>2. Information We Collect</h2>
                        <h3>Account Information</h3>
                        <p>When you create an account, we collect your name, email address, and password (stored encrypted). This is used to identify your account and deliver the Service.</p>

                        <h3>Usage Data</h3>
                        <p>We may collect anonymous usage metrics such as feature usage frequency, video processing counts, and general interaction patterns to improve the Service.</p>

                        <h3>Video Content</h3>
                        <p><strong>We do not store your video files on our servers.</strong> All video processing — including transcription and overlay generation — occurs client-side in your browser. Video data remains on your device at all times.</p>
                    </section>

                    <section>
                        <h2>3. How We Use Your Information</h2>
                        <ul>
                            <li><strong>Providing the Service:</strong> Account management, subscription handling, and feature delivery</li>
                            <li><strong>AI Processing:</strong> Transcript text (not video/audio data) may be sent to third-party AI providers (OpenAI, Anthropic, Google) for overlay suggestions. This text is not stored by these providers.</li>
                            <li><strong>Communications:</strong> Service announcements, product updates, and billing notifications</li>
                            <li><strong>Improvement:</strong> Anonymous analytics to improve features and performance</li>
                        </ul>
                    </section>

                    <section>
                        <h2>4. Third-Party AI Providers</h2>
                        <p>MakeScript uses AI models from third-party providers for transcription and overlay generation:</p>
                        <ul>
                            <li><strong>OpenAI</strong> — Whisper (transcription), GPT models</li>
                            <li><strong>Anthropic</strong> — Claude models</li>
                            <li><strong>Google</strong> — Gemini models</li>
                            <li><strong>DeepSeek, Meta, Moonshot</strong> — Various AI models</li>
                        </ul>
                        <p>Only transcript text is sent to these providers. Your video and audio files are never transmitted. Each provider has their own privacy policy governing their handling of data.</p>
                    </section>

                    <section>
                        <h2>5. Data Storage</h2>
                        <p>Project data (transcripts, overlays, settings) is stored locally in your browser using IndexedDB and localStorage. This data persists between sessions but remains on your device.</p>
                        <p>Account information is stored securely. We use industry-standard encryption for sensitive data like passwords.</p>
                    </section>

                    <section>
                        <h2>6. Data Sharing</h2>
                        <p>We do not sell, rent, or trade your personal information. We may share data only in these circumstances:</p>
                        <ul>
                            <li>With your explicit consent</li>
                            <li>To comply with legal obligations</li>
                            <li>To protect the rights and safety of our users</li>
                            <li>With service providers who assist in operating the Service (e.g., payment processing)</li>
                        </ul>
                    </section>

                    <section>
                        <h2>7. Cookies & Tracking</h2>
                        <p>MakeScript uses essential cookies for authentication and preferences (such as theme selection). We do not use third-party advertising trackers. Analytics, when implemented, will collect only anonymized, aggregated data.</p>
                    </section>

                    <section>
                        <h2>8. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li><strong>Access</strong> your personal information</li>
                            <li><strong>Correct</strong> inaccurate data</li>
                            <li><strong>Delete</strong> your account and associated data</li>
                            <li><strong>Export</strong> your data in a standard format</li>
                            <li><strong>Opt out</strong> of non-essential communications</li>
                        </ul>
                        <p>To exercise these rights, visit your Settings page or contact us at <a href="mailto:privacy@makescript.app">privacy@makescript.app</a>.</p>
                    </section>

                    <section>
                        <h2>9. Data Security</h2>
                        <p>We implement appropriate technical and organizational measures to protect your data, including encryption in transit and at rest, access controls, and regular security assessments.</p>
                    </section>

                    <section>
                        <h2>10. Changes to This Policy</h2>
                        <p>We may update this Privacy Policy from time to time. We will notify users of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance.</p>
                    </section>

                    <section>
                        <h2>11. Contact</h2>
                        <p>For privacy-related inquiries, contact us at <a href="mailto:privacy@makescript.app">privacy@makescript.app</a>.</p>
                    </section>
                </div>
            </main>

            <footer className="border-t border-[var(--lp-border)] py-6 px-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between text-[12px] text-[var(--lp-text-dim)]">
                    <span>MakeScript &copy; 2026</span>
                    <div className="flex gap-4">
                        <Link href="/terms" className="hover:text-[var(--lp-text-sub)] transition-colors">Terms of Service</Link>
                        <Link href="/" className="hover:text-[var(--lp-text-sub)] transition-colors">Home</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
