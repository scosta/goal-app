# Goal App

A full-stack goal tracking application with a Go backend and React frontend, featuring type-safe API communication and comprehensive testing.

## Prerequisites

- Node.js 18+ and pnpm 8+
- Go 1.21+
- Python 3.8+ (for analytics)
- Git

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/scosta/goal-app
cd goal-app
./setup.sh
```

### 2. Environment Configuration
```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your values
# Required for development:
# - FIRESTORE_PROJECT_ID=your-project-id
# - FIRESTORE_EMULATOR_HOST=localhost:8081 (for local development)

# Note: The .env file should be in the project root directory
# Both Go server and Python analytics will load from ../.env
```

### 3. Run Tests

#### Frontend Tests (Client)
```bash
cd client
pnpm test                    # Run all tests once
pnpm test:watch             # Run tests in watch mode
pnpm test:ui                 # Run tests with interactive UI
pnpm test:coverage          # Run tests with coverage report
```

#### Backend Tests (Server)
```bash
cd server
go test ./...                # Run all Go tests
go test -v ./...             # Run tests with verbose output
go test ./internal/handlers  # Run only handler tests
```

#### Integration Tests with Firestore Emulator
```bash
# Start Firestore emulator (in one terminal)
firebase emulators:start --project test-project --only firestore --port 8081

# Run integration tests (in another terminal)
cd server
export FIRESTORE_EMULATOR_HOST=localhost:8081
go test -v ./internal/handlers/integration_test.go

# Or use the automated script
./run-integration-tests.sh
```

#### Real Integration Tests (Client + Server)
```bash
# Run real integration tests with actual server
./run-real-integration-tests.sh

# Or manually:
# Terminal 1: Start server
cd server && go run cmd/api/main.go

# Terminal 2: Run client tests
cd client && pnpm test src/api/__tests__/real-integration.test.ts
```

### 3. Build Applications

#### Build Frontend (Client)
```bash
cd client
pnpm install                    # Install dependencies
pnpm run build                  # Build for production
# Output: dist/ directory with static files
# Note: Requires tsconfig.json, tsconfig.node.json, and index.html files
```

#### Build Backend (Server)
```bash
cd server
go mod download                 # Download Go dependencies
go build -o goal-app cmd/api/main.go  # Build executable
# Output: goal-app executable
```

#### Build Everything
```bash
# From root directory
./setup.sh                      # Generate API types and install dependencies
cd client && pnpm run build     # Build frontend
cd ../server && go build -o goal-app cmd/api/main.go  # Build backend
```

### 4. Start Development
```bash
# From the root directory - starts both server and client
pnpm run dev
```

## Development

### Project Structure
- `client/` - React frontend with TypeScript
- `server/` - Go backend with Gin framework
- `shared/` - Generated API types and schemas

### Available Scripts

#### From root directory:
- `pnpm run dev` - Start both server and client in development mode
- `./setup.sh` - Generate API types and install dependencies

#### From client directory:
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start client development server
- `pnpm run build` - Build for production
- `pnpm test` - Run all tests (includes client and shared tests)
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with interactive UI
- `pnpm test:coverage` - Run tests with coverage report

#### From server directory:
- `go mod download` - Download Go dependencies
- `go build -o goal-app cmd/api/main.go` - Build production executable
- `go run cmd/api/main.go` - Run the API server
- `go test ./...` - Run all Go tests
- `go test -v ./...` - Run tests with verbose output
- `go test ./internal/handlers` - Run only handler tests

### Testing

The project includes comprehensive testing for both frontend and backend:

#### Frontend Testing (Client)
- **Test Runner**: Vitest with TypeScript support
- **Test Types**: Unit tests, integration tests, and schema validation
- **Coverage**: Built-in coverage reporting with `pnpm test:coverage`
- **Quality Focus**: Tests focus on business logic and integration

#### Backend Testing (Server)
- **Test Runner**: Go's built-in testing framework
- **Test Types**: Unit tests and integration tests with Firestore emulator
- **Database**: Uses Firestore emulator for realistic testing
- **Coverage**: Go's built-in coverage reporting

#### Test Files

**Frontend Tests:**
- `client/src/__tests__/setup.test.ts` - Project setup validation
- `client/src/api/__tests__/integration.test.ts` - End-to-end workflow tests
- `shared/__tests__/zod-schemas.test.ts` - Schema validation tests

**Backend Tests:**
- `server/internal/handlers/integration_test.go` - Handler integration tests
- `server/internal/handlers/*_test.go` - Individual handler tests
- `server/run-integration-tests.sh` - Automated test runner with emulator

#### Test Configuration

**Frontend:**
- **Vitest**: Fast test runner with TypeScript support
- **Global Setup**: Mocks console methods and clears mocks between tests
- **Path Aliases**: `@` for client code, `@shared` for shared code
- **Coverage**: Built-in coverage reporting

**Backend:**
- **Firestore Emulator**: Realistic database testing without external dependencies
- **Integration Tests**: End-to-end testing of API handlers
- **Mock Services**: Isolated testing of individual components

### API Generation

The `setup.sh` script automatically generates:
- TypeScript types from OpenAPI spec
- Zod schemas for validation
- Go models from OpenAPI spec

All generated files are in the `shared/` directory and are automatically updated when you run `./setup.sh`.

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

### Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and customize for your environment:

```bash
# Development (local)
FIRESTORE_PROJECT_ID=your-project-id
FIRESTORE_EMULATOR_HOST=localhost:8081
PUBSUB_TOPIC=goal-events
PORT=8080

# Production
FIRESTORE_PROJECT_ID=your-production-project
# FIRESTORE_EMULATOR_HOST not set (uses real Firestore)
PUBSUB_TOPIC=goal-events-prod
PORT=8080
```

### Environment-Specific Setup

#### **Local Development**
```bash
# .env for local development
FIRESTORE_PROJECT_ID=test-project
FIRESTORE_EMULATOR_HOST=localhost:8081
PUBSUB_TOPIC=goal-events
PORT=8080
GIN_MODE=debug
```

#### **Staging**
```bash
# .env for staging
FIRESTORE_PROJECT_ID=goal-app-staging
PUBSUB_TOPIC=goal-events-staging
PORT=8080
GIN_MODE=release
```

#### **Production**
```bash
# .env for production
FIRESTORE_PROJECT_ID=goal-app-prod
PUBSUB_TOPIC=goal-events-prod
PORT=8080
GIN_MODE=release
```

### Analytics Environment
```bash
# For analytics/ directory
DATABRICKS_HOST=your-workspace.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
DATABRICKS_TOKEN=your-databricks-token
```

## Troubleshooting

### Client Build Issues

#### Missing TypeScript Configuration
If you get TypeScript compilation errors, ensure you have:
- `tsconfig.json` - Main TypeScript configuration
- `tsconfig.node.json` - Node.js TypeScript configuration  
- `index.html` - Entry point for Vite

#### Missing Dependencies
If you get module resolution errors:
```bash
cd client
pnpm install  # Install all dependencies
```

#### Test Files in Build
If test files are being included in the build, ensure `tsconfig.json` excludes them:
```json
{
  "exclude": ["src/**/*.test.ts", "src/**/*.spec.ts", "../shared"]
}
```

### Server Build Issues

#### Missing Go Dependencies
```bash
cd server
go mod download  # Download dependencies
go mod tidy      # Clean up dependencies
```

#### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```