# SEKWENCJA DEPLOY - Evonyte Admin

## KROK PO KROKU (tylko to robisz):

### 1. BUMP VERSION
```
Pliki do zmiany (wersja X.Y.Z):
- apps/evonyte_admin/pubspec.yaml          → version: X.Y.Z+BUILD
- apps/evonyte_admin/.../admin_main_screen.dart → appVersion = 'X.Y.Z'
```

### 2. BUILD
```powershell
cd D:\evonyte_desktop\apps\evonyte_admin
flutter build windows --release
```

### 3. PACKAGE ZIP
```powershell
cd D:\evonyte_desktop\apps\evonyte_admin\build\windows\x64\runner\Release
Compress-Archive -Path * -DestinationPath "D:\evonyte_desktop\evonyte-distribution\evonyte-admin-vX.Y.Z-windows.zip" -Force
```

### 4. UPDATE version.json
```json
{
  "version": "X.Y.Z",
  "build": BUILD,
  "releaseDate": "YYYY-MM-DD",
  "downloadUrl": "https://github.com/Evonyte/evonyte-distribution/releases/download/vX.Y.Z/evonyte-admin-vX.Y.Z-windows.zip",
  "changelog": [...],
  "mandatory": false,
  "minVersion": "1.0.0"
}
```

### 5. UPDATE Edge Function (supabase/functions/latest/index.ts)
```typescript
const response = {
  version: "X.Y.Z",
  file_name: "evonyte-admin-vX.Y.Z-windows.zip",
  file_size: FILE_SIZE_IN_BYTES,
  changelog: "...",
  released_at: "YYYY-MM-DD",
  download_url: "https://github.com/Evonyte/evonyte-distribution/releases/download/vX.Y.Z/evonyte-admin-vX.Y.Z-windows.zip",
};
```

### 6. DEPLOY TO GITHUB
```powershell
cd D:\evonyte_desktop\evonyte-distribution
git add version.json evonyte-admin-vX.Y.Z-windows.zip supabase/functions/latest/index.ts
git commit -m "Release vX.Y.Z - OPIS"
git push origin master
gh release create vX.Y.Z evonyte-admin-vX.Y.Z-windows.zip --title "Evonyte Admin vX.Y.Z" --notes "CHANGELOG"
```

### 7. DEPLOY EDGE FUNCTION (KRYTYCZNE!)
```powershell
cd D:\evonyte_desktop\evonyte-distribution
$env:SUPABASE_ACCESS_TOKEN = "sbp_0820b563c3686474d593f403e6631e290e073331"
npx supabase functions deploy latest --project-ref brobuwegghwjhxlptffk --no-verify-jwt
```

### 8. VERIFY
```powershell
# Test Supabase endpoint (strona używa tego!)
curl https://brobuwegghwjhxlptffk.supabase.co/functions/v1/latest

# Powinno zwrócić: {"version":"X.Y.Z",...}
```

---

## SZYBKI DEPLOY (jeden skrypt)

```powershell
# deploy_version.ps1 X.Y.Z
# Użycie: .\deploy_version.ps1 1.0.28

param([string]$Version)

$env:SUPABASE_ACCESS_TOKEN = "sbp_0820b563c3686474d593f403e6631e290e073331"
Set-Location "D:\evonyte_desktop\evonyte-distribution"

# 1. Git
git add version.json "evonyte-admin-v$Version-windows.zip" supabase/functions/latest/index.ts
git commit -m "Release v$Version"
git push origin master

# 2. GitHub Release
gh release create "v$Version" "evonyte-admin-v$Version-windows.zip" --title "Evonyte Admin v$Version"

# 3. Deploy Edge Function
npx supabase functions deploy latest --project-ref brobuwegghwjhxlptffk --no-verify-jwt

# 4. Verify
Start-Sleep -Seconds 3
$result = Invoke-RestMethod -Uri "https://brobuwegghwjhxlptffk.supabase.co/functions/v1/latest"
Write-Host "LIVE VERSION: $($result.version)" -ForegroundColor Green
```

---

## CO AKTUALIZUJESZ:

| Plik | Co zmieniasz |
|------|--------------|
| `pubspec.yaml` | version: X.Y.Z+BUILD |
| `admin_main_screen.dart` | appVersion = 'X.Y.Z' |
| `version.json` | version, build, downloadUrl, changelog |
| `supabase/functions/latest/index.ts` | version, file_name, file_size, download_url |
| **`docs/index.html`** | **version-badge, changelog, download link (HARDCODED!)** |

## GDZIE SPRAWDZASZ:

| Endpoint | Co pokazuje |
|----------|-------------|
| **`https://evonyte.com`** | **GŁÓWNA STRONA (docs/index.html) - HARDCODED!** |
| `https://brobuwegghwjhxlptffk.supabase.co/functions/v1/latest` | Edge Function (website/index.html używa) |
| `https://raw.githubusercontent.com/.../version.json` | App update check |
| `https://github.com/Evonyte/evonyte-distribution/releases` | GitHub releases |

---

## BŁĘDY KTÓRYCH NIE ROBISZ:

1. ❌ NIE zapominasz o `docs/index.html` (GŁÓWNA STRONA evonyte.com!)
2. ❌ NIE zapominasz o Edge Function deploy
3. ❌ NIE zostawiasz verify_jwt: true
4. ❌ NIE pomijasz weryfikacji endpoint po deploy
