#!/bin/bash

echo "Starting Anlagen Management System..."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your configuration before continuing!"
    exit 1
fi

# Build the application
echo "Building application..."
npm run build

# Start Docker services
echo "Starting Docker services..."
docker-compose up -d db redis

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run migrations
echo "Running database migrations..."
npm run migrate

# Start the application
echo "Starting application..."
if [ "$NODE_ENV" = "production" ]; then
    npm start
else
    npm run dev
fi