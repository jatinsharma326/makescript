import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { ProjectMeta } from '../../lib/types';
import { Input } from '../ui/Input';
import { Search, Plus, Filter, SortAsc, LayoutGrid, List, ChevronDown, Settings, Library, Home, HardDrive, Users, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProjectSidebarProps {
    projects: ProjectMeta[];
    activeProjectId: string | null;
    onSelectProject: (id: string) => void;
    onNewProject: () => void;
    onDeleteProject: (id: string) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
type NavItem = 'home' | 'library' | 'team' | 'settings' | 'billing';

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
    projects,
    activeProjectId,
    onSelectProject,
    onNewProject,
    onDeleteProject
}) => {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortOption>('date-desc');
    const [activeNav, setActiveNav] = useState<NavItem>('home');

    const filteredProjects = useMemo(() => {
        let result = [...projects];

        // Filter
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q));
        }

        // Sort
        result.sort((a, b) => {
            switch (sort) {
                case 'date-desc': return b.createdAt - a.createdAt;
                case 'date-asc': return a.createdAt - b.createdAt;
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                default: return 0;
            }
        });

        return result;
    }, [projects, search, sort]);

    const fmtTime = (ts: number) => {
        const date = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <aside className="w-72 flex flex-col border-r border-border bg-background/95 backdrop-blur-xl z-20 shrink-0 h-full flex-none">
            {/* Workspace Switcher */}
            <div className="p-4 border-b border-border">
                <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-foreground font-bold text-xs shadow-lg shadow-indigo-500/20">
                            JS
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-semibold text-foreground dark:text-foreground leading-none mb-1">Jatin's Workspace</div>
                            <div className="text-[10px] text-muted-foreground font-medium">Free Plan</div>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                </button>
            </div>

            {/* Main Navigation */}
            <div className="p-3 space-y-1">
                <Button variant="ghost" className={cn("w-full justify-start text-sm h-9 px-3", activeNav === 'home' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => setActiveNav('home')}>
                    <Home className="w-4 h-4 mr-3 opacity-70" /> Home
                </Button>
                <Button variant="ghost" className={cn("w-full justify-start text-sm h-9 px-3", activeNav === 'library' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => setActiveNav('library')}>
                    <Library className="w-4 h-4 mr-3 opacity-70" /> Asset Library
                </Button>
            </div>

            <div className="px-4 py-2">
                <div className="h-px bg-border" />
            </div>

            {/* Projects Header */}
            <div className="px-4 py-2 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Projects</h3>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onNewProject}>
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 bg-muted/40 border border-border rounded-md text-[12px] text-foreground/80 placeholder:text-muted-foreground/70 focus:outline-none focus:border-indigo-500/30 focus:bg-muted/80 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 space-y-0.5">
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-[11px] text-muted-foreground/70">No projects found</p>
                    </div>
                ) : (
                    filteredProjects.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => onSelectProject(p.id)}
                            className={cn(
                                "group flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border border-transparent",
                                activeProjectId === p.id
                                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-100"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <div className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                activeProjectId === p.id ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                            )} />
                            <span className="text-[13px] font-medium truncate flex-1">{p.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                                className="w-5 h-5 rounded flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                title="Delete project"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] opacity-40 font-mono">{fmtTime(p.createdAt)}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-border bg-background/50 space-y-1">
                <Button variant="ghost" className="w-full justify-start text-xs h-8 px-3 text-muted-foreground hover:text-foreground/80">
                    <Users className="w-3.5 h-3.5 mr-3 opacity-70" /> Team Members
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs h-8 px-3 text-muted-foreground hover:text-foreground/80">
                    <Settings className="w-3.5 h-3.5 mr-3 opacity-70" /> Settings
                </Button>

                {/* Usage Bar */}
                <div className="mt-3 px-1">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1.5 font-medium">
                        <span>Storage</span>
                        <span>45% used</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-[45%] rounded-full" />
                    </div>
                </div>
            </div>
        </aside>
    );
};
