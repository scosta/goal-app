// Main API client that combines all endpoints
import { GoalsAPI } from './goals';
import { ProgressAPI } from './progress';
import { SummaryAPI } from './summary';

// Re-export all individual functions
export * from './goals';
export * from './progress';
export * from './summary';

// Main API client class
export class GoalAppAPI {
  // Goals endpoints
  static goals = GoalsAPI;
  
  // Progress endpoints
  static progress = ProgressAPI;
  
  // Summary/Analytics endpoints
  static summary = SummaryAPI;
}

// Default export for convenience
export default GoalAppAPI;
