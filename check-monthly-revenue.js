const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

db.all("SELECT strftime('%Y-%m', date) as month, COUNT(*) as records, SUM(total_revenue) as revenue, SUM(net_profit) as profit FROM harvest_data GROUP BY strftime('%Y-%m', date) ORDER BY month DESC LIMIT 10", (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Monthly Revenue Summary:');
        rows.forEach(row => {
            console.log(`${row.month}: ${row.records} records, Revenue: ${row.revenue}, Profit: ${row.profit}`);
        });
    }
    db.close();
});