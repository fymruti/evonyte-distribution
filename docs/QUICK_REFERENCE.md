# ⚡ QUICK REFERENCE

## 🔑 IMPORTANT URLs

```
Strona główna:      https://evonyte.com
Admin Panel:        https://evonyte.com/admin.html
Supabase Dashboard: https://supabase.com/dashboard
```

## 📋 AFTER FIRST SETUP - SAVE THESE:

```
Supabase Project URL:     https://YOUR_PROJECT_ID.supabase.co
Supabase anon key:        eyJhbGc... (public, OK to commit)
Supabase service_role:    eyJhbGc... (SECRET! NEVER COMMIT!)

API Key (from schema.sql): aBc123XyZ... (SAVE THIS!)
```

## 🚀 COMMON TASKS

### Upload New Version
1. Build .exe: `cargo build --release`
2. Go to: https://evonyte.com/admin.html
3. Enter API key
4. Fill form (version, file, changelog)
5. Click Upload ✅

### Check Download Stats
```sql
-- Supabase SQL Editor
SELECT
    v.version,
    COUNT(d.id) as downloads
FROM versions v
LEFT JOIN downloads d ON d.version_id = v.id
GROUP BY v.version;
```

### Generate New API Key
```sql
-- Supabase SQL Editor
DO $$
DECLARE
    random_key TEXT;
    key_hash TEXT;
BEGIN
    random_key := encode(gen_random_bytes(24), 'base64');
    key_hash := encode(digest(random_key, 'sha256'), 'hex');

    INSERT INTO api_keys (key_hash, name, permissions)
    VALUES (key_hash, 'My New Key', ARRAY['download', 'upload']);

    RAISE NOTICE 'API Key: %', random_key;
END $$;
```

### Test Health
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/health
```

### Test Download (with API key)
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/download
```

## 🐛 TROUBLESHOOTING CHECKLIST

- [ ] Health endpoint returns 200? → Edge Functions deployed
- [ ] Latest endpoint returns version? → Database working
- [ ] Download with API key works? → Auth working
- [ ] Website loads on evonyte.com? → DNS + Cloudflare working
- [ ] Admin panel can upload? → Storage + permissions OK

## 📞 SUPPORT

Full docs: [SETUP_GUIDE.md](SETUP_GUIDE.md)
