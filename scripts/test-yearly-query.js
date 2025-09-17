const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

console.log('🔍 Testing new date query...');

db.all(`SELECT 
    substr(date, -4) as year,
    COUNT(*) as harvest_count,
    SUM(total_weight) as total_weight,
    SUM(total_revenue) as total_revenue,
    SUM(net_profit) as total_profit
FROM harvest_data 
WHERE date IS NOT NULL
GROUP BY substr(date, -4)
ORDER BY year`, [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err);
    } else {
        console.log('📊 Yearly harvest stats:');
        console.table(rows);
    }
    
    db.close();
});