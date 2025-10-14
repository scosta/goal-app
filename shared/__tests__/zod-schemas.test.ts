import { describe, it, expect } from 'vitest';
import { schemas } from '../zod-schemas';

// Extract schemas for easier testing
const {
  Goal: GoalSchema,
  createGoal_Body: CreateGoalSchema,
  Progress: ProgressSchema,
  recordProgress_Body: CreateProgressSchema,
  MonthlyProgressReport: MonthlyProgressReportSchema,
  YearlySummary: YearlySummarySchema,
  Error: ErrorSchema
} = schemas;

describe('Zod Schemas Validation', () => {
  describe('GoalSchema', () => {
    it('should validate a complete goal object', () => {
      const validGoal = {
        id: 'goal_abc123',
        userId: 'user123',
        title: 'Learn Spanish',
        description: 'Practice Spanish daily',
        targetMinutesPerDay: 30,
        startDate: '2025-10-05',
        endDate: '2025-12-31',
        tags: ['language', 'learning'],
        createdAt: '2025-10-05T10:30:00Z'
      };

      const result = GoalSchema.safeParse(validGoal);
      expect(result.success).toBe(true);
    });

    it('should reject goal with invalid targetMinutesPerDay', () => {
      const invalidGoal = {
        id: 'goal_abc123',
        userId: 'user123',
        title: 'Learn Spanish',
        targetMinutesPerDay: 0, // Invalid: must be >= 1
        startDate: '2025-10-05',
        createdAt: '2025-10-05T10:30:00Z'
      };

      const result = GoalSchema.safeParse(invalidGoal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Number must be greater than or equal to 1');
      }
    });

    it('should reject goal with invalid date format', () => {
      const invalidGoal = {
        id: 'goal_abc123',
        userId: 'user123',
        title: 'Learn Spanish',
        targetMinutesPerDay: 30,
        startDate: 'invalid-date', // Invalid format
        createdAt: 'invalid-datetime' // Invalid datetime format
      };

      const result = GoalSchema.safeParse(invalidGoal);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateGoalSchema', () => {
    it('should validate create goal request', () => {
      const validCreateGoal = {
        userId: 'user123',
        title: 'Learn Spanish',
        description: 'Practice Spanish daily',
        targetMinutesPerDay: 30,
        startDate: '2025-10-05',
        endDate: '2025-12-31',
        tags: ['language', 'learning']
      };

      const result = CreateGoalSchema.safeParse(validCreateGoal);
      expect(result.success).toBe(true);
    });

    it('should reject create goal without required fields', () => {
      const invalidCreateGoal = {
        title: 'Learn Spanish',
        // Missing userId, targetMinutesPerDay, startDate
      };

      const result = CreateGoalSchema.safeParse(invalidCreateGoal);
      expect(result.success).toBe(false);
    });
  });

  describe('ProgressSchema', () => {
    it('should validate progress object', () => {
      const validProgress = {
        id: 'progress_xyz789',
        goalId: 'goal_abc123',
        date: '2025-10-05',
        minutesSpent: 45,
        note: 'Completed two lessons',
        targetMet: true,
        createdAt: '2025-10-05T14:30:00Z'
      };

      const result = ProgressSchema.safeParse(validProgress);
      expect(result.success).toBe(true);
    });

    it('should reject progress with negative minutes', () => {
      const invalidProgress = {
        id: 'progress_xyz789',
        goalId: 'goal_abc123',
        date: '2025-10-05',
        minutesSpent: -5, // Invalid: cannot be negative
        targetMet: false,
        createdAt: '2025-10-05T14:30:00Z'
      };

      const result = ProgressSchema.safeParse(invalidProgress);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProgressSchema', () => {
    it('should validate create progress request', () => {
      const validCreateProgress = {
        goalId: 'goal_abc123',
        date: '2025-10-05',
        minutesSpent: 45,
        note: 'Completed two lessons'
      };

      const result = CreateProgressSchema.safeParse(validCreateProgress);
      expect(result.success).toBe(true);
    });

    it('should validate create progress without optional note', () => {
      const validCreateProgress = {
        goalId: 'goal_abc123',
        date: '2025-10-05',
        minutesSpent: 30
      };

      const result = CreateProgressSchema.safeParse(validCreateProgress);
      expect(result.success).toBe(true);
    });
  });

  describe('MonthlyProgressReportSchema', () => {
    it('should validate monthly progress report', () => {
      const validReport = {
        month: '2025-10',
        goalProgress: [
          {
            goal: {
              id: 'goal_abc123',
              userId: 'user123',
              title: 'Learn Spanish',
              targetMinutesPerDay: 30,
              startDate: '2025-10-05',
              createdAt: '2025-10-05T10:30:00Z'
            },
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
      };

      const result = MonthlyProgressReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
    });

    it('should accept any month format as string', () => {
      const reportWithDifferentFormat = {
        month: '2025/10', // Different format but still valid string
        goalProgress: [],
        overallStats: {
          totalMinutesSpent: 0,
          totalGoals: 0,
          averageSuccessRate: 0
        }
      };

      const result = MonthlyProgressReportSchema.safeParse(reportWithDifferentFormat);
      expect(result.success).toBe(true);
    });
  });

  describe('YearlySummarySchema', () => {
    it('should validate yearly summary', () => {
      const validSummary = {
        year: '2025',
        monthlyData: [
          {
            month: '2025-01',
            successRate: 78.5,
            totalMinutesSpent: 1200,
            goalsTracked: 3
          }
        ],
        overallStats: {
          totalMinutesSpent: 14400,
          averageSuccessRate: 72.3,
          bestMonth: {
            month: '2025-06',
            successRate: 85.0
          },
          worstMonth: {
            month: '2025-02',
            successRate: 45.0
          }
        }
      };

      const result = YearlySummarySchema.safeParse(validSummary);
      expect(result.success).toBe(true);
    });

    it('should accept any year format as string', () => {
      const summaryWithDifferentFormat = {
        year: '25', // Different format but still valid string
        monthlyData: [],
        overallStats: {
          totalMinutesSpent: 0,
          averageSuccessRate: 0,
          bestMonth: { month: '', successRate: 0 },
          worstMonth: { month: '', successRate: 0 }
        }
      };

      const result = YearlySummarySchema.safeParse(summaryWithDifferentFormat);
      expect(result.success).toBe(true);
    });
  });

  // Note: Query parameter schemas are defined inline in the API endpoints
  // and are not exported as separate schemas for testing

  describe('ErrorSchema', () => {
    it('should validate error object', () => {
      const validError = {
        message: 'Invalid request',
        code: 'INVALID_INPUT'
      };

      const result = ErrorSchema.safeParse(validError);
      expect(result.success).toBe(true);
    });

    it('should validate error without code', () => {
      const validError = {
        message: 'Internal server error'
      };

      const result = ErrorSchema.safeParse(validError);
      expect(result.success).toBe(true);
    });
  });
});
