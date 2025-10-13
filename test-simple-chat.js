const http = require('http');

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDk0NDMyMDB9.3ox5T1Rg9wJC8VNWRfa_PSynBV0Fg6BBCrp8nTeH-C4';

const data = JSON.stringify({
    message: 'สวัสดีครับ'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log('🧪 ทดสอบ offline chat...');

const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        console.log('📊 Status Code:', res.statusCode);
        console.log('📝 Response:', responseData);
        
        try {
            const parsed = JSON.parse(responseData);
            console.log('✅ คำตอบ:', parsed.message);
        } catch (e) {
            console.log('❌ Cannot parse JSON response');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error);
});

req.write(data);
req.end();