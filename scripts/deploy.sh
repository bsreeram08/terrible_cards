#!/bin/bash

# Terrible Cards - Firebase Deployment Script
# This script builds and deploys the app to Firebase Hosting

set -e  # Exit on error

echo "🎴 Terrible Cards - Firebase Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo "Running: firebase login"
    firebase login
fi

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf .vinxi .output

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
bun install

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
bun run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Ask for deployment type
echo "Select deployment type:"
echo "1) Full deploy (hosting + firestore rules)"
echo "2) Hosting only (faster)"
echo "3) Firestore rules only"
echo "4) Preview channel (test before production)"
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo -e "${YELLOW}🚀 Deploying full application...${NC}"
        firebase deploy
        ;;
    2)
        echo -e "${YELLOW}🚀 Deploying hosting only...${NC}"
        firebase deploy --only hosting
        ;;
    3)
        echo -e "${YELLOW}🚀 Deploying Firestore rules...${NC}"
        firebase deploy --only firestore:rules,firestore:indexes
        ;;
    4)
        read -p "Enter preview channel name (e.g., 'test'): " channel
        echo -e "${YELLOW}🚀 Deploying to preview channel: ${channel}...${NC}"
        firebase hosting:channel:deploy $channel
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "Your app is live at:"
    firebase hosting:sites:list
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
