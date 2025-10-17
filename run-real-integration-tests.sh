#!/bin/bash

# Script to run real integration tests with actual server

echo "Starting Goal App API server..."
cd server
go run cmd/api/main.go &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

# Check if server is running
if curl -s http://localhost:8080/health > /dev/null; then
    echo "Server is running!"
else
    echo "Server failed to start"
    kill $SERVER_PID
    exit 1
fi

# Run client integration tests
echo "Running client integration tests..."
cd ../client
export API_BASE_URL=http://localhost:8080
pnpm test src/api/__tests__/real-integration.test.ts

# Clean up
echo "Stopping server..."
kill $SERVER_PID

echo "Real integration tests completed!"
