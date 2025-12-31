# DEPLOYMENT GUIDE - Evonyte Admin App

**Wersja:** 1.0 (Przetestowane 31.12.2025 - Session #80)
**Status:** DZIAŁA W 100%

---

## SEKWENCJA DEPLOYMENT (10 KROKÓW)

### KROK 1: Ustaw wersję w pubspec.yaml

```
Plik: D:\evonyte_desktop\apps\evonyte_admin\pubspec.yaml
Linia: version: X.X.X+XX
```

**Przykład:** `version: 1.0.25+25` → `version: 1.0.26+26`

---

### KROK 2: Clean Build

```bash
cd /d/evonyte_desktop/apps/evonyte_admin
flutter clean
flutter pub get
flutter build windows --release
```

**Output:** `build\windows\x64\runner\Release\` (zawiera .exe + .dll)
**Czas:** ~3-5 minut

---

### KROK 3: Spakuj do ZIP

```bash
cd /d/evonyte_desktop/apps/evonyte_admin/build/windows/x64/runner/Release
powershell -Command "Compress-Archive -Path * -DestinationPath evonyte-admin-vX.X.X-windows.zip -Force"
```

**Zmień X.X.X na numer wersji!**

---

### KROK 4: Przenieś ZIP do evonyte-distribution

```bash
cp evonyte-admin-vX.X.X-windows.zip /d/evonyte_desktop/evonyte-distribution/
```

---

### KROK 5: Utwórz GitHub Release + Upload ZIP

```bash
cd /d/evonyte_desktop/evonyte-distribution
gh release create vX.X.X evonyte-admin-vX.X.X-windows.zip --title "Evonyte Admin vX.X.X" --notes "Changelog here"
```

**Rezultat:** `https://github.com/Evonyte/evonyte-distribution/releases/download/vX.X.X/evonyte-admin-vX.X.X-windows.zip`

---

### KROK 6: Update version.json

```
Plik: D:\evonyte_desktop\evonyte-distribution\version.json
```

**Zmień:**
```json
{
  "version": "X.X.X",
  "build": XX,
  "releaseDate": "YYYY-MM-DD",
  "downloadUrl": "https://github.com/Evonyte/evonyte-distribution/releases/download/vX.X.X/evonyte-admin-vX.X.X-windows.zip",
  "changelog": ["..."],
  "mandatory": false,
  "minVersion": "1.0.0"
}
```

---

### KROK 7: Update docs/index.html (4 miejsca!)

```
Plik: D:\evonyte_desktop\evonyte-distribution\docs\index.html
```

**Znajdź i zamień (4 lokalizacje):**

1. **Linia ~553:** `<span class="version-badge">vX.X.X</span>`
2. **Linia ~581:** `<h3>📝 Co nowego w vX.X.X</h3>`
3. **Linia ~592:** Download URL z nową wersją
4. **Linia ~596:** `Pobierz Evonyte Admin App vX.X.X`

**Również zaktualizuj datę wydania (linia ~576)**

---

### KROK 8: Update /latest Edge Function

```
Plik: D:\evonyte_desktop\evonyte-distribution\supabase\functions\latest\index.ts
```

**Zmień w response object:**
```typescript
const response = {
  version: "X.X.X",
  file_name: "evonyte-admin-vX.X.X-windows.zip",
  file_size: ROZMIAR_W_BAJTACH,
  changelog: "...",
  released_at: "YYYY-MM-DD",
  download_url: "https://github.com/Evonyte/evonyte-distribution/releases/download/vX.X.X/evonyte-admin-vX.X.X-windows.zip",
};
```

---

### KROK 9: Deploy Edge Function + Git Push

```bash
cd /d/evonyte_desktop/evonyte-distribution

# Deploy Edge Function (wymaga tokenu)
SUPABASE_ACCESS_TOKEN="sbp_0820b563c3686474d593f403e6631e290e073331" npx supabase functions deploy latest --project-ref brobuwegghwjhxlptffk

# Git commit + push (uruchomi GitHub Pages deploy)
git add .
git commit -m "Release vX.X.X - opis zmian"
git push
```

---

### KROK 10: Weryfikacja (3 checkpointy)

```bash
# 1. Endpoint /latest zwraca nową wersję
curl -s https://brobuwegghwjhxlptffk.supabase.co/functions/v1/latest \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyb2J1d2VnZ2h3amh4bHB0ZmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTgxODUsImV4cCI6MjA3OTM3NDE4NX0.am5qBoWlYlyR3-WByXv73llkUs2Ad4Cycgoxtu_SMLE"

# 2. Download URL działa (HTTP 302)
curl -sI "https://github.com/Evonyte/evonyte-distribution/releases/download/vX.X.X/evonyte-admin-vX.X.X-windows.zip" | head -1

# 3. evonyte.com pokazuje nową wersję (poczekaj 1-2 min na GitHub Pages)
curl -s https://evonyte.com | grep -o "vX\.[0-9]*\.[0-9]*" | head -1
```

**Wszystkie 3 muszą pokazywać nową wersję!**

---

## PLIKI DO MODYFIKACJI - PODSUMOWANIE

| # | Plik | Co zmienić |
|---|------|------------|
| 1 | `apps/evonyte_admin/pubspec.yaml` | version: X.X.X+XX |
| 2 | `evonyte-distribution/version.json` | version, build, downloadUrl, releaseDate, changelog |
| 3 | `evonyte-distribution/docs/index.html` | 4 miejsca z wersją + data |
| 4 | `evonyte-distribution/supabase/functions/latest/index.ts` | version, file_name, download_url, released_at |

---

## CZAS WYKONANIA

| Krok | Czas |
|------|------|
| Build (clean) | ~3-5 min |
| Package ZIP | ~30 sec |
| GitHub Release | ~1 min |
| Update files | ~2 min |
| Deploy + Push | ~2 min |
| Verify (+ wait) | ~2 min |
| **TOTAL** | **~12-15 min** |

---

## CHECKLIST PRZED WYKONANIEM

- [ ] Wersja w pubspec.yaml ustawiona (nowa)
- [ ] Changelog przygotowany
- [ ] `gh auth status` - zalogowany do GitHub CLI
- [ ] Internet działa
- [ ] Poprzednia wersja LIVE (nie nadpisuj niezdeployowanej)

---

## CHECKLIST PO WYKONANIU

- [ ] /latest endpoint zwraca nową wersję
- [ ] Download link działa (HTTP 302)
- [ ] evonyte.com pokazuje nową wersję
- [ ] ZIP pobiera się poprawnie (opcjonalnie - test manualny)

---

## CREDENTIALS REFERENCE

**Supabase Project:** `brobuwegghwjhxlptffk`

**Management Token:**
```
sbp_0820b563c3686474d593f403e6631e290e073331
```

**Anon Key (dla testów /latest):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyb2J1d2VnZ2h3amh4bHB0ZmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTgxODUsImV4cCI6MjA3OTM3NDE4NX0.am5qBoWlYlyR3-WByXv73llkUs2Ad4Cycgoxtu_SMLE
```

**GitHub Repo:** `Evonyte/evonyte-distribution`

---

## TROUBLESHOOTING

### Build failed - pdf/printing error
```
Rozwiązanie: pdf_export_service.dart jest stubowany (OK)
Jeśli wrócił błąd - sprawdź czy evonyte_core/pubspec.yaml ma zakomentowane pdf/printing
```

### Build failed - Win98Colors not found
```
Rozwiązanie: Dodaj import do pliku z błędem:
import '../../core/theme/win98_admin_theme.dart';
```

### gh release create - not authenticated
```
Rozwiązanie: gh auth login
```

### Supabase deploy - access token error
```
Rozwiązanie: Dodaj token do komendy:
SUPABASE_ACCESS_TOKEN="sbp_..." npx supabase functions deploy latest --project-ref brobuwegghwjhxlptffk
```

### evonyte.com nie pokazuje nowej wersji
```
Rozwiązanie: Poczekaj 1-2 minuty - GitHub Pages potrzebuje czasu na deploy
Wymuś odświeżenie: Ctrl+F5 lub Incognito mode
```

---

## HISTORIA WERSJI

| Wersja | Data | Uwagi |
|--------|------|-------|
| v1.0.25 | 31.12.2025 | Pierwsze pełne użycie tego guide |
| v1.0.24 | 30.12.2025 | Manual deployment (przed guide) |

---

**Utworzono:** 31.12.2025 (Session #80)
**Przetestowano:** TAK - v1.0.25 deployment successful
**Lokalizacja:** `D:\evonyte_desktop\evonyte-distribution\DEPLOYMENT_GUIDE.md`
