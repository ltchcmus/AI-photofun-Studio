#!/bin/bash
# Quick install script - Cài đặt requirements đã sửa

echo "========================================="
echo "INSTALLING REQUIREMENTS"
echo "========================================="

# Deactivate any existing virtual environment
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "Deactivating existing virtual environment..."
    deactivate 2>/dev/null || true
fi

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "Error: requirements.txt not found in current directory"
    exit 1
fi

echo ""
echo "Installing from requirements.txt..."
echo ""

pip install --upgrade pip

# Try to install all requirements
if pip install -r requirements.txt; then
    echo ""
    echo "✅ Installation successful!"
    echo ""
    echo "Checking installed packages..."
    echo ""
    
    # Check critical packages
    python3 -c "import django; print(f'✅ Django {django.VERSION}')" 2>/dev/null || echo "❌ Django not found"
    python3 -c "import rest_framework; print('✅ DRF installed')" 2>/dev/null || echo "❌ DRF not found"
    python3 -c "import celery; print(f'✅ Celery installed')" 2>/dev/null || echo "❌ Celery not found"
    python3 -c "import pymongo; print('✅ PyMongo installed')" 2>/dev/null || echo "❌ PyMongo not found"
    python3 -c "import psycopg2; print('✅ psycopg2 installed')" 2>/dev/null || echo "❌ psycopg2 not found"
    python3 -c "from google import genai; print('✅ Google Generative AI installed')" 2>/dev/null || echo "❌ google-generativeai not found"
    python3 -c "from PIL import Image; print('✅ Pillow installed')" 2>/dev/null || echo "❌ Pillow not found"
    python3 -c "import redis; print('✅ Redis installed')" 2>/dev/null || echo "❌ Redis not found"
    python3 -c "import requests; print('✅ Requests installed')" 2>/dev/null || echo "❌ Requests not found"
    
    echo ""
    echo "========================================="
    echo "✅ ALL DONE!"
    echo "========================================="
    echo ""
    echo "You can now run:"
    echo "  python manage.py runserver 0.0.0.0:9999"
    echo "  celery -A backendAI worker --loglevel=info"
    echo ""
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Try installing minimal requirements:"
    echo "  pip install -r requirements-minimal.txt"
    echo ""
    exit 1
fi
