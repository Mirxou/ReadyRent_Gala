#!/bin/bash
# Script to run frontend tests with coverage report

echo "Running Frontend Tests with Coverage..."

# Run tests with coverage
npm run test:coverage

echo ""
echo "Coverage report generated in coverage/ directory"
echo "Open coverage/lcov-report/index.html in your browser to view the detailed coverage report"

