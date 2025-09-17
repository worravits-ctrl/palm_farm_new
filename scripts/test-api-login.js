const axios = require('axios');

async function testLoginAPI() {
    console.log('🧪 Testing login API directly...');
    
    const testCases = [
        {
            email: 'admin@palmoil.com',
            password: 'admin123',
            name: 'Admin'
        },
        {
            email: 'worravit38@hotmail.com', 
            password: '123456',
            name: 'User'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🔑 Testing ${testCase.name} login...`);
        
        try {
            const response = await axios.post('http://localhost:3001/api/auth/login', {
                email: testCase.email,
                password: testCase.password
            });
            
            console.log(`✅ ${testCase.name} login successful!`);
            console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
            console.log(`   User: ${response.data.user.email} (${response.data.user.role})`);
            
        } catch (error) {
            console.log(`❌ ${testCase.name} login failed:`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${error.response.data.error}`);
            } else {
                console.log(`   Error: ${error.message}`);
            }
        }
    }
}

testLoginAPI();