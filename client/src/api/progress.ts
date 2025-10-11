import axios from 'axios';
import { components, operations } from '../../../shared/api-types';

const API_BASE_URL = 'http://localhost:8080';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Type-safe API client for progress
export class ProgressAPI {
  /**
   * Record daily time spent on a goal
   */
  static async recordProgress(
    data: operations['recordProgress']['requestBody']['content']['application/json']
  ): Promise<components['schemas']['Progress']> {
    const response = await apiClient.post('/progress', data);
    return response.data;
  }

  /**
   * Get progress data for a specific month
   */
  static async getProgress(
    params: operations['getProgress']['parameters']['query']
  ): Promise<components['schemas']['MonthlyProgressReport']> {
    const response = await apiClient.get('/progress', { params });
    return response.data;
  }

  /**
   * Get progress for a specific goal in a month
   */
  static async getProgressForGoal(
    goalId: string,
    month: string
  ): Promise<components['schemas']['MonthlyProgressReport']> {
    const response = await apiClient.get('/progress', {
      params: { goalId, month }
    });
    return response.data;
  }

  /**
   * Update existing progress entry
   */
  static async updateProgress(
    progressId: string,
    data: Partial<components['schemas']['Progress']>
  ): Promise<components['schemas']['Progress']> {
    const response = await apiClient.put(`/progress/${progressId}`, data);
    return response.data;
  }

  /**
   * Delete progress entry
   */
  static async deleteProgress(progressId: string): Promise<void> {
    await apiClient.delete(`/progress/${progressId}`);
  }
}

// Export individual functions for convenience
export const recordProgress = ProgressAPI.recordProgress;
export const getProgress = ProgressAPI.getProgress;
export const getProgressForGoal = ProgressAPI.getProgressForGoal;
export const updateProgress = ProgressAPI.updateProgress;
export const deleteProgress = ProgressAPI.deleteProgress;
