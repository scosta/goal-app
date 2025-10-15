import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SummaryAPI } from '../summary';
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

describe('SummaryAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getYearlySummary', () => {
    it('should validate year parameter', async () => {
      const invalidParams = {
        year: 'invalid-year'
      };

      await expect(SummaryAPI.getYearlySummary(invalidParams))
        .rejects.toThrow('Invalid year format');
    });

    it('should validate year format (YYYY)', async () => {
      const invalidParams = {
        year: '25'
      };

      await expect(SummaryAPI.getYearlySummary(invalidParams))
        .rejects.toThrow('Year must be in YYYY format');
    });

    it('should fetch yearly summary', async () => {
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

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await SummaryAPI.getYearlySummary(params);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.get).toHaveBeenCalledWith('/summary', { params });
    });

    it('should handle goal filter', async () => {
      const params = {
        year: '2025',
        goalId: 'goal_123'
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

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await SummaryAPI.getYearlySummary(params);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const params = { year: '2025' };

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      await expect(SummaryAPI.getYearlySummary(params))
        .rejects.toThrow('Failed to fetch yearly summary: API error');
    });
  });

  describe('getYearlySummaryForGoal', () => {
    it('should validate goal ID', async () => {
      await expect(SummaryAPI.getYearlySummaryForGoal('', '2025'))
        .rejects.toThrow('Goal ID is required');
    });

    it('should validate year format', async () => {
      await expect(SummaryAPI.getYearlySummaryForGoal('goal_123', '25'))
        .rejects.toThrow('Invalid year format');
    });

    it('should fetch yearly summary for specific goal', async () => {
      const goalId = 'goal_123';
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
                goalId: 'goal_123',
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

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await SummaryAPI.getYearlySummaryForGoal(goalId, year);

      expect(result).toEqual(mockResponse.data);
      expect(apiClient.get).toHaveBeenCalledWith('/summary', {
        params: { goalId, year }
      });
    });
  });

  describe('getYearlyStats', () => {
    it('should validate year format', async () => {
      await expect(SummaryAPI.getYearlyStats('25'))
        .rejects.toThrow('Invalid year format');
    });

    it('should extract yearly statistics', async () => {
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

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await SummaryAPI.getYearlyStats(year);

      expect(result).toEqual(mockResponse.data.overallStats);
      expect(apiClient.get).toHaveBeenCalledWith('/summary', {
        params: { year }
      });
    });

    it('should handle API errors', async () => {
      const year = '2025';

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      await expect(SummaryAPI.getYearlyStats(year))
        .rejects.toThrow('Failed to fetch yearly stats: API error');
    });
  });

  describe('getMonthlyData', () => {
    it('should validate year format', async () => {
      await expect(SummaryAPI.getMonthlyData('25'))
        .rejects.toThrow('Invalid year format');
    });

    it('should extract monthly data', async () => {
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

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await SummaryAPI.getMonthlyData(year);

      expect(result).toEqual(mockResponse.data.monthlyData);
      expect(apiClient.get).toHaveBeenCalledWith('/summary', {
        params: { year }
      });
    });

    it('should handle API errors', async () => {
      const year = '2025';

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      await expect(SummaryAPI.getMonthlyData(year))
        .rejects.toThrow('Failed to fetch monthly data: API error');
    });
  });
});
