import { apiEndpoint } from '@/config/routes';
import { getAccessToken, getRefreshToken, saveTokens, deleteTokens } from '@/libs/tokenHelper';
import axios from 'axios';

// Define the type for AuthStore
interface AuthStoreState {
  accessToken: string | null;
  refreshToken: string | null;
  refreshTokenIfNeeded: () => Promise<boolean>;
  logout: () => void;
}

interface AuthStore {
  getState: () => AuthStoreState;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// List of endpoints that don't require authentication
const publicEndpoints = [
  // Auth endpoints
  apiEndpoint.login,
  apiEndpoint.register,
  apiEndpoint.fotgotPassword,
  apiEndpoint.resetPassword,
  
  // Public data endpoints
  apiEndpoint.odataTours, // Public tour listing
  apiEndpoint.tours,      // Public tour details
];

// Helper function to check if an endpoint is public
const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  
  // Remove base URL if present to get the clean endpoint path
  let path = url;
  if (BASE_URL && path.startsWith(BASE_URL)) {
    path = path.substring(BASE_URL.length);
  }
  
  // Check if the URL matches any public endpoint
  return publicEndpoints.some(endpoint => {
    // Handle endpoints with and without trailing slash
    if (endpoint.endsWith('/')) {
      return path === endpoint || path.startsWith(endpoint);
    } else {
      return path === endpoint || path.startsWith(endpoint + '/');
    }
  });
};

// Auth store reference to be set later
let authStore: AuthStore | null = null;

// Function to set the auth store from outside
export const setAuthStoreRef = (store: AuthStore): void => {
  authStore = store;
};

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    // Check if this is a public endpoint that doesn't require authentication
    if (isPublicEndpoint(config.url)) {
      console.log('Public endpoint detected, skipping token check:', config.url);
      return config;
    }
    
    // If auth store is available, use it
    if (authStore) {
      const { accessToken, refreshTokenIfNeeded } = authStore.getState();
      
      // Check if token needs refresh before making API request
      if (accessToken) {
        // Only perform token refresh if needed (not for auth endpoints)
        const isAuthEndpoint = config.url?.includes('/authentication/');
        if (!isAuthEndpoint) {
          try {
            // Try to refresh token if needed
            await refreshTokenIfNeeded();
            
            // Get the (possibly refreshed) token
            const freshToken = authStore.getState().accessToken;
            
            // Set the authorization header with the token
            if (freshToken) {
              config.headers.Authorization = `Bearer ${freshToken}`;
            }
          } catch (error) {
            console.error('Token refresh failed in interceptor:', error);
          }
        } else {
          // For auth endpoints, just set the token if available
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
    } else {
      // Fallback to the old method if auth store is not available
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an expired token (401) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if this is a public endpoint, if so, don't try to refresh the token
      if (isPublicEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      if (authStore) {
        try {
          // Try to refresh the token
          const refreshed = await authStore.getState().refreshTokenIfNeeded();
          
          if (refreshed) {
            // Get the fresh token after refresh
            const freshToken = authStore.getState().accessToken;
            
            // Set the authorization header with the new token
            if (freshToken) {
              axios.defaults.headers.common['Authorization'] = `Bearer ${freshToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${freshToken}`;
            }
            
            // Retry the original request with the new token
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Error refreshing token in response interceptor:', refreshError);
          // If refresh fails, logout the user
          authStore.getState().logout();
        }
      } else {
        // Fallback to the old method if auth store is not available
        try {
          const refreshToken = await getRefreshToken();
          if (refreshToken) {
            try {
              const response = await axios.post(`${BASE_URL}${apiEndpoint.refresh}`, { refreshToken });
              if (response.data && response.data.data) {
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
                
                // Save new tokens
                await saveTokens(newAccessToken, newRefreshToken);
                
                // Set the authorization header with the new token
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                
                // Retry the original request with the new token
                return api(originalRequest);
              }
            } catch (error) {
              console.error('Token refresh failed:', error);
              // Clear tokens if refresh fails
              await deleteTokens();
            }
          }
        } catch (error) {
          console.error('Error accessing refresh token:', error);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Export functions to dynamically add public endpoints
export const addPublicEndpoint = (endpoint: string): void => {
  if (!publicEndpoints.includes(endpoint)) {
    publicEndpoints.push(endpoint);
  }
};

export const removePublicEndpoint = (endpoint: string): void => {
  const index = publicEndpoints.indexOf(endpoint);
  if (index !== -1) {
    publicEndpoints.splice(index, 1);
  }
};

export default api;
