// ============================================
// EVONYTE ADMIN APP - UPDATE CHECKER
// ============================================

use serde::{Deserialize, Serialize};
use reqwest;
use std::error::Error;
use std::fs;
use std::path::Path;

// Configuration
const SUPABASE_URL: &str = "https://brobuwegghwjhxlptffk.supabase.co";
const API_KEY: &str = "03n1A6QhTI4JPpzkKt3+aUzgEOD9J5aS";
const CURRENT_VERSION: &str = "1.0.0"; // Update this with each release

// ============================================
// DATA STRUCTURES
// ============================================

#[derive(Debug, Deserialize, Serialize)]
struct HealthResponse {
    status: String,
    service: String,
    timestamp: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct LatestVersionResponse {
    version: String,
    file_name: String,
    file_size: i64,
    changelog: Option<String>,
    released_at: String,
    download_url: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct DownloadResponse {
    version: String,
    file_name: String,
    file_size: i64,
    changelog: Option<String>,
    download_url: String,
    expires_at: String,
}

// ============================================
// HEALTH CHECK
// ============================================

pub async fn check_health() -> Result<bool, Box<dyn Error>> {
    let url = format!("{}/functions/v1/health", SUPABASE_URL);

    let client = reqwest::Client::new();
    let response = client.get(&url)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await?;

    if response.status().is_success() {
        let health: HealthResponse = response.json().await?;
        println!("✅ Distribution system online: {}", health.status);
        Ok(true)
    } else {
        println!("❌ Distribution system offline");
        Ok(false)
    }
}

// ============================================
// CHECK FOR UPDATES
// ============================================

pub async fn check_for_updates() -> Result<Option<LatestVersionResponse>, Box<dyn Error>> {
    println!("🔍 Checking for updates...");
    println!("   Current version: {}", CURRENT_VERSION);

    let url = format!("{}/functions/v1/latest", SUPABASE_URL);

    let client = reqwest::Client::new();
    let response = client.get(&url)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(format!("Failed to check for updates: {}", response.status()).into());
    }

    let latest: LatestVersionResponse = response.json().await?;

    println!("   Latest version: {}", latest.version);

    // Compare versions
    if is_newer_version(&latest.version, CURRENT_VERSION) {
        println!("🎉 New version available: {} → {}", CURRENT_VERSION, latest.version);
        if let Some(changelog) = &latest.changelog {
            println!("   What's new: {}", changelog);
        }
        Ok(Some(latest))
    } else {
        println!("✅ You're running the latest version");
        Ok(None)
    }
}

// ============================================
// DOWNLOAD UPDATE
// ============================================

pub async fn download_update(version: Option<&str>) -> Result<String, Box<dyn Error>> {
    println!("📥 Downloading update...");

    let url = if let Some(v) = version {
        format!("{}/functions/v1/download?version={}", SUPABASE_URL, v)
    } else {
        format!("{}/functions/v1/download", SUPABASE_URL)
    };

    let client = reqwest::Client::new();
    let response = client.get(&url)
        .header("Authorization", format!("Bearer {}", API_KEY))
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(format!("Download failed: {}", response.status()).into());
    }

    let download_info: DownloadResponse = response.json().await?;

    println!("   Version: {}", download_info.version);
    println!("   File: {}", download_info.file_name);
    println!("   Size: {:.2} MB", download_info.file_size as f64 / 1_048_576.0);

    // Download file from signed URL
    let file_path = download_file(&download_info.download_url, &download_info.file_name).await?;

    println!("✅ Update downloaded: {}", file_path);
    Ok(file_path)
}

// ============================================
// DOWNLOAD FILE FROM SIGNED URL
// ============================================

async fn download_file(url: &str, file_name: &str) -> Result<String, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let response = client.get(url)
        .timeout(std::time::Duration::from_secs(300)) // 5 min timeout
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(format!("Failed to download file: {}", response.status()).into());
    }

    // Get total size for progress
    let total_size = response.content_length().unwrap_or(0);
    println!("   Downloading {} MB...", total_size as f64 / 1_048_576.0);

    // Save to temp folder
    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join(file_name);

    let bytes = response.bytes().await?;
    fs::write(&file_path, bytes)?;

    Ok(file_path.to_string_lossy().to_string())
}

// ============================================
// VERSION COMPARISON
// ============================================

fn is_newer_version(latest: &str, current: &str) -> bool {
    let parse_version = |v: &str| -> Vec<u32> {
        v.split('.')
            .filter_map(|s| s.parse().ok())
            .collect()
    };

    let latest_parts = parse_version(latest);
    let current_parts = parse_version(current);

    for (l, c) in latest_parts.iter().zip(current_parts.iter()) {
        if l > c {
            return true;
        } else if l < c {
            return false;
        }
    }

    // If all parts are equal but latest has more parts, it's newer
    latest_parts.len() > current_parts.len()
}

// ============================================
// INSTALL UPDATE
// ============================================

pub fn install_update(update_file: &str) -> Result<(), Box<dyn Error>> {
    println!("🔧 Installing update...");

    // Get current executable path
    let current_exe = std::env::current_exe()?;
    let current_exe_str = current_exe.to_string_lossy();

    println!("   Current: {}", current_exe_str);
    println!("   Update: {}", update_file);

    // Create backup
    let backup_path = format!("{}.backup", current_exe_str);
    if Path::new(&current_exe_str.to_string()).exists() {
        fs::copy(&current_exe_str.to_string(), &backup_path)?;
        println!("   Backup created: {}", backup_path);
    }

    // Replace executable
    fs::copy(update_file, &current_exe_str.to_string())?;

    println!("✅ Update installed successfully!");
    println!("⚠️  Please restart the application to apply changes.");

    Ok(())
}

// ============================================
// FULL UPDATE FLOW
// ============================================

pub async fn perform_full_update() -> Result<(), Box<dyn Error>> {
    println!("🚀 Starting update process...\n");

    // 1. Health check
    if !check_health().await? {
        return Err("Distribution system is offline".into());
    }

    println!();

    // 2. Check for updates
    if let Some(update_info) = check_for_updates().await? {
        println!();

        // 3. Ask user for confirmation (in real app, use UI dialog)
        println!("Do you want to download and install this update? (y/n)");
        // For CLI demo - in real app, use GUI dialog
        // For now, auto-download:

        // 4. Download
        let update_file = download_update(Some(&update_info.version)).await?;

        println!();

        // 5. Install
        install_update(&update_file)?;

        println!();
        println!("🎉 Update complete! Restart required.");
    } else {
        println!();
        println!("No updates available.");
    }

    Ok(())
}

// ============================================
// EXAMPLE USAGE
// ============================================

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("═══════════════════════════════════");
    println!("  EVONYTE ADMIN APP - UPDATE CHECK");
    println!("═══════════════════════════════════\n");

    perform_full_update().await?;

    Ok(())
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_comparison() {
        assert!(is_newer_version("1.0.1", "1.0.0"));
        assert!(is_newer_version("1.1.0", "1.0.9"));
        assert!(is_newer_version("2.0.0", "1.9.9"));
        assert!(!is_newer_version("1.0.0", "1.0.0"));
        assert!(!is_newer_version("1.0.0", "1.0.1"));
    }

    #[tokio::test]
    async fn test_health_check() {
        // This will fail if SUPABASE_URL is not configured
        // Run after deployment
        let result = check_health().await;
        assert!(result.is_ok());
    }
}
