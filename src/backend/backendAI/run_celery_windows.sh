#!/bin/bash
# Run Celery Worker on Windows (using Git Bash or WSL)
# Alternative to .bat file

echo "Starting Celery Worker for Windows..."
echo ""

# Check if eventlet is installed
if ! python -c "import eventlet" 2>/dev/null; then
    echo "Installing eventlet for Windows compatibility..."
    pip install eventlet
fi

echo ""
echo "Running Celery with eventlet pool..."
echo "Use Ctrl+C to stop"
echo ""

# Run celery with eventlet (Windows compatible)
celery -A backendAI worker --loglevel=info --pool=eventlet --concurrency=4
