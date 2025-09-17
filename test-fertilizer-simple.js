const https = require('https');
const http = require('http');

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonBody = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, body: jsonBody });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testFertilizerAPI() {
    try {
        // First login to get token
        console.log('🔐 Logging in...');
        const loginOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const loginData = {
            email: 'admin@palmoil.com',
            password: 'admin123'
        };

        const loginResponse = await makeRequest(loginOptions, loginData);

        if (loginResponse.statusCode !== 200 || !loginResponse.body.token) {
            console.error('❌ Login failed:', loginResponse.body);
            return;
        }

        console.log('✅ Login successful, token received');

        // Test fertilizer data submission
        console.log('🚀 Testing fertilizer data submission...');
        const fertilizerData = {
            date: '2025-01-15',
            fertilizer_type: 'ปุ๋ยเคมี A',
            amount: 50,
            cost_per_bag: 150.00,
            labor_cost: 500.00,
            supplier: 'บริษัท ปุ๋ยไทย',
            notes: 'ปุ๋ยสำหรับฤดูเก็บเกี่ยว'
        };

        const fertilizerOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/fertilizer',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginResponse.body.token}`
            }
        };

        const fertilizerResponse = await makeRequest(fertilizerOptions, fertilizerData);

        if (fertilizerResponse.statusCode === 201) {
            console.log('✅ Fertilizer data saved successfully!');
            console.log('📊 Response:', fertilizerResponse.body);
        } else {
            console.error('❌ Failed to save fertilizer data:');
            console.error('📊 Status:', fertilizerResponse.statusCode);
            console.error('📊 Response:', fertilizerResponse.body);
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testFertilizerAPI();