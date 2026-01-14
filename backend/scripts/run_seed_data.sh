#!/bin/bash
# Script to run seed_data command
# This script runs the seed_data management command

echo "========================================"
echo "Running Seed Data Command"
echo "========================================"
echo ""

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo "Running seed_data command..."
python manage.py seed_data

echo ""
echo "========================================"
echo "Seed data completed!"
echo "========================================"
echo ""

