import { create } from 'zustand';
import { router } from 'expo-router';
import { saveTokens, getAccessToken, getRefreshToken, deleteTokens } from '@/libs/tokenHelper';
import api, { setAuthStoreRef } from '@/services/axiosInstance';
import { apiEndpoint } from '@/config/routes';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  expiresAt: number | null; // New field to track expiration
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Auth actions
  setTokens: (response: any) => void; // Changed type to 'any' to handle different response formats
  logout: () => void;
  isAuthenticated: () => boolean;
  checkAuth: () => Promise<boolean>;
  refreshTokenIfNeeded: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // State
  accessToken: null,
  refreshToken: null,
  role: null,
  expiresAt: null,
  isLoading: false,
  isRefreshing: false,

  // Set tokens from API response
  setTokens: (response: any) => {
    // Handle both direct token object and nested data object
    const tokenData = response.data || response;
    
    if (tokenData && tokenData.accessToken) {
      const { accessToken, refreshToken, role, expiresIn } = tokenData;
      
      // Calculate expiration time
      const expiresAt = Date.now() + expiresIn * 1000; // Convert seconds to milliseconds
      
      // Save tokens to secure storage using the helper
      saveTokens(accessToken, refreshToken);
      
      // Update state
      set({
        accessToken,
        refreshToken,
        role,
        expiresAt
      });

      // Log token has been set
      console.log('Auth tokens set successfully');
    } else {
      console.error('Invalid token data format:', tokenData);
    }
  },
  
  // Logout - clear tokens
  logout: () => {
    // Clear tokens from storage using the helper
    deleteTokens();
    
    // Clear state
    set({
      accessToken: null,
      refreshToken: null,
      role: null,
      expiresAt: null
    });
    
    // Navigate to tabs (or login screen if you have one)
    router.replace('/(tabs)');
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const state = get();
    const now = Date.now();
    
    // Check if token exists and is not expired
    if (state.accessToken && state.expiresAt && state.expiresAt > now) {
      return true;
    }
    
    // If token is expired but we can refresh it
    if (state.refreshToken) {
      // Initiate refresh (but don't wait for it in this function)
      state.refreshTokenIfNeeded();
      // Return based on current token state
      return !!state.accessToken;
    }
    
    return false;
  },
  
  // Refresh token if it's expired or about to expire
  refreshTokenIfNeeded: async () => {
    const state = get();
    const now = Date.now();
    
    // If no refresh token or already refreshing, don't proceed
    if (!state.refreshToken || state.isRefreshing) {
      return false;
    }
    
    // If token is valid and not close to expiry (within 5 minutes), don't refresh
    if (state.accessToken && state.expiresAt && state.expiresAt > now + 5 * 60 * 1000) {
      return true;
    }
    
    // Token is expired or about to expire, refresh it
    try {
      set({ isRefreshing: true });
      
      const response = await api.post(apiEndpoint.refresh, {
        refreshToken: state.refreshToken
      });
      
      if (response.data) {
        // Update tokens with new data
        get().setTokens(response.data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
      get().logout();
      return false;
    } finally {
      set({ isRefreshing: false });
    }
  },
  
  // Check auth status from storage on app startup
  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      
      if (accessToken && refreshToken) {
        // We don't know the exact expiry from storage, so set a temporary expiry
        // The actual validity will be checked with the server later
        set({
          accessToken,
          refreshToken,
          role: null,
          expiresAt: Date.now() + 3600 * 1000 // Assume 1 hour validity by default
        });
        
        // Try to refresh the token to get a valid one
        return await get().refreshTokenIfNeeded();
      }
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
}));

// Initialize auth state on import
useAuthStore.getState().checkAuth();

// Set the auth store reference in axios to break the circular dependency
setAuthStoreRef(useAuthStore);
