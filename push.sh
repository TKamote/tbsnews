#!/bin/bash

# Simple 3-in-1 Git Push Script
# Usage: ./push.sh "Your commit message"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if commit message is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a commit message${NC}"
    echo "Usage: ./push.sh \"Your commit message\""
    exit 1
fi

COMMIT_MSG="$1"

echo -e "${BLUE}🚀 Starting git push...${NC}"
echo ""

# Step 1: Add all files
echo -e "${BLUE}Step 1/3: Adding files...${NC}"
git add .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files added${NC}"
else
    echo -e "${RED}❌ Failed to add files${NC}"
    exit 1
fi
echo ""

# Step 2: Commit
echo -e "${BLUE}Step 2/3: Committing...${NC}"
git commit -m "$COMMIT_MSG"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Committed: $COMMIT_MSG${NC}"
else
    echo -e "${RED}❌ Failed to commit${NC}"
    exit 1
fi
echo ""

# Step 3: Push
echo -e "${BLUE}Step 3/3: Pushing to GitHub...${NC}"
git push origin main
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo -e "${GREEN}🎉 Your changes will auto-deploy to Vercel${NC}"
else
    echo -e "${RED}❌ Failed to push${NC}"
    exit 1
fi

