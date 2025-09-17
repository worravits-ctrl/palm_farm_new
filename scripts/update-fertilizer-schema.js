const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Updating fertilizer_data table schema...');

db.serialize(() => {
    // Create backup table with old data
    db.run(`CREATE TABLE IF NOT EXISTS fertilizer_data_backup AS SELECT * FROM fertilizer_data`);
    
    // Drop the old table
    db.run(`DROP TABLE IF EXISTS fertilizer_data`);
    
    // Create new table with updated schema
    db.run(`
        CREATE TABLE IF NOT EXISTS fertilizer_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            fertilizer_type VARCHAR(255) NOT NULL,
            amount INTEGER NOT NULL,
            cost_per_bag DECIMAL(8,2) NOT NULL,
            total_cost DECIMAL(12,2) NOT NULL,
            supplier VARCHAR(255),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating new fertilizer_data table:', err);
        } else {
            console.log('✅ New fertilizer_data table created successfully');
        }
    });
    
    // Migrate data from backup if exists
    db.run(`
        INSERT INTO fertilizer_data (user_id, date, fertilizer_type, amount, cost_per_bag, total_cost, created_at)
        SELECT user_id, date, item, sacks, price_per_sack, total_cost, created_at 
        FROM fertilizer_data_backup
    `, (err) => {
        if (err) {
            console.log('ℹ️ No existing data to migrate or migration error:', err.message);
        } else {
            console.log('✅ Data migrated from old schema');
        }
    });
    
    // Clean up backup table
    db.run(`DROP TABLE IF EXISTS fertilizer_data_backup`);
});

db.close((err) => {
    if (err) {
        console.error('❌ Error closing database:', err);
    } else {
        console.log('✅ Fertilizer schema update completed');
    }
});