# Redeploy /latest function
$env:SUPABASE_ACCESS_TOKEN = "sbp_0820b563c3686474d593f403e6631e290e073331"
Set-Location "D:\evonyte_desktop\evonyte-distribution"

Write-Host "Deploying /latest function..." -ForegroundColor Yellow
npx supabase functions deploy latest --project-ref brobuwegghwjhxlptffk --no-verify-jwt

Write-Host ""
Write-Host "Testing endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$result = Invoke-RestMethod -Uri "https://brobuwegghwjhxlptffk.supabase.co/functions/v1/latest" -ErrorAction SilentlyContinue
if ($result) {
    Write-Host "SUCCESS! Version: $($result.version)" -ForegroundColor Green
} else {
    Write-Host "FAILED - check logs" -ForegroundColor Red
}
