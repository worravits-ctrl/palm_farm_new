const fs = require('fs');
const path = require('path');

// Read the sample CSV file
const csvPath = path.join(__dirname, 'sample_fertilizer.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

console.log('📁 Reading CSV file...');
console.log('CSV Content:');
console.log(csvContent);
console.log('---');

// Parse CSV (same logic as frontend)
const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

const data = lines.slice(1)
  .filter(line => line.trim())
  .map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });

console.log('📊 Parsed data:');
console.log(JSON.stringify(data, null, 2));

// Test the API call
const testBulkImport = async () => {
  try {
    console.log('🚀 Testing bulk import API...');

    // First, get a JWT token by logging in
    const loginResponse = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@palmoil.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('✅ Logged in successfully');

    // Now test the bulk import
    const importResponse = await fetch('http://localhost:3001/api/fertilizer/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ data })
    });

    const result = await importResponse.json();
    console.log('📤 Bulk import result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testBulkImport();