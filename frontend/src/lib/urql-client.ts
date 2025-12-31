/**
 * urql GraphQL Client Setup
 * Configured for Strapi v5 GraphQL API
 */

import {
  createClient,
  fetchExchange,
  cacheExchange,
  subscriptionExchange,
  type Client,
  type Exchange
} from 'urql';
import { createClient as createWSClient, type Client as WSClient } from 'graphql-ws';

// Environment variables
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_STRAPI_URL
  ? `${process.env.NEXT_PUBLIC_STRAPI_URL}/graphql`
  : 'http://localhost:1337/graphql';

const WS_ENDPOINT = process.env.NEXT_PUBLIC_STRAPI_WS_URL
  || GRAPHQL_ENDPOINT.replace('http', 'ws');

// WebSocket client for subscriptions (client-side only)
let wsClient: WSClient | null = null;

function getWSClient(): WSClient | null {
  if (typeof window === 'undefined') return null;

  if (!wsClient) {
    wsClient = createWSClient({
      url: WS_ENDPOINT,
      connectionParams: () => {
        const token = localStorage.getItem('jwt');
        return token ? { authorization: `Bearer ${token}` } : {};
      },
      retryAttempts: 5,
      shouldRetry: () => true,
      on: {
        connected: () => console.log('[WS] Connected to GraphQL'),
        closed: () => console.log('[WS] Disconnected from GraphQL'),
        error: (err) => console.error('[WS] Error:', err),
      },
    });
  }

  return wsClient;
}

// Build exchanges array
function getExchanges(): Exchange[] {
  const exchanges: Exchange[] = [
    cacheExchange,
    fetchExchange,
  ];

  // Add subscription exchange only on client
  if (typeof window !== 'undefined') {
    const ws = getWSClient();
    if (ws) {
      exchanges.push(
        subscriptionExchange({
          forwardSubscription: (request) => ({
            subscribe: (sink) => ({
              unsubscribe: ws.subscribe(request, sink),
            }),
          }),
        })
      );
    }
  }

  return exchanges;
}

// Create the urql client
export function createUrqlClient(): Client {
  return createClient({
    url: GRAPHQL_ENDPOINT,
    exchanges: getExchanges(),
    fetchOptions: () => {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('jwt')
        : null;

      return {
        headers: {
          authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      };
    },
    // Use cache-first for faster initial loads, refetch in background
    requestPolicy: 'cache-first',
  });
}

// Singleton for client-side use
let urqlClient: Client | null = null;

export function getUrqlClient(): Client {
  if (typeof window === 'undefined') {
    // Server-side: always create a new client
    return createUrqlClient();
  }

  // Client-side: reuse the same client
  if (!urqlClient) {
    urqlClient = createUrqlClient();
  }

  return urqlClient;
}

// Reset client (useful after login/logout)
export function resetUrqlClient(): void {
  urqlClient = null;
  wsClient = null;
}

// Export types for convenience
export type { Client };
