import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressAPI } from '../progress';
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

describe('ProgressAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordProgress', () => {
    it('should validate progress data', async () => {
      const invalidData = {
        goalId: '',
        date: 'invalid-date',
        minutesSpent: -5
      };

      await expect(ProgressAPI.recordProgress(invalidData))
        .rejects.toThrow('Invalid progress data');
    });

    it('should validate minutes spent', async () => {
      const invalidData = {
        goalId: 'goal_123',
        date: '2025-10-05',
        minutesSpent: -1
      };

      await expect(ProgressAPI.recordProgress(invalidData))
        .rejects.toThrow('Minutes spent must be non-negative');
    });

    it('should validate date format', async () => {
      const invalidData = {
        goalId: 'goal_123',
        date: 'invalid-date',
        minutesSpent: 30
      };

      await expect(ProgressAPI.recordProgress(invalidData))
        .rejects.toThrow('Invalid date format');
    });

    it('should calculate target met status', async () => {
      const progressData = {
        goalId: 'goal_123',
        date: '2025-10-05',
        minutesSpent: 45
      };

      const mockResponse = {
        data: {
          id: 'progress_123',
          ...progressData,
          targetMet: true,
          createdAt: '2025-10-05T14:30:00Z'
        }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await ProgressAPI.recordProgress(progressData);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.post).toHaveBeenCalledWith('/progress', {
        ...progressData,
        targetMet: true
      });
    });

    it('should handle optional note field', async () => {
      const progressData = {
        goalId: 'goal_123',
        date: '2025-10-05',
        minutesSpent: 30
        // No note field
      };

      const mockResponse = {
        data: {
          id: 'progress_123',
          ...progressData,
          targetMet: true,
          createdAt: '2025-10-05T14:30:00Z'
        }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await ProgressAPI.recordProgress(progressData);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const progressData = {
        goalId: 'goal_123',
        date: '2025-10-05',
        minutesSpent: 30
      };

      vi.mocked(apiClient.post).mockRejectedValue(new Error('API error'));

      await expect(ProgressAPI.recordProgress(progressData))
        .rejects.toThrow('Failed to record progress: API error');
    });
  });

  describe('getProgress', () => {
    it('should validate month parameter', async () => {
      const invalidParams = {
        month: 'invalid-month'
      };

      await expect(ProgressAPI.getProgress(invalidParams))
        .rejects.toThrow('Invalid month format');
    });

    it('should validate month format (YYYY-MM)', async () => {
      const invalidParams = {
        month: '2025/10'
      };

      await expect(ProgressAPI.getProgress(invalidParams))
        .rejects.toThrow('Month must be in YYYY-MM format');
    });

    it('should fetch progress for month', async () => {
      const params = {
        month: '2025-10'
      };

      const mockResponse = {
        data: {
          month: '2025-10',
          goalProgress: [
            {
              goal: { id: 'goal1', title: 'Learn Spanish' },
              totalMinutesSpent: 450,
              totalTargetMinutes: 600,
              daysTracked: 15,
              daysTargetMet: 12,
              successRate: 80.0
            }
          ],
          overallStats: {
            totalMinutesSpent: 900,
            totalGoals: 3,
            averageSuccessRate: 75.5
          }
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await ProgressAPI.getProgress(params);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.get).toHaveBeenCalledWith('/progress', { params });
    });

    it('should handle goal filter', async () => {
      const params = {
        month: '2025-10',
        goalId: 'goal_123'
      };

      const mockResponse = {
        data: {
          month: '2025-10',
          goalProgress: [],
          overallStats: {
            totalMinutesSpent: 0,
            totalGoals: 0,
            averageSuccessRate: 0
          }
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await ProgressAPI.getProgress(params);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const params = { month: '2025-10' };

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      await expect(ProgressAPI.getProgress(params))
        .rejects.toThrow('Failed to fetch progress: API error');
    });
  });

  describe('getProgressForGoal', () => {
    it('should validate goal ID', async () => {
      await expect(ProgressAPI.getProgressForGoal('', '2025-10'))
        .rejects.toThrow('Goal ID is required');
    });

    it('should validate month format', async () => {
      await expect(ProgressAPI.getProgressForGoal('goal_123', 'invalid-month'))
        .rejects.toThrow('Invalid month format');
    });

    it('should fetch progress for specific goal', async () => {
      const goalId = 'goal_123';
      const month = '2025-10';

      const mockResponse = {
        data: {
          month: '2025-10',
          goalProgress: [
            {
              goal: { id: goalId, title: 'Learn Spanish' },
              totalMinutesSpent: 450,
              totalTargetMinutes: 600,
              daysTracked: 15,
              daysTargetMet: 12,
              successRate: 80.0
            }
          ],
          overallStats: {
            totalMinutesSpent: 450,
            totalGoals: 1,
            averageSuccessRate: 80.0
          }
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await ProgressAPI.getProgressForGoal(goalId, month);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.get).toHaveBeenCalledWith('/progress', {
        params: { goalId, month }
      });
    });
  });

  describe('updateProgress', () => {
    it('should validate progress ID', async () => {
      await expect(ProgressAPI.updateProgress('', {}))
        .rejects.toThrow('Progress ID is required');
    });

    it('should validate update data', async () => {
      const invalidData = {
        minutesSpent: -1
      };

      await expect(ProgressAPI.updateProgress('progress_123', invalidData))
        .rejects.toThrow('Invalid update data');
    });

    it('should update progress', async () => {
      const progressId = 'progress_123';
      const updateData = {
        minutesSpent: 60,
        note: 'Updated progress'
      };

      const mockResponse = {
        data: {
          id: progressId,
          goalId: 'goal_123',
          date: '2025-10-05',
          minutesSpent: 60,
          note: 'Updated progress',
          targetMet: true,
          createdAt: '2025-10-05T14:30:00Z'
        }
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await ProgressAPI.updateProgress(progressId, updateData);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.put).toHaveBeenCalledWith(`/progress/${progressId}`, updateData);
    });

    it('should handle update errors', async () => {
      const progressId = 'progress_123';
      const updateData = { minutesSpent: 60 };

      vi.mocked(apiClient.put).mockRejectedValue(new Error('Update failed'));

      await expect(ProgressAPI.updateProgress(progressId, updateData))
        .rejects.toThrow('Failed to update progress: Update failed');
    });
  });

  describe('deleteProgress', () => {
    it('should validate progress ID', async () => {
      await expect(ProgressAPI.deleteProgress(''))
        .rejects.toThrow('Progress ID is required');
    });

    it('should delete progress', async () => {
      const progressId = 'progress_123';

      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

      await ProgressAPI.deleteProgress(progressId);

      expect(apiClient.delete).toHaveBeenCalledWith(`/progress/${progressId}`);
    });

    it('should handle delete errors', async () => {
      const progressId = 'progress_123';

      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(ProgressAPI.deleteProgress(progressId))
        .rejects.toThrow('Failed to delete progress: Delete failed');
    });
  });
});
