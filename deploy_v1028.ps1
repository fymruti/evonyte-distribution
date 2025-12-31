$env:SUPABASE_ACCESS_TOKEN = "sbp_0820b563c3686474d593f403e6631e290e073331"
Set-Location "D:\evonyte_desktop\evonyte-distribution"

Write-Host "1. Seeding v1.0.28 to database..." -ForegroundColor Yellow
$body = @{
    version = "1.0.28"
    file_name = "evonyte-admin-v1.0.28-windows.zip"
    file_size = 12004733
    changelog = "Fixed: Auto-update button now works correctly. Fixed: Settings shows correct current version. Update dialog with changelog and download button."
    secret = "evonyte-seed-2024"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "https://brobuwegghwjhxlptffk.supabase.co/functions/v1/seed" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Database seeded: v$($result.data.version)" -ForegroundColor Green
} catch {
    Write-Host "Seed error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Git push..." -ForegroundColor Yellow
git add version.json evonyte-admin-v1.0.28-windows.zip
git commit -m "Release v1.0.28 - Fixed auto-update, correct version display"
git push origin master

Write-Host ""
Write-Host "3. Creating GitHub release..." -ForegroundColor Yellow
gh release create v1.0.28 evonyte-admin-v1.0.28-windows.zip --title "Evonyte Admin v1.0.28" --notes "Fixed: Auto-update button now works correctly`nFixed: Settings shows correct current version`nUpdate dialog with changelog and download button"

Write-Host ""
Write-Host "4. Verifying endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
$latest = Invoke-RestMethod -Uri "https://brobuwegghwjhxlptffk.supabase.co/functions/v1/latest"
Write-Host "LIVE VERSION: $($latest.version)" -ForegroundColor Green
