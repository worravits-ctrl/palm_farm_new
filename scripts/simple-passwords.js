const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

async function createSimplePasswords() {
  console.log('🔧 Creating simple passwords...');
  
  try {
    // Hash simple passwords
    const adminPassword = await bcrypt.hash('admin', 10);
    const userPassword = await bcrypt.hash('user', 10);
    
    console.log('📝 Password hashes created:');
    console.log('   Admin hash:', adminPassword.substring(0, 20) + '...');
    console.log('   User hash:', userPassword.substring(0, 20) + '...');
    
    // Update admin password
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password = ? WHERE email = ?', [adminPassword, 'admin@palmoil.com'], function(err) {
        if (err) {
          console.error('❌ Error updating admin password:', err);
          reject(err);
        } else {
          console.log('✅ Admin password updated');
          resolve();
        }
      });
    });
    
    // Update user password
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password = ? WHERE email = ?', [userPassword, 'worravit38@hotmail.com'], function(err) {
        if (err) {
          console.error('❌ Error updating user password:', err);
          reject(err);
        } else {
          console.log('✅ User password updated');
          resolve();
        }
      });
    });
    
    console.log('');
    console.log('🎉 Passwords updated successfully!');
    console.log('');
    console.log('📧 New login credentials:');
    console.log('🔑 Admin: admin@palmoil.com / admin');
    console.log('🔑 User: worravit38@hotmail.com / user');
    console.log('');
    console.log('💡 These are simple passwords for easy testing');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

createSimplePasswords();