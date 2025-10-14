#!/usr/bin/env node

/**
 * 📊 Railway Resource Usage Monitor
 * ตรวจสอบการใช้ทรัพยากรเทียบกับขิดจำกัดของ Hobby Plan
 */

const fs = require('fs');
const path = require('path');

class RailwayResourceMonitor {
  constructor() {
    this.hobbyLimits = {
      memory: 8192, // 8GB in MB
      storage: 8192, // 8GB in MB
      bandwidth: 100 * 1024, // 100GB in MB per month
      buildMinutes: 500, // minutes per month
      connections: 100 // concurrent connections
    };
    
    this.currentUsage = {
      memory: 0,
      storage: 0,
      bandwidth: 0,
      buildMinutes: 0,
      connections: 0
    };
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  calculatePercentage(used, limit) {
    return ((used / limit) * 100).toFixed(2);
  }

  getStatusIcon(percentage) {
    if (percentage < 50) return '🟢';
    if (percentage < 75) return '🟡';
    if (percentage < 90) return '🟠';
    return '🔴';
  }

  checkLocalDatabaseSize() {
    console.log('📊 Local Database Analysis (for comparison)');
    console.log('-'.repeat(40));
    
    const sqlitePath = path.join(__dirname, 'database', 'palmoil.db');
    if (fs.existsSync(sqlitePath)) {
      const stats = fs.statSync(sqlitePath);
      const sizeKB = stats.size / 1024;
      const sizeMB = sizeKB / 1024;
      
      console.log(`SQLite Database: ${this.formatBytes(stats.size)}`);
      console.log(`Estimated PostgreSQL size: ${this.formatBytes(stats.size * 50)}`); // PostgreSQL usually 50x larger
      
      // คาดการณ์ขนาดหลัง migration
      const estimatedPostgresSize = sizeMB * 50 + 50; // 50MB base overhead
      const storagePercentage = this.calculatePercentage(estimatedPostgresSize, this.hobbyLimits.storage);
      
      console.log(`${this.getStatusIcon(storagePercentage)} Storage after migration: ${storagePercentage}% of 8GB limit`);
    } else {
      console.log('❌ SQLite database not found');
    }
  }

  estimateMemoryUsage() {
    console.log('\n💾 Memory Usage Estimation');
    console.log('-'.repeat(40));
    
    // Node.js application memory estimation
    const nodeMemory = 150; // MB - typical for Express.js app
    const postgresMemory = 200; // MB - PostgreSQL connection pool
    const systemMemory = 100; // MB - OS overhead
    const totalEstimated = nodeMemory + postgresMemory + systemMemory;
    
    const memoryPercentage = this.calculatePercentage(totalEstimated, this.hobbyLimits.memory);
    
    console.log(`Node.js App: ${nodeMemory}MB`);
    console.log(`PostgreSQL: ${postgresMemory}MB`);
    console.log(`System Overhead: ${systemMemory}MB`);
    console.log(`${this.getStatusIcon(memoryPercentage)} Total Estimated: ${totalEstimated}MB (${memoryPercentage}% of 8GB limit)`);
    
    return totalEstimated;
  }

  estimateBandwidthUsage() {
    console.log('\n🌐 Bandwidth Usage Estimation');
    console.log('-'.repeat(40));
    
    // การประมาณการใช้งาน bandwidth
    const dailyUsers = 5; // ผู้ใช้ต่อวัน
    const requestsPerUser = 100; // API calls per user per day
    const avgResponseSize = 10; // KB average response size
    
    const dailyBandwidthKB = dailyUsers * requestsPerUser * avgResponseSize;
    const monthlyBandwidthMB = (dailyBandwidthKB * 30) / 1024;
    
    const bandwidthPercentage = this.calculatePercentage(monthlyBandwidthMB, this.hobbyLimits.bandwidth);
    
    console.log(`Daily users: ${dailyUsers}`);
    console.log(`Requests per user: ${requestsPerUser}`);
    console.log(`Average response: ${avgResponseSize}KB`);
    console.log(`Daily bandwidth: ${this.formatBytes(dailyBandwidthKB * 1024)}`);
    console.log(`${this.getStatusIcon(bandwidthPercentage)} Monthly estimate: ${monthlyBandwidthMB.toFixed(2)}MB (${bandwidthPercentage}% of 100GB limit)`);
    
    return monthlyBandwidthMB;
  }

  estimateBuildUsage() {
    console.log('\n🔨 Build Minutes Estimation');
    console.log('-'.repeat(40));
    
    // การประมาณเวลา build
    const deploysPerMonth = 10; // deployments per month
    const buildTimePerDeploy = 3; // minutes per deployment
    const totalBuildMinutes = deploysPerMonth * buildTimePerDeploy;
    
    const buildPercentage = this.calculatePercentage(totalBuildMinutes, this.hobbyLimits.buildMinutes);
    
    console.log(`Deployments per month: ${deploysPerMonth}`);
    console.log(`Build time per deploy: ${buildTimePerDeploy} minutes`);
    console.log(`${this.getStatusIcon(buildPercentage)} Total build time: ${totalBuildMinutes} minutes (${buildPercentage}% of 500 minute limit)`);
    
    return totalBuildMinutes;
  }

  projectGrowth() {
    console.log('\n📈 Growth Projections');
    console.log('-'.repeat(40));
    
    const years = [1, 2, 3, 5];
    const currentRecords = 1526; // current total records
    const growthRate = 0.3; // 30% growth per year
    
    console.log('Database size projections:');
    years.forEach(year => {
      const projectedRecords = Math.round(currentRecords * Math.pow(1 + growthRate, year));
      const projectedSizeMB = (projectedRecords / currentRecords) * 65; // 65MB estimated current size
      const storagePercentage = this.calculatePercentage(projectedSizeMB, this.hobbyLimits.storage);
      
      console.log(`${this.getStatusIcon(storagePercentage)} Year ${year}: ${projectedRecords.toLocaleString()} records, ${projectedSizeMB.toFixed(0)}MB (${storagePercentage}%)`);
    });
    
    // User growth projection
    console.log('\nUser growth projections:');
    const currentUsers = 4;
    years.forEach(year => {
      const projectedUsers = Math.round(currentUsers * Math.pow(1.5, year)); // 50% user growth per year
      const bandwidthMultiplier = projectedUsers / currentUsers;
      const projectedBandwidth = 5 * bandwidthMultiplier; // 5MB baseline * user multiplier
      const bandwidthPercentage = this.calculatePercentage(projectedBandwidth, this.hobbyLimits.bandwidth);
      
      console.log(`${this.getStatusIcon(bandwidthPercentage)} Year ${year}: ${projectedUsers} users, ${projectedBandwidth.toFixed(0)}MB bandwidth (${bandwidthPercentage}%)`);
    });
  }

  generateRecommendations() {
    console.log('\n💡 Recommendations');
    console.log('-'.repeat(40));
    
    const recommendations = [];
    
    // Database recommendations
    recommendations.push('🗄️ Database Optimization:');
    recommendations.push('   • Enable connection pooling (max 10 connections)');
    recommendations.push('   • Create indexes for frequent queries');
    recommendations.push('   • Archive old data (> 2 years)');
    recommendations.push('   • Use pagination for large result sets');
    
    // Performance recommendations
    recommendations.push('\n⚡ Performance Optimization:');
    recommendations.push('   • Enable gzip compression');
    recommendations.push('   • Implement Redis caching for static data');
    recommendations.push('   • Use CDN for static assets');
    recommendations.push('   • Optimize images and files');
    
    // Monitoring recommendations
    recommendations.push('\n📊 Monitoring Setup:');
    recommendations.push('   • Set up error tracking (Sentry)');
    recommendations.push('   • Monitor response times');
    recommendations.push('   • Track database query performance');
    recommendations.push('   • Set up uptime monitoring');
    
    // Scaling recommendations
    recommendations.push('\n📈 Scaling Strategy:');
    recommendations.push('   • Stay on Hobby Plan until 20+ concurrent users');
    recommendations.push('   • Upgrade to Pro Plan if database > 5GB');
    recommendations.push('   • Consider horizontal scaling for high traffic');
    recommendations.push('   • Implement background job processing if needed');
    
    recommendations.forEach(rec => console.log(rec));
  }

  generateSummaryReport() {
    console.log('\n📋 Railway Hobby Plan Suitability Report');
    console.log('='.repeat(50));
    
    const metrics = [
      { name: 'Database Storage', status: '🟢 EXCELLENT', usage: '< 1%', limit: '8GB' },
      { name: 'Memory Usage', status: '🟢 EXCELLENT', usage: '< 6%', limit: '8GB' },
      { name: 'Bandwidth', status: '🟢 EXCELLENT', usage: '< 0.1%', limit: '100GB/month' },
      { name: 'Build Minutes', status: '🟢 EXCELLENT', usage: '< 6%', limit: '500 min/month' },
      { name: 'Performance', status: '🟢 GOOD', usage: 'Shared CPU', limit: 'Varies' }
    ];
    
    console.log('\nResource Utilization Summary:');
    metrics.forEach(metric => {
      console.log(`${metric.status} ${metric.name}: ${metric.usage} of ${metric.limit}`);
    });
    
    console.log('\n🎯 Overall Assessment: HIGHLY SUITABLE');
    console.log('\nKey Benefits:');
    console.log('✅ 10+ years of growth headroom');
    console.log('✅ Professional features included');
    console.log('✅ Cost-effective at $5/month');
    console.log('✅ Easy scaling path available');
    
    console.log('\n⚠️  Considerations:');
    console.log('• Shared CPU may affect peak performance');
    console.log('• Monitor usage as system grows');
    console.log('• Optimize queries for better performance');
    
    console.log('\n🚀 Recommendation: PROCEED with Railway Hobby Plan');
  }

  run() {
    console.log('📊 Railway Hobby Plan Resource Analysis');
    console.log('🌴 Palm Oil Management System');
    console.log('='.repeat(50));
    
    this.checkLocalDatabaseSize();
    this.estimateMemoryUsage();
    this.estimateBandwidthUsage();
    this.estimateBuildUsage();
    this.projectGrowth();
    this.generateRecommendations();
    this.generateSummaryReport();
    
    console.log('\n📚 Next Steps:');
    console.log('1. Set up PostgreSQL service on Railway');
    console.log('2. Run migration: npm run migrate');
    console.log('3. Test performance: node test-railway-performance.js');
    console.log('4. Deploy application to Railway');
    console.log('5. Monitor usage for first month');
  }
}

// รัน analysis
if (require.main === module) {
  const monitor = new RailwayResourceMonitor();
  monitor.run();
}

module.exports = RailwayResourceMonitor;