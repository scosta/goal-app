#!/bin/bash

# Script to run integration tests with Firestore emulator

echo "Starting Firestore emulator..."
firebase emulators:start --project test-project --only firestore &
EMULATOR_PID=$!

# Wait for emulator to start
echo "Waiting for emulator to start..."
sleep 10

# Set environment variable
export FIRESTORE_EMULATOR_HOST=localhost:8080

echo "Running integration tests..."
go test -v ./internal/handlers/integration_test.go

# Clean up
echo "Stopping emulator..."
kill $EMULATOR_PID

echo "Integration tests completed!"
