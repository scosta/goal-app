package handlers

import (
	"fmt"
	"testing"
	"time"

	openapi_types "github.com/oapi-codegen/runtime/types"
	openapi "github.com/scosta/goal-app/internal/models"
	"github.com/stretchr/testify/assert"
)

// Test business logic calculations
func TestCalculateSuccessRate(t *testing.T) {
	tests := []struct {
		name         string
		daysTracked  int
		daysInMonth  int
		expectedRate float64
	}{
		{
			name:         "perfect attendance",
			daysTracked:  30,
			daysInMonth:  30,
			expectedRate: 100.0,
		},
		{
			name:         "half attendance",
			daysTracked:  15,
			daysInMonth:  30,
			expectedRate: 50.0,
		},
		{
			name:         "no tracking",
			daysTracked:  0,
			daysInMonth:  30,
			expectedRate: 0.0,
		},
		{
			name:         "over tracking (should cap at 100%)",
			daysTracked:  35,
			daysInMonth:  30,
			expectedRate: 100.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rate := calculateSuccessRate(tt.daysTracked, tt.daysInMonth)
			assert.Equal(t, tt.expectedRate, rate)
		})
	}
}

func TestCalculateMonthlyStats(t *testing.T) {
	tests := []struct {
		name                string
		progressEntries     []openapi.Progress
		expectedMinutes     int
		expectedDaysTracked int
	}{
		{
			name: "single progress entry",
			progressEntries: []openapi.Progress{
				{MinutesSpent: 30, CreatedAt: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
			},
			expectedMinutes:     30,
			expectedDaysTracked: 1,
		},
		{
			name: "multiple progress entries",
			progressEntries: []openapi.Progress{
				{MinutesSpent: 30, CreatedAt: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
				{MinutesSpent: 45, CreatedAt: time.Date(2025, 10, 2, 0, 0, 0, 0, time.UTC)},
				{MinutesSpent: 25, CreatedAt: time.Date(2025, 10, 3, 0, 0, 0, 0, time.UTC)},
			},
			expectedMinutes:     100, // 30 + 45 + 25
			expectedDaysTracked: 3,
		},
		{
			name:                "no progress entries",
			progressEntries:     []openapi.Progress{},
			expectedMinutes:     0,
			expectedDaysTracked: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			minutes, daysTracked := calculateMonthlyStats(tt.progressEntries)
			assert.Equal(t, tt.expectedMinutes, minutes)
			assert.Equal(t, tt.expectedDaysTracked, daysTracked)
		})
	}
}

func TestValidateGoalData(t *testing.T) {
	tests := []struct {
		name        string
		goalData    openapi.Goal
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid goal data",
			goalData: openapi.Goal{
				Title:               "Learn Spanish",
				TargetMinutesPerDay: 30,
				StartDate:           openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
			},
			expectError: false,
		},
		{
			name: "missing title",
			goalData: openapi.Goal{
				Title:               "",
				TargetMinutesPerDay: 30,
				StartDate:           openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
			},
			expectError: true,
			errorMsg:    "title is required",
		},
		{
			name: "negative target minutes",
			goalData: openapi.Goal{
				Title:               "Learn Spanish",
				TargetMinutesPerDay: -10,
				StartDate:           openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
			},
			expectError: true,
			errorMsg:    "target minutes must be positive",
		},
		{
			name: "zero target minutes",
			goalData: openapi.Goal{
				Title:               "Learn Spanish",
				TargetMinutesPerDay: 0,
				StartDate:           openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
			},
			expectError: true,
			errorMsg:    "target minutes must be positive",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateGoalData(tt.goalData)
			if tt.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errorMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateProgressData(t *testing.T) {
	tests := []struct {
		name         string
		progressData openapi.Progress
		expectError  bool
		errorMsg     string
	}{
		{
			name: "valid progress data",
			progressData: openapi.Progress{
				GoalId:       "goal_123",
				MinutesSpent: 30,
				Date:         openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
			},
			expectError: false,
		},
		{
			name: "missing goal ID",
			progressData: openapi.Progress{
				GoalId:       "",
				MinutesSpent: 30,
				Date:         openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
			},
			expectError: true,
			errorMsg:    "goal ID is required",
		},
		{
			name: "negative minutes spent",
			progressData: openapi.Progress{
				GoalId:       "goal_123",
				MinutesSpent: -10,
				Date:         openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
			},
			expectError: true,
			errorMsg:    "minutes spent must be non-negative",
		},
		{
			name: "zero minutes spent (should be valid)",
			progressData: openapi.Progress{
				GoalId:       "goal_123",
				MinutesSpent: 0,
				Date:         openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateProgressData(tt.progressData)
			if tt.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errorMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestCalculateTargetMetStatus(t *testing.T) {
	tests := []struct {
		name              string
		minutesSpent      int
		targetMinutes     int
		expectedTargetMet bool
	}{
		{
			name:              "target met",
			minutesSpent:      30,
			targetMinutes:     30,
			expectedTargetMet: true,
		},
		{
			name:              "target exceeded",
			minutesSpent:      45,
			targetMinutes:     30,
			expectedTargetMet: true,
		},
		{
			name:              "target not met",
			minutesSpent:      20,
			targetMinutes:     30,
			expectedTargetMet: false,
		},
		{
			name:              "zero minutes spent",
			minutesSpent:      0,
			targetMinutes:     30,
			expectedTargetMet: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			targetMet := calculateTargetMetStatus(tt.minutesSpent, tt.targetMinutes)
			assert.Equal(t, tt.expectedTargetMet, targetMet)
		})
	}
}

// Helper functions that we need to implement
func calculateSuccessRate(daysTracked, daysInMonth int) float64 {
	if daysInMonth == 0 {
		return 0.0
	}
	rate := float64(daysTracked) / float64(daysInMonth) * 100.0
	if rate > 100.0 {
		return 100.0
	}
	return rate
}

func calculateMonthlyStats(progressEntries []openapi.Progress) (totalMinutes int, daysTracked int) {
	totalMinutes = 0
	daysTracked = len(progressEntries)

	for _, entry := range progressEntries {
		totalMinutes += entry.MinutesSpent
	}

	return totalMinutes, daysTracked
}

func validateGoalData(goal openapi.Goal) error {
	if goal.Title == "" {
		return fmt.Errorf("title is required")
	}
	if goal.TargetMinutesPerDay <= 0 {
		return fmt.Errorf("target minutes must be positive")
	}
	return nil
}

func validateProgressData(progress openapi.Progress) error {
	if progress.GoalId == "" {
		return fmt.Errorf("goal ID is required")
	}
	if progress.MinutesSpent < 0 {
		return fmt.Errorf("minutes spent must be non-negative")
	}
	return nil
}

func calculateTargetMetStatus(minutesSpent, targetMinutes int) bool {
	return minutesSpent >= targetMinutes
}
