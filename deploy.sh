#!/bin/bash
# deploy.sh - Deployment script using PM2 (no build step)

set -e  # Exit immediately if a command exits with a non-zero status
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Ensure npm is available
which npm || { echo "npm not found"; exit 1; }
echo "Starting deployment process..."

# Navigate to the application's directory
cd /home/iwabri/htdocs/api-iwabri.abracodebra.com || exit

# Pull the latest changes from the GitHub repository
git pull origin main

# Install dependencies (only if needed)
npm install

# Reload or restart the application using PM2
pm2 reload ecosystem.config.js --env production

# Save the PM2 process list and startup script
pm2 save
pm2 startup

echo "Deployment complete!"