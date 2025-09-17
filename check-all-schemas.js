const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking all table schemas...');

const tables = ['harvest_data', 'fertilizer_data', 'palm_tree_data', 'notes_data'];

let completed = 0;
tables.forEach(table => {
  db.all(`PRAGMA table_info(${table})`, [], (err, columns) => {
    if (err) {
      console.error('Error:', err);
      return;
    }

    console.log(`\n📊 ${table} columns:`);
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    completed++;
    if (completed === tables.length) {
      db.close();
    }
  });
});</content>
<parameter name="filePath">d:\AI\palm_oil_new\check-all-schemas.js