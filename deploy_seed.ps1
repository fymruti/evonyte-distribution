$env:SUPABASE_ACCESS_TOKEN = "sbp_0820b563c3686474d593f403e6631e290e073331"
Set-Location "D:\evonyte_desktop\evonyte-distribution"

Write-Host "Deploying /seed function..." -ForegroundColor Yellow
npx supabase functions deploy seed --project-ref brobuwegghwjhxlptffk --no-verify-jwt

Write-Host ""
Write-Host "Seeding v1.0.27..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$body = @{
    version = "1.0.27"
    file_name = "evonyte-admin-v1.0.27-windows.zip"
    file_size = 12001979
    changelog = "Modular architecture with NavigationRail, Modern dark theme (AdminTheme), New Settings screen with Brain PC config, Updated Dashboard and Quick Actions design, Auto-update button in Settings"
    secret = "evonyte-seed-2024"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "https://brobuwegghwjhxlptffk.supabase.co/functions/v1/seed" -Method Post -Body $body -ContentType "application/json"
    Write-Host "SUCCESS!" -ForegroundColor Green
    $result | ConvertTo-Json
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing /latest..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
$latest = Invoke-RestMethod -Uri "https://brobuwegghwjhxlptffk.supabase.co/functions/v1/latest"
Write-Host "LIVE VERSION: $($latest.version)" -ForegroundColor Green
