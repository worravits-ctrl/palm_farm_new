const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');

function addLaborCostToFertilizer() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    console.log('📊 เพิ่มฟิลด์ค่าจ้างในตารางปุ๋ย...');
    
    db.serialize(() => {
      // เช็คว่าคอลัมน์ labor_cost มีอยู่แล้วหรือไม่
      db.all("PRAGMA table_info(fertilizer_data)", (err, columns) => {
        if (err) {
          console.error('❌ ไม่สามารถเช็คโครงสร้างตารางได้:', err);
          db.close();
          reject(err);
          return;
        }
        
        const hasLaborCost = columns.some(col => col.name === 'labor_cost');
        
        if (hasLaborCost) {
          console.log('✅ ฟิลด์ labor_cost มีอยู่แล้ว');
          db.close((err) => {
            if (err) {
              console.error('❌ ไม่สามารถปิดฐานข้อมูลได้:', err);
            } else {
              console.log('🔒 ปิดฐานข้อมูลสำเร็จ');
            }
            resolve();
          });
          return;
        }
        
        // เพิ่มคอลัมน์ labor_cost
        db.run(`
          ALTER TABLE fertilizer_data 
          ADD COLUMN labor_cost REAL DEFAULT 0
        `, (err) => {
          if (err) {
            console.error('❌ ไม่สามารถเพิ่มคอลัมน์ labor_cost ได้:', err);
            db.close();
            reject(err);
            return;
          }
          
          console.log('✅ เพิ่มคอลัมน์ labor_cost สำเร็จ');
          
          // อัพเดตข้อมูลเก่าให้มีค่า labor_cost = 0
          db.run(`
            UPDATE fertilizer_data 
            SET labor_cost = 0 
            WHERE labor_cost IS NULL
          `, (err) => {
            if (err) {
              console.error('❌ ไม่สามารถอัพเดตข้อมูลเก่าได้:', err);
              db.close();
              reject(err);
              return;
            }
            
            console.log('✅ อัพเดตข้อมูลเก่าสำเร็จ');
            
            db.close((err) => {
              if (err) {
                console.error('❌ ไม่สามารถปิดฐานข้อมูลได้:', err);
              } else {
                console.log('🔒 ปิดฐานข้อมูลสำเร็จ');
              }
              resolve();
            });
          });
        });
      });
    });
  });
}

// รันสคริปต์
addLaborCostToFertilizer()
  .then(() => {
    console.log('🎉 การเพิ่มฟิลด์ค่าจ้างเสร็จสิ้น');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    process.exit(1);
  });