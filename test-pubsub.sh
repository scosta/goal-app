#!/bin/bash

# PubSub Event Testing Script for Goal App
# This script helps test and observe pubsub events

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Setup PubSub emulator (if not already running)
setup_emulator() {
    print_status "Setting up PubSub emulator..."
    
    # Check if emulator is already running
    if curl -s http://localhost:8085 > /dev/null 2>&1; then
        print_success "PubSub emulator is already running"
        return
    fi
    
    print_status "Starting PubSub emulator..."
    gcloud beta emulators pubsub start --project=test-project --host-port=localhost:8085 &
    EMULATOR_PID=$!
    
    # Wait for emulator to start
    sleep 5
    
    # Set environment variable
    export PUBSUB_EMULATOR_HOST=localhost:8085
    export FIRESTORE_PROJECT_ID=test-project
    
    print_success "PubSub emulator started with PID: $EMULATOR_PID"
    print_status "Environment variables set:"
    print_status "  PUBSUB_EMULATOR_HOST=localhost:8085"
    print_status "  FIRESTORE_PROJECT_ID=test-project"
}

# Create topic and subscription
setup_topic() {
    print_status "Creating topic and subscription..."
    
    # Create topic
    gcloud pubsub topics create goal-events --project=test-project 2>/dev/null || true
    print_success "Topic 'goal-events' created or already exists"
    
    # Create subscription
    gcloud pubsub subscriptions create goal-events-sub --topic=goal-events --project=test-project 2>/dev/null || true
    print_success "Subscription 'goal-events-sub' created or already exists"
}

# Start the analytics consumer
start_consumer() {
    print_status "Starting analytics consumer..."
    
    # Create a simple .env.test file for the consumer
    cat > .env.test << EOF
FIRESTORE_PROJECT_ID=test-project
PUBSUB_TOPIC=goal-events
PUBSUB_EMULATOR_HOST=localhost:8085
EOF
    
    print_status "Starting consumer in background..."
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
    source venv/bin/activate && python pubsub_consumer.py &
    CONSUMER_PID=$!
    cd ..
    
    print_success "Analytics consumer started with PID: $CONSUMER_PID"
    echo $CONSUMER_PID > .consumer_pid
}

# Test event publishing
test_events() {
    print_status "Testing event publishing..."
    
    # Test goal.created event
    print_status "Publishing goal.created event..."
    gcloud pubsub topics publish goal-events \
        --message='{"type":"goal.created","payload":{"id":"test-goal-123","userId":"test-user","title":"Test Goal","targetMinutesPerDay":30,"startDate":"2025-01-01","createdAt":"2025-01-01T10:00:00Z"}}' \
        --project=test-project
    
    # Test progress.recorded event
    print_status "Publishing progress.recorded event..."
    gcloud pubsub topics publish goal-events \
        --message='{"type":"progress.recorded","payload":{"id":"test-progress-123","goalId":"test-goal-123","date":"2025-01-01","minutesSpent":30,"targetMet":true,"createdAt":"2025-01-01T10:30:00Z"}}' \
        --project=test-project
    
    print_success "Test events published"
}

# Monitor events
monitor_events() {
    print_status "Monitoring events for 30 seconds..."
    print_status "You should see events being consumed by the analytics consumer"
    
    # Monitor subscription
    timeout 30s gcloud pubsub subscriptions pull goal-events-sub \
        --project=test-project \
        --limit=10 \
        --format="value(message.data)" || true
    
    print_success "Event monitoring completed"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Stop consumer if running
    if [ -f .consumer_pid ]; then
        CONSUMER_PID=$(cat .consumer_pid)
        if kill -0 $CONSUMER_PID 2>/dev/null; then
            kill $CONSUMER_PID
            print_success "Stopped analytics consumer"
        fi
        rm .consumer_pid
    fi
    
    # Stop emulator if we started it
    if [ ! -z "$EMULATOR_PID" ]; then
        kill $EMULATOR_PID 2>/dev/null || true
        print_success "Stopped PubSub emulator"
    fi
    
    # Clean up .env.test file
    rm -f .env.test
    
    print_success "Cleanup completed"
}

# Main menu
show_menu() {
    echo "=========================================="
    echo "Goal App PubSub Testing Menu"
    echo "=========================================="
    echo "1. Setup PubSub emulator and topic"
    echo "2. Start analytics consumer"
    echo "3. Test event publishing"
    echo "4. Monitor events"
    echo "5. Run full test (setup + consumer + test + monitor)"
    echo "6. Cleanup and exit"
    echo "7. Exit without cleanup"
    echo "=========================================="
}

# Main execution
main() {
    # Set up signal handlers for cleanup
    trap cleanup EXIT INT TERM
    
    check_dependencies
    
    while true; do
        show_menu
        read -p "Choose an option (1-7): " choice
        
        case $choice in
            1)
                setup_emulator
                setup_topic
                ;;
            2)
                start_consumer
                ;;
            3)
                test_events
                ;;
            4)
                monitor_events
                ;;
            5)
                print_status "Running full test..."
                setup_emulator
                setup_topic
                start_consumer
                sleep 2
                test_events
                sleep 2
                monitor_events
                ;;
            6)
                cleanup
                exit 0
                ;;
            7)
                print_warning "Exiting without cleanup. You may need to manually stop processes."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-7."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
        echo ""
    done
}

# If script is run with arguments, execute specific functions
if [ $# -gt 0 ]; then
    case $1 in
        "setup")
            check_dependencies
            setup_emulator
            setup_topic
            ;;
        "consumer")
            start_consumer
            ;;
        "test")
            test_events
            ;;
        "monitor")
            monitor_events
            ;;
        "full")
            main
            ;;
        *)
            echo "Usage: $0 [setup|consumer|test|monitor|full]"
            echo "  setup   - Setup emulator and topic"
            echo "  consumer - Start analytics consumer"
            echo "  test    - Test event publishing"
            echo "  monitor - Monitor events"
            echo "  full    - Run interactive menu"
            exit 1
            ;;
    esac
else
    main
fi
