#!/bin/bash
# Script to start ngrok tunnel for ReadyRent.Gala
# Make sure ngrok is installed: https://ngrok.com/download

echo "Starting ngrok tunnel for Django backend..."

# Default Django port
DJANGO_PORT=8000

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "ERROR: ngrok is not installed!"
    echo "Please install ngrok from: https://ngrok.com/download"
    echo "Or use: brew install ngrok/ngrok/ngrok (macOS)"
    exit 1
fi

echo "ngrok found!"

# Check if Django is running
echo "Checking if Django is running on port $DJANGO_PORT..."
if curl -s http://localhost:$DJANGO_PORT/api/health/ > /dev/null 2>&1; then
    echo "Django is running!"
else
    echo "WARNING: Django doesn't seem to be running on port $DJANGO_PORT"
    echo "Please start Django first with: python manage.py runserver"
    echo "Continuing anyway..."
fi

# Start ngrok
echo ""
echo "Starting ngrok tunnel..."
echo "============================================================"

# Start ngrok in background
ngrok http $DJANGO_PORT > ngrok_output.txt 2>&1 &
NGROK_PID=$!

# Wait a bit for ngrok to start
sleep 3

# Try to get ngrok API URL
if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
    PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$PUBLIC_URL" ]; then
        echo ""
        echo "✅ ngrok tunnel is active!"
        echo "Public URL: $PUBLIC_URL"
        echo ""
        echo "Webhook URLs:"
        echo "  BaridiMob: $PUBLIC_URL/api/payments/webhooks/baridimob/"
        echo "  Bank Card: $PUBLIC_URL/api/payments/webhooks/bank-card/"
        echo ""
        echo "Update your .env file with:"
        echo "  BACKEND_URL=$PUBLIC_URL"
        echo "  FRONTEND_URL=$PUBLIC_URL"
    fi
else
    echo ""
    echo "⚠️  Could not get ngrok URL automatically"
    echo "Check ngrok web interface at: http://localhost:4040"
    echo "Or check the output file: ngrok_output.txt"
fi

echo ""
echo "ngrok is running (PID: $NGROK_PID). Press Ctrl+C to stop..."

# Trap Ctrl+C and stop ngrok
trap "echo ''; echo 'Stopping ngrok...'; kill $NGROK_PID 2>/dev/null; exit" INT

# Keep script running
wait $NGROK_PID
