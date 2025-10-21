# Goal App

A full-stack goal tracking application with Go backend, React frontend, and real-time analytics.

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/scosta/goal-app
cd goal-app
./setup.sh

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start development
pnpm run dev
```

## Prerequisites

- Node.js 18+ and pnpm 8+
- Go 1.21+
- Python 3.8+ (for analytics)
- Git

## Development

### Start All Services
```bash
# Terminal 1: Firestore emulator
firebase emulators:start --project test-project --only firestore

# Terminal 2: PubSub emulator  
gcloud beta emulators pubsub start --project test-project

# Terminal 3: Go server
cd server && go run cmd/api/main.go

# Terminal 4: Python consumer (creates topic/subscription automatically)
cd analytics && source venv/bin/activate && python pubsub_consumer.py
```

### Testing
```bash
# Frontend tests
cd client && pnpm test

# Backend tests
cd server && go test ./...

# Integration tests (with emulators running)
cd server && go test -v ./internal/handlers/integration_test.go
```

### Build Applications
```bash
# Frontend
cd client && pnpm run build

# Backend  
cd server && go build -o goal-app cmd/api/main.go

# Everything
./setup.sh && cd client && pnpm run build && cd ../server && go build -o goal-app cmd/api/main.go
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

### Health Checks
```bash
# Check if backend is running
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","service":"goal-app-api"}
```

## Environment Configuration

Copy `.env.example` to `.env` and customize:

```bash
# Development
FIRESTORE_PROJECT_ID=test-project
FIRESTORE_EMULATOR_HOST=localhost:8081
PUBSUB_EMULATOR_HOST=localhost:8085
PORT=8080

# Production (remove emulator hosts)
FIRESTORE_PROJECT_ID=your-production-project
PORT=8080
```

### Analytics Setup
```bash
# For analytics/ directory
DATABRICKS_HOST=your-workspace.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
DATABRICKS_TOKEN=your-databricks-token
```

### Python Dependencies
```bash
# Setup Python virtual environment
cd analytics
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Troubleshooting

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