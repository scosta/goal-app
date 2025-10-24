#!/bin/bash

echo "🚀 Setting up Goal App development environment..."

# Install Go dependencies
echo "📦 Installing Go dependencies..."
cd server
go mod tidy
cd ..

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd client && pnpm install && cd ..

# Setup Python virtual environment for analytics
echo "🐍 Setting up Python analytics environment..."
cd analytics
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..
echo "✅ Python analytics environment ready"

# Generate types from OpenAPI spec
echo "🔧 Generating TypeScript types..."
npx openapi-typescript shared/openapi.yaml -o shared/api-types.ts

# Generate Zod schemas
echo "🔧 Generating Zod schemas..."
npx openapi-zod-client shared/openapi.yaml -o shared/zod-schemas.ts --export-schemas

# Generate Go models
echo "🔧 Generating Go models..."
cd server
oapi-codegen -generate types -o internal/models/models.go ../shared/openapi.yaml
cd ..

echo "✅ Setup complete! You can now run:"
echo "  - Server: cd server && go run cmd/api/main.go"
echo "  - Client: cd client && pnpm dev"
echo "  - Tests: cd client && pnpm test"