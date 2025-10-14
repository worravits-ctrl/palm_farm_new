#!/usr/bin/env node

/**
 * 🧪 Railway API Testing Suite
 * ทดสอบการทำงานของ API หลังจาก deploy บน Railway
 */

const axios = require('axios');
require('dotenv').config();

class RailwayAPITester {
  constructor(baseURL) {
    this.baseURL = baseURL || process.env.RAILWAY_API_URL || 'http://localhost:3001';
    this.token = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${icons[type]} ${message}`);
  }

  async test(name, testFunction) {
    try {
      console.log(`\n🧪 Testing: ${name}`);
      const start = Date.now();
      await testFunction();
      const duration = Date.now() - start;
      
      this.log(`${name} - PASSED (${duration}ms)`, 'success');
      this.testResults.passed++;
      this.testResults.tests.push({ name, status: 'PASSED', duration });
    } catch (error) {
      this.log(`${name} - FAILED: ${error.message}`, 'error');
      this.testResults.failed++;
      this.testResults.tests.push({ name, status: 'FAILED', error: error.message });
    }
  }

  async testHealthCheck() {
    const response = await axios.get(`${this.baseURL}/health`);
    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    this.log(`API is healthy: ${response.data.status}`, 'success');
  }

  async testLogin() {
    const loginData = {
      email: 'niran@example.com',
      password: 'password123'
    };
    
    const response = await axios.post(`${this.baseURL}/api/auth/login`, loginData);
    
    if (response.status !== 200 || !response.data.token) {
      throw new Error('Login failed - no token received');
    }
    
    this.token = response.data.token;
    this.log(`Login successful, token received`, 'success');
  }

  async testRegister() {
    const userData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      role: 'user'
    };
    
    const response = await axios.post(`${this.baseURL}/api/auth/register`, userData);
    
    if (response.status !== 201) {
      throw new Error(`Registration failed: ${response.status}`);
    }
    
    this.log(`User registered: ${userData.username}`, 'success');
  }

  async testHarvestEndpoints() {
    if (!this.token) throw new Error('No authentication token');
    
    const headers = { Authorization: `Bearer ${this.token}` };
    
    // GET harvest data
    const getResponse = await axios.get(`${this.baseURL}/api/harvest`, { headers });
    if (getResponse.status !== 200) {
      throw new Error(`GET harvest failed: ${getResponse.status}`);
    }
    
    this.log(`Retrieved ${getResponse.data.length} harvest records`, 'success');
    
    // POST new harvest
    const harvestData = {
      date: '2024-10-14',
      total_weight: 150.5,
      price_per_kg: 4.80,
      harvesting_cost: 50.00,
      location: 'Test Location'
    };
    
    const postResponse = await axios.post(`${this.baseURL}/api/harvest`, harvestData, { headers });
    if (postResponse.status !== 201) {
      throw new Error(`POST harvest failed: ${postResponse.status}`);
    }
    
    this.log(`Created harvest record with ID: ${postResponse.data.id}`, 'success');
    
    // Cleanup - delete test record
    await axios.delete(`${this.baseURL}/api/harvest/${postResponse.data.id}`, { headers });
    this.log(`Cleaned up test harvest record`, 'success');
  }

  async testFertilizerEndpoints() {
    if (!this.token) throw new Error('No authentication token');
    
    const headers = { Authorization: `Bearer ${this.token}` };
    
    // GET fertilizer data
    const getResponse = await axios.get(`${this.baseURL}/api/fertilizer`, { headers });
    if (getResponse.status !== 200) {
      throw new Error(`GET fertilizer failed: ${getResponse.status}`);
    }
    
    this.log(`Retrieved ${getResponse.data.length} fertilizer records`, 'success');
    
    // POST new fertilizer
    const fertilizerData = {
      date: '2024-10-14',
      fertilizer_type: 'Test NPK',
      quantity_used: 5,
      cost_per_unit: 180.00,
      supplier: 'Test Supplier',
      area_applied: 'Test Area'
    };
    
    const postResponse = await axios.post(`${this.baseURL}/api/fertilizer`, fertilizerData, { headers });
    if (postResponse.status !== 201) {
      throw new Error(`POST fertilizer failed: ${postResponse.status}`);
    }
    
    this.log(`Created fertilizer record with ID: ${postResponse.data.id}`, 'success');
    
    // Cleanup
    await axios.delete(`${this.baseURL}/api/fertilizer/${postResponse.data.id}`, { headers });
    this.log(`Cleaned up test fertilizer record`, 'success');
  }

  async testPalmTreeEndpoints() {
    if (!this.token) throw new Error('No authentication token');
    
    const headers = { Authorization: `Bearer ${this.token}` };
    
    // GET palm tree data
    const getResponse = await axios.get(`${this.baseURL}/api/palmtrees`, { headers });
    if (getResponse.status !== 200) {
      throw new Error(`GET palmtrees failed: ${getResponse.status}`);
    }
    
    this.log(`Retrieved ${getResponse.data.length} palm tree records`, 'success');
  }

  async testNotesEndpoints() {
    if (!this.token) throw new Error('No authentication token');
    
    const headers = { Authorization: `Bearer ${this.token}` };
    
    // GET notes
    const getResponse = await axios.get(`${this.baseURL}/api/notes`, { headers });
    if (getResponse.status !== 200) {
      throw new Error(`GET notes failed: ${getResponse.status}`);
    }
    
    this.log(`Retrieved ${getResponse.data.length} notes`, 'success');
    
    // POST new note
    const noteData = {
      title: 'Test Note',
      content: 'This is a test note for Railway deployment',
      category: 'ทดสอบ',
      priority: 'ปานกลาง'
    };
    
    const postResponse = await axios.post(`${this.baseURL}/api/notes`, noteData, { headers });
    if (postResponse.status !== 201) {
      throw new Error(`POST note failed: ${postResponse.status}`);
    }
    
    this.log(`Created note with ID: ${postResponse.data.id}`, 'success');
    
    // Cleanup
    await axios.delete(`${this.baseURL}/api/notes/${postResponse.data.id}`, { headers });
    this.log(`Cleaned up test note`, 'success');
  }

  async testStatsEndpoints() {
    if (!this.token) throw new Error('No authentication token');
    
    const headers = { Authorization: `Bearer ${this.token}` };
    
    // GET dashboard stats
    const statsResponse = await axios.get(`${this.baseURL}/api/stats/dashboard`, { headers });
    if (statsResponse.status !== 200) {
      throw new Error(`GET dashboard stats failed: ${statsResponse.status}`);
    }
    
    const stats = statsResponse.data;
    this.log(`Dashboard stats: ${stats.totalHarvests} harvests, ${stats.totalRevenue} THB revenue`, 'success');
    
    // GET monthly revenue
    const revenueResponse = await axios.get(`${this.baseURL}/api/stats/monthly-revenue`, { headers });
    if (revenueResponse.status !== 200) {
      throw new Error(`GET monthly revenue failed: ${revenueResponse.status}`);
    }
    
    this.log(`Monthly revenue data retrieved: ${revenueResponse.data.length} months`, 'success');
  }

  async testPerformance() {
    const performanceTests = [
      {
        name: 'Health Check Speed',
        url: `${this.baseURL}/health`
      },
      {
        name: 'Auth Endpoint Speed',
        url: `${this.baseURL}/api/auth/login`,
        method: 'POST',
        data: { email: 'test@test.com', password: 'wrong' }
      }
    ];
    
    for (const test of performanceTests) {
      const start = Date.now();
      try {
        if (test.method === 'POST') {
          await axios.post(test.url, test.data);
        } else {
          await axios.get(test.url);
        }
      } catch (error) {
        // Expected for wrong credentials
      }
      const duration = Date.now() - start;
      
      if (duration > 5000) {
        this.log(`${test.name}: ${duration}ms - SLOW!`, 'warning');
      } else if (duration > 1000) {
        this.log(`${test.name}: ${duration}ms - OK`, 'warning');
      } else {
        this.log(`${test.name}: ${duration}ms - FAST`, 'success');
      }
    }
  }

  async testConcurrency() {
    const concurrentRequests = 5;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        axios.get(`${this.baseURL}/health`).then(() => ({ success: true, id: i }))
          .catch(error => ({ success: false, id: i, error: error.message }))
      );
    }
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    
    if (successful === concurrentRequests) {
      this.log(`Concurrent test: ${successful}/${concurrentRequests} requests successful`, 'success');
    } else {
      throw new Error(`Concurrency test failed: only ${successful}/${concurrentRequests} successful`);
    }
  }

  async runAllTests() {
    console.log('🚂 Railway API Testing Suite');
    console.log('🌴 Palm Oil Management System');
    console.log('='.repeat(50));
    console.log(`Testing API at: ${this.baseURL}`);
    console.log('='.repeat(50));
    
    // Health and performance tests
    await this.test('Health Check', () => this.testHealthCheck());
    await this.test('Performance Test', () => this.testPerformance());
    await this.test('Concurrency Test', () => this.testConcurrency());
    
    // Authentication tests
    await this.test('User Registration', () => this.testRegister());
    await this.test('User Login', () => this.testLogin());
    
    // API endpoint tests (require authentication)
    if (this.token) {
      await this.test('Harvest Endpoints', () => this.testHarvestEndpoints());
      await this.test('Fertilizer Endpoints', () => this.testFertilizerEndpoints());
      await this.test('Palm Tree Endpoints', () => this.testPalmTreeEndpoints());
      await this.test('Notes Endpoints', () => this.testNotesEndpoints());
      await this.test('Stats Endpoints', () => this.testStatsEndpoints());
    }
    
    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = ((this.testResults.passed / total) * 100).toFixed(1);
    
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Railway deployment is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the output above for details.');
    }
    
    console.log('\n📋 Detailed Results:');
    this.testResults.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      const duration = test.duration ? `(${test.duration}ms)` : '';
      console.log(`${status} ${test.name} ${duration}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });
  }
}

// Usage
if (require.main === module) {
  const apiURL = process.argv[2] || process.env.RAILWAY_API_URL;
  
  if (!apiURL) {
    console.log('❌ Please provide API URL:');
    console.log('   node test-railway-api.js https://your-app.railway.app');
    console.log('   or set RAILWAY_API_URL environment variable');
    process.exit(1);
  }
  
  const tester = new RailwayAPITester(apiURL);
  tester.runAllTests().catch(console.error);
}

module.exports = RailwayAPITester;