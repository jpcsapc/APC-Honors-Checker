# Quick Setup Script for Feedback System

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "APC Honors Checker - Feedback System Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local file found" -ForegroundColor Green
    
    # Check if GITHUB_TOKEN is set
    $content = Get-Content ".env.local" -Raw
    if ($content -match "GITHUB_TOKEN=ghp_") {
        Write-Host "✓ GITHUB_TOKEN appears to be configured" -ForegroundColor Green
        Write-Host ""
        Write-Host "Setup appears complete! To test:" -ForegroundColor Yellow
        Write-Host "1. Run: npm run dev" -ForegroundColor White
        Write-Host "2. Open: http://localhost:3000/feedback" -ForegroundColor White
        Write-Host "3. Submit a test feedback" -ForegroundColor White
    } elseif ($content -match "GITHUB_TOKEN=your_github") {
        Write-Host "⚠ GITHUB_TOKEN needs to be configured" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Steps to configure:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor White
        Write-Host "2. Click 'Generate new token (classic)'" -ForegroundColor White
        Write-Host "3. Select 'repo' scope" -ForegroundColor White
        Write-Host "4. Copy the generated token" -ForegroundColor White
        Write-Host "5. Edit .env.local and replace 'your_github_personal_access_token_here' with your token" -ForegroundColor White
    } else {
        Write-Host "⚠ GITHUB_TOKEN not found in .env.local" -ForegroundColor Yellow
        Write-Host "Please add: GITHUB_TOKEN=your_token_here" -ForegroundColor White
    }
} else {
    Write-Host "✗ .env.local file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating .env.local from template..." -ForegroundColor Yellow
    
    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" ".env.local"
        Write-Host "✓ .env.local created successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor White
        Write-Host "2. Generate a new token with 'repo' scope" -ForegroundColor White
        Write-Host "3. Edit .env.local and add your token" -ForegroundColor White
    } else {
        Write-Host "✗ .env.local.example not found" -ForegroundColor Red
        Write-Host "Please create .env.local manually with:" -ForegroundColor White
        Write-Host "GITHUB_TOKEN=your_token_here" -ForegroundColor White
        Write-Host "GITHUB_OWNER=jpcsapc" -ForegroundColor White
        Write-Host "GITHUB_REPO=APC-Honors-Checker" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "  - FEEDBACK_SYSTEM.md" -ForegroundColor White
Write-Host "  - TESTING_GUIDE.md" -ForegroundColor White
Write-Host "==================================" -ForegroundColor Cyan
