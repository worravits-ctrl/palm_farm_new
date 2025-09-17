const fetch = require('node-fetch');

async function testFertilizerAPI() {
    try {
        // First login to get token
        console.log('🔐 Logging in...');
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@palmoil.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        if (!loginData.token) {
            console.error('❌ Login failed:', loginData);
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

        const fertilizerResponse = await fetch('http://localhost:3001/api/fertilizer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify(fertilizerData)
        });

        const fertilizerResult = await fertilizerResponse.json();

        if (fertilizerResponse.ok) {
            console.log('✅ Fertilizer data saved successfully!');
            console.log('📊 Response:', fertilizerResult);
        } else {
            console.error('❌ Failed to save fertilizer data:');
            console.error('📊 Response:', fertilizerResult);
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testFertilizerAPI();