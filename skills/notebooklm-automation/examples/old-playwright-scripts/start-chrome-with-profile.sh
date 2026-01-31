#!/bin/bash
# Start Chrome with your existing profile for NotebookLM

CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome"

echo "Starting Chrome with your existing profile..."
echo "Make sure you are logged into Google before running the automation."

"$CHROME_PATH" \
  --remote-debugging-port=9222 \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  https://notebooklm.google.com
