#!/bin/bash

# QOIN - The Trading Bot Collective
# Simple launch script for local play

echo "🤖 QOIN - The Trading Bot Collective"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the qoins project directory"
    echo "   Make sure you can see the 'frontend' folder here"
    exit 1
fi

# Move to frontend directory
cd frontend

echo "🚀 Starting QOIN locally..."
echo ""

# Check for Node.js serve (preferred)
if command -v npx &> /dev/null && npx serve --version &> /dev/null 2>&1; then
    echo "📡 Using Node.js serve"
    echo "🎮 Game will be available at: http://localhost:3000"
    echo ""
    echo "Press Ctrl+C to stop"
    echo "===================================="

    # Try to open browser
    sleep 2
    if command -v open &> /dev/null; then
        open "http://localhost:3000" 2>/dev/null &
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3000" 2>/dev/null &
    fi

    npx serve -p 3000

# Fallback to Python
elif command -v python3 &> /dev/null; then
    echo "📡 Using Python HTTP server"
    echo "🎮 Game will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop"
    echo "===================================="

    # Try to open browser
    sleep 2
    if command -v open &> /dev/null; then
        open "http://localhost:8000" 2>/dev/null &
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8000" 2>/dev/null &
    fi

    python3 -m http.server 8000

elif command -v python &> /dev/null; then
    echo "📡 Using Python HTTP server"
    echo "🎮 Game will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop"
    echo "===================================="

    # Try to open browser
    sleep 2
    if command -v open &> /dev/null; then
        open "http://localhost:8000" 2>/dev/null &
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8000" 2>/dev/null &
    fi

    python -m http.server 8000

else
    echo "❌ No web server found!"
    echo ""
    echo "💡 You can still play by opening this file directly:"
    echo "   frontend/index.html"
    echo ""
    echo "🔧 Or install a web server:"
    echo "   npm install -g serve"
    echo "   OR install Python 3"
    exit 1
fi
