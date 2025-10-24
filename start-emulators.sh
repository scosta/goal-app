#!/bin/bash

# Start required emulators for Goal App development

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

# Check if emulators are already running
check_emulators() {
    if curl -s http://localhost:8081 > /dev/null 2>&1; then
        print_warning "Firestore emulator already running on port 8081"
        return 0
    fi
    
    if curl -s http://localhost:8085 > /dev/null 2>&1; then
        print_warning "PubSub emulator already running on port 8085"
        return 0
    fi
    
    return 1
}

# Start Firestore emulator
start_firestore() {
    print_status "Starting Firestore emulator on port 8081..."
    
    # Create firebase.json if it doesn't exist
    if [ ! -f firebase.json ]; then
        cat > firebase.json << EOF
{
  "emulators": {
    "firestore": {
      "port": 8081
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
EOF
        print_status "Created firebase.json configuration"
    fi
    
    # Start emulator with proper configuration
    firebase emulators:start --project test-project --only firestore &
    FIRESTORE_PID=$!
    echo $FIRESTORE_PID > .firestore_pid
    
    # Wait for emulator to start
    print_status "Waiting for Firestore emulator to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8081 > /dev/null 2>&1; then
            print_success "Firestore emulator started on port 8081"
            return
        fi
        sleep 1
    done
    
    print_error "Firestore emulator failed to start"
    exit 1
}

# Start PubSub emulator
start_pubsub() {
    print_status "Starting PubSub emulator on port 8085..."
    gcloud beta emulators pubsub start --project test-project --host-port=localhost:8085 &
    PUBSUB_PID=$!
    echo $PUBSUB_PID > .pubsub_pid
    
    # Wait for emulator to start
    print_status "Waiting for PubSub emulator to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8085 > /dev/null 2>&1; then
            print_success "PubSub emulator started on port 8085"
            return
        fi
        sleep 1
    done
    
    print_error "PubSub emulator failed to start"
    exit 1
}

# Create topics and subscriptions
setup_pubsub() {
    print_status "Setting up PubSub topics and subscriptions..."
    gcloud pubsub topics create goal-events --project=test-project 2>/dev/null || true
    gcloud pubsub subscriptions create goal-events-sub --topic=goal-events --project=test-project 2>/dev/null || true
    print_success "PubSub setup completed"
}

# Main execution
main() {
    print_status "Starting Goal App emulators..."
    
    # Check if already running
    if check_emulators; then
        print_warning "Some emulators are already running. Continuing..."
    fi
    
    # Start emulators
    start_firestore
    start_pubsub
    setup_pubsub
    
    print_success "All emulators started successfully!"
    print_status "Firestore emulator: http://localhost:8081"
    print_status "PubSub emulator: http://localhost:8085"
    print_status ""
    print_status "To stop emulators, run: ./stop-emulators.sh"
    print_status "Or press Ctrl+C to stop this script"
    
    # Keep running until interrupted
    while true; do
        sleep 1
    done
}

# Cleanup function
cleanup() {
    print_status "Stopping emulators..."
    
    if [ -f .firestore_pid ]; then
        FIRESTORE_PID=$(cat .firestore_pid)
        if kill -0 $FIRESTORE_PID 2>/dev/null; then
            kill $FIRESTORE_PID
            print_success "Stopped Firestore emulator"
        fi
        rm .firestore_pid
    fi
    
    if [ -f .pubsub_pid ]; then
        PUBSUB_PID=$(cat .pubsub_pid)
        if kill -0 $PUBSUB_PID 2>/dev/null; then
            kill $PUBSUB_PID
            print_success "Stopped PubSub emulator"
        fi
        rm .pubsub_pid
    fi
    
    print_success "Cleanup completed"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Run main function
main "$@"
