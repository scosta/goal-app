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

// Type-safe API client for goals
export class GoalsAPI {
  /**
   * Create a new goal
   */
  static async createGoal(
    data: operations['createGoal']['requestBody']['content']['application/json']
  ): Promise<components['schemas']['Goal']> {
    const response = await apiClient.post('/goals', data);
    return response.data;
  }

  /**
   * List all goals for the authenticated user
   */
  static async listGoals(
    params?: operations['listGoals']['parameters']['query']
  ): Promise<{ goals: components['schemas']['Goal'][], total: number }> {
    const response = await apiClient.get('/goals', { params });
    return response.data;
  }

  /**
   * Get a specific goal by ID
   */
  static async getGoal(goalId: string): Promise<components['schemas']['Goal']> {
    const response = await apiClient.get(`/goals/${goalId}`);
    return response.data;
  }

  /**
   * Update a goal
   */
  static async updateGoal(
    goalId: string,
    data: Partial<components['schemas']['Goal']>
  ): Promise<components['schemas']['Goal']> {
    const response = await apiClient.put(`/goals/${goalId}`, data);
    return response.data;
  }

  /**
   * Delete a goal
   */
  static async deleteGoal(goalId: string): Promise<void> {
    await apiClient.delete(`/goals/${goalId}`);
  }
}

// Export individual functions for convenience
export const createGoal = GoalsAPI.createGoal;
export const listGoals = GoalsAPI.listGoals;
export const getGoal = GoalsAPI.getGoal;
export const updateGoal = GoalsAPI.updateGoal;
export const deleteGoal = GoalsAPI.deleteGoal;
