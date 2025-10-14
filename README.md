# Goal App

A full-stack goal tracking application with a Go backend and React frontend, featuring type-safe API communication and comprehensive testing.

## Prerequisites

- Node.js 18+ and pnpm 8+
- Go 1.21+
- Git

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/scosta/goal-app
cd goal-app
./setup.sh
```

### 2. Run Tests
```bash
cd client
pnpm test                    # Run all tests once
pnpm test:watch             # Run tests in watch mode
pnpm test:ui                 # Run tests with interactive UI
pnpm test:coverage          # Run tests with coverage report
```

### 3. Start Development
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
- `pnpm test` - Run all tests (includes client and shared tests)
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with interactive UI
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm run dev` - Start client development server
- `pnpm run build` - Build for production

### Testing

The project includes comprehensive testing:

#### Test Types
- **Setup Tests**: Validate project structure and configuration
- **API Tests**: Test client-side API functions with mocking
- **Integration Tests**: Test complete workflows end-to-end
- **Schema Tests**: Validate Zod schemas for data validation

#### Test Files
- `client/src/__tests__/setup.test.ts` - Project setup validation
- `client/src/api/__tests__/*.test.ts` - API function tests
- `shared/__tests__/zod-schemas.test.ts` - Schema validation tests

#### Test Configuration
- **Vitest**: Fast test runner with TypeScript support
- **Global Setup**: Mocks console methods and clears mocks between tests
- **Path Aliases**: `@` for client code, `@shared` for shared code
- **Coverage**: Built-in coverage reporting with `pnpm test:coverage`

### API Generation

The `setup.sh` script automatically generates:
- TypeScript types from OpenAPI spec
- Zod schemas for validation
- Go models from OpenAPI spec

All generated files are in the `shared/` directory and are automatically updated when you run `./setup.sh`.