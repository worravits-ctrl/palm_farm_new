const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

// ดู schema ของ fertilizer_data
db.all("PRAGMA table_info(fertilizer_data)", (err, columns) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('🌱 Schema ของตาราง fertilizer_data:');
    console.table(columns);
    
    // ดู schema ของ palm_tree_data
    db.all("PRAGMA table_info(palm_tree_data)", (err2, columns2) => {
        if (err2) {
            console.error('Error:', err2);
            return;
        }
        
        console.log('\n🌴 Schema ของตาราง palm_tree_data:');
        console.table(columns2);
        
        db.close();
    });
});