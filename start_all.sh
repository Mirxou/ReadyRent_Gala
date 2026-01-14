#!/bin/bash
# Script to start ngrok, Django backend, and Next.js frontend
# For ReadyRent.Gala project

echo "========================================"
echo "  ReadyRent.Gala - Development Server"
echo "========================================"
echo ""

# Check if ngrok is installed
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok is installed"
    NGROK_INSTALLED=true
else
    echo "⚠️  ngrok is not installed"
    echo "   Install from: https://ngrok.com/download"
    NGROK_INSTALLED=false
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
    echo "✅ Python found: $(python3 --version)"
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
    echo "✅ Python found: $(python --version)"
else
    echo "❌ Python is not installed!"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
else
    echo "❌ Node.js is not installed!"
    exit 1
fi

echo ""
echo "Starting services..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    if [ ! -z "$NGROK_PID" ]; then
        kill $NGROK_PID 2>/dev/null
    fi
    echo "All services stopped."
    exit
}

trap cleanup INT TERM

# Start Django Backend
echo "1. Starting Django Backend..."
cd backend
$PYTHON_CMD manage.py runserver 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3
echo "   ✅ Backend started (PID: $BACKEND_PID)"

# Start Next.js Frontend
echo "2. Starting Next.js Frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3
echo "   ✅ Frontend started (PID: $FRONTEND_PID)"

# Start ngrok if installed
if [ "$NGROK_INSTALLED" = true ]; then
    echo "3. Starting ngrok tunnel..."
    ngrok http 8000 > ngrok.log 2>&1 &
    NGROK_PID=$!
    sleep 4
    
    # Try to get ngrok URL
    if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | head -1 | cut -d'"' -f4)
        if [ ! -z "$PUBLIC_URL" ]; then
            echo "   ✅ ngrok tunnel active!"
            echo ""
            echo "========================================"
            echo "  Services are running!"
            echo "========================================"
            echo ""
            echo "Backend (Local):    http://localhost:8000"
            echo "Frontend (Local):   http://localhost:3000"
            echo "ngrok (Public):     $PUBLIC_URL"
            echo ""
            echo "Webhook URLs:"
            echo "  BaridiMob:  $PUBLIC_URL/api/payments/webhooks/baridimob/"
            echo "  Bank Card:  $PUBLIC_URL/api/payments/webhooks/bank-card/"
            echo ""
            echo "Update .env with:"
            echo "  BACKEND_URL=$PUBLIC_URL"
            echo "  FRONTEND_URL=$PUBLIC_URL"
        fi
    else
        echo "   ⚠️  ngrok started but URL not available yet"
        echo "   Check: http://localhost:4040"
    fi
else
    echo "3. Skipping ngrok (not installed)"
    echo ""
    echo "========================================"
    echo "  Services are running!"
    echo "========================================"
    echo ""
    echo "Backend:  http://localhost:8000"
    echo "Frontend: http://localhost:3000"
fi

echo ""
echo "Press Ctrl+C to stop all services..."
echo "Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo "  ngrok:    tail -f ngrok.log"
echo ""

# Wait for processes
wait
