/**
 * Global SWR Configuration
 * Prevents infinite loops and optimizes data fetching
 */

export const swrConfig = {
  // Retry configuration to prevent infinite loops
  onErrorRetry: (error: any, key: string, config: any, revalidate: any, { retryCount }: any) => {
    // Never retry on 404
    if (error.status === 404) return

    // Never retry on 401 (unauthorized)
    if (error.status === 401) return

    // Only retry up to 3 times
    if (retryCount >= 3) return

    // Retry after 5 seconds with exponential backoff
    setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1))
  },

  // Don't automatically retry on errors (prevents loops)
  shouldRetryOnError: false,

  // Revalidate on focus (when user comes back to tab)
  revalidateOnFocus: true,

  // Revalidate on reconnect
  revalidateOnReconnect: true,

  // Don't dedupe requests by default
  dedupingInterval: 2000,

  // Error retry interval
  errorRetryInterval: 5000,

  // Focus throttle interval
  focusThrottleInterval: 5000,
}

export const criticalSwrConfig = {
  ...swrConfig,
  // For critical data that needs immediate updates
  refreshInterval: 30000, // Refresh every 30 seconds
  revalidateOnMount: true,
}

export const staticSwrConfig = {
  ...swrConfig,
  // For data that rarely changes
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
}

