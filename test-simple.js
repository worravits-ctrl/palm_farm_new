const http = require('http');

// Simple test without CORS complications
function testServerConnection() {
    const postData = JSON.stringify({
        email: 'admin@test.com',
        password: 'admin'
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`✅ Server responded with status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('📝 Response:', response);
                
                if (response.token) {
                    console.log('✅ Login successful, testing chat...');
                    testChat(response.token);
                } else {
                    console.log('❌ Login failed');
                }
            } catch (e) {
                console.log('❌ Invalid JSON response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Request error: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

function testChat(token) {
    const postData = JSON.stringify({
        message: 'สวัสดีครับ'
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`✅ Chat endpoint responded with status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('🤖 AI Response:', response.message);
            } catch (e) {
                console.log('❌ Invalid JSON response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Chat request error: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

// Wait a bit then test
setTimeout(testServerConnection, 1000);