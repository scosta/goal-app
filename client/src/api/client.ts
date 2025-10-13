import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export for testing - allows us to mock the entire client
export default apiClient;
