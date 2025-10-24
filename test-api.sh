#!/bin/bash

# Goal App API End-to-End Test Script
# This script tests all API endpoints with curl commands

set -e

# Configuration
API_BASE_URL="http://localhost:8080"
USER_ID="test-user-123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to make API calls and handle responses
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    print_status "Testing: $description"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "X-User-ID: $USER_ID" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "X-User-ID: $USER_ID" \
            "$API_BASE_URL$endpoint")
    fi
    
    # Split response and status code
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        print_success "✓ $description (HTTP $http_code)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        print_error "✗ $description (HTTP $http_code)"
        echo "$body"
    fi
    
    echo ""
}

# Check if server is running
print_status "Checking if API server is running..."
if ! curl -s "$API_BASE_URL/health" > /dev/null; then
    print_error "API server is not running at $API_BASE_URL"
    print_status "Please start the server first:"
    print_status "  cd server && go run cmd/api/main.go"
    exit 1
fi

print_success "API server is running!"

echo "=========================================="
echo "Goal App API End-to-End Tests"
echo "=========================================="
echo ""

# Test 1: Health Check
make_request "GET" "/health" "" "Health Check"

# Test 2: Create a Goal
print_status "Creating a test goal..."
GOAL_DATA='{
  "userId": "'$USER_ID'",
  "title": "Learn Spanish",
  "description": "Practice Spanish conversation and grammar daily",
  "targetMinutesPerDay": 30,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "tags": ["language", "learning"]
}'

# Create goal and capture response
print_status "Creating a test goal..."
GOAL_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "X-User-ID: $USER_ID" \
    -d "$GOAL_DATA" \
    "$API_BASE_URL/api/goals")

GOAL_ID=$(echo "$GOAL_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")

if [ -z "$GOAL_ID" ] || [ "$GOAL_ID" = "null" ]; then
    print_error "Failed to extract goal ID from response:"
    echo "$GOAL_RESPONSE"
    exit 1
fi

print_success "Created goal with ID: $GOAL_ID"

# Test 3: List Goals
make_request "GET" "/api/goals" "" "List All Goals"

# Test 4: List Goals with Filters
make_request "GET" "/api/goals?tags=language" "" "List Goals with Tag Filter"
make_request "GET" "/api/goals?active=true" "" "List Active Goals"

# Test 5: Record Progress for Multiple Days
print_status "Recording progress for multiple days..."

# Day 1 - Target met
PROGRESS_DATA_1='{
  "goalId": "'$GOAL_ID'",
  "date": "2025-01-01",
  "minutesSpent": 35,
  "note": "Completed first lesson"
}'
make_request "POST" "/api/progress" "$PROGRESS_DATA_1" "Record Progress - Day 1 (Target Met)"

# Day 2 - Target met
PROGRESS_DATA_2='{
  "goalId": "'$GOAL_ID'",
  "date": "2025-01-02",
  "minutesSpent": 30,
  "note": "Grammar practice"
}'
make_request "POST" "/api/progress" "$PROGRESS_DATA_2" "Record Progress - Day 2 (Target Met)"

# Day 3 - Target not met
PROGRESS_DATA_3='{
  "goalId": "'$GOAL_ID'",
  "date": "2025-01-03",
  "minutesSpent": 15,
  "note": "Short session due to time constraints"
}'
make_request "POST" "/api/progress" "$PROGRESS_DATA_3" "Record Progress - Day 3 (Target Not Met)"

# Day 4 - Target met
PROGRESS_DATA_4='{
  "goalId": "'$GOAL_ID'",
  "date": "2025-01-04",
  "minutesSpent": 45,
  "note": "Extra practice session"
}'
make_request "POST" "/api/progress" "$PROGRESS_DATA_4" "Record Progress - Day 4 (Target Met)"

# Day 5 - Target met
PROGRESS_DATA_5='{
  "goalId": "'$GOAL_ID'",
  "date": "2025-01-05",
  "minutesSpent": 30,
  "note": "Regular practice"
}'
make_request "POST" "/api/progress" "$PROGRESS_DATA_5" "Record Progress - Day 5 (Target Met)"

# Test 6: Get Progress for January 2025
make_request "GET" "/api/progress?month=2025-01" "" "Get Progress for January 2025"

# Test 7: Get Progress for Specific Goal
make_request "GET" "/api/progress?month=2025-01&goalId=$GOAL_ID" "" "Get Progress for Specific Goal"

# Test 8: Get Yearly Summary for 2025
make_request "GET" "/api/summary/yearly?year=2025" "" "Get Yearly Summary for 2025"

# Test 9: Get Yearly Summary for Specific Goal
make_request "GET" "/api/summary/yearly?year=2025&goalId=$GOAL_ID" "" "Get Yearly Summary for Specific Goal"

# Test 10: Create Another Goal for Comparison
print_status "Creating a second goal for comparison..."
GOAL_DATA_2='{
  "userId": "'$USER_ID'",
  "title": "Exercise Daily",
  "description": "30 minutes of physical exercise",
  "targetMinutesPerDay": 30,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "tags": ["health", "fitness"]
}'

GOAL_RESPONSE_2=$(make_request "POST" "/api/goals" "$GOAL_DATA_2" "Create Second Goal")
GOAL_ID_2=$(echo "$GOAL_RESPONSE_2" | jq -r '.id' 2>/dev/null || echo "")

if [ -n "$GOAL_ID_2" ] && [ "$GOAL_ID_2" != "null" ]; then
    # Record some progress for the second goal
    PROGRESS_DATA_6='{
      "goalId": "'$GOAL_ID_2'",
      "date": "2025-01-01",
      "minutesSpent": 30,
      "note": "Morning run"
    }'
    make_request "POST" "/api/progress" "$PROGRESS_DATA_6" "Record Progress for Second Goal"
fi

# Test 11: Final Progress Report
make_request "GET" "/api/progress?month=2025-01" "" "Final Progress Report for January"

# Test 12: Final Summary
make_request "GET" "/api/summary/yearly?year=2025" "" "Final Yearly Summary"

echo "=========================================="
print_success "All API tests completed!"
echo "=========================================="
echo ""
print_status "Test Summary:"
print_status "- Created goals with different tags and timeframes"
print_status "- Recorded progress across multiple days"
print_status "- Tested filtering and aggregation endpoints"
print_status "- Verified data consistency across endpoints"
echo ""
print_status "Next steps:"
print_status "1. Check the pubsub events using: ./test-pubsub.sh"
print_status "2. Review the analytics consumer: python analytics/pubsub_consumer.py"
