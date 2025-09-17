const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

db.all("SELECT date, total_revenue, net_profit FROM harvest_data LIMIT 5", (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Sample harvest data:');
        rows.forEach(row => {
            console.log(`Date: ${row.date}, Revenue: ${row.total_revenue}, Profit: ${row.net_profit}`);
        });
    }
    db.close();
});