# 🚀 EVONYTE DISTRIBUTION SYSTEM - SETUP GUIDE

Kompletny przewodnik krok po kroku.

---

## 📋 WYMAGANIA

- [x] Konto GitHub
- [x] Konto Supabase (free tier wystarczy)
- [x] Domena: evonyte.com (GoDaddy)
- [x] Supabase CLI (optional, dla local development)

---

## KROK 1: SUPABASE SETUP (15 min)

### 1.1 Create New Project

1. Zaloguj się do https://supabase.com
2. Click **New Project**
3. Wypełnij:
   ```
   Name: evonyte-distribution
   Database Password: [Generate strong password - zapisz go!]
   Region: Europe (closest to Poland)
   Plan: Free
   ```
4. Click **Create new project** (zajmie ~2 min)

### 1.2 Get Project URL & API Keys

1. Settings → API
2. Zapisz:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (SECRET! NEVER COMMIT!)
   ```

### 1.3 Create Database Schema

1. Przejdź do **SQL Editor**
2. Click **New Query**
3. Skopiuj całą zawartość pliku `supabase/schema.sql`
4. Click **Run** (▶️)
5. Sprawdź Output:
   ```
   NOTICE: Generated API Key: aBc123XyZ...
   NOTICE: Save this key! It will not be shown again.
   ```
6. **ZAPISZ TEN KLUCZ!** To Twój pierwszy API key dla Admin App

### 1.4 Create Storage Bucket

1. Przejdź do **Storage**
2. Click **New bucket**
3. Wypełnij:
   ```
   Name: evonyte-releases
   Public bucket: NO (unchecked!) ✅
   ```
4. Click **Create bucket**

### 1.5 Deploy Edge Functions

**Option A: Using Supabase CLI (recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
cd supabase/functions
supabase functions deploy health
supabase functions deploy latest
supabase functions deploy download
supabase functions deploy upload
```

**Option B: Manual deploy through Dashboard**

1. Przejdź do **Edge Functions**
2. Click **Deploy new function**
3. Dla każdej funkcji (health, latest, download, upload):
   - Name: [function name]
   - Import code from: `supabase/functions/[name]/index.ts`
   - Click **Deploy function**

### 1.6 Test Setup

```bash
# Test health endpoint
curl https://YOUR_PROJECT_URL.supabase.co/functions/v1/health

# Should return:
{
  "status": "online",
  "service": "Evonyte Distribution System",
  ...
}
```

---

## KROK 2: CLOUDFLARE PAGES SETUP (10 min)

### 2.1 Create GitHub Repository

```bash
# Create new repo
gh repo create evonyte-website --public

# Upload website files
cd website
git init
git add .
git commit -m "Initial commit: Evonyte landing page"
git remote add origin https://github.com/YOUR_USERNAME/evonyte-website.git
git push -u origin main
```

### 2.2 Deploy to Cloudflare Pages

1. Zaloguj się do https://dash.cloudflare.com
2. Przejdź do **Pages**
3. Click **Create a project**
4. Connect to **GitHub**
5. Select `evonyte-website` repository
6. Build settings:
   ```
   Framework preset: None
   Build command: (leave empty)
   Build output directory: /
   ```
7. Click **Save and Deploy** (zajmie ~1 min)

### 2.3 Configure Custom Domain (evonyte.com)

1. W Cloudflare Pages → **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `evonyte.com`
4. Cloudflare automatycznie skonfiguruje DNS (jeśli domena jest w Cloudflare)

**Jeśli domena jest w GoDaddy:**

1. Przejdź do GoDaddy DNS Management
2. Dodaj CNAME record:
   ```
   Type: CNAME
   Name: @
   Value: evonyte-website.pages.dev
   TTL: 1 hour
   ```
3. Poczekaj 5-10 min na propagację DNS

### 2.4 Update Website with Supabase URL

1. Edit `website/index.html`:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   ```
2. Edit `website/admin.html` - to samo
3. Commit & push:
   ```bash
   git add .
   git commit -m "Add Supabase URL"
   git push
   ```
4. Cloudflare auto-deploy (~30s)

---

## KROK 3: ADMIN APP INTEGRATION (5 min)

### 3.1 Add Update Checker to Your Admin App

1. Skopiuj `admin-app/update_checker.rs` do swojego projektu Rust
2. Dodaj dependencies do `Cargo.toml`:
   ```toml
   [dependencies]
   reqwest = { version = "0.11", features = ["json"] }
   serde = { version = "1.0", features = ["derive"] }
   serde_json = "1.0"
   tokio = { version = "1.0", features = ["full"] }
   ```

3. Update constants:
   ```rust
   const SUPABASE_URL: &str = "https://YOUR_PROJECT_ID.supabase.co";
   const API_KEY: &str = "YOUR_GENERATED_API_KEY"; // From step 1.3
   const CURRENT_VERSION: &str = "1.0.0";
   ```

### 3.2 Integrate into Your App

```rust
// In your main.rs or startup code:
use update_checker;

