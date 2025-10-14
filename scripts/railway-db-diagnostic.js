#!/usr/bin/env node

/**
 * Check and initialize Railway database schema
 */

const axios = require('axios');

const API_BASE = 'https://api-server-production-4ba0.up.railway.app/api';

async function checkDatabaseHealth() {
    console.log('🏥 Checking database health...');
    
    try {
        // Health check
        const health = await axios.get(`${API_BASE}/health`);
        console.log('✅ Health status:', health.data);
        
        // Check if we can register user (tests database connection)
        console.log('🧪 Testing database connection by registering test user...');
        
        const testResponse = await axios.post(`${API_BASE}/auth/register`, {
            username: 'dbtest',
            email: 'dbtest@test.com',
            password: 'test123'
        });
        
        console.log('✅ Database is working - User registration successful');
        console.log('Response:', testResponse.data);
        
        return true;
        
    } catch (error) {
        console.error('❌ Database health check failed:', error.response?.data || error.message);
        return false;
    }
}

async function testBasicOperations() {
    console.log('🔧 Testing basic database operations...');
    
    try {
        // Login with test user
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'dbtest@test.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, got token');
        
        // Test simple harvest addition
        console.log('📊 Testing harvest data addition...');
        const harvestResponse = await axios.post(`${API_BASE}/harvest`, {
            date: '2025-10-14',
            total_weight: 50,
            price_per_kg: 4.0,
            harvesting_cost: 100,
            total_revenue: 200,
            net_profit: 100
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Harvest data added successfully');
        console.log('Response:', harvestResponse.data);
        
        // Test retrieve harvest data
        console.log('📋 Testing harvest data retrieval...');
        const getResponse = await axios.get(`${API_BASE}/harvest`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Harvest data retrieved successfully');
        console.log('Records count:', getResponse.data.length);
        
        return true;
        
    } catch (error) {
        console.error('❌ Basic operations test failed:', error.response?.data || error.message);
        
        if (error.response?.data?.error === 'Database error') {
            console.log('🔍 Database schema might be missing or corrupted');
            return false;
        }
        
        return false;
    }
}

async function suggestFixes() {
    console.log('🔧 Suggested fixes for Railway deployment:');
    console.log('');
    console.log('1. 📋 Check Railway dashboard:');
    console.log('   - Go to https://railway.app/dashboard');
    console.log('   - Check if SQLite file exists and has correct permissions');
    console.log('');
    console.log('2. 🗄️ Database initialization:');
    console.log('   - Railway might need database to be initialized');
    console.log('   - Check if schema.sql was properly executed');
    console.log('');
    console.log('3. 📁 File permissions:');
    console.log('   - SQLite file needs read/write permissions');
    console.log('   - Database directory must exist');
    console.log('');
    console.log('4. 🔄 Redeploy options:');
    console.log('   - Push updated schema to Railway');
    console.log('   - Use Railway CLI to check logs');
    console.log('');
    console.log('5. 🐛 Debug commands:');
    console.log('   railway logs --tail');
    console.log('   railway shell');
}

async function main() {
    console.log('🚀 Railway Database Diagnostic Tool');
    console.log('📡 Target:', API_BASE);
    console.log('');
    
    const healthOk = await checkDatabaseHealth();
    
    if (healthOk) {
        console.log('');
        const operationsOk = await testBasicOperations();
        
        if (operationsOk) {
            console.log('');
            console.log('🎉 All tests passed! Database is working correctly.');
            console.log('');
            console.log('💡 The "Database error" might be caused by:');
            console.log('   - Validation issues in the data being sent');
            console.log('   - Schema mismatch between expected and actual');
            console.log('   - Race conditions during data insertion');
        } else {
            console.log('');
            await suggestFixes();
        }
    } else {
        console.log('');
        await suggestFixes();
    }
    
    console.log('');
    console.log('🔗 Useful links:');
    console.log('   Web App: https://api-server-production-4ba0.up.railway.app');
    console.log('   Railway Dashboard: https://railway.app/dashboard');
}

// Run diagnostic
main().catch(console.error);