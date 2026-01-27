#!/bin/bash

# =============================================================================
# URL Lens - Vercel Deployment Script
# =============================================================================

set -e

echo "🚀 URL Lens - Vercel Deployment"
echo "================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo ""
    echo "⚠️  Environment variables not set!"
    echo ""
    echo "Please set the following environment variables:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    echo "You can either:"
    echo "  1. Export them in your terminal before running this script"
    echo "  2. Set them in the Vercel dashboard after deployment"
    echo ""
    read -p "Continue without environment variables? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Production or Preview deployment
echo ""
echo "Select deployment type:"
echo "  1) Production (main branch)"
echo "  2) Preview (creates unique URL)"
read -p "Choice (1/2): " -n 1 -r DEPLOY_TYPE
echo ""

if [[ $DEPLOY_TYPE == "1" ]]; then
    echo "🚀 Deploying to Production..."
    vercel --prod
else
    echo "🔍 Creating Preview deployment..."
    vercel
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
echo "  2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  3. Redeploy if you added env vars after deployment"
echo ""
echo "🔗 Don't forget to update your Supabase settings:"
echo "  - Add your Vercel URL to 'Site URL' in Authentication settings"
echo "  - Add your Vercel URL to 'Redirect URLs' in Authentication settings"
