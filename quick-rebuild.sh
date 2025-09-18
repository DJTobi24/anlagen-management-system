#!/bin/bash
cd /home/anlagen-management-system

# Function to rebuild in background
rebuild_backend() {
    echo "Starting backend rebuild at $(date)" > quick-rebuild.log
    
    # Build
    echo "Building..." >> quick-rebuild.log
    docker-compose build backend >> quick-rebuild.log 2>&1
    
    # Restart
    echo "Restarting..." >> quick-rebuild.log
    docker-compose up -d backend >> quick-rebuild.log 2>&1
    
    echo "Completed at $(date)" >> quick-rebuild.log
}

# Run in background
rebuild_backend &
REBUILD_PID=$!

echo "Backend rebuild started (PID: $REBUILD_PID)"
echo "Check progress with: tail -f quick-rebuild.log"