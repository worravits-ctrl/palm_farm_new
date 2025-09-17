const fetch = require('node-fetch');

async function testPalmTreesAPI() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@palmoil.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful, token received');
    
    // Get palm trees data
    console.log('\n🌴 Fetching palm trees data...');
    const palmTreesResponse = await fetch('http://localhost:3001/api/palmtrees', {
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const palmTreesData = await palmTreesResponse.json();
    console.log(`📊 Received ${palmTreesData.length} palm tree records`);
    
    // Show first 10 records
    console.log('\n📋 First 10 records:');
    palmTreesData.slice(0, 10).forEach((record, index) => {
      console.log(`${index + 1}. ${record.tree_id} - ${record.harvest_date} - ${record.bunch_count} bunches`);
    });
    
    if (palmTreesData.length > 10) {
      console.log(`\n... and ${palmTreesData.length - 10} more records`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPalmTreesAPI();