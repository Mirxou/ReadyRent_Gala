# Script to fix all test URLs and user creation issues

$files = @(
    "tests/unit/test_reviews_views.py",
    "tests/unit/test_vendors_views.py",
    "tests/unit/test_warranties_views.py",
    "tests/unit/test_packaging_views.py",
    "tests/unit/test_branches_views.py"
)

foreach ($file in $files) {
    Write-Host "Fixing $file..."
    
    # Read content
    $content = Get-Content $file -Raw
    
    # Fix URLs - remove /v1 from all API paths
    $content = $content -replace '/api/v1/', '/api/'
    
    # Fix User.objects.create_user without username
    # Pattern: User.objects.create_user(\n            email='...@test.com',\n            password='...')
    $content = $content -replace "User\.objects\.create_user\(\s*email='([^']+)',\s*password='([^']+)'\s*\)", "User.objects.create_user(email='`$1', username='user_`$1', password='`$2')"
    $content = $content -replace "User\.objects\.create_user\(email='([^']+)',\s*password='([^']+)'\)", "User.objects.create_user(email='`$1', username='user_`$1', password='`$2')"
    
    # Write back
    Set-Content -Path $file -Value $content -NoNewline
    Write-Host "✅ Fixed $file"
}

Write-Host "`n✅ All files fixed!"
