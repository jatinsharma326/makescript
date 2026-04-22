'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, Loader2, Hash, Type, FileText, Zap, Twitter, Linkedin, List } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface AiMetaModalProps {
    isOpen: boolean;
    onClose: () => void;
    transcript: string;
}

interface MetaResult {
    title: string;
    description: string;
    hashtags: string[];
    hook: string;
    chapters: string;
    twitter: string;
    linkedin: string;
}

type TabType = 'youtube' | 'chapters' | 'twitter' | 'linkedin';

export default function AiMetaModal({ isOpen, onClose, transcript }: AiMetaModalProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<MetaResult | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('youtube');

    if (!isOpen) return null;

    const generate = async () => {
        setIsGenerating(true);
        setResult(null);
        setActiveTab('youtube');
        try {
            const res = await fetch('/api/ai-generate-meta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript }),
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            console.error('Failed to generate meta:', e);
        }
        setIsGenerating(false);
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const CopyBtn: React.FC<{ text: string; field: string }> = ({ text, field }) => (
        <button
            onClick={() => copyToClipboard(text, field)}
            className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
            title="Copy"
        >
            {copiedField === field ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[#0f1219] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">AI Content Hub</h2>
                            <p className="text-[10px] text-muted-foreground">Repurpose your video</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {!result && !isGenerating && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-violet-400" />
                            </div>
                            <h3 className="text-sm font-medium text-white mb-1">Generate Social Content</h3>
                            <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
                                AI will analyze your transcript and instantly write your YouTube Metadata, Chapters, a Twitter thread, and a LinkedIn post.
                            </p>
                            <Button
                                onClick={generate}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 h-10 text-sm font-medium rounded-xl shadow-lg shadow-violet-500/20"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Everything
                            </Button>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="text-center py-16">
                            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
                            <p className="text-sm font-medium text-white">Writing your content...</p>
                            <p className="text-xs text-muted-foreground mt-1">This takes about 5-10 seconds.</p>
                        </div>
                    )}

                    {result && (
                        <div className="flex flex-col h-full">
                            {/* Tabs */}
                            <div className="flex p-1 bg-white/5 rounded-lg mb-6 shrink-0">
                                {[
                                    { id: 'youtube', label: 'YouTube', icon: FileText },
                                    { id: 'chapters', label: 'Chapters', icon: List },
                                    { id: 'twitter', label: 'Twitter', icon: Twitter },
                                    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all",
                                            activeTab === tab.id
                                                ? "bg-indigo-500 text-white shadow-sm"
                                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {/* YouTube Tab */}
                                {activeTab === 'youtube' && (
                                    <>
                                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Type className="w-3.5 h-3.5 text-violet-400" />
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Title</span>
                                                </div>
                                                <CopyBtn text={result.title} field="title" />
                                            </div>
                                            <p className="text-sm font-semibold text-white leading-snug">{result.title}</p>
                                        </div>

                                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Description</span>
                                                </div>
                                                <CopyBtn text={result.description} field="description" />
                                            </div>
                                            <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{result.description}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Thumbnail Hook</span>
                                                    </div>
                                                    <CopyBtn text={result.hook} field="hook" />
                                                </div>
                                                <p className="text-sm font-bold text-amber-300">{result.hook}</p>
                                            </div>

                                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tags</span>
                                                    </div>
                                                    <CopyBtn text={result.hashtags.join(' ')} field="hashtags" />
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {result.hashtags.map((tag, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 font-medium">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Chapters Tab */}
                                {activeTab === 'chapters' && (
                                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <List className="w-4 h-4 text-blue-400" />
                                                <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Video Timestamps</span>
                                            </div>
                                            <CopyBtn text={result.chapters} field="chapters" />
                                        </div>
                                        <div className="bg-black/30 p-4 rounded-lg font-mono text-xs text-white/80 whitespace-pre-wrap flex-1 overflow-y-auto custom-scrollbar">
                                            {result.chapters}
                                        </div>
                                    </div>
                                )}

                                {/* Twitter Tab */}
                                {activeTab === 'twitter' && (
                                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Twitter className="w-4 h-4 text-sky-400" />
                                                <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Twitter Thread</span>
                                            </div>
                                            <CopyBtn text={result.twitter} field="twitter" />
                                        </div>
                                        <div className="bg-black/30 p-4 rounded-lg text-sm text-white/90 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto custom-scrollbar">
                                            {result.twitter}
                                        </div>
                                    </div>
                                )}

                                {/* LinkedIn Tab */}
                                {activeTab === 'linkedin' && (
                                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Linkedin className="w-4 h-4 text-blue-500" />
                                                <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">LinkedIn Post</span>
                                            </div>
                                            <CopyBtn text={result.linkedin} field="linkedin" />
                                        </div>
                                        <div className="bg-black/30 p-4 rounded-lg text-sm text-white/90 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto custom-scrollbar">
                                            {result.linkedin}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {result && (
                    <div className="px-6 py-4 border-t border-white/5 flex justify-end shrink-0">
                        <Button
                            onClick={generate}
                            variant="outline"
                            className="h-8 text-xs border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
                        >
                            <Sparkles className="w-3 h-3 mr-1.5" />
                            Regenerate All
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
