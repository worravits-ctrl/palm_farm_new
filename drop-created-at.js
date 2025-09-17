const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

console.log('🔍 Checking harvest_data table...');

db.all("PRAGMA table_info(harvest_data)", [], (err, rows) => {
    if (err) {
        console.error('Schema error:', err);
    } else {
        console.log('📊 Harvest table schema:');
        rows.forEach(row => console.log('  -', row.name, ':', row.type));
    }

    // ดูข้อมูลตัวอย่าง
    db.all('SELECT * FROM harvest_data LIMIT 3', [], (err, rows) => {
        if (err) {
            console.error('Data error:', err);
        } else {
            console.log('📋 Sample data:');
            console.log(JSON.stringify(rows, null, 2));
        }

        // ลบคอลัมน์ created_at
        console.log('\n🗑️ Dropping created_at column...');
        db.run('ALTER TABLE harvest_data DROP COLUMN created_at', [], (err) => {
            if (err) {
                console.error('❌ Error dropping column:', err);
            } else {
                console.log('✅ Successfully dropped created_at column');
            }

            // ตรวจสอบ schema หลังการลบ
            db.all("PRAGMA table_info(harvest_data)", [], (err, rows) => {
                if (err) {
                    console.error('Schema error after drop:', err);
                } else {
                    console.log('📊 Schema after dropping created_at:');
                    rows.forEach(row => console.log('  -', row.name, ':', row.type));
                }
                db.close();
            });
        });
    });
});