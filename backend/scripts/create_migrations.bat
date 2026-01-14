@echo off
REM Script to create migrations for all apps (Windows)

echo Creating migrations for all apps...

python manage.py makemigrations users
python manage.py makemigrations products
python manage.py makemigrations bookings
python manage.py makemigrations inventory
python manage.py makemigrations maintenance
python manage.py makemigrations returns
python manage.py makemigrations locations
python manage.py makemigrations hygiene
python manage.py makemigrations packaging
python manage.py makemigrations warranties
python manage.py makemigrations bundles
python manage.py makemigrations local_guide
python manage.py makemigrations artisans
python manage.py makemigrations chatbot
python manage.py makemigrations analytics
python manage.py makemigrations notifications

echo All migrations created!
python manage.py makemigrations --dry-run

pause

