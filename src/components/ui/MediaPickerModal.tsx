'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, Loader2, ImageIcon, VideoIcon, Sparkles, Check } from 'lucide-react';

interface MediaResult {
    id: string;
    type: 'gif' | 'image' | 'video';
    url: string;
    thumbnailUrl: string;
    source: string;
    title?: string;
    width?: number;
    height?: number;
    duration?: number;
}

interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (media: MediaResult) => void;
    segmentText?: string; // Pre-fill search with segment text
    overlayType?: 'gif-reaction' | 'image-card' | 'broll-video' | 'ai-generated-image';
}

const SOURCE_BADGES: Record<string, { color: string; label: string }> = {
    giphy: { color: '#6366f1', label: 'Giphy' },
    pexels: { color: '#10b981', label: 'Pexels' },
    pixabay: { color: '#f59e0b', label: 'Pixabay' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    gif: <Sparkles className="w-3 h-3" />,
    image: <ImageIcon className="w-3 h-3" />,
    video: <VideoIcon className="w-3 h-3" />,
};

export default function MediaPickerModal({
    isOpen,
    onClose,
    onSelect,
    segmentText = '',
    overlayType = 'gif-reaction',
}: MediaPickerModalProps) {
    const [query, setQuery] = useState(segmentText.substring(0, 50));
    const [results, setResults] = useState<MediaResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<MediaResult | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'gif' | 'image' | 'video'>(
        overlayType === 'gif-reaction' ? 'gif' : 
        overlayType === 'broll-video' ? 'video' : 
        overlayType === 'image-card' || overlayType === 'ai-generated-image' ? 'image' : 'all'
    );
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-search when modal opens with segment text
    useEffect(() => {
        if (isOpen && segmentText) {
            setQuery(segmentText.substring(0, 50));
            performSearch(segmentText.substring(0, 50));
        }
    }, [isOpen, segmentText]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        setSelectedMedia(null);

        try {
            const response = await fetch(`/api/search-media?q=${encodeURIComponent(searchQuery)}&type=${activeTab}&limit=30`);
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('[MediaPicker] Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    // Search when tab changes
    useEffect(() => {
        if (isOpen && query.trim()) {
            performSearch(query);
        }
    }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };

    const handleSelect = () => {
        if (selectedMedia) {
            onSelect(selectedMedia);
            onClose();
        }
    };

    const handleMediaClick = (media: MediaResult) => {
        setSelectedMedia(media);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div 
                className="w-[900px] max-w-[95vw] max-h-[85vh] rounded-xl border border-border overflow-hidden flex flex-col"
                style={{ background: 'var(--bg-card)', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}>
                            <ImageIcon className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-semibold text-foreground">Media Library</h2>
                            <p className="text-[11px] text-muted-foreground">Search GIFs, images & videos from stock libraries</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-5 py-3 border-b border-border shrink-0">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for GIFs, images, or videos..."
                                className="w-full text-[13px] pl-10 pr-4 py-2.5 rounded-lg border border-border bg-black/20 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="h-10 px-4 rounded-lg text-[12px] font-semibold flex items-center gap-2 transition-all disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: '#fff' }}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search
                        </button>
                    </form>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 mt-3">
                        {(['all', 'gif', 'image', 'video'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                                    activeTab === tab 
                                        ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25' 
                                        : 'text-muted-foreground hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                {TYPE_ICONS[tab]}
                                {tab === 'all' ? 'All Media' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                            <p className="text-[12px] text-muted-foreground">Searching media libraries...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                            <p className="text-[12px] text-muted-foreground">
                                {query.trim() ? 'No results found. Try a different search term.' : 'Search for media to add to your video'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3">
                            {results.map((media) => (
                                <div
                                    key={media.id}
                                    onClick={() => handleMediaClick(media)}
                                    className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                                        selectedMedia?.id === media.id 
                                            ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-black' 
                                            : 'hover:ring-1 hover:ring-white/20'
                                    }`}
                                    style={{ aspectRatio: '4/3', background: 'rgba(0,0,0,0.3)' }}
                                >
                                    {/* Thumbnail */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={media.thumbnailUrl}
                                        alt={media.title || 'media'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            target.style.display = 'none';
                                            if (target.parentElement) {
                                                target.parentElement.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
                                            }
                                        }}
                                    />

                                    {/* Selection checkmark */}
                                    {selectedMedia?.id === media.id && (
                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shadow-lg">
                                            <Check className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}

                                    {/* Source badge */}
                                    <div 
                                        className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1"
                                        style={{ background: SOURCE_BADGES[media.source]?.color || '#666', color: '#fff' }}
                                    >
                                        {TYPE_ICONS[media.type]}
                                        {SOURCE_BADGES[media.source]?.label || media.source}
                                    </div>

                                    {/* Duration for videos */}
                                    {media.type === 'video' && media.duration && (
                                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                                            {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}
                                        </div>
                                    )}

                                    {/* GIF indicator */}
                                    {media.type === 'gif' && (
                                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-indigo-500/80 text-[9px] font-bold text-white">
                                            GIF
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {selectedMedia && (
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-5 h-5 rounded flex items-center justify-center"
                                    style={{ background: SOURCE_BADGES[selectedMedia.source]?.color || '#666' }}
                                >
                                    {TYPE_ICONS[selectedMedia.type]}
                                </div>
                                <span>
                                    {selectedMedia.type.toUpperCase()} from {SOURCE_BADGES[selectedMedia.source]?.label || selectedMedia.source}
                                    {selectedMedia.width && selectedMedia.height && ` • ${selectedMedia.width}×${selectedMedia.height}`}
                                </span>
                            </div>
                        )}
                        {!selectedMedia && (
                            <span>Select a media item to add to your video</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSelect}
                            disabled={!selectedMedia}
                            className="px-5 py-2 rounded-lg text-[12px] font-semibold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: '#fff' }}
                        >
                            <Check className="w-4 h-4" />
                            Add to Video
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}