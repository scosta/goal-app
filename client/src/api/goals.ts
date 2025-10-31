import { components, operations } from '../../../shared/api-types';
import { apiClient } from './client';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

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

// React Query hooks
export const useGoals = (params?: operations['listGoals']['parameters']['query']) => {
  return useQuery({
    queryKey: ['goals', params],
    queryFn: () => GoalsAPI.listGoals(params),
    placeholderData: keepPreviousData, // Keep previous data while fetching new page
  });
};

// Paginated goals hook with cursor support
export const useGoalsPaginated = (params?: operations['listGoals']['parameters']['query'] & {
  page?: number;
  pageSize?: number;
  nextCursor?: string;
}) => {
  return useQuery({
    queryKey: ['goals', 'paginated', params],
    queryFn: () => GoalsAPI.listGoals(params),
    placeholderData: keepPreviousData,
  });
};

export const useGoal = (goalId: string) => {
  return useQuery({
    queryKey: ['goals', goalId],
    queryFn: () => GoalsAPI.getGoal(goalId),
    enabled: !!goalId,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: GoalsAPI.createGoal,
    onMutate: async (newGoal) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      
      // Snapshot previous value
      const previousGoals = queryClient.getQueryData(['goals']);
      
      // Optimistically update cache
      queryClient.setQueryData(['goals'], (old: any) => {
        const tempId = `temp-${Date.now()}`;
        return {
          ...old,
          goals: [...(old?.goals || []), { ...newGoal, id: tempId, createdAt: new Date().toISOString() }],
          total: (old?.total || 0) + 1
        };
      });
      
      return { previousGoals };
    },
    onError: (error, _newGoal, context) => {
      // Rollback on error
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals);
      }
      console.error('Failed to create goal:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: Partial<components['schemas']['Goal']> }) =>
      GoalsAPI.updateGoal(goalId, data),
    onMutate: async ({ goalId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      await queryClient.cancelQueries({ queryKey: ['goals', goalId] });
      
      // Snapshot previous values
      const previousGoals = queryClient.getQueryData(['goals']);
      const previousGoal = queryClient.getQueryData(['goals', goalId]);
      
      // Optimistically update cache
      queryClient.setQueryData(['goals'], (old: any) => {
        if (!old?.goals) return old;
        return {
          ...old,
          goals: old.goals.map((goal: any) => 
            goal.id === goalId ? { ...goal, ...data } : goal
          )
        };
      });
      
      queryClient.setQueryData(['goals', goalId], (old: any) => {
        if (!old) return old;
        return { ...old, ...data };
      });
      
      return { previousGoals, previousGoal };
    },
    onError: (error, { goalId }, context) => {
      // Rollback on error
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals);
      }
      if (context?.previousGoal) {
        queryClient.setQueryData(['goals', goalId], context.previousGoal);
      }
      console.error('Failed to update goal:', error);
    },
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals', goalId] });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: GoalsAPI.deleteGoal,
    onMutate: async (goalId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      
      // Snapshot previous value
      const previousGoals = queryClient.getQueryData(['goals']);
      
      // Optimistically update cache
      queryClient.setQueryData(['goals'], (old: any) => {
        if (!old?.goals) return old;
        return {
          ...old,
          goals: old.goals.filter((goal: any) => goal.id !== goalId),
          total: Math.max(0, (old.total || 0) - 1)
        };
      });
      
      return { previousGoals };
    },
    onError: (error, _goalId, context) => {
      // Rollback on error
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals);
      }
      console.error('Failed to delete goal:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};
