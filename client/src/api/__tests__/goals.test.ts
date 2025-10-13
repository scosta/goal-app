import { describe, it, expect, vi } from 'vitest';

// Mock the API client
vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { GoalsAPI } from '../goals';
import { apiClient } from '../client';

describe('GoalsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a goal with valid data', async () => {
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
        createdAt: '2025-10-05T10:30:00Z'
      }
    };

    vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

    const result = await GoalsAPI.createGoal(goalData);

    expect(result).toEqual(mockResponse.data);
    expect(apiClient.post).toHaveBeenCalledWith('/goals', goalData);
  });

  it('should list goals with query parameters', async () => {
    const mockResponse = {
      data: {
        goals: [
          { id: 'goal1', title: 'Learn Spanish' },
          { id: 'goal2', title: 'Exercise' }
        ],
        total: 2
      }
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await GoalsAPI.listGoals({ active: true });

    expect(result).toEqual(mockResponse.data);
    expect(apiClient.get).toHaveBeenCalledWith('/goals', { params: { active: true } });
  });
});
