const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

console.log('📊 ตรวจสอบข้อมูลในฐานข้อมูล SQLite:\n');

const tables = ['users', 'harvest_data', 'fertilizer_data', 'palm_tree_data', 'notes_data'];
let completed = 0;

tables.forEach(table => {
  db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
    if (!err) {
      console.log(`- ${table}: ${row.count} รายการ`);
    } else {
      console.log(`- ${table}: Error - ${err.message}`);
    }
    
    completed++;
    if (completed === tables.length) {
      // แสดงโครงสร้างตาราง
      console.log('\n📋 โครงสร้างตาราง:');
      db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        if (!err && row) {
          console.log('\nUsers table schema:');
          console.log(row.sql);
        }
        
        db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='harvest_data'", (err, row) => {
          if (!err && row) {
            console.log('\nHarvest_data table schema:');
            console.log(row.sql);
          }
          
          // แสดงตัวอย่างข้อมูล
          console.log('\n💾 ตัวอย่างข้อมูล:');
          db.get("SELECT * FROM users LIMIT 1", (err, row) => {
            if (!err && row) {
              console.log('\nSample user:', row);
            }
            
            db.get("SELECT * FROM harvest_data LIMIT 1", (err, row) => {
              if (!err && row) {
                console.log('\nSample harvest data:', row);
              }
              
              db.close();
              console.log('\n✅ การตรวจสอบเสร็จสิ้น');
            });
          });
        });
      });
    }
  });
});