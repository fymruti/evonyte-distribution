# 🚀 EVONYTE DISTRIBUTION SYSTEM

Profesjonalny system dystrybucji aplikacji z auto-update dla Evonyte Admin App.

[![Status](https://img.shields.io/badge/status-ready-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 📋 OVERVIEW

Complete distribution system for Windows applications (.exe) with:

- ✅ **Secure file hosting** (private Supabase Storage)
- ✅ **Auto-update checker** (integrated in Admin App)
- ✅ **Version management** (database + changelog)
- ✅ **API-based downloads** (token authentication)
- ✅ **Admin panel** (web-based upload interface)
- ✅ **Analytics** (download tracking)
- ✅ **100% FREE** (Supabase free tier + Cloudflare Pages)

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────┐
│ EVONYTE.COM (Cloudflare Pages)                  │
│ - Landing page                                  │
│ - Download page (with auth)                     │
│ - Admin panel                                   │
└─────────────────────────────────────────────────┘
                    ↓ HTTPS
┌─────────────────────────────────────────────────┐
│ SUPABASE (Backend)                              │
│                                                 │
│ 📦 Storage: evonyte-releases (PRIVATE)         │
│    - 1GB free storage                           │
│    - CDN delivery                               │
│                                                 │
│ 🗄️ PostgreSQL Database:                        │
│    - versions (app versions)                    │
│    - downloads (analytics)                      │
│    - api_keys (authentication)                  │
│                                                 │
│ ⚡ Edge Functions (Serverless API):             │
│    - GET  /health                               │
│    - GET  /latest                               │
│    - GET  /download (auth required)             │
│    - POST /upload (admin only)                  │
└─────────────────────────────────────────────────┘
                    ↑ API calls
┌─────────────────────────────────────────────────┐
│ EVONYTE ADMIN APP (Windows)                     │
│                                                 │
│ On startup:                                     │
│  1. Check /health                               │
│  2. Check /latest version                       │
│  3. Compare with current version                │
│  4. Download update (if available)              │
│  5. Install & restart                           │
└─────────────────────────────────────────────────┘
```

---

## 📦 FEATURES

### For End Users
- 🌐 **Public website** - evonyte.com with download page
- 🔐 **Secure downloads** - API key authentication
- 📱 **Auto-updates** - Seamless in-app updates
- 📊 **Version history** - See all releases

### For Developers
- 📤 **Easy uploads** - Web-based admin panel
- 🔄 **Version control** - Database-backed versioning
- 📈 **Analytics** - Track downloads and usage
- 🛡️ **Security** - Row Level Security (RLS)
- 🚀 **Fast delivery** - CDN worldwide

---

## 📁 PROJECT STRUCTURE

```
evonyte-distribution/
├── supabase/
│   ├── schema.sql              # Database schema + RLS
│   ├── storage-setup.md        # Storage configuration
│   └── functions/              # Edge Functions
│       ├── health/index.ts     # Health check endpoint
│       ├── latest/index.ts     # Get latest version
│       ├── download/index.ts   # Download with auth
│       └── upload/index.ts     # Upload new version
│
├── website/
│   ├── index.html              # Landing page (evonyte.com)
│   └── admin.html              # Admin panel (upload)
│
├── admin-app/
│   ├── update_checker.rs       # Rust update checker module
│   └── Cargo.toml              # Dependencies
│
├── docs/
│   └── SETUP_GUIDE.md          # Complete setup guide
│
└── README.md                   # This file
```

---

## 🚀 QUICK START

### 1. Prerequisites
- [x] GitHub account
- [x] Supabase account (free)
- [x] Domain: evonyte.com
- [x] Cloudflare account (optional, for Pages)

### 2. Setup (30 minutes)
See **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** for detailed instructions.

**TL;DR:**
```bash
# 1. Deploy Supabase schema
# 2. Create Storage bucket
# 3. Deploy Edge Functions
# 4. Deploy website to Cloudflare Pages
# 5. Configure DNS (evonyte.com)
# 6. Upload first version
```

### 3. Integrate into Admin App
```rust
// Add to your Rust project
use update_checker;

#[tokio::main]
async fn main() {
    // Check for updates on startup
    if let Ok(Some(update)) = update_checker::check_for_updates().await {
        // New version available!
        show_update_dialog(update);
    }
}
```

---

## 🔐 SECURITY

- ✅ **Private Storage** - Files not publicly accessible
- ✅ **API Key Authentication** - Token-based access control
- ✅ **Row Level Security (RLS)** - Database-level security
- ✅ **Signed URLs** - Temporary download links (1 hour expiry)
- ✅ **HTTPS Only** - Enforced by Cloudflare
- ✅ **No hardcoded secrets** - Environment variables

---

## 💰 COST BREAKDOWN

**TOTAL: $0/month** (within free tiers)

### Supabase (Free Tier)
- Storage: 1GB (enough for ~20 versions @ 50MB each)
- Database: 500MB
- Bandwidth: 5GB/month
- Edge Functions: 500K invocations/month

### Cloudflare Pages (Free)
- Unlimited requests
- Unlimited bandwidth
- Custom domain
- Auto SSL

### GoDaddy Domain
- $12-15/year (already purchased)

**Upgrade if needed:**
- Supabase Pro: $25/month (100GB storage, 250GB bandwidth)

---

## 📊 ANALYTICS

### View Download Stats

```sql
-- In Supabase SQL Editor
SELECT
    v.version,
    COUNT(d.id) as downloads,
    COUNT(DISTINCT d.ip_address) as unique_users,
    MAX(d.downloaded_at) as last_download
FROM versions v
LEFT JOIN downloads d ON d.version_id = v.id
GROUP BY v.version
ORDER BY v.created_at DESC;
```

---

## 🔄 RELEASE WORKFLOW

```bash
# 1. Build new version of Admin App
cargo build --release --target x86_64-pc-windows-msvc

# 2. Upload via Admin Panel
https://evonyte.com/admin.html
→ Enter API key
→ Version: 1.1.0
→ File: evonyte-admin-v1.1.0.exe
→ Changelog: "New features: ..."
→ Upload ✅

# 3. Users get update automatically
# On next Admin App startup:
🎉 New version available: 1.0.0 → 1.1.0
📥 Downloading update...
✅ Update installed! Please restart.
```

---

## 🆘 TROUBLESHOOTING

### Health check fails
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/health
# Should return: {"status":"online",...}
```

### Download fails with 403
- Check API key is valid
- Verify in Supabase: `SELECT * FROM api_keys WHERE is_active = true;`

### Website not loading
- Check DNS: `nslookup evonyte.com`
- Wait 10-30 min for DNS propagation

---

## 📝 API REFERENCE

### GET /health
Health check endpoint
```bash
curl https://YOUR_URL.supabase.co/functions/v1/health
```

### GET /latest
Get latest version info
```bash
curl https://YOUR_URL.supabase.co/functions/v1/latest
```

### GET /download?version=X.X.X
Download specific version (requires API key)
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://YOUR_URL.supabase.co/functions/v1/download?version=1.0.0
```

### POST /upload
Upload new version (requires admin API key)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -F "file=@app.exe" \
  -F "version=1.0.0" \
  -F "changelog=New features" \
  -F "set_latest=true" \
  https://YOUR_URL.supabase.co/functions/v1/upload
```

---

## 🛠️ TECH STACK

- **Frontend**: HTML/CSS/JavaScript (vanilla)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Storage**: Supabase Storage (S3-compatible)
- **CDN**: Cloudflare Pages + Supabase CDN
- **Update Client**: Rust (reqwest, serde)
- **Database**: PostgreSQL with Row Level Security

---

## 📜 LICENSE

MIT License - see LICENSE file for details

---

## 👥 SUPPORT

- 📧 Email: support@evonyte.com
- 🐛 Issues: GitHub Issues
- 📖 Docs: [SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

---

**Built with ❤️ for Evonyte**

Last updated: 2025-12-23
