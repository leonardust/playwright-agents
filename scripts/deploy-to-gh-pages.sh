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

# Function to generate report list HTML
generate_report_list() {
  local type=$1
  local reports=""
  
  if [ -d "pages/$type" ]; then
    # Get all timestamped directories, sorted newest first
    for dir in $(ls -1 "pages/$type" 2>/dev/null | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r | head -20); do
      # Parse timestamp to readable format
      local date_part="${dir:0:8}"
      local time_part="${dir:9:6}"
      local formatted_date="${date_part:0:4}-${date_part:4:2}-${date_part:6:2}"
      local formatted_time="${time_part:0:2}:${time_part:2:2}:${time_part:4:2}"
      
      reports+="        <li><a href=\"$type/$dir/\" class=\"history-link\">📅 $formatted_date $formatted_time UTC</a></li>\n"
    done
  fi
  
  if [ -z "$reports" ]; then
    reports="        <li class=\"empty-state\">No historical reports yet</li>\n"
  fi
  
  echo -e "$reports"
}

# Get report lists
SELF_HOSTED_REPORTS=$(generate_report_list "self-hosted")
GITHUB_HOSTED_REPORTS=$(generate_report_list "github-hosted")

# Create/update index.html for root
cat > pages/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Playwright Test Reports</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      max-width: 1200px; 
      margin: 0 auto; 
      padding: 40px 20px;
      background: #f6f8fa;
      color: #24292f;
    }
    h1 { 
      color: #2ea44f; 
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #656d76;
      margin-bottom: 40px;
      font-size: 1.1em;
    }
    .report-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .report-section h2 {
      color: #24292f;
      margin-bottom: 20px;
      font-size: 1.5em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .latest-link {
      display: inline-block;
      padding: 12px 24px;
      background: #2ea44f;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: background 0.2s;
      margin-bottom: 20px;
    }
    .latest-link:hover {
      background: #2c974b;
    }
    .history-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #d0d7de;
    }
    .history-section h3 {
      color: #656d76;
      font-size: 1em;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .history-list {
      list-style: none;
      max-height: 300px;
      overflow-y: auto;
    }
    .history-list li {
      margin-bottom: 8px;
    }
    .history-link {
      display: block;
      padding: 10px 15px;
      background: #f6f8fa;
      color: #0969da;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.2s;
      font-size: 0.95em;
    }
    .history-link:hover {
      background: #e7edf3;
    }
    .empty-state {
      color: #656d76;
      font-style: italic;
      padding: 10px 15px;
    }
    .timestamp {
      color: #656d76;
      font-size: 0.9em;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <h1>🎭 Playwright Test Reports</h1>
  <p class="subtitle">Latest test results and historical reports</p>
  
  <div class="report-section">
    <h2>💻 Self-Hosted Runner Tests</h2>
    <a href="self-hosted/latest/" class="latest-link">View Latest Report →</a>
    <div class="timestamp">Last updated: $CURRENT_TIME</div>
    
    <div class="history-section">
      <h3>📚 Report History (Last 20)</h3>
      <ul class="history-list">
$SELF_HOSTED_REPORTS
      </ul>
    </div>
  </div>
  
  <div class="report-section">
    <h2>☁️ GitHub-Hosted Runner Tests</h2>
    <a href="github-hosted/latest/" class="latest-link">View Latest Report →</a>
    <div class="timestamp">Last updated: $CURRENT_TIME</div>
    
    <div class="history-section">
      <h3>📚 Report History (Last 20)</h3>
      <ul class="history-list">
$GITHUB_HOSTED_REPORTS
      </ul>
    </div>
  </div>
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
echo "🔗 Latest: https://leonardust.github.io/playwright-agents/$REPORT_TYPE/latest/"
echo "🔗 All Reports: https://leonardust.github.io/playwright-agents/"

# Add to GitHub Step Summary if available
if [ -n "$GITHUB_STEP_SUMMARY" ]; then
  echo "" >> "$GITHUB_STEP_SUMMARY"
  echo "✅ Report deployed successfully!" >> "$GITHUB_STEP_SUMMARY"
  echo "" >> "$GITHUB_STEP_SUMMARY"
  echo "📊 **Latest Report:** https://leonardust.github.io/playwright-agents/$REPORT_TYPE/latest/" >> "$GITHUB_STEP_SUMMARY"
  echo "" >> "$GITHUB_STEP_SUMMARY"
  echo "📚 **All Reports:** https://leonardust.github.io/playwright-agents/" >> "$GITHUB_STEP_SUMMARY"
fi
