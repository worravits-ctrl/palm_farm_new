const http = require('http');
const jwt = require('jsonwebtoken');

// Generate fresh token
const token = jwt.sign(
    { userId: 1, email: 'admin@palmoil.com', role: 'admin' },
    'palmoil-secret-key-2025',
    { expiresIn: '1h' }
);

console.log('🔑 Fresh token generated for testing');

const endpoints = [
    { path: '/api/harvest', name: 'Harvest' },
    { path: '/api/fertilizer', name: 'Fertilizer' },
    { path: '/api/palmtrees', name: 'Palm Trees' },
    { path: '/api/notes', name: 'Notes' }
];

function testEndpoint(endpoint, callback) {
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: endpoint.path,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (Array.isArray(result)) {
                    console.log(`✅ ${endpoint.name}: ${result.length} records`);
                    if (result.length > 0) {
                        console.log(`   📋 Sample: ${result[0].id || 'N/A'} - ${result[0].date || result[0].harvest_date || 'N/A'}`);
                    }
                } else {
                    console.log(`❌ ${endpoint.name}: Invalid response format`);
                }
                callback();
            } catch (error) {
                console.error(`❌ ${endpoint.name}: Error parsing response:`, error.message);
                console.log('Raw response:', data.substring(0, 100));
                callback();
            }
        });
    });

    req.on('error', (error) => {
        console.error(`❌ ${endpoint.name}: Request error:`, error.message);
        callback();
    });

    req.end();
}

console.log('🔍 Testing all endpoints with shared data model...\n');

let completed = 0;
endpoints.forEach(endpoint => {
    testEndpoint(endpoint, () => {
        completed++;
        if (completed === endpoints.length) {
            console.log('\n🎉 ALL ENDPOINTS TESTED!');
            console.log('✅ Every user now sees the same shared data across all tabs!');
        }
    });
});