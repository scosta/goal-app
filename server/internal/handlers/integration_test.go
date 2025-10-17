package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"cloud.google.com/go/firestore"
	openapi_types "github.com/oapi-codegen/runtime/types"
	openapi "github.com/scosta/goal-app/internal/models"
	"github.com/scosta/goal-app/internal/pubsub"
)

func setupFirestoreEmulator() (*firestore.Client, error) {
	// Set Firestore emulator host
	os.Setenv("FIRESTORE_EMULATOR_HOST", "localhost:8080")

	ctx := context.Background()
	client, err := firestore.NewClient(ctx, "test-project")
	if err != nil {
		return nil, fmt.Errorf("failed to create Firestore client: %v", err)
	}

	return client, nil
}

func setupTestRouter() (*gin.Engine, *firestore.Client, *pubsub.Publisher) {
	gin.SetMode(gin.TestMode)

	// Setup Firestore emulator
	fsClient, err := setupFirestoreEmulator()
	if err != nil {
		panic(fmt.Sprintf("Failed to setup Firestore emulator: %v", err))
	}

	// Setup mock publisher
	publisher := &pubsub.Publisher{}

	// Create handlers
	goalHandler := &GoalHandler{
		Fs:   fsClient,
		Pub:  publisher,
		Coll: "goals",
	}

	progressHandler := &ProgressHandler{
		Fs:   fsClient,
		Pub:  publisher,
		Coll: "progress",
	}

	summaryHandler := &SummaryHandler{
		Fs:           fsClient,
		ProgressColl: "progress",
		GoalsColl:    "goals",
	}

	// Setup router
	router := gin.New()

	// Add auth middleware (mock)
	router.Use(func(c *gin.Context) {
		c.Set("uid", "test-user-123")
		c.Next()
	})

	// Goals routes
	goals := router.Group("/goals")
	{
		goals.POST("", goalHandler.CreateGoal)
		goals.GET("", goalHandler.ListGoals)
	}

	// Progress routes
	progress := router.Group("/progress")
	{
		progress.POST("", progressHandler.RecordProgress)
		progress.GET("", progressHandler.GetProgress)
		progress.GET("/:goalId", progressHandler.GetProgressForGoal)
		progress.PUT("/:progressId", progressHandler.UpdateProgress)
		progress.DELETE("/:progressId", progressHandler.DeleteProgress)
	}

	// Summary routes
	summary := router.Group("/summary")
	{
		summary.GET("/monthly", summaryHandler.GetMonthlySummary)
		summary.GET("/yearly", summaryHandler.GetYearlySummary)
	}

	return router, fsClient, publisher
}

