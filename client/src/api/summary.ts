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

// Type-safe API client for summary/analytics
export class SummaryAPI {
  /**
   * Get yearly summary with monthly success rates and streaks
   */
  static async getYearlySummary(
    params: operations['getYearlySummary']['parameters']['query']
  ): Promise<components['schemas']['YearlySummary']> {
    const response = await apiClient.get('/summary', { params });
    return response.data;
  }

  /**
   * Get yearly summary for a specific goal
   */
  static async getYearlySummaryForGoal(
    goalId: string,
    year: string
  ): Promise<components['schemas']['YearlySummary']> {
    const response = await apiClient.get('/summary', {
      params: { goalId, year }
    });
    return response.data;
  }

  /**
   * Get overall statistics for a year
   */
  static async getYearlyStats(year: string): Promise<{
    totalMinutesSpent: number;
    averageSuccessRate: number;
    bestMonth: { month: string; successRate: number };
    worstMonth: { month: string; successRate: number };
  }> {
    const response = await apiClient.get('/summary', {
      params: { year }
    });
    return response.data.overallStats;
  }

  /**
   * Get monthly data for a year
   */
  static async getMonthlyData(year: string): Promise<Array<{
    month: string;
    successRate: number;
    totalMinutesSpent: number;
    goalsTracked: number;
    bestPerformingGoal?: {
      goalId: string;
      goalTitle: string;
      successRate: number;
    };
  }>> {
    const response = await apiClient.get('/summary', {
      params: { year }
    });
    return response.data.monthlyData;
  }
}

// Export individual functions for convenience
export const getYearlySummary = SummaryAPI.getYearlySummary;
export const getYearlySummaryForGoal = SummaryAPI.getYearlySummaryForGoal;
export const getYearlyStats = SummaryAPI.getYearlyStats;
export const getMonthlyData = SummaryAPI.getMonthlyData;
