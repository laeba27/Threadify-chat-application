#!/bin/bash

# Start script for Threadify application
# This starts both backend and frontend services

set -e

echo "Starting Threadify application..."

# Install dependencies if needed
echo "Installing backend dependencies..."
cd backend
npm install
echo "Installing frontend dependencies..."
cd ../frontend
npm install
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Start services
echo "Starting services..."

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm start &
FRONTEND_PID=$!

# Trap signals to cleanup
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

# Wait for services
wait
