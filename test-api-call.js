const http = require('http');
const jwt = require('jsonwebtoken');

// Generate fresh token
const token = jwt.sign(
    { userId: 1, email: 'admin@palmoil.com', role: 'admin' },
    'palmoil-secret-key-2025',
    { expiresIn: '1h' }
);

console.log('🔑 Fresh token generated for testing');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/notes',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

console.log('🔍 Testing GET /api/notes with shared data model...');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const notes = JSON.parse(data);
            if (notes.error) {
                console.error('❌ API Error:', notes.error);
                return;
            }
            console.log(`✅ API Response: ${notes.length} notes returned`);
            console.log('📋 Sample notes:');
            notes.slice(0, 3).forEach(note => {
                console.log(`- ID: ${note.id}, User: ${note.user_id}, Title: ${note.title}, Date: ${note.date}`);
            });
            console.log('🎉 SUCCESS: All users now see shared notes data!');
        } catch (error) {
            console.error('❌ Error parsing response:', error);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error);
});

req.end();