#!/usr/bin/env node

/**
 * Railway Production Startup Script
 * ไฟล์นี้จะรัน api-server.js ใน production environment
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Palm Oil API Server for Railway Production...');
console.log('📍 Current directory:', __dirname);
console.log('🔌 PORT:', process.env.PORT || '8080');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');

// Initialize database if needed
const initDatabase = require('./scripts/init-database.js');

// Start the main server
const server = spawn('node', ['api-server.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

server.on('error', (err) => {
    console.error('❌ Server startup error:', err);
    process.exit(1);
});

server.on('close', (code) => {
    console.log(`🔚 Server process exited with code ${code}`);
    process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('📡 Received SIGTERM, shutting down gracefully...');
    server.kill();
});

process.on('SIGINT', () => {
    console.log('📡 Received SIGINT, shutting down gracefully...');
    server.kill();
});