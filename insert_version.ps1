$body = @{
    version = "1.0.27"
    file_name = "evonyte-admin-v1.0.27-windows.zip"
    file_path = "releases/evonyte-admin-v1.0.27-windows.zip"
    file_size = 12001979
    changelog = "Modular architecture with NavigationRail, Modern dark theme (AdminTheme), New Settings screen with Brain PC config, Updated Dashboard and Quick Actions design, Auto-update button in Settings"
    is_latest = $true
    is_active = $true
} | ConvertTo-Json

$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyb2J1d2VnZ2h3amh4bHB0ZmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NTEwOTcsImV4cCI6MjA1MTIyNzA5N30.BVKyFXDVkqt_bXBKbqVT3S8i5bmlMJZB-nBXvWu55as"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyb2J1d2VnZ2h3amh4bHB0ZmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NTEwOTcsImV4cCI6MjA1MTIyNzA5N30.BVKyFXDVkqt_bXBKbqVT3S8i5bmlMJZB-nBXvWu55as"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

try {
    $result = Invoke-RestMethod -Uri "https://brobuwegghwjhxlptffk.supabase.co/rest/v1/versions" -Method Post -Headers $headers -Body $body
    Write-Host "SUCCESS! Inserted version:" -ForegroundColor Green
    $result | ConvertTo-Json
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Response
}
