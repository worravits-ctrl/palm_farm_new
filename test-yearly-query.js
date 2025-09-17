const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

console.log('Testing harvest yearly query...');
const query = `
SELECT
    CASE
        WHEN date LIKE '____-__-__' THEN strftime('%Y', date)
        WHEN date LIKE '__/__/____' THEN substr(date, -4)
        WHEN date LIKE '%____' THEN substr(date, -4)
        ELSE substr(date, -4)
    END as year,
    COUNT(*) as harvest_count,
    SUM(total_weight) as total_weight,
    SUM(total_revenue) as total_revenue,
    SUM(net_profit) as total_profit
   FROM harvest_data
   WHERE user_id = 1 AND date IS NOT NULL
   GROUP BY CASE
       WHEN date LIKE '____-__-__' THEN strftime('%Y', date)
       WHEN date LIKE '__/__/____' THEN substr(date, -4)
       WHEN date LIKE '%____' THEN substr(date, -4)
       ELSE substr(date, -4)
   END
   ORDER BY year`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('Query error:', err);
  } else {
    console.log('Harvest yearly results:', rows);
  }
  db.close();
});