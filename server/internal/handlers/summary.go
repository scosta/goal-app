package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"cloud.google.com/go/firestore"
	openapi "github.com/scosta/goal-app/internal/models"
)

// SummaryHandler struct contains dependencies
type SummaryHandler struct {
	Fs           *firestore.Client
	ProgressColl string
	GoalsColl    string
}

// GET /summary/monthly
func (h *SummaryHandler) GetMonthlySummary(c *gin.Context) {
	_ = c.GetString("uid")
	month := c.Query("month") // Format: YYYY-MM

	if month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "month parameter is required"})
		return
	}

	// Parse month to get start and end dates
	year, err := strconv.Atoi(month[:4])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month format"})
		return
	}

	monthNum, err := strconv.Atoi(month[5:])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month format"})
		return
	}

	startDate := time.Date(year, time.Month(monthNum), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0) // Next month

	// Get all progress entries for the month
	progressIter := h.Fs.Collection(h.ProgressColl).
		Where("createdAt", ">=", startDate).
		Where("createdAt", "<", endDate).
		Documents(c.Request.Context())

	var progressEntries []openapi.Progress
	for {
		doc, err := progressIter.Next()
		if err != nil {
			break
		}
		var p openapi.Progress
		if err := doc.DataTo(&p); err == nil {
			progressEntries = append(progressEntries, p)
		}
	}

	// Get all goals for the user
	goalsIter := h.Fs.Collection(h.GoalsColl).
		Where("userId", "==", "test-user").
		Documents(c.Request.Context())

	var goals []openapi.Goal
	for {
		doc, err := goalsIter.Next()
		if err != nil {
			break
		}
		var g openapi.Goal
		if err := doc.DataTo(&g); err == nil {
			goals = append(goals, g)
		}
	}

	// Group progress by goal and calculate success rates
	goalProgress := make(map[string][]openapi.Progress)
	for _, p := range progressEntries {
		goalProgress[p.GoalId] = append(goalProgress[p.GoalId], p)
	}

	// Calculate goal progress for each goal
	var goalProgressList []struct {
		GoalId        string  `json:"goalId"`
		GoalTitle     string  `json:"goalTitle"`
		SuccessRate   float64 `json:"successRate"`
		MinutesSpent  int     `json:"minutesSpent"`
		CurrentStreak int     `json:"currentStreak"`
		LongestStreak int     `json:"longestStreak"`
	}
	totalMinutesSpent := 0
	totalGoals := len(goals)

	for _, goal := range goals {
		progress := goalProgress[goal.Id]

		// Calculate success rate for this goal
		daysInMonth := int(endDate.Sub(startDate).Hours() / 24)
		daysWithProgress := len(progress)
		successRate := float64(daysWithProgress) / float64(daysInMonth) * 100

		// Calculate total minutes spent on this goal
		goalMinutesSpent := 0
		for _, p := range progress {
			goalMinutesSpent += p.MinutesSpent
		}
		totalMinutesSpent += goalMinutesSpent

		// Calculate current streak (simplified)
		currentStreak := 0
		if len(progress) > 0 {
			// Sort by date and calculate consecutive days
			// For now, just use the number of entries as a proxy
			currentStreak = len(progress)
		}

		goalProgressList = append(goalProgressList, struct {
			GoalId        string  `json:"goalId"`
			GoalTitle     string  `json:"goalTitle"`
			SuccessRate   float64 `json:"successRate"`
			MinutesSpent  int     `json:"minutesSpent"`
			CurrentStreak int     `json:"currentStreak"`
			LongestStreak int     `json:"longestStreak"`
		}{
			GoalId:        goal.Id,
			GoalTitle:     goal.Title,
			SuccessRate:   successRate,
			MinutesSpent:  goalMinutesSpent,
			CurrentStreak: currentStreak,
			LongestStreak: currentStreak, // Simplified
		})
	}

	// Calculate overall stats
	averageSuccessRate := 0.0
	if totalGoals > 0 {
		totalSuccessRate := 0.0
		for _, gp := range goalProgressList {
			totalSuccessRate += gp.SuccessRate
		}
		averageSuccessRate = totalSuccessRate / float64(totalGoals)
	}

	// Create monthly progress report (simplified)
	report := map[string]interface{}{
		"month":        month,
		"goalProgress": goalProgressList,
		"overallStats": map[string]interface{}{
			"totalMinutesSpent":  totalMinutesSpent,
			"totalGoals":         totalGoals,
			"averageSuccessRate": averageSuccessRate,
		},
	}

	c.JSON(http.StatusOK, report)
}

