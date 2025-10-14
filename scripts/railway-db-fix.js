#!/usr/bin/env node

/**
 * Fix Railway database by creating missing tables via direct database commands
 */

const axios = require('axios');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api-server-production-4ba0.up.railway.app/api';

// Admin credentials
const ADMIN_EMAIL = 'admin.new@palmoil.com';
const ADMIN_PASSWORD = 'admin123';

let adminToken = null;

async function loginAdmin() {
    console.log('🔑 Logging in as admin...');
    
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        
        adminToken = response.data.token;
        console.log('✅ Admin login successful');
        return true;
    } catch (error) {
        console.error('❌ Admin login failed:', error.response?.data || error.message);
        return false;
    }
}

async function testCurrentState() {
    console.log('🔍 Testing current database state...');
    
    const tests = [
        { name: 'Users', endpoint: 'users', method: 'GET', needsAdmin: true },
        { name: 'Notes', endpoint: 'notes', method: 'GET', needsAdmin: false },
        { name: 'Harvest', endpoint: 'harvest', method: 'GET', needsAdmin: false },
        { name: 'Fertilizer', endpoint: 'fertilizer', method: 'GET', needsAdmin: false },
        { name: 'Palm Trees', endpoint: 'palmtrees', method: 'GET', needsAdmin: false }
    ];
    
    const results = {};
    
    for (const test of tests) {
        try {
            const headers = { Authorization: `Bearer ${adminToken}` };
            const response = await axios.get(`${API_BASE}/${test.endpoint}`, { headers });
            results[test.name] = { status: '✅ Working', data: response.data.length || 'OK' };
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            results[test.name] = { status: '❌ Failed', error: errorMsg };
        }
    }
    
    console.log('\n📊 Database State Report:');
    for (const [name, result] of Object.entries(results)) {
        console.log(`${result.status} ${name}: ${result.error || result.data}`);
    }
    
    return results;
}

async function createTemporaryFixApi() {
    console.log('🛠️ Creating temporary API endpoints for database initialization...');
    
    // Since we can't directly access the Railway SQLite file, 
    // we'll create a special endpoint to run SQL commands
    
    const initScript = `
    // Add this to api-server.js temporarily for database fixing
    
    app.post('/api/admin/fix-database', authenticateToken, requireAdmin, (req, res) => {
        console.log('🔧 Database fix requested by admin:', req.user.email);
        
        const { sql_commands } = req.body;
        
        if (!sql_commands || !Array.isArray(sql_commands)) {
            return res.status(400).json({ error: 'SQL commands array required' });
        }
        
        let results = [];
        let completedCommands = 0;
        
        sql_commands.forEach((sql, index) => {
            db.run(sql, [], function(err) {
                if (err) {
                    results[index] = { error: err.message };
                } else {
                    results[index] = { success: true, changes: this.changes };
                }
                
                completedCommands++;
                if (completedCommands === sql_commands.length) {
                    res.json({ 
                        message: 'Database fix commands executed',
                        results: results 
                    });
                }
            });
        });
    });
    `;
    
    console.log('📝 Suggested code to add to api-server.js:');
    console.log(initScript);
    
    return initScript;
}

async function createDatabaseInitSql() {
    console.log('📋 Reading database schema...');
    
    try {
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Extract CREATE TABLE statements
        const createTableStatements = schemaContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.toLowerCase().includes('create table'))
            .map(stmt => stmt + ';');
            
        console.log(`✅ Found ${createTableStatements.length} CREATE TABLE statements`);
        
        return createTableStatements;
        
    } catch (error) {
        console.error('❌ Error reading schema:', error.message);
        return [];
    }
}

