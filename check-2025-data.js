const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

console.log('Checking 2025 data...');

// Check harvest data for 2025
db.all('SELECT date, total_revenue, net_profit FROM harvest_data WHERE user_id = 1 AND date LIKE "2025%" ORDER BY date DESC LIMIT 10', (err, rows) => {
  if (err) {
    console.error('Harvest error:', err);
  } else {
    console.log('2025 Harvest data:');
    rows.forEach(row => console.log(`Date: ${row.date}, Revenue: ${row.total_revenue}, Profit: ${row.net_profit}`));
  }

  // Check fertilizer data for 2025
  db.all('SELECT date, total_cost FROM fertilizer_data WHERE user_id = 1 AND date LIKE "2025%" ORDER BY date DESC LIMIT 10', (err2, rows2) => {
    if (err2) {
      console.error('Fertilizer error:', err2);
    } else {
      console.log('2025 Fertilizer data:');
      rows2.forEach(row => console.log(`Date: ${row.date}, Cost: ${row.total_cost}`));
    }

    // Check palm tree data for 2025
    db.all('SELECT harvest_date, bunch_count FROM palm_tree_data WHERE user_id = 1 AND harvest_date LIKE "2025%" ORDER BY harvest_date DESC LIMIT 10', (err3, rows3) => {
      if (err3) {
        console.error('Palm tree error:', err3);
      } else {
        console.log('2025 Palm tree data:');
        rows3.forEach(row => console.log(`Date: ${row.harvest_date}, Bunches: ${row.bunch_count}`));
      }

      db.close();
    });
  });
});