
import React, { useState } from 'react';
import { VideoFilters, DEFAULT_FILTERS, TrimPoint, TextOverlay, EditorTab } from '../../lib/types';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import {
    SlidersHorizontal,
    Scissors,
    Gauge,
    Type,
    RotateCcw,
    X,
    Plus,
    Trash2
} from 'lucide-react';

/* ===== Editor Slider Wrapper ===== */
const EditorSliderField: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    defaultValue: number;
    onChange: (v: number) => void;
    accentColor?: string;
}> = ({ label, value, min, max, step = 1, unit = '', defaultValue, onChange, accentColor }) => {
    const isDefault = value === defaultValue;

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                        {value}{unit}
                    </span>
                    {!isDefault && (
                        <button
                            onClick={() => onChange(defaultValue)}
                            className="text-muted-foreground/70 hover:text-foreground/80 transition-colors"
                            title="Reset"
                        >
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
            <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={(vals) => onChange(vals[0])}
                accentColor={accentColor}
            />
        </div>
    );
};

/* ===== Filters Tab ===== */
const FiltersTab: React.FC<{
    filters: VideoFilters;
    onChange: (filters: VideoFilters) => void;
}> = ({ filters, onChange }) => {
    const update = (key: keyof VideoFilters, value: number) => {
        onChange({ ...filters, [key]: value });
    };

    const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adjustments</h3>
                {!isDefault && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange({ ...DEFAULT_FILTERS })}
                        className="h-6 text-[10px] px-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                    >
                        Reset All
                    </Button>
                )}
            </div>

            <div className="space-y-1">
                <EditorSliderField label="Brightness" value={filters.brightness} min={0} max={200} defaultValue={100} onChange={(v) => update('brightness', v)} unit="%" accentColor="bg-amber-400" />
                <EditorSliderField label="Contrast" value={filters.contrast} min={0} max={200} defaultValue={100} onChange={(v) => update('contrast', v)} unit="%" accentColor="bg-orange-400" />
                <EditorSliderField label="Saturation" value={filters.saturation} min={0} max={200} defaultValue={100} onChange={(v) => update('saturation', v)} unit="%" accentColor="bg-pink-500" />
                <EditorSliderField label="Blur" value={filters.blur} min={0} max={20} step={0.5} defaultValue={0} onChange={(v) => update('blur', v)} unit="px" accentColor="bg-violet-500" />
                <EditorSliderField label="Vignette" value={filters.vignette} min={0} max={100} defaultValue={0} onChange={(v) => update('vignette', v)} unit="%" accentColor="bg-sky-500" />
                <EditorSliderField label="Temperature" value={filters.temperature} min={-50} max={50} defaultValue={0} onChange={(v) => update('temperature', v)} accentColor="bg-red-500" />
            </div>
        </div>
    );
};

