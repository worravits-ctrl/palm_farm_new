#!/usr/bin/env node

/**
 * 🧪 Railway Hobby Plan Performance Tester
 * ทดสอบประสิทธิภาพ PostgreSQL บน Railway Hobby Plan
 */

const { Pool } = require('pg');
require('dotenv').config();

class RailwayTester {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10, // จำกัด connections สำหรับ Hobby Plan
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  async testConnection() {
    console.log('🔌 Testing Database Connection...');
    try {
      const start = Date.now();
      const result = await this.db.query('SELECT NOW() as current_time, version() as version');
      const duration = Date.now() - start;
      
      console.log(`   ✅ Connected in ${duration}ms`);
      console.log(`   📅 Server time: ${result.rows[0].current_time}`);
      console.log(`   🐘 Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
      return true;
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      return false;
    }
  }

  async testDatabaseSize() {
    console.log('\n📊 Checking Database Size...');
    try {
      // ขนาดฐานข้อมูลทั้งหมด
      const sizeQuery = `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as total_size,
          pg_database_size(current_database()) as size_bytes
      `;
      const sizeResult = await this.db.query(sizeQuery);
      
      // ขนาดของแต่ละตาราง
      const tableQuery = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;
      const tableResult = await this.db.query(tableQuery);
      
      console.log(`   📦 Total Database Size: ${sizeResult.rows[0].total_size}`);
      console.log(`   📊 Size Breakdown:`);
      tableResult.rows.forEach(row => {
        console.log(`      ${row.tablename}: ${row.size}`);
      });
      
      // คำนวณ % ของ Hobby Plan limit (8GB)
      const hobbyLimitGB = 8 * 1024 * 1024 * 1024; // 8GB in bytes
      const usagePercent = (sizeResult.rows[0].size_bytes / hobbyLimitGB * 100).toFixed(2);
      console.log(`   🎯 Hobby Plan Usage: ${usagePercent}% of 8GB limit`);
      
    } catch (error) {
      console.log(`   ❌ Size check failed: ${error.message}`);
    }
  }

  async testDataCounts() {
    console.log('\n🔢 Checking Record Counts...');
    try {
      const tables = ['users', 'harvest_data', 'fertilizer_data', 'palm_tree_data', 'notes_data'];
      let totalRecords = 0;
      
      for (const table of tables) {
        const result = await this.db.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        totalRecords += count;
        console.log(`   📋 ${table}: ${count.toLocaleString()} records`);
      }
      
      console.log(`   🎯 Total Records: ${totalRecords.toLocaleString()}`);
    } catch (error) {
      console.log(`   ❌ Count check failed: ${error.message}`);
    }
  }

  async testQueryPerformance() {
    console.log('\n⚡ Testing Query Performance...');
    
    const queries = [
      {
        name: 'Simple Select',
        sql: 'SELECT * FROM users LIMIT 10'
      },
      {
        name: 'Harvest with Date Filter',
        sql: `SELECT * FROM harvest_data 
              WHERE date >= CURRENT_DATE - INTERVAL '30 days' 
              ORDER BY date DESC LIMIT 50`
      },
      {
        name: 'Complex Join Query',
        sql: `SELECT h.date, h.total_weight, h.price_per_kg, u.username
              FROM harvest_data h 
              JOIN users u ON h.user_id = u.id 
              ORDER BY h.date DESC LIMIT 100`
      },
      {
        name: 'Aggregation Query',
        sql: `SELECT 
                DATE_TRUNC('month', date) as month,
                COUNT(*) as harvest_count,
                SUM(total_weight) as total_weight,
                AVG(price_per_kg) as avg_price
              FROM harvest_data 
              GROUP BY DATE_TRUNC('month', date) 
              ORDER BY month DESC LIMIT 12`
      }
    ];

    for (const query of queries) {
      try {
        const start = Date.now();
        const result = await this.db.query(query.sql);
        const duration = Date.now() - start;
        
        console.log(`   ⚡ ${query.name}: ${duration}ms (${result.rows.length} rows)`);
        
        // แสดงเตือนถ้าช้าเกิน 1 วินาที
        if (duration > 1000) {
          console.log(`      ⚠️  Query slow, consider optimization`);
        }
      } catch (error) {
        console.log(`   ❌ ${query.name}: Failed - ${error.message}`);
      }
    }
  }

  async testConcurrency() {
    console.log('\n🚀 Testing Concurrent Connections...');
    
    const concurrentTests = [];
    const testQuery = 'SELECT COUNT(*) FROM harvest_data WHERE date >= CURRENT_DATE - INTERVAL \'7 days\'';
    
    // สร้าง 5 การเชื่อมต่อพร้อมกัน
    for (let i = 0; i < 5; i++) {
      concurrentTests.push(
        this.db.query(testQuery).then(result => ({
          success: true,
          rows: result.rows.length,
          connectionId: i + 1
        })).catch(error => ({
          success: false,
          error: error.message,
          connectionId: i + 1
        }))
      );
    }
    
    try {
      const start = Date.now();
      const results = await Promise.all(concurrentTests);
      const duration = Date.now() - start;
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`   🎯 Concurrent Test Results:`);
      console.log(`      ✅ Successful: ${successful}/5 connections`);
      console.log(`      ❌ Failed: ${failed}/5 connections`);
      console.log(`      ⏱️  Total Time: ${duration}ms`);
      
      if (failed > 0) {
        console.log(`      ⚠️  Some connections failed - may need connection pooling optimization`);
      }
      
    } catch (error) {
      console.log(`   ❌ Concurrency test failed: ${error.message}`);
    }
  }

  async testMemoryUsage() {
    console.log('\n💾 Checking Memory Usage...');
    
    const used = process.memoryUsage();
    console.log(`   📊 Memory Usage:`);
    console.log(`      RSS: ${Math.round(used.rss / 1024 / 1024)}MB`);
    console.log(`      Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
    console.log(`      Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
    console.log(`      External: ${Math.round(used.external / 1024 / 1024)}MB`);
    
    // คำนวณ % ของ Hobby Plan limit (8GB = 8192MB)
    const hobbyLimitMB = 8192;
    const usagePercent = (used.rss / 1024 / 1024 / hobbyLimitMB * 100).toFixed(2);
    console.log(`   🎯 Hobby Plan Memory Usage: ${usagePercent}% of 8GB limit`);
    
    if (usagePercent > 50) {
      console.log(`      ⚠️  High memory usage - consider optimization`);
    }
  }

  async testIndexPerformance() {
    console.log('\n🔍 Testing Index Performance...');
    
    try {
      // ทดสอบ query ที่ใช้ index
      const indexTests = [
        {
          name: 'User ID Index',
          sql: `EXPLAIN ANALYZE SELECT * FROM harvest_data WHERE user_id = 1`
        },
        {
          name: 'Date Index',
          sql: `EXPLAIN ANALYZE SELECT * FROM harvest_data WHERE date >= '2024-01-01'`
        }
      ];
      
      for (const test of indexTests) {
        try {
          const result = await this.db.query(test.sql);
          const executionTime = result.rows.find(row => 
            row['QUERY PLAN']?.includes('Execution Time:')
          );
          
          if (executionTime) {
            const timeMatch = executionTime['QUERY PLAN'].match(/Execution Time: ([\d.]+) ms/);
            if (timeMatch) {
              console.log(`   ⚡ ${test.name}: ${timeMatch[1]}ms`);
            }
          }
        } catch (error) {
          console.log(`   ❌ ${test.name}: Failed`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Index test failed: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🧪 Railway Hobby Plan Performance Test Suite');
    console.log('=' .repeat(50));
    
    // ทดสอบการเชื่อมต่อก่อน
    const connected = await this.testConnection();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }
    
    // รันการทดสอบทั้งหมด
    await this.testDatabaseSize();
    await this.testDataCounts();
    await this.testQueryPerformance();
    await this.testConcurrency();
    await this.testMemoryUsage();
    await this.testIndexPerformance();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('📊 Check results above for Hobby Plan suitability');
    
    await this.db.end();
  }
}

// รันการทดสอบ
if (require.main === module) {
  const tester = new RailwayTester();
  tester.runAllTests().catch(console.error);
}

module.exports = RailwayTester;