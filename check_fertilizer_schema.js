const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

db.all('PRAGMA table_info(fertilizer_data)', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  console.log('Fertilizer data table schema:');
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULLABLE'}`);
  });

  db.close();
});