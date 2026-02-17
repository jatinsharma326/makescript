'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ReactNode> = {
    success: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    error: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
    info: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    warning: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
};

const COLORS: Record<ToastType, { bg: string; border: string }> = {
    success: { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.2)' },
    error: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)' },
    info: { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)' },
    warning: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeToast = useCallback((id: string) => {
        const timer = timersRef.current.get(id);
        if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* Toast container */}
            <div style={{
                position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
                display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
            }}>
                {toasts.map((t) => (
                    <div key={t.id}
                        onClick={() => removeToast(t.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 16px',
                            background: COLORS[t.type].bg,
                            border: `1px solid ${COLORS[t.type].border}`,
                            backdropFilter: 'blur(16px)',
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                            pointerEvents: 'auto',
                            cursor: 'pointer',
                            animation: 'toastSlideIn 0.25s ease-out',
                            maxWidth: 340,
                        }}>
                        {ICONS[t.type]}
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
