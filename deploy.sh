#!/bin/bash
# =============================================================================
# URL Lens Frontend - Deployment Script
# =============================================================================

set -e

echo "🚀 URL Lens Frontend - Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ Warning: .env.local not found${NC}"
    echo ""
    echo "Creating .env.local.example..."
    cat > .env.local.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Playwright for visual analysis (requires Chrome/Chromium)
# PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers
EOF
    echo -e "${YELLOW}Please copy .env.local.example to .env.local and fill in your values${NC}"
else
    echo -e "${GREEN}✓ .env.local found${NC}"

    # Check for required variables
    if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local${NC}"
        exit 1
    fi
    if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local${NC}"
        exit 1
    fi
    if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo -e "${YELLOW}⚠ Warning: SUPABASE_SERVICE_ROLE_KEY not found - guest analysis won't work${NC}"
    fi
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci

# Run type check
echo ""
echo "🔍 Running type check..."
npm run type-check 2>/dev/null || npx tsc --noEmit

# Build the application
echo ""
echo "🔨 Building application..."
npm run build

echo ""
echo "=================================="
echo -e "${GREEN}✅ Frontend Build Complete!${NC}"
echo "=================================="
echo ""

# Deployment options
echo -e "${BLUE}Deployment Options:${NC}"
echo ""
echo "1. ${YELLOW}Local Development:${NC}"
echo "   npm run dev"
echo ""
echo "2. ${YELLOW}Production (Local):${NC}"
echo "   npm start"
echo ""
echo "3. ${YELLOW}Vercel (Recommended):${NC}"
echo "   npx vercel --prod"
echo ""
echo "4. ${YELLOW}Docker:${NC}"
echo "   docker build -t url-lens ."
echo "   docker run -p 3000:3000 url-lens"
echo ""

# Database setup reminder
echo -e "${BLUE}Database Setup:${NC}"
echo ""
echo "Run the following SQL in Supabase SQL Editor:"
echo "  scripts/setup-database.sql"
echo ""
echo "For guest analysis support (MCP server), also run:"
echo "  scripts/migration-guest-analysis.sql"
echo ""
