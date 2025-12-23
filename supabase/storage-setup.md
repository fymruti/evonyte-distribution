# SUPABASE STORAGE SETUP

## 1. Create Storage Bucket

1. Otwórz Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Konfiguracja:
   ```
   Name: evonyte-releases
   Public: NO (PRIVATE!) ✅
   Allowed MIME types: application/x-msdownload, application/octet-stream
   File size limit: 500 MB (lub więcej jeśli potrzebujesz)
   ```
4. Click **Create bucket**

---

## 2. Storage Policies (RLS)

Przejdź do **Policies** dla bucket `evonyte-releases`:

### Policy 1: Allow authenticated upload

```sql
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'evonyte-releases'
    AND (storage.foldername(name))[1] = 'releases'
);
```

### Policy 2: Allow download with valid API key (handled by Edge Function)

```sql
-- Brak publicznej policy!
-- Downloads będą obsługiwane przez Edge Function z signed URLs
```

---

## 3. Struktura folderów w bucket

```
evonyte-releases/
└── releases/
    ├── evonyte-admin-v1.0.0.exe
    ├── evonyte-admin-v1.0.1.exe
    └── evonyte-admin-v1.1.0.exe
```

---

## 4. Verify Setup

Test w Supabase SQL Editor:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'evonyte-releases';

-- Should return: public = false ✅
```

---

## DONE! ✅

Next step: Deploy Edge Functions
