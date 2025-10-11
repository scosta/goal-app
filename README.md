# goal-app

# Clone the repo
git clone <your-repo>
cd goal-app

# Run setup script
pnpm run setup

# Start development
pnpm run dev

# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Generating Model Objects

Generate TypeScript types from the OpenAPI spec using `openapi-typescript`:
```
pnpm install -D openapi-typescript
npx openapi-typescript ./shared/openapi.yaml --output ./shared/api-types.ts
```

Generate Zod schemas from the OpenAPI spec using `openapi-zod-client`:
```
pnpm add zod
pnpm add -D openapi-zod-client
npx openapi-zod-client shared/openapi.yaml -o shared/zod-schemas.ts --export-schemas
```

Generate go types from the OpenAPI spec using `oapi-codegen`:
```
go install github.com/deepmap/oapi-codegen/cmd/oapi-codegen@latest
cd server && oapi-codegen -generate types -o models/models.go ../shared/openapi.yaml
```