func TestGoalWorkflow(t *testing.T) {
	router, fsClient, _ := setupTestRouter()
	defer fsClient.Close()

	// Create a goal
	goalData := openapi.Goal{
		Title:               "Learn Spanish",
		TargetMinutesPerDay: 30,
		StartDate:           openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
		Description:         stringPtr("Daily Spanish practice"),
	}

	goalJSON, _ := json.Marshal(goalData)
	req := httptest.NewRequest("POST", "/goals", bytes.NewBuffer(goalJSON))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var createdGoal openapi.Goal
	err := json.Unmarshal(w.Body.Bytes(), &createdGoal)
	require.NoError(t, err)
	assert.Equal(t, "Learn Spanish", createdGoal.Title)
	assert.NotEmpty(t, createdGoal.Id)

	// List goals
	req = httptest.NewRequest("GET", "/goals", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var goals []openapi.Goal
	err = json.Unmarshal(w.Body.Bytes(), &goals)
	require.NoError(t, err)
	assert.Len(t, goals, 1)
	assert.Equal(t, "Learn Spanish", goals[0].Title)
}

func TestProgressWorkflow(t *testing.T) {
	router, fsClient, _ := setupTestRouter()
	defer fsClient.Close()

	// First create a goal
	goalData := openapi.Goal{
		Title:               "Learn Spanish",
		TargetMinutesPerDay: 30,
		StartDate:           openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
	}

	goalJSON, _ := json.Marshal(goalData)
	req := httptest.NewRequest("POST", "/goals", bytes.NewBuffer(goalJSON))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var createdGoal openapi.Goal
	json.Unmarshal(w.Body.Bytes(), &createdGoal)

	// Record progress
	progressData := openapi.Progress{
		GoalId:       createdGoal.Id,
		MinutesSpent: 45,
		Date:         openapi_types.Date{Time: time.Date(2025, 10, 5, 0, 0, 0, 0, time.UTC)},
	}

	progressJSON, _ := json.Marshal(progressData)
	req = httptest.NewRequest("POST", "/progress", bytes.NewBuffer(progressJSON))
	req.Header.Set("Content-Type", "application/json")

	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var createdProgress openapi.Progress
	err := json.Unmarshal(w.Body.Bytes(), &createdProgress)
	require.NoError(t, err)
	assert.Equal(t, createdGoal.Id, createdProgress.GoalId)
	assert.Equal(t, 45, createdProgress.MinutesSpent)

	// Get progress for the month
	req = httptest.NewRequest("GET", "/progress?month=2025-10", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var progressList []openapi.Progress
	err = json.Unmarshal(w.Body.Bytes(), &progressList)
	require.NoError(t, err)
	assert.Len(t, progressList, 1)
	assert.Equal(t, 45, progressList[0].MinutesSpent)
}

func TestMonthlySummaryCalculation(t *testing.T) {
	router, fsClient, _ := setupTestRouter()
	defer fsClient.Close()

	// Create a goal
	goalData := openapi.Goal{
		Title:               "Learn Spanish",
		TargetMinutesPerDay: 30,
		StartDate:           openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
	}

	goalJSON, _ := json.Marshal(goalData)
	req := httptest.NewRequest("POST", "/goals", bytes.NewBuffer(goalJSON))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var createdGoal openapi.Goal
	json.Unmarshal(w.Body.Bytes(), &createdGoal)

	// Record multiple progress entries
	progressEntries := []openapi.Progress{
		{
			GoalId:       createdGoal.Id,
			MinutesSpent: 30,
			Date:         openapi_types.Date{Time: time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)},
		},
		{
			GoalId:       createdGoal.Id,
			MinutesSpent: 45,
			Date:         openapi_types.Date{Time: time.Date(2025, 10, 2, 0, 0, 0, 0, time.UTC)},
		},
		{
			GoalId:       createdGoal.Id,
			MinutesSpent: 25,
			Date:         openapi_types.Date{Time: time.Date(2025, 10, 3, 0, 0, 0, 0, time.UTC)},
		},
	}

	for _, progress := range progressEntries {
		progressJSON, _ := json.Marshal(progress)
		req = httptest.NewRequest("POST", "/progress", bytes.NewBuffer(progressJSON))
		req.Header.Set("Content-Type", "application/json")

		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusCreated, w.Code)
	}

	// Get monthly summary
	req = httptest.NewRequest("GET", "/summary/monthly?month=2025-10", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var summary map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &summary)
	require.NoError(t, err)

	assert.Equal(t, "2025-10", summary["month"])
	goalProgress := summary["goalProgress"].([]interface{})
	assert.Len(t, goalProgress, 1)

	overallStats := summary["overallStats"].(map[string]interface{})
	assert.Equal(t, float64(1), overallStats["totalGoals"])
	assert.Equal(t, float64(100), overallStats["totalMinutesSpent"])
}

func TestYearlySummaryCalculation(t *testing.T) {
	router, fsClient, _ := setupTestRouter()
	defer fsClient.Close()

	// Create a goal
	goalData := openapi.Goal{
		Title:               "Learn Spanish",
		TargetMinutesPerDay: 30,
		StartDate:           openapi_types.Date{Time: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)},
	}

	goalJSON, _ := json.Marshal(goalData)
	req := httptest.NewRequest("POST", "/goals", bytes.NewBuffer(goalJSON))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var createdGoal openapi.Goal
	json.Unmarshal(w.Body.Bytes(), &createdGoal)

	// Record progress for different months
	progressEntries := []openapi.Progress{
		{
			GoalId:       createdGoal.Id,
			MinutesSpent: 30,
			Date:         openapi_types.Date{Time: time.Date(2025, 1, 15, 0, 0, 0, 0, time.UTC)},
		},
		{
			GoalId:       createdGoal.Id,
			MinutesSpent: 45,
			Date:         openapi_types.Date{Time: time.Date(2025, 2, 10, 0, 0, 0, 0, time.UTC)},
		},
		{
			GoalId:       createdGoal.Id,
			MinutesSpent: 25,
			Date:         openapi_types.Date{Time: time.Date(2025, 3, 5, 0, 0, 0, 0, time.UTC)},
		},
	}

	for _, progress := range progressEntries {
		progressJSON, _ := json.Marshal(progress)
		req = httptest.NewRequest("POST", "/progress", bytes.NewBuffer(progressJSON))
		req.Header.Set("Content-Type", "application/json")

		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusCreated, w.Code)
	}

	// Get yearly summary
	req = httptest.NewRequest("GET", "/summary/yearly?year=2025", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var summary map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &summary)
	require.NoError(t, err)

	assert.Equal(t, "2025", summary["year"])
	monthlyData := summary["monthlyData"].([]interface{})
	assert.Len(t, monthlyData, 12) // All 12 months

	overallStats := summary["overallStats"].(map[string]interface{})
	assert.Equal(t, float64(100), overallStats["totalMinutesSpent"]) // 30 + 45 + 25
}

// Helper function
func stringPtr(s string) *string {
	return &s
}
