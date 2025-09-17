const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

console.log('Checking fertilizer data...');

// First, check if table exists and get record count
db.get('SELECT COUNT(*) as count FROM fertilizer_data', [], (err, row) => {
  if (err) {
    console.error('Error getting count:', err);
    return;
  }

  console.log(`Total fertilizer records: ${row.count}`);

  // If there are records, get a few samples
  if (row.count > 0) {
    db.all('SELECT id, user_id, date, fertilizer_type, amount, cost_per_bag, total_cost FROM fertilizer_data ORDER BY date DESC LIMIT 5', [], (err, rows) => {
      if (err) {
        console.error('Error getting sample records:', err);
        return;
      }

      console.log('\nSample fertilizer records:');
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}, Date: '${row.date}', Type: '${row.fertilizer_type}', Amount: ${row.amount}, Cost: ${row.cost_per_bag}, Total: ${row.total_cost}`);
      });

      db.close();
    });
  } else {
    console.log('No fertilizer records found');
    db.close();
  }
});