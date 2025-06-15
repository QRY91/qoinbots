#!/bin/bash

# QOINbots - The Trading Bot Collective (Svelte Version)
# Local development server launcher

echo "🤖 QOINbots - The Trading Bot Collective (Svelte)"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -d "frontend-svelte" ] || [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the qoinbots project directory"
    echo "   Make sure you can see the 'frontend-svelte' folder here"
    exit 1
fi

# Move to Svelte frontend directory
cd frontend-svelte

echo "🚀 Starting QOINbots development server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
    echo ""
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found!"
    echo ""
    echo "💡 Please install Node.js and npm:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "📡 Starting Vite development server"
echo "🎮 Game will be available at: http://localhost:4500"
echo ""
echo "Features:"
echo "  - 🔥 Hot reload for development"
echo "  - 🐛 Debug functions at window.qoinDebug"
echo "  - 📊 Browser console shows trading activity"
echo ""
echo "💡 Manual browser open: http://localhost:4500"
echo "Press Ctrl+C to stop"
echo "================================================"

# Start the development server
npm run dev
