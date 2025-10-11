import { describe, it, expect, vi } from 'vitest';
import { createGoal, listGoals } from '../goals';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
    })),
  },
}));

describe('GoalsAPI', () => {
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

    // Mock the axios response
    const mockAxios = await import('axios');
    vi.mocked(mockAxios.default.create().post).mockResolvedValue(mockResponse);

    const result = await createGoal(goalData);

    expect(result).toEqual(mockResponse.data);
    expect(mockAxios.default.create().post).toHaveBeenCalledWith('/goals', goalData);
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

    const mockAxios = await import('axios');
    vi.mocked(mockAxios.default.create().get).mockResolvedValue(mockResponse);

    const result = await listGoals({ active: true });

    expect(result).toEqual(mockResponse.data);
    expect(mockAxios.default.create().get).toHaveBeenCalledWith('/goals', { params: { active: true } });
  });
});
