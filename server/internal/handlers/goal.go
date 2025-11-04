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

// Handler struct contains dependencies

type GoalHandler struct {
	Fs   *firestore.Client
	Pub  *pubsub.Publisher
	Coll string
}

// POST /goals
func (h *GoalHandler) CreateGoal(c *gin.Context) {
	var input openapi.Goal
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	uid := c.GetString("uid") // set by auth middleware
	if uid == "" {
		// Default to test-user for development when auth is not implemented
		uid = "test-user"
	}
	input.Id = uuid.New().String()
	input.UserId = uid
	input.CreatedAt = time.Now()

	_, err := h.Fs.Collection(h.Coll).Doc(input.Id).Set(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// publish event
	_ = h.Pub.Publish(c.Request.Context(), map[string]interface{}{
		"type":    "goal.created",
		"payload": input,
	})
	c.JSON(http.StatusCreated, input)
}

// GET /goals
func (h *GoalHandler) ListGoals(c *gin.Context) {
	uid := c.GetString("uid")
	if uid == "" {
		// Default to test-user for development when auth is not implemented
		uid = "test-user"
	}
	iter := h.Fs.Collection(h.Coll).Where("UserId", "==", uid).Documents(c.Request.Context())
	var goals []openapi.Goal
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		var g openapi.Goal
		if err := doc.DataTo(&g); err == nil {
			goals = append(goals, g)
		}
	}
	// Return response matching OpenAPI contract: { goals: [...], total: number }
	c.JSON(http.StatusOK, gin.H{
		"goals": goals,
		"total": len(goals),
	})
}
