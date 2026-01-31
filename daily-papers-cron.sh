#!/bin/bash
# Daily Papers Cron Script - Runs at 8 AM
# This script runs the paper fetcher and sends WhatsApp notification

cd /Users/icetomoyo/clawd

# Run the paper fetcher
node skills/daily-papers-x/scripts/fetch-papers.js > /tmp/papers-output.log 2>&1

# Extract WhatsApp message from output
if grep -q "---WHATSAPP_MESSAGE_START---" /tmp/papers-output.log; then
    # Extract message between markers
    MSG=$(sed -n '/---WHATSAPP_MESSAGE_START---/,/---WHATSAPP_MESSAGE_END---/p' /tmp/papers-output.log | sed '1d;$d')
    
    # Send via Moltbot (requires moltbot CLI to be configured)
    echo "$MSG" | moltbot message send --to +8613466571167 --channel whatsapp --message - 2>/dev/null || echo "Message ready in memory/"
fi

echo "Daily papers completed at $(date)"
