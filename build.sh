#!/bin/bash

# QOINbots Build Script for Cloudflare Pages
# Prepares the static frontend for deployment

echo "🤖 Building QOINbots for deployment..."
echo "===================================="

# Clean any existing build
rm -rf dist/
rm -rf build/

# Create output directory
mkdir -p dist/

# Build Svelte frontend
echo "📁 Building Svelte frontend..."
cd frontend-svelte

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the Svelte project
echo "🔨 Building with Vite..."
npm run build

# Go back to root directory
cd ..

# Copy built files to dist
echo "📁 Copying built files..."
cp -r frontend-svelte/dist/* dist/

# Copy root files that might be needed
echo "📄 Copying root configuration files..."
if [ -f "README.md" ]; then
    cp README.md dist/
fi

# Create a simple robots.txt for SEO
echo "🤖 Creating robots.txt..."
cat > dist/robots.txt << EOF
User-agent: *
Allow: /

Sitemap: https://qoinbots.com/sitemap.xml
EOF

# Create a basic sitemap.xml
echo "🗺️ Creating sitemap.xml..."
cat > dist/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://qoinbots.com/</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
EOF

# Create _redirects file for Cloudflare Pages SPA routing
echo "🔀 Creating redirects..."
cat > dist/_redirects << EOF
# QOINbots redirects for Cloudflare Pages

# Main game routes to index.html
/ /index.html 200
/play /index.html 200
/game /index.html 200

# Demo routes
/demo /qoin_demo.html 200
/test /test.html 200

# 404 fallback
/* /index.html 404
EOF

# Create a simple _headers file for security and performance
echo "🔒 Creating headers configuration..."
cat > dist/_headers << EOF
# QOINbots security and performance headers

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=3600

/index.html
  Cache-Control: public, max-age=300
EOF

echo ""
echo "✅ Build complete!"
echo "📦 Output directory: dist/"
echo "🌐 Ready for deployment to qoinbots.com"
echo ""
echo "Files created:"
ls -la dist/ | head -10
echo ""
echo "🚀 Deploy with: Cloudflare Pages → Connect to Git → Build command: ./build.sh → Publish directory: dist"
