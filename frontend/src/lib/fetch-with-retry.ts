/**
 * Fetch with Retry Utility
 *
 * Implements exponential backoff retry logic for network requests.
 * Use this for all API calls to ensure reliability.
 *
 * @module lib/fetch-with-retry
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** HTTP status codes that should trigger retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatuses?: number[];
  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Executes an async function with exponential backoff retry logic
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 * @throws Last error if all retries fail
 *
 * @example
 * // Basic usage
 * const data = await fetchWithRetry(
 *   () => fetch('/api/orders').then(r => r.json())
 * );
 *
 * @example
 * // With custom options
 * const data = await fetchWithRetry(
 *   () => fetch('/api/orders').then(r => r.json()),
 *   {
 *     maxRetries: 5,
 *     baseDelayMs: 500,
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}:`, error.message)
 *   }
 * );
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    retryableStatuses,
  } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(lastError, retryableStatuses)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      // Call onRetry callback if provided
      options.onRetry?.(attempt + 1, lastError, delay);

      // Wait before next attempt
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Fetch wrapper with built-in retry logic
 *
 * @param url - Request URL
 * @param init - Fetch init options
 * @param retryOptions - Retry configuration
 * @returns Promise resolving to Response
 *
 * @example
 * const response = await fetchRetry('/api/orders', {
 *   method: 'POST',
 *   body: JSON.stringify({ item: 'pizza' }),
 * });
 */
export async function fetchRetry(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return fetchWithRetry(async () => {
    const response = await fetch(url, init);

    // Throw on retryable status codes
    if (!response.ok) {
      const error = new FetchError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
      throw error;
    }

    return response;
  }, retryOptions);
}

/**
 * Fetch and parse JSON with retry logic
 *
 * @param url - Request URL
 * @param init - Fetch init options
 * @param retryOptions - Retry configuration
 * @returns Promise resolving to parsed JSON
 *
 * @example
 * const orders = await fetchJsonRetry<Order[]>('/api/orders');
 */
export async function fetchJsonRetry<T>(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<T> {
  const response = await fetchRetry(url, init, retryOptions);
  return response.json() as Promise<T>;
}

/**
 * Custom error class for fetch errors with status code
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Check if an error should trigger a retry
 */
function isRetryableError(error: Error, retryableStatuses: number[]): boolean {
  // Network errors are always retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // Check status code for FetchError
  if (error instanceof FetchError) {
    return retryableStatuses.includes(error.status);
  }

  // Retry on network-related error messages
  const retryableMessages = [
    'network',
    'timeout',
    'abort',
    'connection',
    'ECONNRESET',
    'ETIMEDOUT',
  ];

  return retryableMessages.some(msg =>
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
