const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');

function checkDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    console.log('📊 เช็คตารางในฐานข้อมูล...');
    
    // เช็คว่ามีตารางอะไรบ้าง
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ ไม่สามารถเช็คตารางได้:', err);
        db.close();
        reject(err);
        return;
      }
      
      console.log('📋 ตารางทั้งหมด:');
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
      });
      
      // เช็คโครงสร้างของตาราง fertilizer ถ้ามี
      const fertilizerTable = tables.find(t => t.name.toLowerCase().includes('fertilizer'));
      
      if (fertilizerTable) {
        console.log(`\n🔍 โครงสร้างตาราง ${fertilizerTable.name}:`);
        db.all(`PRAGMA table_info(${fertilizerTable.name})`, (err, columns) => {
          if (err) {
            console.error('❌ ไม่สามารถเช็คโครงสร้างตารางได้:', err);
          } else {
            columns.forEach(col => {
              console.log(`  - ${col.name} (${col.type})`);
            });
          }
          
          db.close((err) => {
            if (err) {
              console.error('❌ ไม่สามารถปิดฐานข้อมูลได้:', err);
            } else {
              console.log('🔒 ปิดฐานข้อมูลสำเร็จ');
            }
            resolve();
          });
        });
      } else {
        console.log('\n❌ ไม่พบตาราง fertilizer');
        db.close((err) => {
          if (err) {
            console.error('❌ ไม่สามารถปิดฐานข้อมูลได้:', err);
          } else {
            console.log('🔒 ปิดฐานข้อมูลสำเร็จ');
          }
          resolve();
        });
      }
    });
  });
}

// รันสคริปต์
checkDatabase()
  .then(() => {
    console.log('🎉 การเช็คฐานข้อมูลเสร็จสิ้น');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    process.exit(1);
  });