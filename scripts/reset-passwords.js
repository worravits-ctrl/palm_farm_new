const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

async function resetUserPasswords() {
  console.log('🔧 Resetting user passwords...');
  
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('123456', 10); // ตั้งรหัสผ่านใหม่เป็น 123456
    
    // Update admin password (make sure it's properly hashed)
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password = ? WHERE email = ?', [adminPassword, 'admin@palmoil.com'], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Update user password
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password = ? WHERE email = ?', [userPassword, 'worravit38@hotmail.com'], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Passwords updated successfully!');
    console.log('');
    console.log('📧 Login credentials:');
    console.log('🔑 Admin: admin@palmoil.com / admin123');
    console.log('🔑 User: worravit38@hotmail.com / 123456');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

resetUserPasswords();