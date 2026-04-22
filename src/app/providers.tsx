'use client';

import { ToastProvider } from '../components/ui/Toast';
import { AuthProvider } from '../lib/AuthContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ToastProvider>
                {children}
            </ToastProvider>
        </AuthProvider>
    );
}
