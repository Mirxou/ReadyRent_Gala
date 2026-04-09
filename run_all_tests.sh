#!/bin/bash

echo "Running All Tests for ReadyRent.Gala..."

echo ""
echo "=== BACKEND TESTS ==="
cd "c:\Users\aboun\Desktop\ReadyRent_Gala\backend"
echo "Running backend tests with coverage..."
python -m pytest --cov=apps --cov-report=term-missing --cov-report=html --cov-report=json --tb=short -v

if [ $? -ne 0 ]; then
    echo "Backend tests failed!"
    exit 1
fi

echo ""
echo "=== FRONTEND UNIT TESTS ==="
cd "c:\Users\aboun\Desktop\ReadyRent_Gala\frontend"
echo "Running frontend unit tests..."
npm run test

if [ $? -ne 0 ]; then
    echo "Frontend unit tests failed!"
    exit 1
fi

echo ""
echo "=== FRONTEND E2E TESTS ==="
echo "Running frontend E2E tests..."
npm run test:e2e

if [ $? -ne 0 ]; then
    echo "Frontend E2E tests failed!"
    exit 1
fi

echo ""
echo "All tests completed successfully!"
echo "Check the following for results:"
echo "- Backend coverage: backend/htmlcov/index.html"
echo "- Frontend coverage: frontend/coverage/lcov-report/index.html"