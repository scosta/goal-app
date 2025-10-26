# Goal App

A full-stack goal tracking application with Go backend, React frontend, and real-time analytics.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/scosta/goal-app
cd goal-app
./setup.sh

# Configure environment
cp .env.example .env
# Edit .env with your values
```

### Start All Services
```bash
# Terminal 1: Firestore emulator
firebase emulators:start --project goal-app --only firestore

# Terminal 2: PubSub emulator  
gcloud beta emulators pubsub start --project goal-app

# Terminal 3: Go server
cd server && go run cmd/api/main.go

# Terminal 4: Python consumer (creates topic/subscription automatically)
cd analytics && source venv/bin/activate && python -u pubsub_consumer.py
```

## Build Applications
```bash
# Frontend
cd client && pnpm run build

# Backend  
cd server && go build -o goal-app cmd/api/main.go

# Everything
./setup.sh && cd client && pnpm run build && cd ../server && go build -o goal-app cmd/api/main.go
```

## Testing

### Quick Start - End-to-End Testing
```bash
# Run complete test suite (API + PubSub + Analytics)
./run-e2e-tests.sh

# Test only API endpoints
./test-api.sh

# Test only PubSub functionality
./test-pubsub.sh
```

### Individual Testing
```bash
# Frontend tests
cd client && pnpm test

# Backend tests
cd server && go test ./...

# Integration tests (with emulators running)
cd server && ./run-integration-tests.sh

# Manual API testing with curl
./test-api.sh
```

### Manual curl Commands
```bash
# Health Check
curl http://localhost:8080/health

# Create a Goal
curl -X POST http://localhost:8080/api/goals \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-123" \
  -d '{
    "userId": "test-user-123",
    "title": "Learn Spanish",
    "description": "Practice Spanish daily",
    "targetMinutesPerDay": 30,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "tags": ["language", "learning"]
  }'

# Record Progress
curl -X POST http://localhost:8080/api/progress \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-123" \
  -d '{
    "goalId": "YOUR_GOAL_ID_HERE",
    "date": "2025-01-01",
    "minutesSpent": 35,
    "note": "Completed first lesson"
  }'

# Get Progress Report
curl -X GET "http://localhost:8080/api/progress?month=2025-01" \
  -H "X-User-ID: test-user-123"

# Get Yearly Summary
curl -X GET "http://localhost:8080/api/summary/yearly?year=2025" \
  -H "X-User-ID: test-user-123"

# List Goals with Filters
curl -X GET "http://localhost:8080/api/goals?tags=language&active=true" \
  -H "X-User-ID: test-user-123"
```

### PubSub Event Testing
```bash
# Setup PubSub emulator and test events
./test-pubsub.sh setup

# Start analytics consumer
./test-pubsub.sh consumer

# Test event publishing
./test-pubsub.sh test

# Monitor events
./test-pubsub.sh monitor
```

## Project Structure
- `client/` - React frontend with TypeScript
- `server/` - Go backend with Gin framework  
- `analytics/` - Python PubSub consumer for real-time analytics
- `shared/` - Generated API types and schemas

## Production Deployment

### Frontend Deployment
```bash
cd client
pnpm run build                    # Build production bundle
# Deploy the dist/ directory to your static hosting service
# Examples: Vercel, Netlify, AWS S3, etc.
```

### Backend Deployment
```bash
cd server
go build -o goal-app cmd/api/main.go  # Build production binary
# Deploy the goal-app executable to your server
# Examples: Docker, AWS EC2, Google Cloud Run, etc.
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile for backend
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY server/ .
RUN go build -o goal-app cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/goal-app .
CMD ["./goal-app"]
```

## Troubleshooting

### Health Checks
```bash
# Check if backend is running
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","service":"goal-app-api"}
```

### Common Issues
**Port already in use:**
```bash
# Find and kill process on port 8080
lsof -ti :8080 | xargs kill -9
```

**Missing dependencies:**
```bash
cd client && pnpm install
cd server && go mod download
```

**Build errors:**
```bash
# Regenerate everything
./setup.sh
```