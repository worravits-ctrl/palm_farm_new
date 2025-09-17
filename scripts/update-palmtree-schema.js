#!/usr/bin/env node

/**
 * Script to update palm_tree_data table schema for new harvest tracking system
 * Changes:
 * - date -> harvest_date
 * - palm_tree -> tree_id
 * - bunches -> bunch_count
 * - note -> notes
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');

console.log('🔄 Updating palm_tree_data table schema...');
console.log(`📊 Database: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

// Run schema updates
db.serialize(() => {
    // First, let's check current schema
    db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='palm_tree_data'", (err, row) => {
        if (err) {
            console.error('❌ Error checking current schema:', err);
            return;
        }
        
        console.log('📋 Current schema:', row?.sql);
        
        // Check if we need to update the schema
        if (row?.sql.includes('harvest_date')) {
            console.log('✅ Schema already updated!');
            db.close();
            return;
        }
        
        console.log('🔄 Schema needs updating...');
        
        // Create new table with updated schema
        db.run(`
            CREATE TABLE IF NOT EXISTS palm_tree_data_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                tree_id VARCHAR(10) NOT NULL, -- A1, A2, ..., L26
                harvest_date DATE NOT NULL,
                bunch_count INTEGER NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error creating new table:', err);
                return;
            }
            
            console.log('✅ Created new table structure');
            
            // Copy data from old table to new table
            db.run(`
                INSERT INTO palm_tree_data_new (id, user_id, tree_id, harvest_date, bunch_count, notes, created_at)
                SELECT id, user_id, palm_tree, date, bunches, note, created_at 
                FROM palm_tree_data
            `, (err) => {
                if (err) {
                    console.error('❌ Error copying data:', err);
                    return;
                }
                
                console.log('✅ Data copied successfully');
                
                // Drop old table
                db.run('DROP TABLE palm_tree_data', (err) => {
                    if (err) {
                        console.error('❌ Error dropping old table:', err);
                        return;
                    }
                    
                    console.log('✅ Old table dropped');
                    
                    // Rename new table
                    db.run('ALTER TABLE palm_tree_data_new RENAME TO palm_tree_data', (err) => {
                        if (err) {
                            console.error('❌ Error renaming table:', err);
                            return;
                        }
                        
                        console.log('✅ Table renamed successfully');
                        
                        // Recreate index
                        db.run('CREATE INDEX IF NOT EXISTS idx_palmtree_user_date ON palm_tree_data(user_id, harvest_date)', (err) => {
                            if (err) {
                                console.error('❌ Error creating index:', err);
                                return;
                            }
                            
                            console.log('✅ Index created successfully');
                            
                            // Verify new schema
                            db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='palm_tree_data'", (err, row) => {
                                if (err) {
                                    console.error('❌ Error verifying schema:', err);
                                    return;
                                }
                                
                                console.log('📋 New schema:', row?.sql);
                                console.log('🎉 Schema update completed successfully!');
                                
                                db.close();
                            });
                        });
                    });
                });
            });
        });
    });
});