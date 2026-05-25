#!/bin/bash
# Fail-safe checkpoint generator & test runner for GPEG Command Center

CHECKPOINT_NAME=$1
if [ -z "$CHECKPOINT_NAME" ]; then
  echo "Usage: ./run_checkpoint.sh <checkpoint_tag_name>"
  exit 1
fi

# Initialize git workspace if not already tracked
if [ ! -d ".git" ]; then
  echo "Initializing git tracking baseline..."
  git init
  git add .
  git commit -m "Initial tracking baseline"
fi

# Run Regression tests first
echo "Running regression tests..."
python3 src/gpeg_ingestion_engine.py > /dev/null 2>&1
INGEST_EXIT=$?

python3 src/gpeg_quality_auditor.py > /dev/null 2>&1
AUDIT_EXIT=$?

if [ $INGEST_EXIT -eq 0 ] && [ $AUDIT_EXIT -eq 0 ]; then
  echo "✅ Regression tests passed successfully."
  git add -A
  # Avoid committing nothing if files are unchanged
  git diff-index --quiet HEAD -- || git commit -m "Checkpoint pre-change: $CHECKPOINT_NAME"
  git tag -f "$CHECKPOINT_NAME"
  echo "Checkpoint created successfully: $CHECKPOINT_NAME"
else
  echo "❌ Test suite failed! Refusing to save broken state as a baseline checkpoint."
  exit 1
fi
