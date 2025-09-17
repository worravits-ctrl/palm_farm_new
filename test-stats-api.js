const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { userId: 2, email: 'jinda@example.com', role: 'user' },
    'palmoil-secret-key-2025',
    { expiresIn: '1h' }
);

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/stats',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

console.log('🔍 Testing GET /api/stats with shared data model...');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const stats = JSON.parse(data);
            console.log('✅ Stats API Response:');
            console.log('📊 Harvest:', stats.harvest);
            console.log('🌱 Fertilizer:', stats.fertilizer);
            console.log('🌴 Palm Trees:', stats.palmtrees);
            console.log('👥 Users:', stats.users);
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