async function attemptDatabaseFix() {
    console.log('🔧 Attempting to fix database via API...');
    
    const sqlCommands = await createDatabaseInitSql();
    
    if (sqlCommands.length === 0) {
        console.log('❌ No SQL commands to execute');
        return false;
    }
    
    try {
        // Try to send fix commands to a special endpoint (if it exists)
        const response = await axios.post(`${API_BASE}/admin/fix-database`, {
            sql_commands: sqlCommands
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('✅ Database fix successful:', response.data);
        return true;
        
    } catch (error) {
        console.log('❌ Database fix endpoint not available:', error.response?.data?.error || error.message);
        return false;
    }
}

async function suggestManualFix() {
    console.log('🔧 Manual fix suggestions:');
    console.log('');
    console.log('1. 🚀 Railway Dashboard Method:');
    console.log('   - Go to https://railway.app/dashboard');
    console.log('   - Find your palm oil project');
    console.log('   - Click on the service');
    console.log('   - Go to "Settings" > "Variables"');
    console.log('   - Add: INIT_DB=true');
    console.log('   - Redeploy the service');
    console.log('');
    
    console.log('2. 🛠️ Railway CLI Method:');
    console.log('   railway login');
    console.log('   railway link [your-project-id]');
    console.log('   railway shell');
    console.log('   # Then run:');
    console.log('   sqlite3 database/palmoil.db < database/schema.sql');
    console.log('   exit');
    console.log('');
    
    console.log('3. 📝 Code Update Method:');
    console.log('   - Add database initialization to api-server.js startup');
    console.log('   - Check if database tables exist on app start');
    console.log('   - Auto-create missing tables');
    console.log('   - Push update to Railway');
    console.log('');
    
    console.log('4. 🔄 Fresh Deploy Method:');
    console.log('   - Create new Railway project');
    console.log('   - Deploy with proper database initialization');
    console.log('   - Update DNS/domain if needed');
}

async function createAutofixCode() {
    console.log('📝 Creating auto-fix code for api-server.js...');
    
    const autofixCode = `
// Add this code to the top of api-server.js after const db = new sqlite3.Database(dbPath);

function initializeMissingTables() {
    console.log('🔍 Checking database tables...');
    
    const tables = {
        'harvest_data': \`
            CREATE TABLE IF NOT EXISTS harvest_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                total_weight REAL NOT NULL,
                price_per_kg REAL NOT NULL,
                fallen_weight REAL DEFAULT 0,
                fallen_price_per_kg REAL DEFAULT 0,
                total_revenue REAL NOT NULL,
                harvesting_cost REAL NOT NULL,
                net_profit REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        \`,
        'fertilizer_data': \`
            CREATE TABLE IF NOT EXISTS fertilizer_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                fertilizer_type TEXT NOT NULL,
                amount INTEGER NOT NULL,
                cost_per_bag REAL NOT NULL,
                labor_cost REAL DEFAULT 0,
                total_cost REAL NOT NULL,
                supplier TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        \`,
        'palm_tree_data': \`
            CREATE TABLE IF NOT EXISTS palm_tree_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                tree_id TEXT NOT NULL,
                harvest_date TEXT NOT NULL,
                bunch_count INTEGER NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        \`
    };
    
    Object.entries(tables).forEach(([tableName, createSql]) => {
        db.run(createSql, (err) => {
            if (err) {
                console.error(\`❌ Error creating table \${tableName}:\`, err.message);
            } else {
                console.log(\`✅ Table \${tableName} ready\`);
            }
        });
    });
    
    console.log('🎉 Database initialization completed');
}

// Call this function after db connection
initializeMissingTables();
`;

    console.log('💾 Auto-fix code generated. Add this to api-server.js:');
    console.log(autofixCode);
    
    // Save to file for easy copying
    fs.writeFileSync(path.join(__dirname, '..', 'railway-autofix.js'), autofixCode);
    console.log('📁 Code saved to: railway-autofix.js');
    
    return autofixCode;
}

async function main() {
    console.log('🚀 Railway Database Fix Tool');
    console.log('📡 Target:', API_BASE);
    console.log('');
    
    // Login as admin
    const loginSuccess = await loginAdmin();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without admin access');
        return;
    }
    
    // Test current state
    const currentState = await testCurrentState();
    
    // Check if fix is needed
    const needsFix = Object.values(currentState).some(result => result.error === 'Database error');
    
    if (needsFix) {
        console.log('\\n🔧 Database needs fixing...');
        
        // Try automatic fix
        const fixSuccess = await attemptDatabaseFix();
        
        if (!fixSuccess) {
            // Generate auto-fix code
            await createAutofixCode();
            
            // Provide manual instructions
            console.log('\\n📋 Since automatic fix failed, here are manual options:');
            await suggestManualFix();
        }
        
    } else {
        console.log('\\n✅ Database appears to be working correctly!');
    }
    
    console.log('\\n🔗 Useful links:');
    console.log('   Web App: https://api-server-production-4ba0.up.railway.app');
    console.log('   Railway Dashboard: https://railway.app/dashboard');
    console.log('   Project Repo: https://github.com/worravits-ctrl/palm_farm_new');
}

// Run the fix tool
main().catch(console.error);