const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

console.log('Testing API-like queries...');

// Test harvest query
const harvestQuery = `
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

console.log('Testing harvest query...');
db.all(harvestQuery, [], (err, rows) => {
  if (err) {
    console.error('Harvest query error:', err);
  } else {
    console.log('Harvest results:', rows);
  }

  // Test fertilizer query
  const fertilizerQuery = `SELECT
      strftime('%Y', date) as year,
      COUNT(*) as fertilizer_count,
      SUM(amount) as total_amount,
      SUM(total_cost) as total_cost
     FROM fertilizer_data
     WHERE user_id = 1
     GROUP BY strftime('%Y', date)
     ORDER BY year`;

  console.log('Testing fertilizer query...');
  db.all(fertilizerQuery, [], (err2, rows2) => {
    if (err2) {
      console.error('Fertilizer query error:', err2);
    } else {
      console.log('Fertilizer results:', rows2);
    }

    // Test palm tree query
    const palmQuery = `
        SELECT
            CASE
                WHEN harvest_date LIKE '____-__-__' THEN strftime('%Y', harvest_date)
                WHEN harvest_date LIKE '__/__/____' THEN substr(harvest_date, -4)
                WHEN harvest_date LIKE '%____' THEN substr(harvest_date, -4)
                ELSE substr(harvest_date, -4)
            END as year,
            COUNT(*) as tree_harvest_count,
            COUNT(DISTINCT tree_id) as unique_trees,
            SUM(bunch_count) as total_bunches
           FROM palm_tree_data
           WHERE user_id = 1
           GROUP BY CASE
               WHEN harvest_date LIKE '____-__-__' THEN strftime('%Y', harvest_date)
               WHEN harvest_date LIKE '__/__/____' THEN substr(harvest_date, -4)
               WHEN harvest_date LIKE '%____' THEN substr(harvest_date, -4)
               ELSE substr(harvest_date, -4)
           END
           ORDER BY year`;

    console.log('Testing palm tree query...');
    db.all(palmQuery, [], (err3, rows3) => {
      if (err3) {
        console.error('Palm tree query error:', err3);
      } else {
        console.log('Palm tree results:', rows3);
      }

      db.close();
    });
  });
});