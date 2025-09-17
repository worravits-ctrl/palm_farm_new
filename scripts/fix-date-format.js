const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('Error opening database', err.message);
    }
    console.log('Connected to the SQLite database.');
});

// This query targets dates that are NOT in the YYYY-MM-DD format.
// It looks for dates containing '/' which is a common alternative format.
const query = `
    DELETE FROM harvest_data 
    WHERE date LIKE '%/%';
`;

console.log('Attempting to delete records with incorrect date formats (e.g., DD/MM/YYYY)...');

db.run(query, function(err) {
    if (err) {
        console.error('Error deleting records', err.message);
    } else {
        if (this.changes > 0) {
            console.log(`✅ Successfully deleted ${this.changes} record(s) with incorrect date formats.`);
        } else {
            console.log('No records with incorrect date formats found to delete.');
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
