const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing admin login...');
        const response = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@palmoil.com',
            password: 'admin'
        });

        console.log('Login successful!');
        console.log('Token:', response.data.token.substring(0, 20) + '...');
        return response.data.token;
    } catch (error) {
        console.log('Login failed:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function testFertilizerAPI(token) {
    try {
        console.log('Testing fertilizer API...');
        const response = await axios.get('http://localhost:3001/api/fertilizer', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Fertilizer API successful!');
        console.log('Records found:', response.data.length);
        response.data.forEach((record, i) => {
            console.log(`${i+1}. ${record.date}: ${record.fertilizer_type} - ${record.amount} bags`);
        });
    } catch (error) {
        console.log('Fertilizer API failed:', error.response ? error.response.data : error.message);
    }
}

async function main() {
    const token = await testLogin();
    if (token) {
        await testFertilizerAPI(token);
    }
}

main();