#!/bin/bash

# Install dependencies using pnpm
echo "Installing dependencies..."
cd /vercel/share/v0-project

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo "pnpm not found, trying npm..."
  npm install
else
  echo "Using pnpm..."
  pnpm install
fi

echo "Dependencies installed successfully!"
