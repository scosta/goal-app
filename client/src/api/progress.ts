import { components, operations } from '../../../shared/api-types';
import { apiClient } from './client';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

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

// React Query hooks
export const useProgress = (params: operations['getProgress']['parameters']['query']) => {
  return useQuery({
    queryKey: ['progress', params],
    queryFn: () => ProgressAPI.getProgress(params),
    placeholderData: keepPreviousData,
  });
};

// Paginated progress hook with cursor support
export const useProgressPaginated = (params: operations['getProgress']['parameters']['query'] & {
  page?: number;
  pageSize?: number;
  nextCursor?: string;
}) => {
  return useQuery({
    queryKey: ['progress', 'paginated', params],
    queryFn: () => ProgressAPI.getProgress(params),
    placeholderData: keepPreviousData,
  });
};

export const useProgressForGoal = (goalId: string, month: string) => {
  return useQuery({
    queryKey: ['progress', 'goal', goalId, month],
    queryFn: () => ProgressAPI.getProgressForGoal(goalId, month),
    enabled: !!goalId && !!month,
  });
};

export const useRecordProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ProgressAPI.recordProgress,
    onMutate: async (newProgress) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['progress'] });
      await queryClient.cancelQueries({ queryKey: ['progress', 'goal', newProgress.goalId] });
      
      // Snapshot previous values
      const previousProgress = queryClient.getQueryData(['progress']);
      const previousGoalProgress = queryClient.getQueryData(['progress', 'goal', newProgress.goalId]);
      
      // Optimistically update cache
      const tempId = `temp-${Date.now()}`;
      const optimisticProgress = { ...newProgress, id: tempId, createdAt: new Date().toISOString() };
      
      queryClient.setQueryData(['progress'], (old: any) => {
        if (!old?.progress) return old;
        return {
          ...old,
          progress: [...old.progress, optimisticProgress]
        };
      });
      
      queryClient.setQueryData(['progress', 'goal', newProgress.goalId], (old: any) => {
        if (!old?.progress) return old;
        return {
          ...old,
          progress: [...old.progress, optimisticProgress]
        };
      });
      
      return { previousProgress, previousGoalProgress };
    },
    onError: (error, newProgress, context) => {
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(['progress'], context.previousProgress);
      }
      if (context?.previousGoalProgress) {
        queryClient.setQueryData(['progress', 'goal', newProgress.goalId], context.previousGoalProgress);
      }
      console.error('Failed to record progress:', error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['progress', 'goal', variables.goalId] });
    },
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ progressId, data }: { progressId: string; data: Partial<components['schemas']['Progress']> }) =>
      ProgressAPI.updateProgress(progressId, data),
    onMutate: async ({ progressId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['progress'] });
      
      // Snapshot previous value
      const previousProgress = queryClient.getQueryData(['progress']);
      
      // Optimistically update cache
      queryClient.setQueryData(['progress'], (old: any) => {
        if (!old?.progress) return old;
        return {
          ...old,
          progress: old.progress.map((progress: any) => 
            progress.id === progressId ? { ...progress, ...data } : progress
          )
        };
      });
      
      return { previousProgress };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(['progress'], context.previousProgress);
      }
      console.error('Failed to update progress:', error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['progress', variables.progressId] });
    },
  });
};

export const useDeleteProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ProgressAPI.deleteProgress,
    onMutate: async (progressId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['progress'] });
      
      // Snapshot previous value
      const previousProgress = queryClient.getQueryData(['progress']);
      
      // Optimistically update cache
      queryClient.setQueryData(['progress'], (old: any) => {
        if (!old?.progress) return old;
        return {
          ...old,
          progress: old.progress.filter((progress: any) => progress.id !== progressId)
        };
      });
      
      return { previousProgress };
    },
    onError: (error, _progressId, context) => {
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(['progress'], context.previousProgress);
      }
      console.error('Failed to delete progress:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
};
