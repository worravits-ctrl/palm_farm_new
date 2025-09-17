const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

async function testLogin() {
    console.log('🔍 Testing login credentials...');
    
    // Test passwords
    const testAdminPassword = 'admin';
    const testUserPassword = 'user';
    
    // Get users from database
    db.all('SELECT id, email, password, role FROM users', [], async (err, users) => {
        if (err) {
            console.error('❌ Database error:', err);
            return;
        }
        
        console.log('\n📋 Testing each user:');
        
        for (const user of users) {
            console.log(`\n👤 User: ${user.email} (${user.role})`);
            console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
            
            if (user.email === 'admin@palmoil.com') {
                try {
                    const isValid = await bcrypt.compare(testAdminPassword, user.password);
                    console.log(`   ✅ Testing "${testAdminPassword}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
                } catch (error) {
                    console.log(`   ❌ Error testing admin password: ${error.message}`);
                }
            }
            
            if (user.email === 'worravit38@hotmail.com') {
                try {
                    const isValid = await bcrypt.compare(testUserPassword, user.password);
                    console.log(`   ✅ Testing "${testUserPassword}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
                } catch (error) {
                    console.log(`   ❌ Error testing user password: ${error.message}`);
                }
            }
        }
        
        db.close();
    });
}

testLogin();