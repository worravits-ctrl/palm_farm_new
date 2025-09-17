const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

const db = new sqlite3.Database('./database/palmoil.db');

// Check notes data
db.all('SELECT * FROM notes_data ORDER BY date DESC', [], (err, rows) => {
    if (err) {
        console.error('Database error:', err);
        return;
    }
    console.log('📋 Notes in database:', rows.length);
    rows.forEach(note => {
        console.log(`- ID: ${note.id}, User: ${note.user_id}, Date: ${note.date}, Title: ${note.title}`);
    });

    // Generate test token for admin
    const token = jwt.sign(
        { userId: 1, email: 'admin@palmoil.com', role: 'admin' },
        'your-secret-key',
        { expiresIn: '1h' }
    );

    console.log('\n🔑 Test token generated:', token);

    // Test API call simulation
    console.log('\n✅ Notes endpoint should return all', rows.length, 'notes for any user');
});

db.close();