// GET /summary/yearly
func (h *SummaryHandler) GetYearlySummary(c *gin.Context) {
	_ = c.GetString("uid")
	year := c.Query("year") // Format: YYYY

	if year == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "year parameter is required"})
		return
	}

	yearNum, err := strconv.Atoi(year)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year format"})
		return
	}

	startDate := time.Date(yearNum, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(yearNum+1, 1, 1, 0, 0, 0, 0, time.UTC)

	// Get all progress entries for the year
	progressIter := h.Fs.Collection(h.ProgressColl).
		Where("createdAt", ">=", startDate).
		Where("createdAt", "<", endDate).
		Documents(c.Request.Context())

	var progressEntries []openapi.Progress
	for {
		doc, err := progressIter.Next()
		if err != nil {
			break
		}
		var p openapi.Progress
		if err := doc.DataTo(&p); err == nil {
			progressEntries = append(progressEntries, p)
		}
	}

	// Group progress by month
	monthlyData := make(map[string][]openapi.Progress)
	for _, p := range progressEntries {
		month := p.CreatedAt.Format("2006-01")
		monthlyData[month] = append(monthlyData[month], p)
	}

	// Calculate monthly summaries
	var monthlySummaries []struct {
		Month        string  `json:"month"`
		MinutesSpent int     `json:"minutesSpent"`
		SuccessRate  float64 `json:"successRate"`
	}
	totalMinutesSpent := 0
	var successRates []float64

	for month := 1; month <= 12; month++ {
		monthStr := time.Date(yearNum, time.Month(month), 1, 0, 0, 0, 0, time.UTC).Format("2006-01")
		monthProgress := monthlyData[monthStr]

		// Calculate success rate for this month
		daysInMonth := time.Date(yearNum, time.Month(month+1), 0, 0, 0, 0, 0, time.UTC).Day()
		daysWithProgress := len(monthProgress)
		successRate := float64(daysWithProgress) / float64(daysInMonth) * 100

		// Calculate minutes spent this month
		monthMinutesSpent := 0
		for _, p := range monthProgress {
			monthMinutesSpent += p.MinutesSpent
		}
		totalMinutesSpent += monthMinutesSpent

		monthlySummaries = append(monthlySummaries, struct {
			Month        string  `json:"month"`
			MinutesSpent int     `json:"minutesSpent"`
			SuccessRate  float64 `json:"successRate"`
		}{
			Month:        monthStr,
			MinutesSpent: monthMinutesSpent,
			SuccessRate:  successRate,
		})

		if successRate > 0 {
			successRates = append(successRates, successRate)
		}
	}

	// Calculate overall stats
	averageSuccessRate := 0.0
	if len(successRates) > 0 {
		totalSuccessRate := 0.0
		for _, rate := range successRates {
			totalSuccessRate += rate
		}
		averageSuccessRate = totalSuccessRate / float64(len(successRates))
	}

	// Find best and worst months
	bestMonth := struct {
		Month       string  `json:"month"`
		SuccessRate float64 `json:"successRate"`
	}{Month: "", SuccessRate: 0}

	worstMonth := struct {
		Month       string  `json:"month"`
		SuccessRate float64 `json:"successRate"`
	}{Month: "", SuccessRate: 100}

	for _, month := range monthlySummaries {
		if month.SuccessRate > bestMonth.SuccessRate {
			bestMonth = struct {
				Month       string  `json:"month"`
				SuccessRate float64 `json:"successRate"`
			}{
				Month:       month.Month,
				SuccessRate: month.SuccessRate,
			}
		}
		if month.SuccessRate < worstMonth.SuccessRate && month.SuccessRate > 0 {
			worstMonth = struct {
				Month       string  `json:"month"`
				SuccessRate float64 `json:"successRate"`
			}{
				Month:       month.Month,
				SuccessRate: month.SuccessRate,
			}
		}
	}

	// Create yearly summary (simplified)
	summary := map[string]interface{}{
		"year":        year,
		"monthlyData": monthlySummaries,
		"overallStats": map[string]interface{}{
			"totalMinutesSpent":  totalMinutesSpent,
			"averageSuccessRate": averageSuccessRate,
			"bestMonth":          bestMonth,
			"worstMonth":         worstMonth,
		},
	}

	c.JSON(http.StatusOK, summary)
}
