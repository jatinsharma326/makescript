import React from 'react';
import { Check, Sparkles, Zap, Shield } from 'lucide-react';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-20 px-4">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 mb-6 drop-shadow-sm tracking-tight inline-block">
                    Supercharge your editing with AI.
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow">
                    Pick a plan that fits your creative workflow. Give your videos the state-of-the-art AI brains they deserve.
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full px-4">
                
                {/* Free Tier */}
                <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md p-8 flex flex-col transition-all hover:bg-white/[0.02] hover:border-white/10">
                    <h3 className="text-xl font-serif font-bold text-white mb-2">Hobby</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-3xl font-black text-white">$0</span>
                        <span className="text-muted-foreground text-sm font-medium">/month</span>
                    </div>
                    <p className="text-sm text-white/60 mb-8 flex-1">
                        Perfect for trying out the core features with fast, basic AI editing.
                    </p>
                    <div className="space-y-4 mb-8 text-sm text-white/80">
                        <FeatureItem text="Llama 3 8B AI Model" />
                        <FeatureItem text="Standard Auto B-Roll" />
                        <FeatureItem text="Basic Smart Cuts" />
                        <FeatureItem text="3 projects per month" />
                    </div>
                    <a
                        href="/auth"
                        className="w-full h-11 flex items-center justify-center rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                    >
                        Get Started
                    </a>
                </div>

                {/* Pro Tier (Highlighted) */}
                <div className="rounded-2xl border-2 border-indigo-500 bg-indigo-950/20 backdrop-blur-md p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-500/10">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-indigo-500/40">
                        Most Popular
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white mb-2 flex items-center gap-2">
                        Pro <Sparkles className="w-4 h-4 text-indigo-400" />
                    </h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-black text-white">$19</span>
                        <span className="text-indigo-200/60 text-sm font-medium">/month</span>
                    </div>
                    <p className="text-sm text-indigo-100/70 mb-8 flex-1">
                        Unleash the power of deep reasoning for cinematic B-Roll and flawless cuts.
                    </p>
                    <div className="space-y-4 mb-8 text-sm text-white/90 font-medium">
                        <FeatureItem text="DeepSeek V3 Model Access" highlight />
                        <FeatureItem text="Advanced Dynamic B-Roll & FX" />
                        <FeatureItem text="Full AI Content Hub (YouTube, Twitter)" />
                        <FeatureItem text="Unlimited projects" />
                        <FeatureItem text="Priority email support" />
                    </div>
                    <a
                        href="/checkout" // Placeholder for Stripe integration
                        className="w-full h-11 flex items-center justify-center rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 relative overflow-hidden group"
                    >
                        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative">Upgrade to Pro</span>
                    </a>
                </div>

                {/* Max Tier */}
                <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md p-8 flex flex-col transition-all hover:bg-white/[0.02] hover:border-white/10">
                    <h3 className="text-xl font-serif font-bold text-white mb-2 flex items-center gap-2">
                        Max <Zap className="w-4 h-4 text-amber-400" />
                    </h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-3xl font-black text-white">$39</span>
                        <span className="text-muted-foreground text-sm font-medium">/month</span>
                    </div>
                    <p className="text-sm text-white/60 mb-8 flex-1">
                        For professional volume and the absolute best AI performance on the market.
                    </p>
                    <div className="space-y-4 mb-8 text-sm text-white/80">
                        <FeatureItem text="Claude 3.5 Sonnet Model Access" highlight />
                        <FeatureItem text="Cinematic 4K Image Generation" />
                        <FeatureItem text="Highest priority generation queue" />
                        <FeatureItem text="Dedicated account manager" />
                        <FeatureItem text="Custom brand templates" />
                    </div>
                    <a
                        href="/checkout" // Placeholder
                        className="w-full h-11 flex items-center justify-center rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                    >
                        Go Max
                    </a>
                </div>

            </div>
        </div>
    );
}

function FeatureItem({ text, highlight = false }: { text: string; highlight?: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-emerald-400" strokeWidth={3} />
            </div>
            <span className={`leading-tight ${highlight ? 'font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}`}>
                {text}
            </span>
        </div>
    );
}
