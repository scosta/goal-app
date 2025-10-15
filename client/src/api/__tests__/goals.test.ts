import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoalsAPI } from '../goals';
import { apiClient } from '../client';

// Mock the API client
vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('GoalsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createGoal', () => {
    it('should validate goal data before creating', async () => {
      const invalidData = {
        userId: '',
        title: '',
        targetMinutesPerDay: -1,
        startDate: 'invalid-date'
      };

      await expect(GoalsAPI.createGoal(invalidData))
        .rejects.toThrow('Invalid goal data');
    });

    it('should validate target minutes per day', async () => {
      const invalidData = {
        userId: 'user123',
        title: 'Learn Spanish',
        targetMinutesPerDay: 0,
        startDate: '2025-10-05'
      };

      await expect(GoalsAPI.createGoal(invalidData))
        .rejects.toThrow('Target minutes must be greater than 0');
    });

    it('should validate date format', async () => {
      const invalidData = {
        userId: 'user123',
        title: 'Learn Spanish',
        targetMinutesPerDay: 30,
        startDate: 'invalid-date'
      };

      await expect(GoalsAPI.createGoal(invalidData))
        .rejects.toThrow('Invalid date format');
    });

    it('should transform goal data before API call', async () => {
      const goalData = {
        userId: 'user123',
        title: 'Learn Spanish',
        targetMinutesPerDay: 30,
        startDate: '2025-10-05'
      };

      const mockResponse = {
        data: {
          id: 'goal_abc123',
          ...goalData,
          createdAt: '2025-10-05T10:30:00Z',
          status: 'active'
        }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await GoalsAPI.createGoal(goalData);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.post).toHaveBeenCalledWith('/goals', {
        ...goalData,
        status: 'active'
      });
    });

    it('should handle API errors gracefully', async () => {
      const goalData = {
        userId: 'user123',
        title: 'Learn Spanish',
        targetMinutesPerDay: 30,
        startDate: '2025-10-05'
      };

      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      await expect(GoalsAPI.createGoal(goalData))
        .rejects.toThrow('Failed to create goal: Network error');
    });

    it('should retry on network failures', async () => {
      const goalData = {
        userId: 'user123',
        title: 'Learn Spanish',
        targetMinutesPerDay: 30,
        startDate: '2025-10-05'
      };

      // First call fails, second succeeds
      vi.mocked(apiClient.post)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { id: 'goal_123', ...goalData } });

      const result = await GoalsAPI.createGoal(goalData);

      expect(result.id).toBe('goal_123');
      expect(apiClient.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('listGoals', () => {
    it('should validate query parameters', async () => {
      const invalidParams = {
        active: 'invalid-boolean' as any
      };

      await expect(GoalsAPI.listGoals(invalidParams))
        .rejects.toThrow('Invalid query parameters');
    });

    it('should transform query parameters', async () => {
      const params = {
        tags: 'language,learning',
        active: true
      };

      const mockResponse = {
        data: {
          goals: [
            { id: 'goal1', title: 'Learn Spanish' },
            { id: 'goal2', title: 'Learn French' }
          ],
          total: 2
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await GoalsAPI.listGoals(params);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.get).toHaveBeenCalledWith('/goals', {
        params: {
          tags: 'language,learning',
          active: true
        }
      });
    });

    it('should handle empty results', async () => {
      const mockResponse = {
        data: {
          goals: [],
          total: 0
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await GoalsAPI.listGoals();

      expect(result.goals).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle API errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      await expect(GoalsAPI.listGoals())
        .rejects.toThrow('Failed to fetch goals: API error');
    });
  });

  describe('getGoal', () => {
    it('should validate goal ID', async () => {
      await expect(GoalsAPI.getGoal(''))
        .rejects.toThrow('Goal ID is required');
    });

    it('should fetch goal by ID', async () => {
      const goalId = 'goal_abc123';
      const mockResponse = {
        data: {
          id: goalId,
          title: 'Learn Spanish',
          userId: 'user123'
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await GoalsAPI.getGoal(goalId);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.get).toHaveBeenCalledWith(`/goals/${goalId}`);
    });

    it('should handle goal not found', async () => {
      const goalId = 'nonexistent';
      
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 404, data: { message: 'Goal not found' } }
      });

      await expect(GoalsAPI.getGoal(goalId))
        .rejects.toThrow('Goal not found');
    });
  });

  describe('updateGoal', () => {
    it('should validate goal ID', async () => {
      await expect(GoalsAPI.updateGoal('', {}))
        .rejects.toThrow('Goal ID is required');
    });

    it('should validate update data', async () => {
      const invalidData = {
        targetMinutesPerDay: -1
      };

      await expect(GoalsAPI.updateGoal('goal_123', invalidData))
        .rejects.toThrow('Invalid update data');
    });

    it('should update goal', async () => {
      const goalId = 'goal_abc123';
      const updateData = {
        title: 'Updated Goal',
        targetMinutesPerDay: 45
      };

      const mockResponse = {
        data: {
          id: goalId,
          ...updateData,
          updatedAt: '2025-10-05T15:30:00Z'
        }
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await GoalsAPI.updateGoal(goalId, updateData);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.put).toHaveBeenCalledWith(`/goals/${goalId}`, updateData);
    });

    it('should handle update errors', async () => {
      const goalId = 'goal_abc123';
      const updateData = { title: 'Updated Goal' };

      vi.mocked(apiClient.put).mockRejectedValue(new Error('Update failed'));

      await expect(GoalsAPI.updateGoal(goalId, updateData))
        .rejects.toThrow('Failed to update goal: Update failed');
    });
  });

  describe('deleteGoal', () => {
    it('should validate goal ID', async () => {
      await expect(GoalsAPI.deleteGoal(''))
        .rejects.toThrow('Goal ID is required');
    });

    it('should delete goal', async () => {
      const goalId = 'goal_abc123';

      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

      await GoalsAPI.deleteGoal(goalId);

      expect(apiClient.delete).toHaveBeenCalledWith(`/goals/${goalId}`);
    });

    it('should handle delete errors', async () => {
      const goalId = 'goal_abc123';

      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(GoalsAPI.deleteGoal(goalId))
        .rejects.toThrow('Failed to delete goal: Delete failed');
    });
  });
});
