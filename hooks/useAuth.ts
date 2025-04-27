import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import * as authService from '@/services/authService';
import { LoginSchemaType } from '@/schemaValidation/auth.schema';

/**
 * Custom hook for authentication state and actions
 */
export default function useAuth() {
  const router = useRouter();
  const { 
    accessToken, 
    refreshToken, 
    role,
    expiresAt,
    isLoading,
    isAuthenticated,
    logout: storeLogout,
    setTokens,
    refreshTokenIfNeeded
  } = useAuthStore();

  // Remove automatic token check on component mount and periodic checks
  // Instead, we'll check tokens only when needed for API requests

  // Login function 
  const login = async (credentials: LoginSchemaType) => {
    try {
      console.log('Attempting login...');
      const response = await authService.login(credentials);
      
      console.log('Login successful, setting tokens...');
      // Set tokens in the store
      setTokens(response);
      
      // Wait a moment for the store to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get fresh token values from store
      const currentState = useAuthStore.getState();
      
      // Log the auth state after waiting
      console.log('After login:');
      console.log('- Access token exists:', !!currentState.accessToken);
      console.log('- Token first 10 chars:', currentState.accessToken?.substring(0, 10) + '...');
      console.log('- Role:', currentState.role);
      
      // Return the response and let the component re-render to see the new token
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Call store logout to clear state and navigate
    storeLogout();
  };

  // Check token before API request
  const checkTokenBeforeRequest = async () => {
    // Get fresh state from the store
    const state = useAuthStore.getState();
    
    // Log token info for debugging
    console.log('Checking token before API request:');
    console.log('- Token exists:', !!state.accessToken);
    
    if (state.accessToken) {
      console.log('- Token length:', state.accessToken.length);
      
      // Show token expiration info
      if (state.expiresAt) {
        const now = Date.now();
        const remainingMs = state.expiresAt - now;
        const remainingMinutes = Math.floor(remainingMs / 60000);
        
        console.log('- Token expires in:', remainingMinutes, 'minutes');
        console.log('- Token is expired:', remainingMs <= 0);
      }
    }
    
    // If we have a token, check if it needs refresh
    if (state.accessToken && state.refreshToken) {
      // Only perform the refresh if needed
      await refreshTokenIfNeeded();
      return true;
    } else if (!state.accessToken) {
      console.log('No access token found');
      return false;
    }
    
    return !!state.accessToken;
  };

  // Redirect to login if not authenticated
  const requireAuth = () => {
    if (!isLoading && !isAuthenticated()) {
      // Navigate to login screen
      router.replace('/');
    }
  };

  // Wait for authentication to complete (useful after login)
  const waitForAuth = async (timeoutMs = 5000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      // Check if we're authenticated
      if (isAuthenticated()) {
        return true;
      }
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // If we reach here, we timed out waiting for auth
    return false;
  };
  
  // Get token expiration info
  const getTokenExpiration = () => {
    if (!expiresAt) return null;
    
    const now = Date.now();
    const remainingMs = expiresAt - now;
    const remainingMinutes = Math.floor(remainingMs / 60000);
    
    return {
      expiresAt,
      remainingMs,
      remainingMinutes,
      isExpired: remainingMs <= 0
    };
  };

  // Debug function to log token information
  const debugTokenInfo = () => {
    // Get fresh state from store
    const state = useAuthStore.getState();
    
    console.log('\n=== AUTH TOKEN DEBUG INFO ===');
    console.log('Is authenticated:', isAuthenticated());
    console.log('Access token exists:', !!state.accessToken);
    
    if (state.accessToken) {
      console.log('Token length:', state.accessToken.length);
      console.log('Token preview:', state.accessToken.substring(0, 15) + '...');
      
      // Try to parse JWT parts
      try {
        const [header, payload, signature] = state.accessToken.split('.');
        console.log('Token structure:');
        console.log('- Header length:', header?.length);
        console.log('- Payload length:', payload?.length);
        console.log('- Signature length:', signature?.length);
        
        // Decode payload
        const decodedPayload = JSON.parse(atob(payload));
        console.log('Payload data:');
        console.log('- Expiration:', new Date(decodedPayload.exp * 1000).toLocaleString());
        console.log('- User role:', decodedPayload.role || decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
        console.log('- User ID:', decodedPayload.uid || decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
      } catch (error) {
        console.log('Error parsing JWT:', error);
      }
    }
    
    // Expiration info
    const expInfo = getTokenExpiration();
    if (expInfo) {
      console.log('Expiration info:');
      console.log('- Expires at:', new Date(expInfo.expiresAt).toLocaleString());
      console.log('- Minutes remaining:', expInfo.remainingMinutes);
      console.log('- Is expired:', expInfo.isExpired);
    } else {
      console.log('No expiration info available');
    }
    
    // Refresh token info
    console.log('Refresh token exists:', !!state.refreshToken);
    if (state.refreshToken) {
      console.log('Refresh token length:', state.refreshToken.length);
    }
    
    console.log('===========================\n');
  };
  
  return {
    accessToken,
    refreshToken,
    role,
    isLoading,
    expiresAt,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    requireAuth,
    waitForAuth,
    refreshTokenManually: refreshTokenIfNeeded,
    checkTokenBeforeRequest,
    getTokenExpiration,
    debugTokenInfo
  };
} 