/* ===== Trim Tab ===== */
const TrimTab: React.FC<{
    trimPoints: TrimPoint;
    duration: number;
    onChange: (trimPoints: TrimPoint) => void;
}> = ({ trimPoints, duration, onChange }) => {
    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        const ms = Math.floor((s % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    const trimDuration = trimPoints.outPoint - trimPoints.inPoint;

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Trim Video</h3>

                {/* Visual trim bar */}
                <div className="relative h-12 mb-6 rounded-lg overflow-hidden bg-muted ring-1 ring-white/5">
                    {/* Active range */}
                    <div
                        className="absolute top-0 h-full transition-all bg-indigo-500/20"
                        style={{
                            left: `${(trimPoints.inPoint / duration) * 100}%`,
                            width: `${((trimPoints.outPoint - trimPoints.inPoint) / duration) * 100}%`,
                            borderLeft: '2px solid #6366f1',
                            borderRight: '2px solid #8b5cf6',
                        }}
                    />
                    {/* Cut regions (hatched pattern) */}
                    <div className="absolute inset-y-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-[length:8px_8px]"
                        style={{ width: `${(trimPoints.inPoint / duration) * 100}%` }}
                    />
                    <div className="absolute inset-y-0 right-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-[length:8px_8px]"
                        style={{ width: `${(1 - (trimPoints.outPoint / duration)) * 100}%` }}
                    />
                </div>

                <EditorSliderField label="Start Time" value={Number(trimPoints.inPoint.toFixed(1))} min={0} max={Math.max(0, trimPoints.outPoint - 0.5)} step={0.1} defaultValue={0}
                    onChange={(v) => onChange({ ...trimPoints, inPoint: v })} unit="s" accentColor="bg-emerald-500" />
                <EditorSliderField label="End Time" value={Number(trimPoints.outPoint.toFixed(1))} min={trimPoints.inPoint + 0.5} max={duration} step={0.1} defaultValue={duration}
                    onChange={(v) => onChange({ ...trimPoints, outPoint: v })} unit="s" accentColor="bg-rose-500" />
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="text-center">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Original</div>
                    <div className="text-xs font-mono text-foreground/80">{formatTime(duration)}</div>
                </div>
                <div className="text-center border-x border-border">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Duration</div>
                    <div className="text-xs font-mono text-indigo-400">{formatTime(trimDuration)}</div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Removed</div>
                    <div className="text-xs font-mono text-muted-foreground">{formatTime(duration - trimDuration)}</div>
                </div>
            </div>
        </div>
    );
};

/* ===== Speed Tab ===== */
const SpeedTab: React.FC<{
    speed: number;
    onChange: (speed: number) => void;
}> = ({ speed, onChange }) => {
    const presets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Playback Speed</h3>

                <div className="flex items-center justify-center p-6 mb-6 rounded-xl bg-gradient-to-br from-secondary to-background border border-border">
                    <div className="text-center">
                        <div className={cn(
                            "text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br",
                            speed === 1 ? "from-muted-foreground to-muted-foreground/60" : "from-indigo-400 to-violet-500"
                        )}>
                            {speed}×
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wide">
                            {speed < 1 ? 'Slow Motion' : speed === 1 ? 'Normal' : 'Fast Forward'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6">
                    {presets.map((p) => (
                        <button
                            key={p}
                            onClick={() => onChange(p)}
                            className={cn(
                                "h-8 text-xs font-medium rounded-md transition-all",
                                speed === p
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                                    : "bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                            )}
                        >
                            {p}×
                        </button>
                    ))}
                </div>

                <EditorSliderField label="Custom Speed" value={speed} min={0.1} max={4} step={0.05} defaultValue={1}
                    onChange={onChange} unit="×" accentColor="bg-indigo-500" />
            </div>
        </div>
    );
};

/* ===== Text Tab ===== */
const TextTab: React.FC<{
    textOverlays: TextOverlay[];
    duration: number;
    onChange: (overlays: TextOverlay[]) => void;
}> = ({ textOverlays, duration, onChange }) => {
    const [editingId, setEditingId] = useState<string | null>(null);

    const addOverlay = () => {
        const newOverlay: TextOverlay = {
            id: `txt-${Date.now()}`,
            text: 'Your text here',
            x: 50,
            y: 50,
            fontSize: 48,
            color: '#ffffff',
            fontWeight: 700,
            startTime: 0,
            endTime: Math.min(5, duration),
        };
        onChange([...textOverlays, newOverlay]);
        setEditingId(newOverlay.id);
    };

    const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
        onChange(textOverlays.map((o) => o.id === id ? { ...o, ...updates } : o));
    };

    const removeOverlay = (id: string) => {
        onChange(textOverlays.filter((o) => o.id !== id));
        if (editingId === id) setEditingId(null);
    };

    const editing = textOverlays.find((o) => o.id === editingId);

    return (
        <div className="p-4 space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text Overlays</h3>
                <Button onClick={addOverlay} size="sm" variant="outline" className="h-7 text-[10px] gap-1.5 border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/30">
                    <Plus className="w-3 h-3" /> Add Text
                </Button>
            </div>

            {/* Text list */}
            <div className="flex-1 overflow-y-auto min-h-[100px] space-y-2">
                {textOverlays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 rounded-lg border border-dashed border-border bg-secondary/30 text-center">
                        <Type className="w-8 h-8 text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">No text added yet</p>
                        <p className="text-[10px] text-muted-foreground/70">Click &quot;Add Text&quot; to start</p>
                    </div>
                ) : (
                    textOverlays.map((overlay) => (
                        <div
                            key={overlay.id}
                            onClick={() => setEditingId(overlay.id === editingId ? null : overlay.id)}
                            className={cn(
                                "group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                editingId === overlay.id
                                    ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20"
                                    : "bg-secondary/40 border-border hover:bg-secondary/60"
                            )}
                        >
                            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0 border border-border" style={{ color: overlay.color }}>
                                <Type className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-foreground truncate">{overlay.text}</div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                    {overlay.startTime.toFixed(1)}s - {overlay.endTime.toFixed(1)}s
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeOverlay(overlay.id); }}
                                className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground/70 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Panel */}
            {editing && (
                <div className="pt-4 border-t border-border mt-auto space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Content</label>
                        <Input
                            value={editing.text}
                            onChange={(e) => updateOverlay(editing.id, { text: e.target.value })}
                            className="bg-muted border-border focus:border-indigo-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Font Size</label>
                            <Input
                                type="number"
                                value={editing.fontSize}
                                onChange={(e) => updateOverlay(editing.id, { fontSize: Number(e.target.value) })}
                                className="bg-muted border-border"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Color</label>
                            <div className="flex h-9 w-full rounded-md border border-border bg-muted pl-2">
                                <input
                                    type="color"
                                    value={editing.color}
                                    onChange={(e) => updateOverlay(editing.id, { color: e.target.value })}
                                    className="h-full w-6 cursor-pointer bg-transparent border-0 p-0"
                                />
                                <input
                                    type="text"
                                    value={editing.color}
                                    onChange={(e) => updateOverlay(editing.id, { color: e.target.value })}
                                    className="flex-1 bg-transparent border-0 text-xs font-mono ml-2 focus:ring-0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <EditorSliderField label="X Pos" value={editing.x} min={0} max={100} defaultValue={50} onChange={(v) => updateOverlay(editing.id, { x: v })} unit="%" accentColor="bg-indigo-500" />
                        <EditorSliderField label="Y Pos" value={editing.y} min={0} max={100} defaultValue={50} onChange={(v) => updateOverlay(editing.id, { y: v })} unit="%" accentColor="bg-indigo-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <EditorSliderField label="Start" value={Number(editing.startTime.toFixed(1))} min={0} max={editing.endTime - 0.5} step={0.1} defaultValue={0}
                            onChange={(v) => updateOverlay(editing.id, { startTime: v })} unit="s" accentColor="bg-emerald-500" />
                        <EditorSliderField label="End" value={Number(editing.endTime.toFixed(1))} min={editing.startTime + 0.5} max={duration} step={0.1} defaultValue={duration}
                            onChange={(v) => updateOverlay(editing.id, { endTime: v })} unit="s" accentColor="bg-rose-500" />
                    </div>
                </div>
            )}
        </div>
    );
};

/* ===== Main Panel ===== */
interface EditorPanelProps {
    activeTab: EditorTab;
    onTabChange: (tab: EditorTab) => void;
    filters: VideoFilters;
    onFiltersChange: (filters: VideoFilters) => void;
    trimPoints: TrimPoint;
    onTrimChange: (trimPoints: TrimPoint) => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
    textOverlays: TextOverlay[];
    onTextOverlaysChange: (overlays: TextOverlay[]) => void;
    duration: number;
    onClose: () => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
    activeTab,
    onTabChange,
    filters,
    onFiltersChange,
    trimPoints,
    onTrimChange,
    speed,
    onSpeedChange,
    textOverlays,
    onTextOverlaysChange,
    duration,
    onClose,
}) => {
    const tabs: { id: EditorTab; label: string; icon: React.FC<{ className?: string }> }[] = [
        { id: 'filters', label: 'Filters', icon: SlidersHorizontal },
        { id: 'trim', label: 'Trim', icon: Scissors },
        { id: 'speed', label: 'Speed', icon: Gauge },
        { id: 'text', label: 'Text', icon: Type },
    ];

    return (
        <aside className="w-80 flex flex-col border-l border-border bg-background/50 backdrop-blur-xl z-20 shrink-0 shadow-[-10px_0_40px_rgba(0,0,0,0.2)]">
            {/* Header */}
            <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
                <h2 className="text-sm font-semibold text-foreground tracking-tight">Editor Tools</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-4 p-1 gap-1 border-b border-border bg-secondary/50">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-md transition-all relative text-[10px] font-medium",
                            activeTab === id
                                ? "text-indigo-400 bg-indigo-500/10"
                                : "text-muted-foreground hover:text-foreground/80 hover:bg-muted"
                        )}
                    >
                        <Icon className={cn("w-4 h-4", activeTab === id ? "stroke-[2.5px]" : "stroke-2")} />
                        {label}
                        {activeTab === id && (
                            <span className="absolute bottom-0 w-8 h-0.5 rounded-t-full bg-indigo-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="absolute inset-0">
                    {activeTab === 'filters' && <FiltersTab filters={filters} onChange={onFiltersChange} />}
                    {activeTab === 'trim' && <TrimTab trimPoints={trimPoints} duration={duration} onChange={onTrimChange} />}
                    {activeTab === 'speed' && <SpeedTab speed={speed} onChange={onSpeedChange} />}
                    {activeTab === 'text' && <TextTab textOverlays={textOverlays} duration={duration} onChange={onTextOverlaysChange} />}
                </div>
            </div>
        </aside>
    );
};

export default EditorPanel;
