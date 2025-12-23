-- ============================================
-- EVONYTE DISTRIBUTION SYSTEM - DATABASE SCHEMA
-- ============================================

-- 1. VERSIONS TABLE (aplikacje i ich wersje)
CREATE TABLE IF NOT EXISTS versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL UNIQUE, -- np. "1.0.0"
    file_name TEXT NOT NULL, -- np. "evonyte-admin-v1.0.0.exe"
    file_path TEXT NOT NULL, -- ścieżka w Supabase Storage
    file_size BIGINT NOT NULL, -- rozmiar w bajtach
    changelog TEXT, -- opis zmian
    is_latest BOOLEAN DEFAULT false, -- czy to najnowsza wersja
    is_active BOOLEAN DEFAULT true, -- czy dostępna do pobrania
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index dla szybkiego wyszukiwania latest
CREATE INDEX idx_versions_latest ON versions(is_latest, is_active);
CREATE INDEX idx_versions_created ON versions(created_at DESC);

-- Trigger: tylko jedna wersja może być "latest"
CREATE OR REPLACE FUNCTION ensure_single_latest()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_latest = true THEN
        UPDATE versions SET is_latest = false WHERE id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_latest
BEFORE INSERT OR UPDATE ON versions
FOR EACH ROW
WHEN (NEW.is_latest = true)
EXECUTE FUNCTION ensure_single_latest();

-- ============================================
-- 2. API_KEYS TABLE (tokeny dostępu dla Admin App)
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash klucza
    name TEXT NOT NULL, -- np. "Admin App Production"
    permissions TEXT[] DEFAULT ARRAY['download'], -- ['download', 'upload', 'admin']
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- opcjonalne wygaśnięcie
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = true;

-- ============================================
-- 3. DOWNLOADS TABLE (analytics - kto i kiedy pobrał)
-- ============================================
CREATE TABLE IF NOT EXISTS downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_downloads_version ON downloads(version_id, downloaded_at DESC);
CREATE INDEX idx_downloads_date ON downloads(downloaded_at DESC);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- Policy: Wszyscy mogą czytać aktywne wersje (dla Edge Functions)
CREATE POLICY "Allow public read active versions"
ON versions FOR SELECT
USING (is_active = true);

-- Policy: Tylko authenticated users mogą dodawać wersje
CREATE POLICY "Allow authenticated insert versions"
ON versions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Tylko authenticated users mogą updateować
CREATE POLICY "Allow authenticated update versions"
ON versions FOR UPDATE
TO authenticated
USING (true);

-- API Keys: tylko authenticated mogą czytać (Edge Functions używają service_role)
CREATE POLICY "Allow authenticated read api_keys"
ON api_keys FOR SELECT
TO authenticated
USING (is_active = true);

-- Downloads: wszyscy mogą inserować (analytics)
CREATE POLICY "Allow public insert downloads"
ON downloads FOR INSERT
WITH CHECK (true);

-- Downloads: tylko authenticated mogą czytać (dla dashboardu)
CREATE POLICY "Allow authenticated read downloads"
ON downloads FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Funkcja: Get latest version
CREATE OR REPLACE FUNCTION get_latest_version()
RETURNS TABLE (
    version TEXT,
    file_name TEXT,
    file_path TEXT,
    file_size BIGINT,
    changelog TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.version,
        v.file_name,
        v.file_path,
        v.file_size,
        v.changelog,
        v.created_at
    FROM versions v
    WHERE v.is_latest = true AND v.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcja: Verify API key
CREATE OR REPLACE FUNCTION verify_api_key(key_to_check TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    api_key_id UUID,
    permissions TEXT[]
) AS $$
DECLARE
    key_hash_input TEXT;
BEGIN
    -- Hash the input key
    key_hash_input := encode(digest(key_to_check, 'sha256'), 'hex');

    RETURN QUERY
    SELECT
        true AS is_valid,
        ak.id AS api_key_id,
        ak.permissions
    FROM api_keys ak
    WHERE ak.key_hash = key_hash_input
      AND ak.is_active = true
      AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
    LIMIT 1;

    -- Update last_used_at
    UPDATE api_keys
    SET last_used_at = NOW()
    WHERE key_hash = key_hash_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcja: Log download
CREATE OR REPLACE FUNCTION log_download(
    p_version_id UUID,
    p_api_key_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    download_id UUID;
BEGIN
    INSERT INTO downloads (version_id, api_key_id, ip_address, user_agent)
    VALUES (p_version_id, p_api_key_id, p_ip_address, p_user_agent)
    RETURNING id INTO download_id;

    RETURN download_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. INITIAL DATA (przykładowy API key)
-- ============================================

-- Generuj random API key (użyj tego w Admin App!)
DO $$
DECLARE
    random_key TEXT;
    key_hash TEXT;
BEGIN
    -- Generate random key (32 chars)
    random_key := encode(gen_random_bytes(24), 'base64');
    key_hash := encode(digest(random_key, 'sha256'), 'hex');

    -- Insert API key
    INSERT INTO api_keys (key_hash, name, permissions)
    VALUES (
        key_hash,
        'Admin App - Initial Key',
        ARRAY['download', 'upload']
    );

    -- Print the key (TYLKO RAZ! Zapisz go!)
    RAISE NOTICE 'Generated API Key: %', random_key;
    RAISE NOTICE 'Save this key! It will not be shown again.';
END $$;

-- ============================================
-- DONE! Schema created successfully.
-- Next step: Run this SQL in Supabase SQL Editor
-- ============================================
