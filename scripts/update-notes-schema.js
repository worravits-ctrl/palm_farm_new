#!/usr/bin/env node

/**
 * Script to update notes_data table schema
 * Add title, category, priority columns
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');

console.log('🔄 Updating notes_data table schema...');
console.log(`📊 Database: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

// Run schema updates
db.serialize(() => {
    // Check if columns already exist
    db.get("PRAGMA table_info(notes_data)", (err, row) => {
        if (err) {
            console.error('❌ Error checking table info:', err);
            return;
        }
        
        // Add title column if it doesn't exist
        db.run("ALTER TABLE notes_data ADD COLUMN title VARCHAR(255) DEFAULT ''", (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('❌ Error adding title column:', err);
                return;
            }
            if (!err) console.log('✅ Added title column');
            
            // Add category column if it doesn't exist
            db.run("ALTER TABLE notes_data ADD COLUMN category VARCHAR(100) DEFAULT 'ทั่วไป'", (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.error('❌ Error adding category column:', err);
                    return;
                }
                if (!err) console.log('✅ Added category column');
                
                // Add priority column if it doesn't exist
                db.run("ALTER TABLE notes_data ADD COLUMN priority VARCHAR(50) DEFAULT 'ปานกลาง'", (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error('❌ Error adding priority column:', err);
                        return;
                    }
                    if (!err) console.log('✅ Added priority column');
                    
                    // Update existing records with default values
                    db.run("UPDATE notes_data SET title = 'บันทึก' WHERE title = '' OR title IS NULL", (err) => {
                        if (err) {
                            console.error('❌ Error updating existing records:', err);
                            return;
                        }
                        
                        console.log('✅ Updated existing records with default values');
                        console.log('🎉 Notes schema update completed successfully!');
                        
                        db.close();
                    });
                });
            });
        });
    });
});