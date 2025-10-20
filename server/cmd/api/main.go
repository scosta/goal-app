package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/pubsub"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/scosta/goal-app/internal/handlers"
	apppubsub "github.com/scosta/goal-app/internal/pubsub"
)

func main() {
	fmt.Println("Starting Goal App API server...")

	// Load environment variables from .env file in project root
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found in project root, using system environment variables")
	}

	// Initialize database connection
	ctx := context.Background()
	projectID := os.Getenv("FIRESTORE_PROJECT_ID")
	if projectID == "" {
		projectID = "test-project" // Default for development
	}

	// Check if we're using Firestore emulator
	emulatorHost := os.Getenv("FIRESTORE_EMULATOR_HOST")
	if emulatorHost != "" {
		log.Printf("Using Firestore emulator at %s", emulatorHost)
	}

	fsClient, err := firestore.NewClient(ctx, projectID)
	if err != nil {
		log.Fatal("Failed to create Firestore client:", err)
	}
	defer fsClient.Close()

	// Initialize PubSub client (optional for development)
	var publisher *apppubsub.Publisher
	if emulatorHost != "" {
		// Use mock publisher for emulator/development
		publisher = &apppubsub.Publisher{}
		log.Println("Using mock publisher for development")
	} else {
		// Only create PubSub client if not using emulator
		pubsubClient, err := pubsub.NewClient(ctx, projectID)
		if err != nil {
			log.Printf("Warning: Failed to create PubSub client: %v", err)
			log.Println("Using mock publisher instead")
			publisher = &apppubsub.Publisher{}
		} else {
			defer pubsubClient.Close()
			// Initialize publisher
			publisher = apppubsub.NewPublisher(ctx, pubsubClient, "goal-events")
		}
	}

	// Setup Gin router
	router := gin.Default()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Add CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "goal-app-api",
		})
	})

	// Initialize handlers
	goalHandler := &handlers.GoalHandler{
		Fs:   fsClient,
		Pub:  publisher,
		Coll: "goals",
	}

	progressHandler := &handlers.ProgressHandler{
		Fs:   fsClient,
		Pub:  publisher,
		Coll: "progress",
	}

	summaryHandler := &handlers.SummaryHandler{
		Fs:           fsClient,
		ProgressColl: "progress",
		GoalsColl:    "goals",
	}

	// Set up routes with handlers
	api := router.Group("/api")
	{
		// Goals routes
		goals := api.Group("/goals")
		{
			goals.POST("", goalHandler.CreateGoal)
			goals.GET("", goalHandler.ListGoals)
		}

		// Progress routes
		progress := api.Group("/progress")
		{
			progress.POST("", progressHandler.RecordProgress)
			progress.GET("", progressHandler.GetProgress)
			progress.GET("/:goalId", progressHandler.GetProgressForGoal)
			progress.PUT("/:progressId", progressHandler.UpdateProgress)
			progress.DELETE("/:progressId", progressHandler.DeleteProgress)
		}

		// Summary routes
		summary := api.Group("/summary")
		{
			summary.GET("/monthly", summaryHandler.GetMonthlySummary)
			summary.GET("/yearly", summaryHandler.GetYearlySummary)
		}
	}

	log.Println("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
