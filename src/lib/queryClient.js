import { QueryClient } from '@tanstack/react-query';

/** Client errors (4xx) won't fix themselves — only retry network/server failures. */
const shouldRetry = (failureCount, error) => {
  if (error?.name === 'AbortError') return false;
  if (error?.status >= 400 && error?.status < 500) return false;
  return failureCount < 2;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      // Socket.IO pushes most changes; refetching on tab focus catches anything missed while hidden.
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});
