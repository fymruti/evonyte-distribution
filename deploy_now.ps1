# Quick deploy script for v1.0.27
$env:SUPABASE_ACCESS_TOKEN = "sbp_0820b563c3686474d593f403e6631e290e073331"
Set-Location "D:\evonyte_desktop\evonyte-distribution"
npx supabase functions deploy latest --project-ref brobuwegghwjhxlptffk
