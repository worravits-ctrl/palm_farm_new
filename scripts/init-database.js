const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

// สร้างโฟลเดอร์ database หากยังไม่มี
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// อ่านไฟล์ schema
const schema = fs.readFileSync(schemaPath, 'utf8');

// สร้างฐานข้อมูล
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error creating database:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
});

// รันสคริปต์สร้างตาราง
db.exec(schema, (err) => {
    if (err) {
        console.error('❌ Error creating tables:', err.message);
        return;
    }
    console.log('✅ Database tables created successfully');
    
    // ปิดการเชื่อมต่อ
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
            return;
        }
        console.log('✅ Database connection closed');
        console.log('🎉 Database initialization completed!');
        console.log(`📁 Database file: ${dbPath}`);
    });
});