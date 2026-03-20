'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { PWARefresh } from '@/components/PWARefresh';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PWARefresh />
      {children}
    </AuthProvider>
  );
}
