import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import GoalAppAPI from '../index';
import { schemas } from '../../../../shared/zod-schemas';

// Real integration tests that communicate with actual server
describe('Real API Integration Tests', () => {
  const API_BASE_URL = 'http://localhost:8080';
  let api: GoalAppAPI;

  beforeAll(async () => {
    // Initialize API client with real server
    api = new GoalAppAPI(API_BASE_URL);
    
    // Wait for server to be ready
    await waitForServer(API_BASE_URL);
  });

  afterAll(async () => {
    // Cleanup any test data if needed
  });

  describe('Complete Goal Workflow', () => {
    it('should create goal, record progress, and get analytics', async () => {
      // Create a goal
      const goalData = {
        userId: 'test-user-123',
        title: 'Learn Spanish',
        description: 'Practice Spanish daily',
        targetMinutesPerDay: 30,
        startDate: '2025-10-05'
      };

      const createdGoal = await api.goals.createGoal(goalData);
      expect(createdGoal).toBeDefined();
      expect(createdGoal.title).toBe('Learn Spanish');
      expect(createdGoal.id).toBeDefined();

      // Record progress
      const progressData = {
        goalId: createdGoal.id,
        minutesSpent: 45,
        date: '2025-10-05',
        note: 'Completed lesson 1'
      };

      const recordedProgress = await api.progress.recordProgress(progressData);
      expect(recordedProgress).toBeDefined();
      expect(recordedProgress.minutesSpent).toBe(45);
      expect(recordedProgress.goalId).toBe(createdGoal.id);

      // Get progress for the month
      const monthlyProgress = await api.progress.getProgress({ month: '2025-10' });
      expect(monthlyProgress).toBeDefined();
      expect(monthlyProgress.length).toBeGreaterThan(0);

      // Get monthly summary
      const monthlySummary = await api.summary.getMonthlySummary({ month: '2025-10' });
      expect(monthlySummary).toBeDefined();
      expect(monthlySummary.month).toBe('2025-10');
      expect(monthlySummary.goalProgress).toBeDefined();
      expect(monthlySummary.overallStats).toBeDefined();
    });

    it('should handle multiple goals and progress entries', async () => {
      // Create multiple goals
      const goals = [
        {
          userId: 'test-user-123',
          title: 'Learn Spanish',
          targetMinutesPerDay: 30,
          startDate: '2025-10-01'
        },
        {
          userId: 'test-user-123',
          title: 'Exercise',
          targetMinutesPerDay: 60,
          startDate: '2025-10-01'
        }
      ];

      const createdGoals = [];
      for (const goalData of goals) {
        const goal = await api.goals.createGoal(goalData);
        createdGoals.push(goal);
      }

      expect(createdGoals).toHaveLength(2);

      // Record progress for each goal
      const progressEntries = [
        {
          goalId: createdGoals[0].id,
          minutesSpent: 30,
          date: '2025-10-01'
        },
        {
          goalId: createdGoals[1].id,
          minutesSpent: 60,
          date: '2025-10-01'
        },
        {
          goalId: createdGoals[0].id,
          minutesSpent: 45,
          date: '2025-10-02'
        }
      ];

      for (const progressData of progressEntries) {
        const progress = await api.progress.recordProgress(progressData);
        expect(progress).toBeDefined();
      }

      // Get monthly summary
      const monthlySummary = await api.summary.getMonthlySummary({ month: '2025-10' });
      expect(monthlySummary.goalProgress).toHaveLength(2);
      expect(monthlySummary.overallStats.totalGoals).toBe(2);
      expect(monthlySummary.overallStats.totalMinutesSpent).toBe(135); // 30 + 60 + 45
    });

    it('should handle yearly summary calculations', async () => {
      // Create a goal
      const goalData = {
        userId: 'test-user-123',
        title: 'Yearly Goal',
        targetMinutesPerDay: 30,
        startDate: '2025-01-01'
      };

      const goal = await api.goals.createGoal(goalData);

      // Record progress for different months
      const progressEntries = [
        { goalId: goal.id, minutesSpent: 30, date: '2025-01-15' },
        { goalId: goal.id, minutesSpent: 45, date: '2025-02-10' },
        { goalId: goal.id, minutesSpent: 25, date: '2025-03-05' }
      ];

      for (const progressData of progressEntries) {
        await api.progress.recordProgress(progressData);
      }

      // Get yearly summary
      const yearlySummary = await api.summary.getYearlySummary({ year: '2025' });
      expect(yearlySummary).toBeDefined();
      expect(yearlySummary.year).toBe('2025');
      expect(yearlySummary.monthlyData).toHaveLength(12);
      expect(yearlySummary.overallStats.totalMinutesSpent).toBe(100); // 30 + 45 + 25
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with invalid data
      try {
        await api.goals.createGoal({
          userId: 'test-user-123',
          title: '', // Invalid: empty title
          targetMinutesPerDay: -1, // Invalid: negative minutes
          startDate: 'invalid-date' // Invalid: bad date format
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle network errors', async () => {
      // Test with invalid server URL
      const invalidApi = new GoalAppAPI('http://localhost:9999');
      
      try {
        await invalidApi.goals.listGoals();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate goal data with Zod schemas', async () => {
      const validGoalData = {
        userId: 'test-user-123',
        title: 'Valid Goal',
        targetMinutesPerDay: 30,
        startDate: '2025-10-05'
      };

      // Validate with Zod schema
      const validationResult = schemas.createGoal_Body.safeParse(validGoalData);
      expect(validationResult.success).toBe(true);

      if (validationResult.success) {
        const goal = await api.goals.createGoal(validGoalData);
        expect(goal).toBeDefined();
      }
    });

    it('should reject invalid goal data', async () => {
      const invalidGoalData = {
        userId: 'test-user-123',
        title: '', // Invalid: empty title
        targetMinutesPerDay: -1, // Invalid: negative minutes
        startDate: 'invalid-date' // Invalid: bad date format
      };

      // Validate with Zod schema
      const validationResult = schemas.createGoal_Body.safeParse(invalidGoalData);
      expect(validationResult.success).toBe(false);
    });
  });
});

// Helper function to wait for server to be ready
async function waitForServer(baseUrl: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        console.log('Server is ready!');
        return;
      }
    } catch (error) {
      // Server not ready yet
      console.log(`Attempt ${i + 1}: Server not ready yet...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Server did not become ready within timeout');
}
