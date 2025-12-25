#!/bin/bash

set -e 

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AI-photofun-Studio Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"

REPO_URL="https://github.com/ltchcmus/AI-photofun-Studio.git"
PROJECT_DIR="AI-photofun-Studio"
BRANCH="test"
DEPLOY_PATH="/var/www/html/nmcnpm.lethanhcong.site/"

# Step 1: Clone repository
echo -e "\n${YELLOW}[1/5] Cloning repository...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Directory $PROJECT_DIR already exists. Removing it...${NC}"
    rm -rf "$PROJECT_DIR"
fi
git clone "$REPO_URL"
cd "$PROJECT_DIR"

if [ "$BRANCH" != "master" ]; then
    git checkout -b "$BRANCH" origin/"$BRANCH"
fi

cd src
git branch --show-current
echo -e "${GREEN}Repository cloned successfully${NC}"


# Step 2: Start docker-compose for backendSocial
echo -e "\n${YELLOW}[2/5] Starting backendSocial docker containers...${NC}"
cd backend/backendSocial
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}Found docker-compose.yml in backendSocial${NC}"
    docker-compose down || true 
    docker-compose up -d --build
    echo -e "${GREEN}backendSocial containers started successfully${NC}"
else
    echo -e "${RED}docker-compose.yml not found in backendSocial${NC}"
    exit 1
fi
cd ../..

# Step 3: Start docker-compose for backendAI
echo -e "\n${YELLOW}[3/5] Starting backendAI docker containers...${NC}"
cd backend/backendAI
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}Found docker-compose.yml in backendAI${NC}"
    docker-compose down || true 
    docker-compose up -d --build
    echo -e "${GREEN}backendAI containers started successfully${NC}"
else
    echo -e "${RED}docker-compose.yml not found in backendAI${NC}"
    exit 1
fi
cd ../..

# Step 4: Build frontend
echo -e "\n${YELLOW}[4/5] Building frontend...${NC}"
cd frontend
if [ -f "package.json" ]; then
    echo -e "${GREEN}Installing frontend dependencies...${NC}"
    npm install
    
    echo -e "${GREEN}Building frontend application...${NC}"
    npm run build
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}Build failed - dist directory not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}Frontend build completed successfully${NC}"
else
    echo -e "${RED}package.json not found in frontend${NC}"
    exit 1
fi

# Step 5: Deploy to production
echo -e "\n${YELLOW}[5/5] Deploying to production server...${NC}"
if [ -d "dist" ]; then
    echo -e "${GREEN}Creating deployment directory if not exists...${NC}"
    mkdir -p "$DEPLOY_PATH"
    rm -rf "$DEPLOY_PATH"/*
    
    echo -e "${GREEN}Backing up existing files...${NC}"
    if [ "$(ls -A $DEPLOY_PATH)" ]; then
        cp -r "$DEPLOY_PATH" "${DEPLOY_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    echo -e "${GREEN}Copying files to deployment directory...${NC}"
    cp -rf dist/* "$DEPLOY_PATH"
        
    echo -e "${GREEN}Deployment completed successfully!${NC}"
else
    echo -e "${RED}dist directory not found${NC}"
    exit 1
fi