import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordProgress, getProgress, getProgressForGoal, updateProgress, deleteProgress } from '../progress';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

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

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().post).mockResolvedValue(mockResponse);

      const result = await recordProgress(progressData);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxios.default.create().post).toHaveBeenCalledWith('/progress', progressData);
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

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().post).mockResolvedValue(mockResponse);

      const result = await recordProgress(progressData);

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

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().get).mockResolvedValue(mockResponse);

      const result = await getProgress(params);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxios.default.create().get).toHaveBeenCalledWith('/progress', { params });
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

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().get).mockResolvedValue(mockResponse);

      const result = await getProgress(params);

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

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().get).mockResolvedValue(mockResponse);

      const result = await getProgressForGoal(goalId, month);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxios.default.create().get).toHaveBeenCalledWith('/progress', {
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

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().put).mockResolvedValue(mockResponse);

      const result = await updateProgress(progressId, updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxios.default.create().put).toHaveBeenCalledWith(`/progress/${progressId}`, updateData);
    });
  });

  describe('deleteProgress', () => {
    it('should delete progress entry', async () => {
      const progressId = 'progress_xyz789';

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().delete).mockResolvedValue({ data: undefined });

      await deleteProgress(progressId);

      expect(mockAxios.default.create().delete).toHaveBeenCalledWith(`/progress/${progressId}`);
    });
  });
});
