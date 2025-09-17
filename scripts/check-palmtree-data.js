const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking palm tree data...');

// Count total records
db.get(`SELECT COUNT(*) as total FROM palm_tree_data`, [], (err, row) => {
  if (err) {
    console.error('Error counting records:', err);
    return;
  }
  
  console.log(`\n📊 Total palm tree records: ${row.total}`);
  
  // Get recent records
  db.all(`SELECT tree_id, harvest_date, bunch_count, notes FROM palm_tree_data ORDER BY harvest_date DESC LIMIT 10`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching records:', err);
      return;
    }
    
    console.log('\n📋 Recent palm tree records:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. Tree: ${row.tree_id}, Date: ${row.harvest_date}, Bunches: ${row.bunch_count}, Notes: ${row.notes || 'N/A'}`);
    });
    
    db.close();
  });
});