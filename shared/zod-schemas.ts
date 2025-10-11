import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const Goal = z
  .object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    targetMinutesPerDay: z.number().int().gte(1),
    startDate: z.string(),
    endDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
const Error = z
  .object({ message: z.string(), code: z.string().optional() })
  .passthrough();
const createGoal_Body = z
  .object({
    userId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    targetMinutesPerDay: z.number().int().gte(1),
    startDate: z.string(),
    endDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .passthrough();
const Progress = z
  .object({
    id: z.string(),
    goalId: z.string(),
    date: z.string(),
    minutesSpent: z.number().int().gte(0),
    note: z.string().optional(),
    targetMet: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
const MonthlyProgressReport = z
  .object({
    month: z.string(),
    goalProgress: z.array(
      z
        .object({
          goal: Goal,
          totalMinutesSpent: z.number().int(),
          totalTargetMinutes: z.number().int(),
          daysTracked: z.number().int(),
          daysTargetMet: z.number().int(),
          successRate: z.number().gte(0).lte(100),
          dailyProgress: z.array(Progress).optional(),
          currentStreak: z
            .object({
              type: z.enum(["daily_target_met", "daily_progress_recorded"]),
              days: z.number().int(),
              startDate: z.string(),
              endDate: z.string(),
            })
            .partial()
            .passthrough()
            .optional(),
          longestStreak: z
            .object({
              type: z.enum(["daily_target_met", "daily_progress_recorded"]),
              days: z.number().int(),
              startDate: z.string(),
              endDate: z.string(),
            })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough()
    ),
    overallStats: z
      .object({
        totalMinutesSpent: z.number().int(),
        totalGoals: z.number().int(),
      })
      .passthrough(),
  })
  .passthrough();
const recordProgress_Body = z
  .object({
    goalId: z.string(),
    date: z.string(),
    minutesSpent: z.number().int().gte(0),
    note: z.string().optional(),
  })
  .passthrough();
const YearlySummary = z
  .object({
    year: z.string(),
    monthlyData: z.array(
      z
        .object({
          month: z.string(),
          successRate: z.number().gte(0).lte(100),
          totalMinutesSpent: z.number().int(),
          goalsTracked: z.number().int(),
          bestPerformingGoal: z
            .object({
              goalId: z.string(),
              goalTitle: z.string(),
              successRate: z.number(),
            })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough()
    ),
    overallStats: z
      .object({
        totalMinutesSpent: z.number().int(),
        averageSuccessRate: z.number().gte(0).lte(100),
        bestMonth: z
          .object({ month: z.string(), successRate: z.number() })
          .partial()
          .passthrough(),
        worstMonth: z
          .object({ month: z.string(), successRate: z.number() })
          .partial()
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

export const schemas = {
  Goal,
  Error,
  createGoal_Body,
  Progress,
  MonthlyProgressReport,
  recordProgress_Body,
  YearlySummary,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/goals",
    alias: "listGoals",
    description: `Retrieves all goals belonging to the authenticated user`,
    requestFormat: "json",
    parameters: [
      {
        name: "tags",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "active",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: z
      .object({ goals: z.array(Goal), total: z.number().int() })
      .partial()
      .passthrough(),
    errors: [
      {
        status: 401,
        description: `Unauthorized - authentication required`,
        schema: Error,
      },
      {
        status: 429,
        description: `Too many requests - rate limit exceeded`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: Error,
      },
    ],
  },
  {
    method: "post",
    path: "/goals",
    alias: "createGoal",
    description: `Creates a new goal with daily recurrence tracking`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: createGoal_Body,
      },
    ],
    response: Goal,
    errors: [
      {
        status: 400,
        description: `Bad request - invalid input data`,
        schema: Error,
      },
      {
        status: 401,
        description: `Unauthorized - authentication required`,
        schema: Error,
      },
      {
        status: 429,
        description: `Too many requests - rate limit exceeded`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: Error,
      },
    ],
  },
  {
    method: "get",
    path: "/progress",
    alias: "getProgress",
    description: `Retrieves progress data for a month, including totals per goal and success rate`,
    requestFormat: "json",
    parameters: [
      {
        name: "month",
        type: "Query",
        schema: z.string().regex(/^\d{4}-\d{2}$/),
      },
      {
        name: "goalId",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: MonthlyProgressReport,
    errors: [
      {
        status: 400,
        description: `Bad request - invalid input data`,
        schema: Error,
      },
      {
        status: 401,
        description: `Unauthorized - authentication required`,
        schema: Error,
      },
      {
        status: 429,
        description: `Too many requests - rate limit exceeded`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: Error,
      },
    ],
  },
  {
    method: "post",
    path: "/progress",
    alias: "recordProgress",
    description: `Records the time spent on a goal for a specific date. The server computes whether the daily target was met.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: recordProgress_Body,
      },
    ],
    response: Progress,
    errors: [
      {
        status: 400,
        description: `Bad request - invalid input data`,
        schema: Error,
      },
      {
        status: 401,
        description: `Unauthorized - authentication required`,
        schema: Error,
      },
      {
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
      {
        status: 429,
        description: `Too many requests - rate limit exceeded`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: Error,
      },
    ],
  },
  {
    method: "get",
    path: "/summary",
    alias: "getYearlySummary",
    description: `Retrieves a yearly summary including aggregated monthly success rates and streaks`,
    requestFormat: "json",
    parameters: [
      {
        name: "year",
        type: "Query",
        schema: z.string().regex(/^\d{4}$/),
      },
      {
        name: "goalId",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: YearlySummary,
    errors: [
      {
        status: 400,
        description: `Bad request - invalid input data`,
        schema: Error,
      },
      {
        status: 401,
        description: `Unauthorized - authentication required`,
        schema: Error,
      },
      {
        status: 429,
        description: `Too many requests - rate limit exceeded`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal server error`,
        schema: Error,
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
