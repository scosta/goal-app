import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API client
vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { ProgressAPI } from '../progress';
import { apiClient } from '../client';

describe('ProgressAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordProgress', () => {
    it('should record progress with valid data', async () => {
      const progressData = {
        goalId: 'goal_abc123',
        date: '2025-10-05',
        minutesSpent: 45,
        note: 'Completed two lessons'
      };

      const mockResponse = {
        data: {
          id: 'progress_xyz789',
          ...progressData,
          targetMet: true,
          createdAt: '2025-10-05T14:30:00Z'
        }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await ProgressAPI.recordProgress(progressData);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.post).toHaveBeenCalledWith('/progress', progressData);
    });

    it('should record progress without optional note', async () => {
      const progressData = {
        goalId: 'goal_abc123',
        date: '2025-10-05',
        minutesSpent: 30
      };

      const mockResponse = {
        data: {
          id: 'progress_xyz789',
          ...progressData,
          targetMet: true,
          createdAt: '2025-10-05T14:30:00Z'
        }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await ProgressAPI.recordProgress(progressData);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getProgress', () => {
    it('should get progress for a specific month', async () => {
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

    it('should get progress with goal filter', async () => {
      const params = {
        month: '2025-10',
        goalId: 'goal_abc123'
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
  });

  describe('getProgressForGoal', () => {
    it('should get progress for a specific goal and month', async () => {
      const goalId = 'goal_abc123';
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
    it('should update existing progress entry', async () => {
      const progressId = 'progress_xyz789';
      const updateData = {
        minutesSpent: 60,
        note: 'Updated progress'
      };

      const mockResponse = {
        data: {
          id: progressId,
          goalId: 'goal_abc123',
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
  });

  describe('deleteProgress', () => {
    it('should delete progress entry', async () => {
      const progressId = 'progress_xyz789';

      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

      await ProgressAPI.deleteProgress(progressId);

      expect(apiClient.delete).toHaveBeenCalledWith(`/progress/${progressId}`);
    });
  });
});
