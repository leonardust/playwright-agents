#!/bin/bash
set -e

# Usage: ./deploy-to-gh-pages.sh <report-type> <github-token>

REPORT_TYPE=$1
GITHUB_TOKEN=$2

if [ -z "$REPORT_TYPE" ] || [ -z "$GITHUB_TOKEN" ]; then
  echo "Usage: $0 <report-type> <github-token>"
  exit 1
fi

echo "🚀 Starting deployment for $REPORT_TYPE report..."

# Create pages directory
mkdir -p pages

# Copy existing gh-pages content if it exists
if [ -d "gh-pages-content" ] && [ "$(ls -A gh-pages-content 2>/dev/null | grep -v '.git')" ]; then
  echo "📋 Copying existing Pages content..."
  cp -r gh-pages-content/. pages/ 2>/dev/null || true
  rm -rf pages/.git
fi

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
CURRENT_TIME=$(date -u +"%Y-%m-%d %H:%M UTC")

echo "📦 Deploying $REPORT_TYPE report with timestamp: $TIMESTAMP"

# Save report with timestamp
mkdir -p "pages/$REPORT_TYPE/$TIMESTAMP"
cp -r playwright-report/* "pages/$REPORT_TYPE/$TIMESTAMP/"

# Update 'latest' folder (overwrite)
mkdir -p "pages/$REPORT_TYPE/latest"
rm -rf "pages/$REPORT_TYPE/latest"/*
cp -r playwright-report/* "pages/$REPORT_TYPE/latest/"

# Create/update index.html for root
cat > pages/index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <title>Playwright Test Reports</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #2ea44f; }
    .report-link { display: block; padding: 15px; margin: 10px 0; background: #f6f8fa; border-radius: 6px; text-decoration: none; color: #0969da; }
    .report-link:hover { background: #e7edf3; }
    .timestamp { color: #656d76; font-size: 14px; }
  </style>
</head>
<body>
  <h1>🎭 Playwright Test Reports</h1>
  <a href="self-hosted/latest/" class="report-link">
    📊 Self-Hosted Runner Tests
    <div class="timestamp">Latest: $CURRENT_TIME</div>
  </a>
  <a href="github-hosted/latest/" class="report-link">
    📊 GitHub-Hosted Runner Tests
    <div class="timestamp">Latest: $CURRENT_TIME</div>
  </a>
</body>
</html>
EOF

# Deploy to gh-pages branch
echo "🔧 Configuring git..."
cd pages
git init
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

echo "📤 Pushing to gh-pages branch..."
git add .
git commit -m "Deploy $REPORT_TYPE report - $TIMESTAMP"
git branch -M gh-pages
git push -f "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" gh-pages

echo "✅ Report deployed successfully!"
echo "🔗 View at: https://leonardust.github.io/playwright-agents/$REPORT_TYPE/latest/"

# Add to GitHub Step Summary if available
if [ -n "$GITHUB_STEP_SUMMARY" ]; then
  echo "✅ Report deployed to: https://leonardust.github.io/playwright-agents/$REPORT_TYPE/latest/" >> "$GITHUB_STEP_SUMMARY"
fi
