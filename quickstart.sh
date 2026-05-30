#!/bin/bash
# Quick Start Script for LED & Sensor System

echo "================================"
echo "Aura IoT - LED & Sensor Setup"
echo "================================"
echo ""

# Check if Redis is running
echo "Checking Redis..."
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Redis is not running. Start it with: redis-server"
    exit 1
fi
echo "✅ Redis is running"
echo ""

# Check Python environment
echo "Checking Python environment..."
python --version
echo ""

# Install dependencies
echo "Installing/verifying dependencies..."
pip install -r requirements-iot.txt -q
echo "✅ Dependencies installed"
echo ""

# Run migrations
echo "Running database migrations..."
python manage.py migrate
echo "✅ Migrations complete"
echo ""

# Start services
echo "Starting services..."
echo ""
echo "1️⃣  Django server (main terminal)"
echo "   Command: python manage.py runserver"
echo ""
echo "2️⃣  Celery worker (new terminal)"
echo "   Command: celery -A aura_backend worker -l info"
echo ""
echo "3️⃣  Celery Beat (new terminal)"
echo "   Command: celery -A aura_backend beat -l info"
echo ""
echo "4️⃣  Frontend (new terminal)"
echo "   Command: npm start (or expo start)"
echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Access the app at: http://localhost:8000"
echo "API endpoints: http://localhost:8000/api/"
echo "LED endpoint: http://localhost:8000/api/led/current/"
echo ""
echo "💡 Pro tip: Open multiple terminals/tabs to run all services"
