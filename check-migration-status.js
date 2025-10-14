#!/usr/bin/env node

/**
 * 🔍 Migration Status Checker
 * ตรวจสอบสถานะการ migrate database
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Palm Oil Database Migration Status Checker');
console.log('='.repeat(50));

// 1. ตรวจสอบไฟล์ SQLite ต้นฉบับ
const sqliteDbPath = path.join(__dirname, 'database', 'palmoil.db');
console.log('\n📁 SQLite Database:');
if (fs.existsSync(sqliteDbPath)) {
    const stats = fs.statSync(sqliteDbPath);
    console.log(`   ✅ Found: ${sqliteDbPath}`);
    console.log(`   📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   📅 Modified: ${stats.mtime.toLocaleDateString('th-TH')}`);
} else {
    console.log('   ❌ SQLite database not found!');
}

// 2. ตรวจสอบ PostgreSQL schema
const pgSchemaPath = path.join(__dirname, 'database', 'postgresql-schema.sql');
console.log('\n🐘 PostgreSQL Schema:');
if (fs.existsSync(pgSchemaPath)) {
    const content = fs.readFileSync(pgSchemaPath, 'utf8');
    const tableCount = (content.match(/CREATE TABLE/g) || []).length;
    const indexCount = (content.match(/CREATE INDEX/g) || []).length;
    console.log(`   ✅ Schema ready: ${pgSchemaPath}`);
    console.log(`   📊 Tables: ${tableCount}`);
    console.log(`   🔍 Indexes: ${indexCount}`);
} else {
    console.log('   ❌ PostgreSQL schema not found!');
}

// 3. ตรวจสอบ migration script
const migrationScript = path.join(__dirname, 'scripts', 'migrate-to-postgresql.js');
console.log('\n🔄 Migration Script:');
if (fs.existsSync(migrationScript)) {
    console.log(`   ✅ Ready: ${migrationScript}`);
} else {
    console.log('   ❌ Migration script not found!');
}

// 4. ตรวจสอบ PostgreSQL API server
const pgApiServer = path.join(__dirname, 'api-server-postgresql.js');
console.log('\n🌐 PostgreSQL API Server:');
if (fs.existsSync(pgApiServer)) {
    console.log(`   ✅ Ready: ${pgApiServer}`);
} else {
    console.log('   ❌ PostgreSQL API server not found!');
}

// 5. ตรวจสอบ package.json dependencies
console.log('\n📦 Dependencies:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasPg = packageJson.dependencies && packageJson.dependencies.pg;
    const hasSqlite = packageJson.dependencies && packageJson.dependencies.sqlite3;
    
    console.log(`   ${hasPg ? '✅' : '❌'} PostgreSQL (pg): ${hasPg || 'Not installed'}`);
    console.log(`   ${hasSqlite ? '✅' : '❌'} SQLite3: ${hasSqlite || 'Not installed'}`);
    
    // ตรวจสอบ scripts
    const scripts = packageJson.scripts || {};
    const hasPostgreScripts = scripts['start:postgresql'] && scripts['migrate'];
    console.log(`   ${hasPostgreScripts ? '✅' : '❌'} PostgreSQL scripts configured`);
    
} catch (error) {
    console.log('   ❌ Error reading package.json');
}

// 6. ตรวจสอบ environment configuration
console.log('\n⚙️  Environment Configuration:');
const envFiles = ['.env', '.env.railway', '.env.local'];
let envFound = false;

envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
        console.log(`   ✅ Found: ${envFile}`);
        envFound = true;
        
        const content = fs.readFileSync(envFile, 'utf8');
        const hasDatabaseUrl = content.includes('DATABASE_URL');
        const hasRailwayToken = content.includes('RAILWAY_TOKEN');
        
        console.log(`      ${hasDatabaseUrl ? '✅' : '❌'} DATABASE_URL configured`);
        if (envFile.includes('railway')) {
            console.log(`      ${hasRailwayToken ? '✅' : '❌'} RAILWAY_TOKEN configured`);
        }
    }
});

if (!envFound) {
    console.log('   ⚠️  No environment files found');
    console.log('      Create .env with DATABASE_URL for PostgreSQL connection');
}

// 7. ตรวจสอบ Railway configuration
console.log('\n🚄 Railway Configuration:');
const railwayConfig = path.join(__dirname, 'railway.json');
if (fs.existsSync(railwayConfig)) {
    console.log(`   ✅ Railway config ready: ${railwayConfig}`);
} else {
    console.log('   ⚠️  Railway configuration not found');
}

// 8. แสดงสรุปสถานะ
console.log('\n' + '='.repeat(50));
console.log('📋 MIGRATION READINESS CHECKLIST:');

const checks = [
    fs.existsSync(sqliteDbPath),
    fs.existsSync(pgSchemaPath),
    fs.existsSync(migrationScript),
    fs.existsSync(pgApiServer),
];

const readyCount = checks.filter(Boolean).length;
const totalChecks = checks.length;

console.log(`\n   Progress: ${readyCount}/${totalChecks} components ready`);

if (readyCount === totalChecks) {
    console.log('   🎉 READY FOR MIGRATION!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Set up PostgreSQL on Railway');
    console.log('   2. Configure DATABASE_URL in .env');
    console.log('   3. Run: npm install pg');
    console.log('   4. Run: npm run migrate');
    console.log('   5. Deploy to Railway');
} else {
    console.log('   ⚠️  Migration setup incomplete');
    console.log('   📖 Check DATABASE_MIGRATION_SUMMARY.md for details');
}

console.log('\n📚 Documentation:');
console.log('   • DATABASE_MIGRATION_SUMMARY.md - Overview');
console.log('   • RAILWAY_DEPLOYMENT_GUIDE.md - Step-by-step guide');
console.log('   • database/postgresql-schema.sql - Database schema');