import { components, operations } from '../../../shared/api-types';
import { apiClient } from './client';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

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

// React Query hooks
export const useYearlySummary = (params: operations['getYearlySummary']['parameters']['query']) => {
  return useQuery({
    queryKey: ['summary', 'yearly', params],
    queryFn: () => SummaryAPI.getYearlySummary(params),
    placeholderData: keepPreviousData,
  });
};

// Paginated yearly summary hook with cursor support
export const useYearlySummaryPaginated = (params: operations['getYearlySummary']['parameters']['query'] & {
  page?: number;
  pageSize?: number;
  nextCursor?: string;
}) => {
  return useQuery({
    queryKey: ['summary', 'yearly', 'paginated', params],
    queryFn: () => SummaryAPI.getYearlySummary(params),
    placeholderData: keepPreviousData,
  });
};

export const useYearlySummaryForGoal = (goalId: string, year: string) => {
  return useQuery({
    queryKey: ['summary', 'yearly', 'goal', goalId, year],
    queryFn: () => SummaryAPI.getYearlySummaryForGoal(goalId, year),
    enabled: !!goalId && !!year,
  });
};

export const useYearlyStats = (year: string) => {
  return useQuery({
    queryKey: ['summary', 'yearly', 'stats', year],
    queryFn: () => SummaryAPI.getYearlyStats(year),
    enabled: !!year,
    placeholderData: keepPreviousData,
  });
};

export const useMonthlyData = (year: string) => {
  return useQuery({
    queryKey: ['summary', 'monthly', year],
    queryFn: () => SummaryAPI.getMonthlyData(year),
    enabled: !!year,
    placeholderData: keepPreviousData,
  });
};

// Paginated monthly data hook with cursor support
export const useMonthlyDataPaginated = (year: string, params?: {
  page?: number;
  pageSize?: number;
  nextCursor?: string;
}) => {
  return useQuery({
    queryKey: ['summary', 'monthly', 'paginated', year, params],
    queryFn: () => SummaryAPI.getMonthlyData(year),
    enabled: !!year,
    placeholderData: keepPreviousData,
  });
};
