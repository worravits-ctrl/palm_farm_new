const http = require('http');

// ทดสอบ login ก่อน
function testLogin() {
    return new Promise((resolve, reject) => {
        const loginData = JSON.stringify({
            email: 'admin@palmoil.com',
            password: 'admin'
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (parsed.token) {
                        console.log('✅ Login successful');
                        resolve(parsed.token);
                    } else {
                        console.log('❌ Login failed:', responseData);
                        reject(new Error('Login failed'));
                    }
                } catch (e) {
                    console.log('❌ Cannot parse login response:', responseData);
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(loginData);
        req.end();
    });
}

// ทดสอบ chat
function testChat(token) {
    return new Promise((resolve, reject) => {
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
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(data)
            }
        };

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
                    resolve(parsed.message);
                } catch (e) {
                    console.log('❌ Cannot parse JSON response');
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// รันทดสอบ
async function runTest() {
    try {
        console.log('🔐 ทำการ login...');
        const token = await testLogin();
        
        console.log('🧪 ทดสอบ offline chat...');
        await testChat(token);
        
        console.log('🎉 ทดสอบเสร็จสิ้น');
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
    }
}

runTest();