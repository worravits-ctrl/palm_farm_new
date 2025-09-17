const http = require('http');
const jwt = require('jsonwebtoken');

// Generate fresh token
const token = jwt.sign(
    { userId: 1, email: 'admin@palmoil.com', role: 'admin' },
    'palmoil-secret-key-2025',
    { expiresIn: '1h' }
);

console.log('🔑 Testing AI harvest questions...');

// Test cases for harvest questions
const testCases = [
    'การตัดปาล์มเดือนนี้เป็นอย่างไรบ้าง',
    'แสดงข้อมูลการเก็บเกี่ยวแต่ละเดือน',
    'การเก็บเกี่ยวปีนี้มีอะไรบ้าง',
    'สรุปการตัดปาล์มทั้งหมด',
    'น้ำหนักปาล์มที่เก็บได้เดือนละเท่าไหร่'
];

let currentTest = 0;

function runTest() {
    if (currentTest >= testCases.length) {
        console.log('\n🎉 All harvest question tests completed!');
        return;
    }

    const testMessage = testCases[currentTest];
    const postData = JSON.stringify({ message: testMessage });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log(`\n🧪 Test ${currentTest + 1}: "${testMessage}"`);
    console.log('📤 Sending data:', postData);

    const req = http.request(options, (res) => {
        console.log('📥 Response status:', res.statusCode);

        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ AI Response:', response.message ? response.message.substring(0, 300) + '...' : 'No message');
                console.log('📊 Data used:', response.dataUsed || 'None');
            } catch (error) {
                console.error('❌ Error parsing response:', error);
                console.log('Raw response:', data.substring(0, 200));
            }

            currentTest++;
            setTimeout(runTest, 1000); // Wait 1 second between tests
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error);
        currentTest++;
        setTimeout(runTest, 1000);
    });

    req.write(postData);
    req.end();
}

// Start testing
runTest();