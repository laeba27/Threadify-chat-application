#!/bin/bash

# Build script for Threadify application
# This prepares the application for deployment

set -e

echo "Building Threadify application..."

# Install backend dependencies
echo "Building backend..."
cd backend
npm install
cd ..

# Install frontend dependencies and build
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build completed successfully!"
