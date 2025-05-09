
"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';

// This component can be used to wrap your application with any necessary providers
// (e.g., ThemeProvider, QueryClientProvider, AuthProvider, etc.)

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
