/**
 * Config Loader - Load configuration from environment variables or .env file
 * This module helps skills read configuration without hardcoding paths
 */

const fs = require('fs');
const path = require('path');

let cachedConfig = null;

function loadEnvFile() {
  const workspace = process.env.WORKSPACE || '/Users/icetomoyo/clawd';
  const envPath = path.join(workspace, '.env');
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        // Remove quotes if present
        const unquoted = value.replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = unquoted;
        }
      }
    }
  }
}

function loadConfig() {
  if (cachedConfig) return cachedConfig;
  
  // Load from .env file
  loadEnvFile();
  
  const workspace = process.env.WORKSPACE || '/Users/icetomoyo/clawd';
  
  cachedConfig = {
    // Sync folder path - MUST be set in .env
    syncFolder: process.env.SYNC_FOLDER_PATH,
    
    // Workspace path
    workspace: workspace,
    
    // Debug mode
    debug: process.env.DEBUG === 'true',
    
    // Skill-specific paths (can be overridden)
    aiTrendMonitor: {
      outputDir: process.env.AI_TREND_MONITOR_OUTPUT_DIR 
        || path.join(workspace, 'skills', 'ai-trend-monitor', 'output')
    },
    
    aiTrendAnalyzer: {
      outputDir: process.env.AI_TREND_ANALYZER_OUTPUT_DIR 
        || path.join(workspace, 'skills', 'ai-trend-analyzer', 'output')
    },
    
    dailyPapersX: {
      outputDir: process.env.DAILY_PAPERS_OUTPUT_DIR 
        || path.join(workspace, 'skills', 'daily-papers-x', 'output')
    },
    
    hotTopicVocabulary: {
      updateInterval: parseInt(process.env.HOT_TOPIC_UPDATE_INTERVAL) || 6
    }
  };
  
  return cachedConfig;
}

function getSyncFolder() {
  const config = loadConfig();
  if (!config.syncFolder) {
    console.warn('⚠️  SYNC_FOLDER_PATH not set in .env file');
    console.warn('   Reports will not be synced to user folder');
    console.warn('   Copy .env.example to .env and set SYNC_FOLDER_PATH');
    return null;
  }
  return config.syncFolder;
}

function ensureSyncFolder() {
  const syncFolder = getSyncFolder();
  if (!syncFolder) return null;
  
  if (!fs.existsSync(syncFolder)) {
    try {
      fs.mkdirSync(syncFolder, { recursive: true });
      console.log(`📁 Created sync folder: ${syncFolder}`);
    } catch (e) {
      console.error(`❌ Failed to create sync folder: ${e.message}`);
      return null;
    }
  }
  
  return syncFolder;
}

module.exports = {
  loadConfig,
  getSyncFolder,
  ensureSyncFolder
};
