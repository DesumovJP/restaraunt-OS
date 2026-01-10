import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, LoginCredentials, LoginResponse } from '@/types/auth';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (credentials: LoginCredentials): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData?.error?.message || 'Login failed';
            set({ error: errorMessage, isLoading: false });
            return false;
          }

          const data: LoginResponse = await response.json();

          // Fetch full user data with relations
          const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=*`, {
            headers: {
              Authorization: `Bearer ${data.jwt}`,
            },
          });

          let fullUser = data.user;
          if (userResponse.ok) {
            fullUser = await userResponse.json();
          }

          set({
            user: fullUser,
            token: data.jwt,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Network error';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        // Clear any cached data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
      },

      checkAuth: async () => {
        const token = get().token;
        const user = get().user;

        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await fetch(`${STRAPI_URL}/api/users/me?populate=*`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const freshUser = await response.json();
            set({
              user: freshUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else if (response.status === 401) {
            // Token is invalid/expired - clear auth
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            // Server error (5xx) or network issue - keep user logged in with cached data
            // This prevents logout on Strapi restart/redeploy
            if (user) {
              set({
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              set({
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        } catch {
          // Network error - keep user logged in if we have cached data
          // This is the key fix for Strapi restart scenario
          if (user && token) {
            set({
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              isAuthenticated: false,
            });
          }
        }
      },

      updateUser: (updates: Partial<AuthUser>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// Hook for getting auth headers
export function useAuthHeaders(): HeadersInit {
  const token = useAuthStore((state) => state.token);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Utility function for authenticated fetch
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
