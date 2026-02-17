'use client';

import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
    variant = 'default', onConfirm, onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const isDanger = variant === 'danger';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9997,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div style={{
                width: 380, maxWidth: '90vw',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 14, padding: '24px',
                boxShadow: '0 16px 60px rgba(0,0,0,0.4)',
                animation: 'toastSlideIn 0.15s ease-out',
                fontFamily: "'Inter', sans-serif",
            }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {title}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel}
                        style={{
                            padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: '1px solid var(--border-color)', background: 'transparent',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                        }}>
                        {cancelLabel}
                    </button>
                    <button onClick={onConfirm}
                        style={{
                            padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: 'none', cursor: 'pointer', color: '#fff',
                            background: isDanger
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        }}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
