const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

db.all("PRAGMA table_info(fertilizer_data)", (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Fertilizer Data Schema:');
        rows.forEach(row => {
            console.log(`- ${row.name}: ${row.type}`);
        });
    }
    db.close();
});