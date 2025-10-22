#!/bin/bash
# Complete rebuild script for Hardhat Docker container

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${RED}       ---------------NEKTAK DAO ---------------${NC}"
echo -e "${BLUE}  Hardhat Docker Container Rebuild Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Step 1: Update dependencies
echo -e "${YELLOW}[1/5]${NC} Updating package.json with OpenZeppelin..."
cd contracts

# Backup existing package-lock.json
# if [ -f "package-lock.json" ]; then
#     cp package-lock.json package-lock.json.backup
#     echo -e "${GREEN}✓${NC} Backed up package-lock.json"
# fi

# Remove node_modules and lock file
echo -e "${YELLOW}[2/5]${NC} Cleaning Docker containers and volumes"
docker system prune -a --volumes
echo -e "${GREEN}✓${NC} Cleaned"



# Remove node_modules and lock file
echo -e "${YELLOW}[2/5]${NC} Cleaning local node_modules and package-lock.json"
rm -rf node_modules package-lock.json
echo -e "${GREEN}✓${NC} Cleaned"

# Install dependencies
echo -e "${YELLOW}[3/5]${NC} Installing dependencies with OpenZeppelin..."
npm install --legacy-peer-deps
echo -e "${GREEN}✓${NC} Dependencies installed"

cd ..

# Step 2: Clean Docker
echo -e "${YELLOW}[4/5]${NC} Cleaning Docker containers and volumes..."
docker compose -f docker-compose.dev.yml down -v 2>/dev/null || true
echo -e "${GREEN}✓${NC} Docker cleaned"

# Step 3: Rebuild image
echo -e "${YELLOW}[5/5]${NC} Building Docker image (this may take a few minutes)..."
docker compose -f docker-compose.dev.yml build hardhat-cli --no-cache

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✓ HardHat Container - Rebuild Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. ${BLUE}./hardhat.sh shell${NC}        - Enter container"
echo -e "  2. ${BLUE}npx hardhat compile${NC}       - Compile contracts"
echo -e "  3. ${BLUE}npx hardhat test${NC}          - Run tests"
echo ""