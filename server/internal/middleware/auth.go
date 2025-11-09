package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware verifies Firebase ID tokens and extracts user ID
type AuthMiddleware struct {
	authClient *auth.Client
}

// NewAuthMiddleware creates a new auth middleware instance
func NewAuthMiddleware(authClient *auth.Client) *AuthMiddleware {
	return &AuthMiddleware{
		authClient: authClient,
	}
}

// RequireAuth is a Gin middleware that verifies Firebase ID tokens
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract the token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]

		// Verify the token
		ctx := c.Request.Context()
		decodedToken, err := m.authClient.VerifyIDToken(ctx, token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Extract user ID from the token
		uid := decodedToken.UID

		// Store user ID in context for handlers to use
		c.Set("uid", uid)

		// Continue to the next handler
		c.Next()
	}
}

// OptionalAuth is a middleware that verifies tokens if present, but doesn't require them
// Useful for endpoints that work with or without authentication
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// No auth header, continue without setting uid
			c.Next()
			return
		}

		// Extract the token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			// Invalid format, continue without auth
			c.Next()
			return
		}

		token := parts[1]

		// Try to verify the token
		ctx := c.Request.Context()
		decodedToken, err := m.authClient.VerifyIDToken(ctx, token)
		if err != nil {
			// Invalid token, continue without auth
			c.Next()
			return
		}

		// Extract user ID from token
		uid := decodedToken.UID
		c.Set("uid", uid)

		// Continue to the next handler
		c.Next()
	}
}

// InitializeFirebaseAuth initializes Firebase Auth client
// Supports both production and emulator modes
func InitializeFirebaseAuth(ctx context.Context, projectID string) (*auth.Client, error) {
	// Check if we're using the Auth emulator
	authEmulatorHost := os.Getenv("FIREBASE_AUTH_EMULATOR_HOST")
	
	// For development, we can use a simpler approach with emulator
	// In production, Firebase Admin SDK will automatically use service account credentials
	// or Application Default Credentials (ADC)
	
	// Note: Firebase Admin SDK doesn't directly support emulator connection
	// For emulator, we might need to use a different verification approach
	// For now, we'll use the standard Firebase Admin SDK which works in production
	
	// In production, Firebase Admin SDK uses:
	// 1. GOOGLE_APPLICATION_CREDENTIALS environment variable (service account key file)
	// 2. Application Default Credentials (ADC) from gcloud CLI
	// 3. Metadata server (when running on GCP)
	
	// For emulator development, you can:
	// 1. Use a test service account
	// 2. Or implement a custom token verifier that bypasses verification in dev mode
	
	app, err := firebase.NewApp(ctx, &firebase.Config{
		ProjectID: projectID,
	})
	if err != nil {
		return nil, err
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		return nil, err
	}

	// If using emulator, log a warning
	if authEmulatorHost != "" {
		// Note: Firebase Admin SDK doesn't natively support emulator
		// You may need to use a custom implementation for local development
		// or use a test service account
		// For now, we'll proceed with standard verification
	}

	return authClient, nil
}

