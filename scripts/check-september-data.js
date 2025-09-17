const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const userId = 1; // admin user
const year = '2025';
const month = '09'; // September

// This query attempts to find records for Sep 2025, regardless of the stored date format (YYYY-MM-DD or DD-MM-YYYY)
const query = `
    SELECT id, user_id, date, total_revenue
    FROM harvest_data
    WHERE user_id = ? 
      AND (
          (strftime('%Y', date) = ? AND strftime('%m', date) = ?) OR 
          (substr(date, -4) = ? AND substr(date, 4, 2) = ?)
      )
    ORDER BY date ASC;
`;

console.log(`Checking harvest data for user ${userId} in ${year}-${month}...`);

db.all(query, [userId, year, month, year, month], (err, rows) => {
    if (err) {
        console.error('Error querying database', err.message);
        return;
    }

    if (rows.length === 0) {
        console.log('No harvest data found for September 2025.');
    } else {
        console.log('Found the following records for September 2025:');
        console.table(rows);
        
        const totalRevenue = rows.reduce((sum, row) => sum + row.total_revenue, 0);
        console.log(`\nCalculated total revenue for September 2025: ${totalRevenue.toFixed(2)}`);

        const expectedRecord = rows.find(row => row.date.includes('10-09-2025') || row.date.includes('2025-09-10'));
        if (expectedRecord) {
            console.log(`\nFound the record for 10-09-2025 with revenue: ${expectedRecord.total_revenue}. Date format is: ${expectedRecord.date}`);
        } else {
            console.log('\nCould not find the specific record for 10-09-2025.');
        }
    }

    db.close((err) => {
        if (err) {
            console.error('Error closing database', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
});
