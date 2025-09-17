const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT id, email, password FROM users WHERE email = "admin@palmoil.com"', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Admin user hash:', rows[0].password.substring(0, 20));
    }
    db.close();
});