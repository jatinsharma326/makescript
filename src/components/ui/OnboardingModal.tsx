'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Download, ArrowRight, X } from 'lucide-react';

const ONBOARDING_KEY = 'makescript-onboarded';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const steps = [
    {
        icon: Upload,
        title: 'Upload your video',
        description: 'Drag and drop any MP4, WebM, or MOV file. Processing starts immediately — no setup needed.',
        color: '#6366f1',
        gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    },
    {
        icon: Sparkles,
        title: 'AI enhances it',
        description: 'Our AI transcribes your audio, identifies key moments, and adds motion graphics — lower thirds, kinetic text, highlight boxes — automatically.',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    },
    {
        icon: Download,
        title: 'Export & share',
        description: 'Preview everything in real-time, tweak what you want, then export at up to 4K with all effects baked in. Ready for YouTube, TikTok, or anywhere.',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    },
];

export function shouldShowOnboarding(): boolean {
    try {
        return !localStorage.getItem(ONBOARDING_KEY);
    } catch {
        return false;
    }
}

export function markOnboardingComplete(): void {
    try {
        localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
        // ignore
    }
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            markOnboardingComplete();
            onClose();
        }
    };

    const handleSkip = () => {
        markOnboardingComplete();
        onClose();
    };

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

            {/* Modal */}
            <div className={`relative w-full max-w-[440px] mx-4 rounded-2xl border border-white/[0.08] overflow-hidden transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                style={{ background: 'rgba(17,17,19,0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 80px -20px rgba(0,0,0,0.8)' }}>

                {/* Close button */}
                <button onClick={handleSkip} className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.05] transition-all z-10">
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="p-8 text-center">
                    {/* Step icon */}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500"
                        style={{ background: step.gradient, boxShadow: `0 8px 30px ${step.color}40` }}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Step counter */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-indigo-500' : i < currentStep ? 'w-4 bg-indigo-500/40' : 'w-4 bg-white/[0.06]'}`} />
                        ))}
                    </div>

                    <h2 className="text-xl font-bold tracking-[-0.02em] text-white mb-3">
                        {step.title}
                    </h2>
                    <p className="text-[14px] text-zinc-400 leading-relaxed max-w-[340px] mx-auto mb-8">
                        {step.description}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button onClick={handleSkip} className="flex-1 h-10 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-white/[0.06] transition-all">
                            Skip
                        </button>
                        <button onClick={handleNext}
                            className="flex-1 h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 text-white transition-all"
                            style={{ background: step.gradient, boxShadow: `0 4px 15px ${step.color}30` }}>
                            {currentStep < steps.length - 1 ? 'Next' : 'Get started'}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
