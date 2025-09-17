const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking users in database...');

// Check all users
db.all('SELECT id, email, password, role FROM users', [], (err, rows) => {
  if (err) {
    console.error('❌ Error reading users:', err);
    return;
  }
  
  console.log('\n📋 Current users in database:');
  console.log('ID | Email | Password (hashed) | Role');
  console.log('---|-------|-------------------|-----');
  
  rows.forEach(row => {
    console.log(`${row.id} | ${row.email} | ${row.password.substring(0, 20)}... | ${row.role}`);
  });
  
  console.log(`\n✅ Total users: ${rows.length}`);
  
  db.close();
});