'use client';

import { Provider } from 'urql';
import { useMemo } from 'react';
import { createUrqlClient } from '@/lib/urql-client';

interface UrqlProviderProps {
  children: React.ReactNode;
}

export function UrqlProvider({ children }: UrqlProviderProps) {
  // Create client once on mount
  const client = useMemo(() => createUrqlClient(), []);

  return <Provider value={client}>{children}</Provider>;
}
