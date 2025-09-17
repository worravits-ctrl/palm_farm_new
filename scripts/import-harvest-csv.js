const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

// --- Configuration ---
const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const csvFilePath = process.argv[2]; // Get CSV file path from command line argument
const userId = 1; // Default to admin user
// -------------------

if (!csvFilePath) {
    console.error('❌ Please provide the path to the CSV file.');
    console.log('Usage: node scripts/import-harvest-csv.js <path_to_your_file.csv>');
    process.exit(1);
}

const absoluteCsvPath = path.resolve(csvFilePath);
if (!fs.existsSync(absoluteCsvPath)) {
    console.error(`❌ File not found: ${absoluteCsvPath}`);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('Error opening database', err.message);
    }
    console.log('✅ Connected to the SQLite database.');
});

const records = [];

fs.createReadStream(absoluteCsvPath)
    .pipe(csv())
    .on('data', (row) => {
        // Basic validation for each row
        if (row.date && row.total_weight && row.price_per_kg && row.harvesting_cost) {
            records.push(row);
        } else {
            console.warn('⚠️ Skipping invalid row:', row);
        }
    })
    .on('end', () => {
        if (records.length === 0) {
            console.log('No valid records to import.');
            db.close();
            return;
        }

        console.log(`Found ${records.length} valid records. Starting import...`);

        const stmt = db.prepare(`
            INSERT INTO harvest_data 
            (user_id, date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            let importedCount = 0;
            records.forEach((record) => {
                const total_weight = parseFloat(record.total_weight);
                const price_per_kg = parseFloat(record.price_per_kg);
                const harvesting_cost = parseFloat(record.harvesting_cost);
                
                // Calculations
                const total_revenue = total_weight * price_per_kg;
                const net_profit = total_revenue - harvesting_cost;

                stmt.run(
                    userId,
                    record.date,
                    total_weight,
                    price_per_kg,
                    total_revenue,
                    harvesting_cost,
                    net_profit,
                    (err) => {
                        if (err) {
                            console.error('Error inserting row:', record, err.message);
                        } else {
                            importedCount++;
                        }
                    }
                );
            });

            db.run('COMMIT', (err) => {
                if (err) {
                    console.error('Transaction commit error:', err.message);
                } else {
                    console.log(`\n✅ Import complete!`);
                    console.log(`   Successfully imported ${importedCount} out of ${records.length} records.`);
                }
                
                stmt.finalize();
                
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database', err.message);
                    } else {
                        console.log('Database connection closed.');
                    }
                });
            });
        });
    });
