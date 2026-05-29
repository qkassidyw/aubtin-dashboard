#!/bin/bash
# Daily sync script - pulls latest Fireflies calls and regenerates metrics

cd "$(dirname "$0")/.."

echo "$(date): Starting daily Fireflies sync..."

# Sync calls from Fireflies
node scripts/sync-fireflies.js

# Process calls and generate metrics
node scripts/process-calls.js

# Commit and push updates
git add data/*.json
git commit -m "Daily sync: $(date +%Y-%m-%d)" || echo "No changes to commit"
git push origin main

echo "$(date): Sync complete"
