@echo off
REM Run Celery Worker on Windows
REM This script handles Windows-specific Celery configuration

echo Starting Celery Worker for Windows...
echo.

REM Check if eventlet is installed
python -c "import eventlet" 2>NUL
if errorlevel 1 (
    echo Installing eventlet for Windows compatibility...
    pip install eventlet
)

echo.
echo Running Celery with eventlet pool...
echo Use Ctrl+C to stop
echo.

REM Run celery with eventlet (Windows compatible)
celery -A backendAI worker --loglevel=info --pool=eventlet --concurrency=4

pause
