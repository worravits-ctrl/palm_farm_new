const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking palm_tree_data schema...');

db.all(`PRAGMA table_info(palm_tree_data)`, [], (err, columns) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n📊 palm_tree_data columns:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  db.close();
});