/**
 * 🔷 TEZERAKT QUANT TERMINAL - React Query Provider
 * TanStack Query setup for API integration
 */

'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // 5 seconds
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

