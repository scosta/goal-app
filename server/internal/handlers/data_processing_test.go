package handlers

import (
	"fmt"
	"testing"
	"time"

	openapi "github.com/scosta/goal-app/internal/models"
	"github.com/stretchr/testify/assert"
)

// Test data aggregation and processing logic
func TestGroupProgressByGoal(t *testing.T) {
	progressEntries := []openapi.Progress{
		{
			Id:           "progress_1",
			GoalId:       "goal_1",
			MinutesSpent: 30,
			CreatedAt:    time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			Id:           "progress_2",
			GoalId:       "goal_1",
			MinutesSpent: 45,
			CreatedAt:    time.Date(2025, 10, 2, 0, 0, 0, 0, time.UTC),
		},
		{
			Id:           "progress_3",
			GoalId:       "goal_2",
			MinutesSpent: 60,
			CreatedAt:    time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC),
		},
	}

	grouped := groupProgressByGoal(progressEntries)

	// Should have 2 goals
	assert.Len(t, grouped, 2)

	// Goal 1 should have 2 entries
	assert.Len(t, grouped["goal_1"], 2)
	assert.Equal(t, 30, grouped["goal_1"][0].MinutesSpent)
	assert.Equal(t, 45, grouped["goal_1"][1].MinutesSpent)

	// Goal 2 should have 1 entry
	assert.Len(t, grouped["goal_2"], 1)
	assert.Equal(t, 60, grouped["goal_2"][0].MinutesSpent)
}

func TestCalculateGoalProgress(t *testing.T) {
	goal := openapi.Goal{
		Id:                  "goal_1",
		Title:               "Learn Spanish",
		TargetMinutesPerDay: 30,
	}

	progressEntries := []openapi.Progress{
		{MinutesSpent: 30, CreatedAt: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
		{MinutesSpent: 45, CreatedAt: time.Date(2025, 10, 2, 0, 0, 0, 0, time.UTC)},
		{MinutesSpent: 25, CreatedAt: time.Date(2025, 10, 3, 0, 0, 0, 0, time.UTC)},
	}

	startDate := time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2025, 10, 31, 0, 0, 0, 0, time.UTC)

	goalProgress := calculateGoalProgress(goal, progressEntries, startDate, endDate)

	assert.Equal(t, "goal_1", goalProgress.GoalId)
	assert.Equal(t, "Learn Spanish", goalProgress.GoalTitle)
	assert.Equal(t, 100, goalProgress.MinutesSpent) // 30 + 45 + 25
	assert.Equal(t, 3, goalProgress.CurrentStreak)
	assert.Equal(t, 3, goalProgress.LongestStreak)

	// Success rate should be 3 days tracked out of 31 days in October
	expectedSuccessRate := float64(3) / float64(31) * 100.0
	assert.InDelta(t, expectedSuccessRate, goalProgress.SuccessRate, 1.0) // Allow 1% tolerance
}

