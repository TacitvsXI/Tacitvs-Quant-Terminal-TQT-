"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 seconds for real-time data
            staleTime: 5000,
            // Refetch interval: 10 seconds for live data
            refetchInterval: 10000,
            // Retry failed requests
            retry: 3,
            // Keep data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
