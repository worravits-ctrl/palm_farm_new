const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err);
        return;
    }
    console.log('✅ Database opened successfully');
});

console.log('🔍 Checking harvest data in database...');

// Check harvest data
db.all('SELECT COUNT(*) as total FROM harvest_data', [], (err, rows) => {
  if (err) {
    console.error('❌ Error reading harvest data:', err);
    return;
  }

  console.log('\n📋 Harvest data summary:');
  console.log('Total harvest records:', rows[0].total);

  if (rows[0].total > 0) {
    // Get sample harvest records
    db.all('SELECT date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit FROM harvest_data ORDER BY date DESC LIMIT 5', [], (err, harvestRows) => {
      if (err) {
        console.error('❌ Error reading harvest records:', err);
        return;
      }

      console.log('\n📝 Recent harvest records:');
      harvestRows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.date}: ${row.total_weight?.toFixed(1) || 0} kg × ${row.price_per_kg?.toFixed(2) || 0} THB/kg = ${row.total_revenue?.toLocaleString() || 0} THB`);
      });

      db.close();
    });
  } else {
    console.log('No harvest data found');
    db.close();
  }
});