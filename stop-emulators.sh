#!/bin/bash

# Stop emulators for Goal App development

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

# Stop Firestore emulator
stop_firestore() {
    if [ -f .firestore_pid ]; then
        FIRESTORE_PID=$(cat .firestore_pid)
        if kill -0 $FIRESTORE_PID 2>/dev/null; then
            kill $FIRESTORE_PID
            print_success "Stopped Firestore emulator (PID: $FIRESTORE_PID)"
        else
            print_warning "Firestore emulator process not found"
        fi
        rm .firestore_pid
    else
        print_warning "No Firestore emulator PID file found"
    fi
}

# Stop PubSub emulator
stop_pubsub() {
    if [ -f .pubsub_pid ]; then
        PUBSUB_PID=$(cat .pubsub_pid)
        if kill -0 $PUBSUB_PID 2>/dev/null; then
            kill $PUBSUB_PID
            print_success "Stopped PubSub emulator (PID: $PUBSUB_PID)"
        else
            print_warning "PubSub emulator process not found"
        fi
        rm .pubsub_pid
    else
        print_warning "No PubSub emulator PID file found"
    fi
}

# Kill any remaining processes on the ports
kill_port_processes() {
    print_status "Checking for processes on emulator ports..."
    
    # Kill processes on port 8081 (Firestore)
    if lsof -ti :8081 > /dev/null 2>&1; then
        lsof -ti :8081 | xargs kill -9 2>/dev/null || true
        print_success "Killed processes on port 8081"
    fi
    
    # Kill processes on port 8085 (PubSub)
    if lsof -ti :8085 > /dev/null 2>&1; then
        lsof -ti :8085 | xargs kill -9 2>/dev/null || true
        print_success "Killed processes on port 8085"
    fi
}

# Main execution
main() {
    print_status "Stopping Goal App emulators..."
    
    stop_firestore
    stop_pubsub
    kill_port_processes
    
    print_success "All emulators stopped!"
}

# Run main function
main "$@"
