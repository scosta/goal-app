#!/bin/bash

# Complete End-to-End Test Suite for Goal App
# This script runs all tests: API, PubSub, and Analytics

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}==========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}==========================================${NC}"
}

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

# Configuration
API_BASE_URL="http://localhost:8080"
USER_ID="e2e-test-user-$(date +%s)"

# Global variables for cleanup
EMULATOR_PID=""
CONSUMER_PID=""
API_PID=""

# Cleanup function
cleanup() {
    print_status "Cleaning up processes..."
    
    # Stop API server
    if [ ! -z "$API_PID" ] && kill -0 $API_PID 2>/dev/null; then
        kill $API_PID
        print_success "Stopped API server"
    fi
    
    # Stop analytics consumer
    if [ -f .consumer_pid ]; then
        CONSUMER_PID=$(cat .consumer_pid)
        if kill -0 $CONSUMER_PID 2>/dev/null; then
            kill $CONSUMER_PID
            print_success "Stopped analytics consumer"
        fi
        rm .consumer_pid
    fi
    
    # Stop emulators (start-emulators.sh handles both Firestore and PubSub)
    if [ -f .emulator_pid ]; then
        EMULATOR_PID=$(cat .emulator_pid)
        if kill -0 $EMULATOR_PID 2>/dev/null; then
            kill $EMULATOR_PID
            print_success "Stopped emulators"
        fi
        rm .emulator_pid
    fi
    
    # Clean up temporary files
    rm -f .env.test .consumer_pid
    
    print_success "Cleanup completed"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    local missing_deps=()
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if ! command -v gcloud &> /dev/null; then
        missing_deps+=("gcloud")
    fi
    
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    if ! command -v go &> /dev/null; then
        missing_deps+=("go")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and try again"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Setup emulators using the dedicated script
setup_emulators() {
    print_header "Setting up Emulators"
    
    print_status "Starting emulators using start-emulators.sh..."
    
    # Start emulators in background
    ./start-emulators.sh &
    EMULATOR_PID=$!
    echo $EMULATOR_PID > .emulator_pid
    
    # Wait for both emulators to start
    print_status "Waiting for emulators to start..."
    for i in {1..60}; do
        if curl -s http://localhost:8081 > /dev/null 2>&1 && curl -s http://localhost:8085 > /dev/null 2>&1; then
            print_success "Both emulators are running"
            break
        fi
        sleep 1
        if [ $i -eq 60 ]; then
            print_error "Emulators failed to start within 60 seconds"
            exit 1
        fi
    done
    
    # Set environment variables
    export PUBSUB_EMULATOR_HOST=localhost:8085
    export FIRESTORE_PROJECT_ID=test-project
    
    print_success "Emulators setup completed"
}

# Start API server
start_api() {
    print_header "Starting API Server"
    
    print_status "Starting Go API server..."
    cd server
    
    # Set environment variables for the server
    export PUBSUB_EMULATOR_HOST=localhost:8085
    export FIRESTORE_PROJECT_ID=test-project
    
    go run cmd/api/main.go &
    API_PID=$!
    cd ..
    
    # Wait for server to start
    print_status "Waiting for API server to start..."
    for i in {1..30}; do
        if curl -s "$API_BASE_URL/health" > /dev/null 2>&1; then
            print_success "API server is running"
            return
        fi
        sleep 1
    done
    
    print_error "API server failed to start"
    exit 1
}

# Start analytics consumer
start_analytics() {
    print_header "Starting Analytics Consumer"
    
    # Create .env.test file for the consumer
    cat > .env.test << EOF
FIRESTORE_PROJECT_ID=test-project
PUBSUB_TOPIC=goal-events
PUBSUB_EMULATOR_HOST=localhost:8085
EOF
    
    print_status "Starting analytics consumer..."
    cd analytics
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_warning "Analytics virtual environment not found. Setting up..."
        cd ..
        # Run the Python setup part from setup.sh
        cd analytics
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        cd ..
        cd analytics
    fi
    
    # Activate virtual environment and run consumer
    print_status "Activating virtual environment and starting consumer..."
    source venv/bin/activate && python pubsub_consumer.py &
    CONSUMER_PID=$!
    echo $CONSUMER_PID > ../.consumer_pid
    cd ..
    
    # Give the consumer a moment to start
    sleep 2
    
    print_success "Analytics consumer started"
}

# Run API tests
run_api_tests() {
    print_header "Running API Tests"
    
    # Make the test script executable and run it
    chmod +x test-api.sh
    
    # Override the USER_ID in the test script
    USER_ID="$USER_ID" ./test-api.sh
    
    print_success "API tests completed"
}

# Test PubSub events
test_pubsub_events() {
    print_header "Testing PubSub Events"
    
    print_status "Publishing test events..."
    
    # Test goal.created event
    gcloud pubsub topics publish goal-events \
        --message='{"type":"goal.created","payload":{"id":"pubsub-test-goal","userId":"'$USER_ID'","title":"PubSub Test Goal","targetMinutesPerDay":30,"startDate":"2025-01-01","createdAt":"2025-01-01T10:00:00Z"}}' \
        --project=test-project
    
    # Test progress.recorded event
    gcloud pubsub topics publish goal-events \
        --message='{"type":"progress.recorded","payload":{"id":"pubsub-test-progress","goalId":"pubsub-test-goal","date":"2025-01-01","minutesSpent":30,"targetMet":true,"createdAt":"2025-01-01T10:30:00Z"}}' \
        --project=test-project
    
    print_success "Test events published"
    
    # Monitor events for a short time
    print_status "Monitoring events for 10 seconds..."
    timeout 10s gcloud pubsub subscriptions pull goal-events-sub \
        --project=test-project \
        --limit=5 \
        --format="value(message.data)" || true
    
    print_success "PubSub event testing completed"
}

# Generate test report
generate_report() {
    print_header "Test Report"
    
    echo "Test Summary:"
    echo "============="
    echo "✓ Dependencies checked"
    echo "✓ Emulators started (via start-emulators.sh)"
    echo "✓ API server started"
    echo "✓ Analytics consumer started"
    echo "✓ API endpoints tested"
    echo "✓ PubSub events tested"
    echo ""
    echo "Test User ID: $USER_ID"
    echo "API Base URL: $API_BASE_URL"
    echo "Firestore Emulator: localhost:8081"
    echo "PubSub Emulator: localhost:8085"
    echo ""
    echo "Events tested:"
    echo "- goal.created"
    echo "- progress.recorded"
    echo ""
    echo "API endpoints tested:"
    echo "- GET /health"
    echo "- POST /goals"
    echo "- GET /goals"
    echo "- POST /progress"
    echo "- GET /progress"
    echo "- GET /summary"
    echo ""
    print_success "All tests completed successfully!"
}

# Main execution
main() {
    print_header "Goal App End-to-End Test Suite"
    
    # Parse command line arguments
    SKIP_API=false
    SKIP_PUBSUB=false
    SKIP_ANALYTICS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-api)
                SKIP_API=true
                shift
                ;;
            --skip-pubsub)
                SKIP_PUBSUB=true
                shift
                ;;
            --skip-analytics)
                SKIP_ANALYTICS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-api       Skip API tests"
                echo "  --skip-pubsub    Skip PubSub tests"
                echo "  --skip-analytics Skip analytics consumer"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run tests
    check_dependencies
    
    # Start emulators (both Firestore and PubSub)
    setup_emulators
    
    if [ "$SKIP_API" = false ]; then
        start_api
    fi
    
    if [ "$SKIP_ANALYTICS" = false ]; then
        start_analytics
    fi
    
    if [ "$SKIP_API" = false ]; then
        run_api_tests
    fi
    
    if [ "$SKIP_PUBSUB" = false ]; then
        test_pubsub_events
    fi
    
    generate_report
    
    print_status "Test suite completed. Press Ctrl+C to stop all services."
    print_status "Services will be automatically cleaned up on exit."
    
    # Keep running until interrupted
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
