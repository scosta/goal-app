import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { auth } from '../config/firebase';

// API base URL configuration:
// 1. If VITE_API_URL is explicitly set (from root .env file or build-time env vars), use it
// 2. Otherwise, default to direct connection to Go server on port 8080
// Note: Vite is configured to read .env files from the project root (see vite.config.ts)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach Firebase ID token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get the current user's ID token
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get ID token:', error);
        // Continue without token - backend will handle auth failure
      }
    }

    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }
    return config;
  },
  (error) => {
    // Always log errors, but use console.error which is more appropriate
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and debugging
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // Always log errors for debugging production issues
    // In production, you might want to send these to an error tracking service
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      // In production, log minimal info to avoid exposing sensitive data
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
      });
    }
    return Promise.reject(error);
  }
);

// Export for testing - allows us to mock the entire client
export default apiClient;
