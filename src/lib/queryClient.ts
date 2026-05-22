// JARVIS App — TanStack Query client
// Configured with sensible defaults for a SaaS app:
//   - staleTime 60s: avoids refetch storms on tab focus
//   - retry 1: fail fast on 4xx, retry once on network errors
//   - error toast via global onError (react-hot-toast)
import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,         // 1 minute
      gcTime: 5 * 60_000,        // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const msg = getErrorMessage(error);
        toast.error(msg, { id: 'mutation-error', duration: 4000 });
      },
    },
  },
});

export default queryClient;
