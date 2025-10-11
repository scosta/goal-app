import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getYearlySummary, getYearlySummaryForGoal, getYearlyStats, getMonthlyData } from '../summary';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
    })),
  },
}));

describe('SummaryAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getYearlySummary', () => {
    it('should get yearly summary with valid year', async () => {
      const params = {
        year: '2025'
      };

      const mockResponse = {
        data: {
          year: '2025',
          monthlyData: [
            {
              month: '2025-01',
              successRate: 78.5,
              totalMinutesSpent: 1200,
              goalsTracked: 3,
              bestPerformingGoal: {
                goalId: 'goal_abc123',
                goalTitle: 'Learn Spanish',
                successRate: 90.0
              }
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
        }
      };

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().get).mockResolvedValue(mockResponse);

      const result = await getYearlySummary(params);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxios.default.create().get).toHaveBeenCalledWith('/summary', { params });
    });

    it('should get yearly summary with goal filter', async () => {
      const params = {
        year: '2025',
        goalId: 'goal_abc123'
      };

      const mockResponse = {
        data: {
          year: '2025',
          monthlyData: [],
          overallStats: {
            totalMinutesSpent: 0,
            averageSuccessRate: 0,
            bestMonth: { month: '', successRate: 0 },
            worstMonth: { month: '', successRate: 0 }
          }
        }
      };

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().get).mockResolvedValue(mockResponse);

      const result = await getYearlySummary(params);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getYearlySummaryForGoal', () => {
    it('should get yearly summary for specific goal', async () => {
      const goalId = 'goal_abc123';
      const year = '2025';

      const mockResponse = {
        data: {
          year: '2025',
          monthlyData: [
            {
              month: '2025-01',
              successRate: 90.0,
              totalMinutesSpent: 900,
              goalsTracked: 1,
              bestPerformingGoal: {
                goalId: 'goal_abc123',
                goalTitle: 'Learn Spanish',
                successRate: 90.0
              }
            }
          ],
          overallStats: {
            totalMinutesSpent: 10800,
            averageSuccessRate: 90.0,
            bestMonth: {
              month: '2025-01',
              successRate: 90.0
            },
            worstMonth: {
              month: '2025-02',
              successRate: 85.0
            }
          }
        }
      };

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().get).mockResolvedValue(mockResponse);

      const result = await getYearlySummaryForGoal(goalId, year);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxios.default.create().get).toHaveBeenCalledWith('/summary', {
        params: { goalId, year }
      });
    });
  });

  describe('getYearlyStats', () => {
    it('should extract yearly statistics from summary', async () => {
      const year = '2025';

      const mockResponse = {
        data: {
          year: '2025',
          monthlyData: [],
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
        }
      };

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().get).mockResolvedValue(mockResponse);

      const result = await getYearlyStats(year);

      expect(result).toEqual(mockResponse.data.overallStats);
      expect(mockAxios.default.create().get).toHaveBeenCalledWith('/summary', {
        params: { year }
      });
    });
  });

  describe('getMonthlyData', () => {
    it('should extract monthly data from summary', async () => {
      const year = '2025';

      const mockResponse = {
        data: {
          year: '2025',
          monthlyData: [
            {
              month: '2025-01',
              successRate: 78.5,
              totalMinutesSpent: 1200,
              goalsTracked: 3,
              bestPerformingGoal: {
                goalId: 'goal_abc123',
                goalTitle: 'Learn Spanish',
                successRate: 90.0
              }
            },
            {
              month: '2025-02',
              successRate: 65.0,
              totalMinutesSpent: 1000,
              goalsTracked: 3
            }
          ],
          overallStats: {
            totalMinutesSpent: 14400,
            averageSuccessRate: 72.3,
            bestMonth: { month: '2025-01', successRate: 78.5 },
            worstMonth: { month: '2025-02', successRate: 65.0 }
          }
        }
      };

      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.create().get).mockResolvedValue(mockResponse);

      const result = await getMonthlyData(year);

      expect(result).toEqual(mockResponse.data.monthlyData);
      expect(mockAxios.default.create().get).toHaveBeenCalledWith('/summary', {
        params: { year }
      });
    });
  });
});
