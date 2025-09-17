const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database/palmoil.db');

console.log('🔍 Checking harvest data dates...');

db.all(`SELECT date, strftime('%Y', date) as year FROM harvest_data LIMIT 10`, [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err);
    } else {
        console.log('📊 Sample harvest dates:');
        console.table(rows);
    }
    
    // ตรวจสอบข้อมูลที่มี date เป็น null หรือ invalid
    db.all(`SELECT COUNT(*) as total, 
                   COUNT(CASE WHEN date IS NULL THEN 1 END) as null_dates,
                   COUNT(CASE WHEN date IS NOT NULL AND strftime('%Y', date) IS NULL THEN 1 END) as invalid_dates
            FROM harvest_data`, [], (err, summary) => {
        if (err) {
            console.error('❌ Error:', err);
        } else {
            console.log('📈 Date Summary:');
            console.table(summary);
        }
        
        db.close();
    });
});