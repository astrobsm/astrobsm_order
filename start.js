#!/usr/bin/env node

/**
 * Production startup script for ASTRO-BSM PWA
 * Handles database initialization and server startup gracefully
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ASTRO-BSM PWA Order System...');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('📊 Initializing database...');
    
    const initProcess = spawn('npm', ['run', 'init'], {
      stdio: 'inherit',
      shell: true
    });

    initProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database initialized successfully');
        resolve();
      } else {
        console.log('⚠️  Database initialization failed (this might be expected if tables already exist)');
        // Don't reject - allow server to start anyway
        resolve();
      }
    });

    initProcess.on('error', (err) => {
      console.log('⚠️  Database initialization error (continuing anyway):', err.message);
      resolve();
    });

    // Timeout after 60 seconds (increased for database operations)
    setTimeout(() => {
      console.log('⚠️  Database initialization timeout (continuing anyway)');
      initProcess.kill();
      resolve();
    }, 60000);
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🌐 Starting web server...');
    
    const serverProcess = spawn('node', ['server/server.js'], {
      stdio: 'inherit',
      shell: true
    });

    serverProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Server stopped gracefully');
        resolve();
      } else {
        console.log('❌ Server exited with code:', code);
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    serverProcess.on('error', (err) => {
      console.log('❌ Server error:', err.message);
      reject(err);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('📤 Received SIGTERM, shutting down gracefully...');
      serverProcess.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('📤 Received SIGINT, shutting down gracefully...');
      serverProcess.kill('SIGINT');
    });
  });
}

async function main() {
  try {
    // Only run database initialization in production on first deploy
    if (isProduction) {
      await initializeDatabase();
    }
    
    // Start the server
    await startServer();
  } catch (error) {
    console.error('💥 Startup failed:', error.message);
    process.exit(1);
  }
}

main();
