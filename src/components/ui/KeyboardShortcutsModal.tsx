'use client';

import React from 'react';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SHORTCUTS = [
    { section: 'General', items: [
        { keys: ['Ctrl', 'Z'], desc: 'Undo' },
        { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo' },
        { keys: ['Ctrl', 'S'], desc: 'Save project' },
        { keys: ['Ctrl', 'E'], desc: 'Export video' },
        { keys: ['?'], desc: 'Show keyboard shortcuts' },
    ]},
    { section: 'Editor', items: [
        { keys: ['Space'], desc: 'Play / Pause' },
        { keys: ['Delete'], desc: 'Remove overlay from selected segment' },
        { keys: ['Escape'], desc: 'Close popup / Deselect' },
        { keys: ['Ctrl', 'A'], desc: 'AI Suggest overlays' },
    ]},
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9996,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{
                width: 420, maxWidth: '90vw',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                animation: 'toastSlideIn 0.2s ease-out',
                fontFamily: "'Inter', sans-serif",
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10" />
                        </svg>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Keyboard Shortcuts
                        </span>
                    </div>
                    <button onClick={onClose}
                        style={{
                            width: 28, height: 28, borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'transparent', color: 'var(--text-secondary)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Shortcuts list */}
                <div style={{ padding: '16px 24px 24px' }}>
                    {SHORTCUTS.map((section) => (
                        <div key={section.section} style={{ marginBottom: 16 }}>
                            <div style={{
                                fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
                                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
                            }}>
                                {section.section}
                            </div>
                            {section.items.map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '6px 0',
                                }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.desc}</span>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {item.keys.map((k, j) => (
                                            <kbd key={j} style={{
                                                padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-primary)',
                                                fontFamily: "'Inter', sans-serif",
                                            }}>
                                                {k}
                                            </kbd>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
