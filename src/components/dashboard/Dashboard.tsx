import React, { useMemo, useState, useCallback, useRef } from 'react';
import { ProjectMeta, TranscriptStatus } from '../../lib/types';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import {
    Plus, Upload, Clock, Film, Sparkles, ArrowRight, LayoutGrid, List,
    Play, Layers, FileVideo, Wand2, Zap, ChevronRight, Command,
    Video, Type, Boxes, Eye, Download, Trash2, BarChart3
} from 'lucide-react';

interface DashboardProps {
    projects: ProjectMeta[];
    onNewProject: () => void;
    onSelectProject: (id: string) => void;
    onImport: () => void;
}

const OVERLAY_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    VisualIllustration: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Motion Graphics' },
    KineticText: { bg: 'bg-pink-500/10', text: 'text-pink-400', label: 'Kinetic Text' },
    HighlightBox: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Highlight Box' },
    GlowingParticles: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Particles' },
    SceneTransition: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Transitions' },
    LowerThird: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Lower Thirds' },
};

const SHORTCUTS = [
    { keys: ['Ctrl', 'Z'], action: 'Undo' },
    { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
    { keys: ['Space'], action: 'Play / Pause' },
    { keys: ['Ctrl', 'E'], action: 'Export video' },
    { keys: ['Ctrl', 'S'], action: 'Save project' },
    { keys: ['/'], action: 'All shortcuts' },
];

export const Dashboard: React.FC<DashboardProps> = ({
    projects,
    onNewProject,
    onSelectProject,
    onImport
}) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [dragOver, setDragOver] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    const stats = useMemo(() => {
        const totalDuration = projects.reduce((acc, p) => acc + p.duration, 0);
        const totalFX = projects.reduce((acc, p) => acc + p.overlayCount, 0);
        const totalSegments = projects.reduce((acc, p) => acc + p.segmentCount, 0);
        const readyCount = projects.filter(p => p.transcriptStatus === 'real').length;
        return { count: projects.length, duration: totalDuration, fx: totalFX, segments: totalSegments, readyCount };
    }, [projects]);

    const recentProjects = useMemo(() =>
        [...projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),
        [projects]
    );

    const fmtDuration = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const fmtTotalDuration = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        const h = Math.floor(seconds / 3600);
        const m = Math.round((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('video/')) {
            onImport();
        }
    }, [onImport]);

    const statusColor = (status: TranscriptStatus) => {
        switch (status) {
            case 'real': return 'bg-emerald-500';
            case 'transcribing': return 'bg-amber-500 animate-pulse';
            case 'mock-error': return 'bg-orange-500';
            default: return 'bg-zinc-600';
        }
    };

    const statusLabel = (status: TranscriptStatus) => {
        switch (status) {
            case 'real': return 'Ready';
            case 'transcribing': return 'Processing';
            case 'mock-error': return 'Fallback';
            default: return 'Draft';
        }
    };

    return (
        <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex-1 flex flex-col bg-background overflow-hidden relative"
        >
            {/* Drag overlay */}
            {dragOver && (
                <div className="absolute inset-0 z-50 bg-indigo-600/10 border-2 border-dashed border-indigo-500/50 backdrop-blur-sm flex items-center justify-center rounded-lg m-2">
                    <div className="text-center">
                        <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                        <p className="text-lg font-semibold text-white">Drop video to import</p>
                        <p className="text-sm text-zinc-400 mt-1">MP4, WebM, MOV</p>
                    </div>
                </div>
            )}

            {/* Subtle radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-background to-background pointer-events-none" />

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                <div className="max-w-[1400px] mx-auto p-6 md:p-8 space-y-8">

                    {/* ===== Row 1: Upload + Stats ===== */}
                    <div className="grid lg:grid-cols-5 gap-4">
                        {/* Upload Zone */}
                        <div
                            onClick={onNewProject}
                            className="lg:col-span-2 group relative rounded-xl border border-dashed border-zinc-800 hover:border-indigo-500/40 bg-zinc-900/30 hover:bg-indigo-500/[0.03] cursor-pointer transition-all duration-300 overflow-hidden min-h-[200px] flex flex-col items-center justify-center p-8"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.04),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 group-hover:bg-indigo-500/10 border border-zinc-700/50 group-hover:border-indigo-500/20 flex items-center justify-center mx-auto mb-4 transition-all group-hover:scale-105">
                                    <FileVideo className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <p className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors mb-1">
                                    Import video
                                </p>
                                <p className="text-xs text-zinc-600 mb-4">
                                    Drop a file or click to browse
                                </p>
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    {['MP4', 'WebM', 'MOV', 'AVI'].map(fmt => (
                                        <span key={fmt} className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-800/80 text-zinc-500 border border-zinc-800">
                                            {fmt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                            <StatCard
                                label="Projects"
                                value={stats.count.toString()}
                                icon={<Film className="w-4 h-4" />}
                                accent="text-zinc-300"
                                iconBg="bg-zinc-800"
                            />
                            <StatCard
                                label="Total runtime"
                                value={fmtTotalDuration(stats.duration)}
                                icon={<Clock className="w-4 h-4" />}
                                accent="text-zinc-300"
                                iconBg="bg-zinc-800"
                            />
                            <StatCard
                                label="AI overlays"
                                value={stats.fx.toString()}
                                icon={<Sparkles className="w-4 h-4" />}
                                accent="text-indigo-400"
                                iconBg="bg-indigo-500/10"
                            />
                            <StatCard
                                label="Segments"
                                value={stats.segments.toString()}
                                icon={<Layers className="w-4 h-4" />}
                                accent="text-zinc-300"
                                iconBg="bg-zinc-800"
                            />
                            <StatCard
                                label="Transcribed"
                                value={`${stats.readyCount}/${stats.count}`}
                                icon={<Zap className="w-4 h-4" />}
                                accent="text-emerald-400"
                                iconBg="bg-emerald-500/10"
                            />
                            <div className="rounded-xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/[0.06] to-violet-500/[0.04] p-4 flex flex-col justify-between cursor-pointer group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <Wand2 className="w-4 h-4 text-indigo-400" />
                                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500/40 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/70 mb-0.5">Pro Plan</div>
                                    <div className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">Unlimited exports</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===== Row 2: Quick Actions ===== */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { icon: Upload, label: 'Import Video', desc: 'Upload from device', action: onImport, accent: 'group-hover:text-indigo-400 group-hover:bg-indigo-500/10' },
                            { icon: Wand2, label: 'AI Auto-Edit', desc: 'Full auto pipeline', action: onNewProject, accent: 'group-hover:text-purple-400 group-hover:bg-purple-500/10' },
                            { icon: Type, label: 'Text Overlay', desc: 'Custom text on video', action: onNewProject, accent: 'group-hover:text-pink-400 group-hover:bg-pink-500/10' },
                            { icon: Boxes, label: 'Batch Process', desc: 'Multiple videos', action: onNewProject, accent: 'group-hover:text-emerald-400 group-hover:bg-emerald-500/10' },
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={action.action}
                                className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-zinc-700/60 transition-all text-left"
                            >
                                <div className={cn("w-9 h-9 rounded-lg bg-zinc-800/60 flex items-center justify-center transition-all shrink-0", action.accent)}>
                                    <action.icon className="w-4 h-4 text-zinc-500 group-hover:text-current transition-colors" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[13px] font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">{action.label}</div>
                                    <div className="text-[11px] text-zinc-600 truncate">{action.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* ===== Row 3: Recent Projects ===== */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-zinc-200">Recent Projects</h3>
                                {projects.length > 0 && (
                                    <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">
                                        {projects.length}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-zinc-900/60 border border-border/40 rounded-md p-0.5">
                                    <button onClick={() => setViewMode('grid')} className={cn("p-1 rounded transition-colors", viewMode === 'grid' ? "bg-zinc-800 text-white" : "text-zinc-600 hover:text-zinc-400")}>
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setViewMode('list')} className={cn("p-1 rounded transition-colors", viewMode === 'list' ? "bg-zinc-800 text-white" : "text-zinc-600 hover:text-zinc-400")}>
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {recentProjects.length === 0 ? (
                            <div className="rounded-xl border border-border/40 bg-zinc-900/20 p-12 text-center">
                                <Video className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                                <p className="text-sm font-medium text-zinc-500 mb-1">No projects yet</p>
                                <p className="text-xs text-zinc-700 mb-4">Import a video to get started</p>
                                <Button onClick={onNewProject} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-2">
                                    <Plus className="w-3.5 h-3.5" /> New Project
                                </Button>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {recentProjects.map(p => (
                                    <ProjectCard key={p.id} project={p} onSelect={onSelectProject} fmtDuration={fmtDuration} statusColor={statusColor} statusLabel={statusLabel} />
                                ))}
                                <button onClick={onNewProject} className="rounded-xl border border-dashed border-border/60 hover:border-indigo-500/30 bg-transparent hover:bg-indigo-500/[0.02] flex flex-col items-center justify-center min-h-[180px] cursor-pointer transition-all gap-2 group">
                                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-indigo-500/30 group-hover:scale-105 transition-all">
                                        <Plus className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                    <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-400 transition-colors">New Project</span>
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/40 overflow-hidden bg-zinc-900/20">
                                <table className="w-full text-left">
                                    <thead className="border-b border-border/40">
                                        <tr className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">
                                            <th className="px-4 py-2.5">Name</th>
                                            <th className="px-4 py-2.5">Status</th>
                                            <th className="px-4 py-2.5">Duration</th>
                                            <th className="px-4 py-2.5">Segments</th>
                                            <th className="px-4 py-2.5">Overlays</th>
                                            <th className="px-4 py-2.5 text-right">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/30">
                                        {recentProjects.map(p => (
                                            <tr key={p.id} onClick={() => onSelectProject(p.id)} className="hover:bg-white/[0.015] cursor-pointer group transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={cn("w-2 h-2 rounded-full", statusColor(p.transcriptStatus))} />
                                                        <span className="text-[13px] font-medium text-zinc-300 group-hover:text-white transition-colors truncate max-w-[200px]">{p.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[11px] font-medium text-zinc-500">{statusLabel(p.transcriptStatus)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-[12px] text-zinc-500 font-mono">{fmtDuration(p.duration)}</td>
                                                <td className="px-4 py-3 text-[12px] text-zinc-500 font-mono">{p.segmentCount}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[11px] font-mono text-indigo-400/70">{p.overlayCount} fx</span>
                                                </td>
                                                <td className="px-4 py-3 text-[12px] text-zinc-600 text-right font-mono">
                                                    {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ===== Row 4: Shortcuts + Tips ===== */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Keyboard Shortcuts */}
                        <div className="rounded-xl border border-border/40 bg-zinc-900/20 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Command className="w-4 h-4 text-zinc-500" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Keyboard Shortcuts</h4>
                            </div>
                            <div className="space-y-2">
                                {SHORTCUTS.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between py-1">
                                        <span className="text-[12px] text-zinc-400">{s.action}</span>
                                        <div className="flex items-center gap-1">
                                            {s.keys.map((k, ki) => (
                                                <kbd key={ki} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700/50 min-w-[24px] text-center">
                                                    {k}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Workflow Tips */}
                        <div className="rounded-xl border border-border/40 bg-zinc-900/20 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-4 h-4 text-zinc-500" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quick Tips</h4>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { tip: 'AI Suggest analyzes your transcript and picks the best overlay type for each segment.', tag: 'AI' },
                                    { tip: 'Right-click any segment in the sidebar to manually pick a different overlay.', tag: 'Editor' },
                                    { tip: 'Use the Editor Panel (sliders icon) to adjust filters, speed, and text overlays.', tag: 'Tools' },
                                    { tip: 'Projects auto-save every 2 seconds. Switch between them freely.', tag: 'Projects' },
                                ].map((t, i) => (
                                    <div key={i} className="flex gap-3">
                                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 h-fit mt-0.5">
                                            {t.tag}
                                        </span>
                                        <p className="text-[12px] text-zinc-500 leading-relaxed">{t.tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

/* ===== Sub-components ===== */

function StatCard({ label, value, icon, accent, iconBg }: {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
    iconBg: string;
}) {
    return (
        <div className="rounded-xl border border-border/40 bg-zinc-900/20 p-4 flex flex-col justify-between">
            <div className={cn("w-7 h-7 rounded-md flex items-center justify-center mb-3", iconBg)}>
                <span className={cn("", accent)}>{icon}</span>
            </div>
            <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-0.5">{label}</div>
                <div className={cn("text-xl font-bold font-mono", accent)}>{value}</div>
            </div>
        </div>
    );
}

function ProjectCard({ project: p, onSelect, fmtDuration, statusColor, statusLabel }: {
    project: ProjectMeta;
    onSelect: (id: string) => void;
    fmtDuration: (s: number) => string;
    statusColor: (s: TranscriptStatus) => string;
    statusLabel: (s: TranscriptStatus) => string;
}) {
    return (
        <div
            onClick={() => onSelect(p.id)}
            className="group rounded-xl border border-border/40 bg-zinc-900/20 overflow-hidden cursor-pointer hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
        >
            {/* Thumbnail */}
            <div className="aspect-video bg-zinc-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                    <Film className="w-8 h-8 text-zinc-800" />
                </div>
                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono font-bold text-zinc-300">
                    {fmtDuration(p.duration)}
                </div>
                {/* Status dot */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm">
                    <div className={cn("w-1.5 h-1.5 rounded-full", statusColor(p.transcriptStatus))} />
                    <span className="text-[9px] font-bold uppercase text-zinc-400">{statusLabel(p.transcriptStatus)}</span>
                </div>
                {/* Hover play */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/30 backdrop-blur-[2px]">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                    </div>
                </div>
            </div>

            <div className="p-3.5">
                <h4 className="text-[13px] font-semibold text-zinc-200 group-hover:text-white mb-2 truncate transition-colors">
                    {p.name}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-zinc-600">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {p.segmentCount}
                        </span>
                        <span className="flex items-center gap-1 text-indigo-400/60">
                            <Sparkles className="w-3 h-3" />
                            {p.overlayCount}
                        </span>
                    </div>
                    <span className="font-mono">
                        {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>
        </div>
    );
}
