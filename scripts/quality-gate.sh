#!/bin/bash

# e-Mam System Quality Gate Audit Script
# Phase 7: Repository Health & Architecture Validation

echo "🚀 Starting Phase 7: Quality Gate Audit..."
set -e

# 1. CLEANUP AUDIT
echo "🧹 Step 1: Repository Cleanup Audit..."
# Check for forbidden files
FORBIDDEN=( ".DS_Store" "node_modules" "dist" "build" ".firebase" "*.log" "backup" )
for item in "${FORBIDDEN[@]}"; do
  if [ -d "$item" ] || [ -f "$item" ]; then
    if [[ "$item" == "node_modules" ]] || [[ "$item" == "dist" ]]; then
       continue
    fi
    echo "⚠️ Warning: Forbidden file/folder found: $item"
  fi
done

# 2. TYPECHECK
echo "🔍 Step 2: Running Typecheck (tsc)..."
npx tsc --noEmit

# 3. LINT
echo "🎨 Step 3: Running Lint (oxlint)..."
npm run lint

# 4. DEAD CODE DETECTION
echo "💀 Step 4: Running Dead Code Detection (knip)..."
npx knip --no-progress

# 5. DEPENDENCY ANALYSIS
echo "🕸️ Step 5: Running Dependency Analysis (dependency-cruiser)..."
npx depcruise src --output-type err-long

# 6. PRODUCTION BUILD
echo "🏗️ Step 6: Running Production Build..."
npm run build

echo "✅ Quality Gate PASSED! Repository is healthy and consistent."
