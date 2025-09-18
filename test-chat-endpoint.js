const axios = require('axios');

// Test chat endpoint locally
async function testChatEndpoint() {
    try {
        console.log('🧪 Testing /api/chat endpoint locally...');
        
        // Wait a bit for server to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // First, login to get token
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, token received');
        
        // Test chat with token
        console.log('🤖 Testing chat...');
        const chatResponse = await axios.post('http://localhost:3001/api/chat', {
            message: 'สวัสดีครับ ช่วยสรุปข้อมูลสวนปาล์มให้หน่อย'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Chat test successful!');
        console.log('📝 AI Response:', chatResponse.data.message);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('📡 Status:', error.response.status);
            console.error('📡 Data:', error.response.data);
        } else if (error.request) {
            console.error('📡 No response received:', error.request);
        } else {
            console.error('📡 Error setting up request:', error.message);
        }
        
        if (error.response?.status === 401) {
            console.error('💡 Authentication failed - check login credentials');
        } else if (error.response?.status === 500) {
            console.error('💡 Server error - check Gemini API key configuration');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Connection refused - server not running on port 3001');
        }
    }
}

testChatEndpoint();