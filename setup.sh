#!/bin/bash

# Social Proof Generator - Quick Setup Script
# This script helps you get the application running locally for testing

echo "🚀 Social Proof Generator - Quick Setup"
echo "======================================"

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
else
    echo "✅ Netlify CLI already installed"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file for local testing
if [ ! -f .env ]; then
    echo "📝 Creating local environment file..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your actual credentials before running!"
    echo "   - Supabase URL and keys"
    echo "   - Email service credentials"
    echo ""
fi

echo "🔧 Setup complete! Next steps:"
echo ""
echo "1. Edit .env file with your credentials"
echo "2. Run: netlify dev"
echo "3. Visit:"
echo "   - Admin Panel: http://localhost:8888/admin"
echo "   - Public Form: http://localhost:8888/submit"
echo ""
echo "📚 See SETUP-CHECKLIST.md for detailed deployment instructions"
