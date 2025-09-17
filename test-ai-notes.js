const http = require('http');
const jwt = require('jsonwebtoken');

// Generate fresh token
const token = jwt.sign(
    { userId: 1, email: 'admin@palmoil.com', role: 'admin' },
    'palmoil-secret-key-2025',
    { expiresIn: '1h' }
);

console.log('🔑 Testing AI note search functionality...');

// Test 1: Search for fertilizer notes
const testMessage1 = 'ค้นหาบันทึกเกี่ยวกับปุ๋ย';
const postData1 = JSON.stringify({ message: testMessage1 });

const options1 = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData1)
    }
};

console.log(`\n🧪 Test 1: "${testMessage1}"`);
console.log('📤 Sending data:', postData1);

const req1 = http.request(options1, (res) => {
    console.log('📥 Response status:', res.statusCode);
    console.log('📥 Response headers:', res.headers);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('📥 Raw response data:', data);
        try {
            const response = JSON.parse(data);
            console.log('✅ Parsed AI Response:', response.message || response.response || response);
        } catch (error) {
            console.error('❌ Error parsing response:', error);
            console.log('Raw response:', data);
        }
    });
});

req1.on('error', (error) => {
    console.error('❌ Request error:', error);
});

req1.write(postData1);
req1.end();

// Test 2: Get notes by category
setTimeout(() => {
    const testMessage2 = 'บันทึกหมวดหมู่';
    const postData2 = JSON.stringify({ message: testMessage2 });

    const options2 = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData2)
        }
    };

    console.log(`\n🧪 Test 2: "${testMessage2}"`);

    const req2 = http.request(options2, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ AI Response:', response.response);
            } catch (error) {
                console.error('❌ Error parsing response:', error);
                console.log('Raw response:', data);
            }
        });
    });

    req2.on('error', (error) => {
        console.error('❌ Request error:', error);
    });

    req2.write(postData2);
    req2.end();
}, 1000);

// Test 3: Get help menu
setTimeout(() => {
    const testMessage3 = 'help';
    const postData3 = JSON.stringify({ message: testMessage3 });

    const options3 = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData3)
        }
    };

    console.log(`\n🧪 Test 3: "${testMessage3}"`);

    const req3 = http.request(options3, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ AI Response:', response.response);
                console.log('\n🎉 AI Note Search Testing Complete!');
            } catch (error) {
                console.error('❌ Error parsing response:', error);
                console.log('Raw response:', data);
            }
        });
    });

    req3.on('error', (error) => {
        console.error('❌ Request error:', error);
    });

    req3.write(postData3);
    req3.end();
}, 2000);