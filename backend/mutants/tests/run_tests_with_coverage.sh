#!/bin/bash
# Script to run tests with coverage report

echo "Running Backend Tests with Coverage..."

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run tests with coverage
pytest \
    --cov=apps \
    --cov=config \
    --cov=core \
    --cov-report=html \
    --cov-report=term \
    --cov-report=xml \
    --cov-fail-under=80 \
    -v

echo ""
echo "Coverage report generated in htmlcov/index.html"
echo "Open htmlcov/index.html in your browser to view the detailed coverage report"

