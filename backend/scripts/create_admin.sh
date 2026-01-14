#!/bin/bash
# Script to create demo admin user
# This script runs the create_demo_admin management command

echo "========================================"
echo "Creating Demo Admin User"
echo "========================================"
echo ""

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo "Running create_demo_admin command..."
python manage.py create_demo_admin

echo ""
echo "========================================"
echo "Admin user created!"
echo "========================================"
echo "Default credentials:"
echo "Email: admin@readyrent.gala"
echo "Password: admin123"
echo ""

