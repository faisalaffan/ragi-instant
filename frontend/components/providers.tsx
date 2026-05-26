'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useUIStore } from '@/stores/ui-store';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize QueryClient inside component to avoid caching client between requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 1000, // 10s
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              if (error?.status === 404 || error?.status === 400) return false;
              return failureCount < 2;
            },
          },
        },
      })
  );

  const { theme } = useUIStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position="top-right" 
        richColors 
        theme={theme === 'system' ? 'dark' : theme} 
        closeButton
      />
    </QueryClientProvider>
  );
}
