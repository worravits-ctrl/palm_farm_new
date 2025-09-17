const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('Error opening database', err.message);
    }
    console.log('✅ Connected to the SQLite database.');
});

const tables = ['users', 'harvest_data', 'fertilizer_data', 'palm_tree_data', 'notes_data'];
const schemaInfo = {};

let tablesProcessed = 0;

tables.forEach(table => {
    db.all(`PRAGMA table_info(${table});`, [], (err, rows) => {
        if (err) {
            console.error(`Error getting schema for table ${table}:`, err.message);
            schemaInfo[table] = { error: err.message };
        } else {
            schemaInfo[table] = rows.map(row => `${row.name} ${row.type}`).join(', ');
        }
        
        tablesProcessed++;
        if (tablesProcessed === tables.length) {
            console.log('\n--- Actual Database Schema ---');
            tables.forEach(tableName => {
                console.log(`\nCREATE TABLE ${tableName} (
    ${schemaInfo[tableName]}
);`);
            });
            console.log('\n----------------------------\n');
            
            db.close((err) => {
                if (err) {
                    console.error('Error closing database', err.message);
                } else {
                    console.log('Database connection closed.');
                }
            });
        }
    });
});