#[tokio::main]
async fn main() {
    // Check for updates on startup
    match update_checker::check_for_updates().await {
        Ok(Some(update_info)) => {
            // Show update dialog to user
            show_update_dialog(update_info);
        },
        Ok(None) => {
            println!("App is up to date");
        },
        Err(e) => {
            eprintln!("Failed to check for updates: {}", e);
        }
    }

    // Rest of your app...
}
```

---

## KROK 4: UPLOAD FIRST VERSION (5 min)

### 4.1 Using Admin Panel (easiest)

1. Przejdź do https://evonyte.com/admin.html
2. Enter API Key (from step 1.3)
3. Click **Authenticate**
4. Fill form:
   ```
   Version Number: 1.0.0
   Executable File: [select evonyte-admin-v1.0.0.exe]
   Changelog: Initial release
   Set as latest version: ✅ checked
   ```
5. Click **Upload Version**
6. Wait for success message ✅

### 4.2 Using cURL (for automation)

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@evonyte-admin-v1.0.0.exe" \
  -F "version=1.0.0" \
  -F "changelog=Initial release" \
  -F "set_latest=true"
```

---

## KROK 5: TEST EVERYTHING (5 min)

### 5.1 Test Website

1. Otwórz https://evonyte.com
2. Powinna pokazać się najnowsza wersja (1.0.0)
3. Click **Enter API Key** → wpisz swój key
4. Click **Download Latest Version**
5. Plik powinien się pobrać ✅

### 5.2 Test Admin App Update Checker

```bash
# Build and run
cd admin-app
cargo run --release

# Output:
═══════════════════════════════════
  EVONYTE ADMIN APP - UPDATE CHECK
═══════════════════════════════════

✅ Distribution system online: online

🔍 Checking for updates...
   Current version: 1.0.0
   Latest version: 1.0.0

✅ You're running the latest version

No updates available.
```

### 5.3 Test Update Flow

1. Upload nową wersję (1.0.1) przez admin panel
2. Run admin app again:
   ```
   🎉 New version available: 1.0.0 → 1.0.1
   📥 Downloading update...
   ✅ Update downloaded: C:\Users\...\evonyte-admin-v1.0.1.exe
   🔧 Installing update...
   ✅ Update installed successfully!
   ```

---

## KROK 6: SECURITY & PRODUCTION (10 min)

### 6.1 Generate Additional API Keys

```sql
-- In Supabase SQL Editor
DO $$
DECLARE
    random_key TEXT;
    key_hash TEXT;
BEGIN
    random_key := encode(gen_random_bytes(24), 'base64');
    key_hash := encode(digest(random_key, 'sha256'), 'hex');

    INSERT INTO api_keys (key_hash, name, permissions)
    VALUES (
        key_hash,
        'Production Release Key',
        ARRAY['download', 'upload']
    );

    RAISE NOTICE 'API Key: %', random_key;
END $$;
```

### 6.2 Environment Variables (SECURE!)

**NEVER hardcode API keys in source code!**

```rust
// Instead of:
const API_KEY: &str = "abc123..."; // ❌ DON'T!

// Use environment variables:
let api_key = std::env::var("EVONYTE_API_KEY")
    .expect("EVONYTE_API_KEY must be set");
```

Store key in:
- Windows: Registry lub encrypted config file
- Build-time: CI/CD secrets

### 6.3 Row Level Security Check

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should have: rowsecurity = true
```

### 6.4 Enable HTTPS Only

Cloudflare Pages automatically enforces HTTPS ✅

---

## KROK 7: MONITORING & ANALYTICS (5 min)

### 7.1 Check Download Stats

```sql
-- In Supabase SQL Editor
SELECT
    v.version,
    v.file_name,
    COUNT(d.id) as downloads,
    MAX(d.downloaded_at) as last_download
FROM versions v
LEFT JOIN downloads d ON d.version_id = v.id
GROUP BY v.id, v.version, v.file_name
ORDER BY v.created_at DESC;
```

### 7.2 Dashboard Query

```sql
-- Total downloads by version
SELECT
    v.version,
    COUNT(d.id) as total_downloads,
    COUNT(DISTINCT d.ip_address) as unique_users
FROM versions v
LEFT JOIN downloads d ON d.version_id = v.id
GROUP BY v.version
ORDER BY v.created_at DESC;
```

---

## ✅ GOTOWE!

System działa! Masz teraz:

- ✅ **evonyte.com** - strona z download
- ✅ **Supabase** - backend, storage, API
- ✅ **Admin Panel** - upload nowych wersji
- ✅ **Admin App** - auto-update checker
- ✅ **Analytics** - kto i kiedy pobiera
- ✅ **Security** - API keys, RLS, private storage

---

## 🔄 WORKFLOW - Nowa wersja

```bash
# 1. Build nowej wersji Admin App
cargo build --release

# 2. Upload przez admin panel
https://evonyte.com/admin.html
→ Version: 1.1.0
→ File: evonyte-admin-v1.1.0.exe
→ Changelog: "Added new features..."
→ Set as latest: ✅
→ Upload

# 3. Users dostaną update automatycznie przy starcie
# Admin App wykryje nową wersję i zaproponuje update
```

---

## 🆘 TROUBLESHOOTING

### "Failed to check for updates"
- Sprawdź czy Edge Functions są deployed
- Test: `curl https://YOUR_URL.supabase.co/functions/v1/health`

### "Invalid API key"
- Sprawdź czy API key jest poprawny
- Verify w Supabase: `SELECT * FROM api_keys WHERE is_active = true;`

### "Version already exists"
- Nie możesz uploadować tej samej wersji 2x
- Użyj innego numeru wersji (np. 1.0.1, 1.1.0)

### DNS nie działa
- Poczekaj 10-30 min na propagację
- Check: `nslookup evonyte.com`

---

**GOTOWE!** 🎉

Teraz masz profesjonalny system dystrybucji aplikacji!
