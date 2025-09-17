const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/palmoil.db');

console.log('🔍 Checking table schemas...');

db.all("PRAGMA table_info(harvest_data)", [], (err, rows) => {
    if (err) {
        console.error('Harvest schema error:', err);
    } else {
        console.log('📊 Harvest table schema:');
        rows.forEach(row => console.log('  -', row.name, ':', row.type));
    }

    db.all("PRAGMA table_info(palm_tree_data)", [], (err, rows) => {
        if (err) {
            console.error('Palm tree schema error:', err);
        } else {
            console.log('🌴 Palm tree table schema:');
            rows.forEach(row => console.log('  -', row.name, ':', row.type));
        }

        // Test the actual queries used in API
        console.log('\n🔍 Testing actual API queries...');

        db.get('SELECT COUNT(*) as count, SUM(total_revenue) as revenue, SUM(net_profit) as profit FROM harvest_data', [], (err, row) => {
            if (err) {
                console.error('❌ Harvest query error:', err);
            } else {
                console.log('✅ Harvest query result:', row);
            }

            db.get('SELECT COUNT(DISTINCT tree_id) as count FROM palm_tree_data', [], (err, row) => {
                if (err) {
                    console.error('❌ Palm tree query error:', err);
                } else {
                    console.log('✅ Palm tree query result:', row);
                }

                db.close();
            });
        });
    });
});