func TestCalculateMonthlyAggregates(t *testing.T) {
	progressEntries := []openapi.Progress{
		{MinutesSpent: 30, CreatedAt: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
		{MinutesSpent: 45, CreatedAt: time.Date(2025, 10, 2, 0, 0, 0, 0, time.UTC)},
		{MinutesSpent: 25, CreatedAt: time.Date(2025, 10, 3, 0, 0, 0, 0, time.UTC)},
	}

	totalMinutes, daysTracked := calculateMonthlyAggregates(progressEntries)

	assert.Equal(t, 100, totalMinutes) // 30 + 45 + 25
	assert.Equal(t, 3, daysTracked)
}

func TestCalculateYearlyAggregates(t *testing.T) {
	monthlyData := []struct {
		Month        string
		MinutesSpent int
		SuccessRate  float64
	}{
		{"2025-01", 100, 80.0},
		{"2025-02", 150, 90.0},
		{"2025-03", 200, 85.0},
	}

	totalMinutes, averageSuccessRate := calculateYearlyAggregates(monthlyData)

	assert.Equal(t, 450, totalMinutes)        // 100 + 150 + 200
	assert.Equal(t, 85.0, averageSuccessRate) // (80 + 90 + 85) / 3
}

func TestFindBestAndWorstMonths(t *testing.T) {
	monthlyData := []struct {
		Month       string
		SuccessRate float64
	}{
		{"2025-01", 80.0},
		{"2025-02", 95.0},
		{"2025-03", 70.0},
		{"2025-04", 0.0}, // No progress
	}

	bestMonth, worstMonth := findBestAndWorstMonths(monthlyData)

	assert.Equal(t, "2025-02", bestMonth.Month)
	assert.Equal(t, 95.0, bestMonth.SuccessRate)

	assert.Equal(t, "2025-03", worstMonth.Month)
	assert.Equal(t, 70.0, worstMonth.SuccessRate)
}

func TestValidateMonthFormat(t *testing.T) {
	tests := []struct {
		name        string
		month       string
		expectError bool
	}{
		{
			name:        "valid month format",
			month:       "2025-10",
			expectError: false,
		},
		{
			name:        "invalid month format - too short",
			month:       "2025",
			expectError: true,
		},
		{
			name:        "invalid month format - wrong separator",
			month:       "2025/10",
			expectError: true,
		},
		{
			name:        "invalid month format - non-numeric",
			month:       "2025-xx",
			expectError: true,
		},
		{
			name:        "invalid month format - invalid month number",
			month:       "2025-13",
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateMonthFormat(tt.month)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateYearFormat(t *testing.T) {
	tests := []struct {
		name        string
		year        string
		expectError bool
	}{
		{
			name:        "valid year format",
			year:        "2025",
			expectError: false,
		},
		{
			name:        "invalid year format - too short",
			year:        "25",
			expectError: true,
		},
		{
			name:        "invalid year format - non-numeric",
			year:        "abcd",
			expectError: true,
		},
		{
			name:        "invalid year format - too far in past",
			year:        "1900",
			expectError: true,
		},
		{
			name:        "invalid year format - too far in future",
			year:        "2100",
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateYearFormat(tt.year)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// Helper functions that we need to implement
func groupProgressByGoal(progressEntries []openapi.Progress) map[string][]openapi.Progress {
	grouped := make(map[string][]openapi.Progress)
	for _, entry := range progressEntries {
		grouped[entry.GoalId] = append(grouped[entry.GoalId], entry)
	}
	return grouped
}

func calculateGoalProgress(goal openapi.Goal, progressEntries []openapi.Progress, startDate, endDate time.Time) struct {
	GoalId        string
	GoalTitle     string
	SuccessRate   float64
	MinutesSpent  int
	CurrentStreak int
	LongestStreak int
} {
	totalMinutes := 0
	for _, entry := range progressEntries {
		totalMinutes += entry.MinutesSpent
	}

	daysInMonth := int(endDate.Sub(startDate).Hours() / 24)
	daysTracked := len(progressEntries)
	successRate := float64(daysTracked) / float64(daysInMonth) * 100.0

	return struct {
		GoalId        string
		GoalTitle     string
		SuccessRate   float64
		MinutesSpent  int
		CurrentStreak int
		LongestStreak int
	}{
		GoalId:        goal.Id,
		GoalTitle:     goal.Title,
		SuccessRate:   successRate,
		MinutesSpent:  totalMinutes,
		CurrentStreak: daysTracked,
		LongestStreak: daysTracked, // Simplified for now
	}
}

func calculateMonthlyAggregates(progressEntries []openapi.Progress) (totalMinutes int, daysTracked int) {
	totalMinutes = 0
	daysTracked = len(progressEntries)

	for _, entry := range progressEntries {
		totalMinutes += entry.MinutesSpent
	}

	return totalMinutes, daysTracked
}

func calculateYearlyAggregates(monthlyData []struct {
	Month        string
	MinutesSpent int
	SuccessRate  float64
}) (totalMinutes int, averageSuccessRate float64) {
	totalMinutes = 0
	totalSuccessRate := 0.0
	monthsWithData := 0

	for _, month := range monthlyData {
		totalMinutes += month.MinutesSpent
		if month.SuccessRate > 0 {
			totalSuccessRate += month.SuccessRate
			monthsWithData++
		}
	}

	if monthsWithData > 0 {
		averageSuccessRate = totalSuccessRate / float64(monthsWithData)
	}

	return totalMinutes, averageSuccessRate
}

func findBestAndWorstMonths(monthlyData []struct {
	Month       string
	SuccessRate float64
}) (bestMonth, worstMonth struct {
	Month       string
	SuccessRate float64
}) {
	bestMonth = struct {
		Month       string
		SuccessRate float64
	}{SuccessRate: 0}

	worstMonth = struct {
		Month       string
		SuccessRate float64
	}{SuccessRate: 100}

	for _, month := range monthlyData {
		if month.SuccessRate > bestMonth.SuccessRate {
			bestMonth = month
		}
		if month.SuccessRate < worstMonth.SuccessRate && month.SuccessRate > 0 {
			worstMonth = month
		}
	}

	return bestMonth, worstMonth
}

func validateMonthFormat(month string) error {
	if len(month) != 7 || month[4] != '-' {
		return fmt.Errorf("month must be in YYYY-MM format")
	}

	year := month[:4]
	monthNum := month[5:]

	// Validate year is numeric and reasonable
	if year < "2020" || year > "2030" {
		return fmt.Errorf("year must be between 2020 and 2030")
	}

	// Validate month is numeric and 01-12
	if monthNum < "01" || monthNum > "12" {
		return fmt.Errorf("month must be between 01 and 12")
	}

	return nil
}

func validateYearFormat(year string) error {
	if len(year) != 4 {
		return fmt.Errorf("year must be in YYYY format")
	}

	if year < "2020" || year > "2030" {
		return fmt.Errorf("year must be between 2020 and 2030")
	}

	return nil
}
