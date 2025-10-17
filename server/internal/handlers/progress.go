package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"cloud.google.com/go/firestore"
	openapi "github.com/scosta/goal-app/internal/models"
	"github.com/scosta/goal-app/internal/pubsub"
)

// ProgressHandler struct contains dependencies
type ProgressHandler struct {
	Fs   *firestore.Client
	Pub  *pubsub.Publisher
	Coll string
}

// POST /progress
func (h *ProgressHandler) RecordProgress(c *gin.Context) {
	var input openapi.Progress
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = c.GetString("uid") // set by auth middleware
	input.Id = uuid.New().String()
	input.CreatedAt = time.Now()

	// Calculate target met status based on goal's target minutes per day
	// This would need to fetch the goal to get targetMinutesPerDay
	// For now, we'll set it to false and calculate in the summary
	input.TargetMet = false

	_, err := h.Fs.Collection(h.Coll).Doc(input.Id).Set(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publish event
	_ = h.Pub.Publish(c.Request.Context(), map[string]interface{}{
		"type":    "progress.recorded",
		"payload": input,
	})

	c.JSON(http.StatusCreated, input)
}

// GET /progress
func (h *ProgressHandler) GetProgress(c *gin.Context) {
	_ = c.GetString("uid")
	month := c.Query("month") // Format: YYYY-MM

	if month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "month parameter is required"})
		return
	}

	// Query progress entries for the given month
	iter := h.Fs.Collection(h.Coll).
		Where("createdAt", ">=", time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)). // Start of month
		Where("createdAt", "<", time.Date(2025, 11, 1, 0, 0, 0, 0, time.UTC)).  // Start of next month
		Documents(c.Request.Context())

	var progress []openapi.Progress
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		var p openapi.Progress
		if err := doc.DataTo(&p); err == nil {
			progress = append(progress, p)
		}
	}

	c.JSON(http.StatusOK, progress)
}

// GET /progress/{goalId}
func (h *ProgressHandler) GetProgressForGoal(c *gin.Context) {
	_ = c.GetString("uid")
	goalId := c.Param("goalId")
	month := c.Query("month")

	if month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "month parameter is required"})
		return
	}

	// Query progress entries for specific goal and month
	iter := h.Fs.Collection(h.Coll).
		Where("goalId", "==", goalId).
		Where("createdAt", ">=", time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)).
		Where("createdAt", "<", time.Date(2025, 11, 1, 0, 0, 0, 0, time.UTC)).
		Documents(c.Request.Context())

	var progress []openapi.Progress
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		var p openapi.Progress
		if err := doc.DataTo(&p); err == nil {
			progress = append(progress, p)
		}
	}

	c.JSON(http.StatusOK, progress)
}

// PUT /progress/{progressId}
func (h *ProgressHandler) UpdateProgress(c *gin.Context) {
	progressId := c.Param("progressId")
	_ = c.GetString("uid")

	var updateData openapi.Progress
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the progress entry
	_, err := h.Fs.Collection(h.Coll).Doc(progressId).Set(c.Request.Context(), updateData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publish event
	_ = h.Pub.Publish(c.Request.Context(), map[string]interface{}{
		"type":    "progress.updated",
		"payload": updateData,
	})

	c.JSON(http.StatusOK, updateData)
}

// DELETE /progress/{progressId}
func (h *ProgressHandler) DeleteProgress(c *gin.Context) {
	progressId := c.Param("progressId")
	_ = c.GetString("uid")

	// Delete the progress entry
	_, err := h.Fs.Collection(h.Coll).Doc(progressId).Delete(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publish event
	_ = h.Pub.Publish(c.Request.Context(), map[string]interface{}{
		"type": "progress.deleted",
		"payload": map[string]interface{}{
			"id": progressId,
		},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Progress entry deleted"})
}
