const axios = require('axios');

async function testDateQuery() {
    try {
        // JWT token for admin user (updated)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AcGFsbW9pbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgxODAwNDUsImV4cCI6MTc1ODI2NjQ0NX0.o8kTypiP88-yPZq2C_ihOdEorLcTuihX1ptV8ybhqo0';
        
        const response = await axios.post('http://localhost:3001/api/chat', {
            message: 'วันนี้วันที่เท่าไหร่',
            context: {
                currentDate: new Date().toLocaleDateString('th-TH'),
                currentDateISO: new Date().toISOString().split('T')[0],
                buddhistYear: new Date().getFullYear() + 543,
                currentYear: new Date().getFullYear(),
                currentMonth: new Date().getMonth() + 1,
                userName: 'admin'
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = response.data;
        console.log('🎯 Test Result:');
        console.log('📅 Message:', result.message);
        console.log('⏰ Timestamp:', result.timestamp);
        
    } catch (error) {
        console.error('❌ Test Error:', error.response?.data || error.message);
    }
}

testDateQuery();