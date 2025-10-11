import { describe, it, expect, vi, beforeEach } from 'vitest';
import GoalAppAPI from '../index';
import { CreateGoalSchema, CreateProgressSchema } from '../../../shared/zod-schemas';

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

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Goal Workflow', () => {
    it('should create goal, record progress, and get analytics', async () => {
      const mockAxios = await import('axios');
      
      // Mock create goal
      const goalData = {
        userId: 'user123',
        title: 'Learn Spanish',
        description: 'Practice Spanish daily',
        targetMinutesPerDay: 30,
        startDate: '2025-10-05'
      };

      const createdGoal = {
        id: 'goal_abc123',
        ...goalData,
        createdAt: '2025-10-05T10:30:00Z'
      };

      vi.mocked(mockAxios.default.create().post)
        .mockResolvedValueOnce({ data: createdGoal });

      // Create goal
      const goal = await GoalAppAPI.goals.createGoal(goalData);
      expect(goal).toEqual(createdGoal);

      // Validate with Zod schema
      const goalValidation = CreateGoalSchema.safeParse(goalData);
      expect(goalValidation.success).toBe(true);

      // Mock record progress
      const progressData = {
        goalId: goal.id,
        date: '2025-10-05',
        minutesSpent: 45,
        note: 'Completed two lessons'
      };

      const recordedProgress = {
        id: 'progress_xyz789',
        ...progressData,
        targetMet: true,
        createdAt: '2025-10-05T14:30:00Z'
      };

      vi.mocked(mockAxios.default.create().post)
        .mockResolvedValueOnce({ data: recordedProgress });

      // Record progress
      const progress = await GoalAppAPI.progress.recordProgress(progressData);
      expect(progress).toEqual(recordedProgress);

      // Validate with Zod schema
      const progressValidation = CreateProgressSchema.safeParse(progressData);
      expect(progressValidation.success).toBe(true);

      // Mock get progress
      const monthlyReport = {
        month: '2025-10',
        goalProgress: [
          {
            goal: createdGoal,
            totalMinutesSpent: 45,
            totalTargetMinutes: 30,
            daysTracked: 1,
            daysTargetMet: 1,
            successRate: 100.0,
            dailyProgress: [recordedProgress]
          }
        ],
        overallStats: {
          totalMinutesSpent: 45,
          totalGoals: 1,
          averageSuccessRate: 100.0
        }
      };

      vi.mocked(mockAxios.default.create().get)
        .mockResolvedValueOnce({ data: monthlyReport });

      // Get monthly progress
      const report = await GoalAppAPI.progress.getProgress({ month: '2025-10' });
      expect(report).toEqual(monthlyReport);

      // Mock yearly summary
      const yearlySummary = {
        year: '2025',
        monthlyData: [
          {
            month: '2025-10',
            successRate: 100.0,
            totalMinutesSpent: 45,
            goalsTracked: 1,
            bestPerformingGoal: {
              goalId: goal.id,
              goalTitle: goal.title,
              successRate: 100.0
            }
          }
        ],
        overallStats: {
          totalMinutesSpent: 45,
          averageSuccessRate: 100.0,
          bestMonth: {
            month: '2025-10',
            successRate: 100.0
          },
          worstMonth: {
            month: '2025-10',
            successRate: 100.0
          }
        }
      };

      vi.mocked(mockAxios.default.create().get)
        .mockResolvedValueOnce({ data: yearlySummary });

      // Get yearly summary
      const summary = await GoalAppAPI.summary.getYearlySummary({ year: '2025' });
      expect(summary).toEqual(yearlySummary);
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle API errors gracefully', async () => {
      const mockAxios = await import('axios');
      
      // Mock API error
      const apiError = {
        response: {
          status: 400,
          data: {
            message: 'Invalid request',
            code: 'INVALID_INPUT'
          }
        }
      };

      vi.mocked(mockAxios.default.create().post)
        .mockRejectedValueOnce(apiError);

      // Test error handling
      try {
        await GoalAppAPI.goals.createGoal({
          userId: '',
          title: '',
          targetMinutesPerDay: -1,
          startDate: 'invalid-date'
        });
      } catch (error) {
        expect(error).toEqual(apiError);
      }
    });
  });

  describe('Data Validation Workflow', () => {
    it('should validate data before API calls', () => {
      // Test invalid goal data
      const invalidGoalData = {
        userId: '',
        title: '',
        targetMinutesPerDay: 0,
        startDate: 'invalid-date'
      };

      const goalValidation = CreateGoalSchema.safeParse(invalidGoalData);
      expect(goalValidation.success).toBe(false);
      
      if (!goalValidation.success) {
        expect(goalValidation.error.issues.length).toBeGreaterThan(0);
      }

      // Test invalid progress data
      const invalidProgressData = {
        goalId: '',
        date: 'invalid-date',
        minutesSpent: -5
      };

      const progressValidation = CreateProgressSchema.safeParse(invalidProgressData);
      expect(progressValidation.success).toBe(false);
    });
  });

  describe('API Client Consistency', () => {
    it('should maintain consistent API client configuration', async () => {
      const mockAxios = await import('axios');
      
      // Test that all API calls use the same base configuration
      await GoalAppAPI.goals.listGoals();
      await GoalAppAPI.progress.getProgress({ month: '2025-10' });
      await GoalAppAPI.summary.getYearlySummary({ year: '2025' });

      // Verify axios.create was called with consistent config
      expect(mockAxios.default.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });
});
