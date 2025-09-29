const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');

console.log('🔄 อัปเดตฐานข้อมูลเพื่อเพิ่มฟิลด์ปาล์มร่วง...');
console.log('📂 ไฟล์ฐานข้อมูล:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', err.message);
        process.exit(1);
    }
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
});

// เพิ่มคอลัมน์ปาล์มร่วงในตาราง harvest_data
const alterQueries = [
    `ALTER TABLE harvest_data ADD COLUMN fallen_weight DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE harvest_data ADD COLUMN fallen_price_per_kg DECIMAL(8,2) DEFAULT 0`
];

let completedQueries = 0;

alterQueries.forEach((query, index) => {
    db.run(query, function(err) {
        if (err) {
            // ถ้าคอลัมน์มีอยู่แล้วจะ error แต่ไม่เป็นไร
            if (err.message.includes('duplicate column name')) {
                console.log(`⚠️  คอลัมน์มีอยู่แล้ว: ${query.split(' ')[4]}`);
            } else {
                console.error(`❌ เกิดข้อผิดพลาดในคำสั่ง ${index + 1}:`, err.message);
            }
        } else {
            console.log(`✅ เพิ่มคอลัมน์สำเร็จ: ${query.split(' ')[4]}`);
        }
        
        completedQueries++;
        
        // ตรวจสอบว่าทำงานเสร็จหมดแล้วหรือยัง
        if (completedQueries === alterQueries.length) {
            // ตรวจสอบโครงสร้างตารางใหม่
            db.all("PRAGMA table_info(harvest_data)", [], (err, rows) => {
                if (err) {
                    console.error('❌ ไม่สามารถตรวจสอบโครงสร้างตารางได้:', err.message);
                } else {
                    console.log('\n📊 โครงสร้างตาราง harvest_data หลังอัปเดต:');
                    rows.forEach(row => {
                        const required = row.notnull ? '*' : '';
                        console.log(`   ${row.name}${required} (${row.type})`);
                    });
                    
                    // ตรวจสอบจำนวนข้อมูลในตาราง
                    db.get("SELECT COUNT(*) as count FROM harvest_data", [], (err, row) => {
                        if (err) {
                            console.error('❌ ไม่สามารถนับจำนวนข้อมูลได้:', err.message);
                        } else {
                            console.log(`\n📈 จำนวนข้อมูลการเก็บเกี่ยวในระบบ: ${row.count} รายการ`);
                        }
                        
                        db.close((err) => {
                            if (err) {
                                console.error('❌ ไม่สามารถปิดการเชื่อมต่อฐานข้อมูลได้:', err.message);
                            } else {
                                console.log('✅ ปิดการเชื่อมต่อฐานข้อมูลสำเร็จ');
                                console.log('\n🎉 อัปเดตฐานข้อมูลเสร็จสิ้น!');
                                console.log('💡 สามารถเริ่มใช้งานฟีเจอร์ปาล์มร่วงได้แล้ว');
                            }
                        });
                    });
                }
            });
        }
    });
});