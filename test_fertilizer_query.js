const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

console.log('Testing the exact fertilizer query from API...');

// Test the exact query from the API
db.all('SELECT * FROM fertilizer_data ORDER BY date DESC', [], (err, rows) => {
  if (err) {
    console.error('Database error:', err);
    console.error('Error code:', err.code);
    console.error('Error errno:', err.errno);
    return;
  }

  console.log(`Query successful! Returned ${rows.length} records`);
  if (rows.length > 0) {
    console.log('First record:', rows[0]);
  }

  db.close();
});