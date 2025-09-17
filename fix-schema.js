const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing database schema...');

// Add missing columns to fertilizer_data table
db.serialize(() => {
    // Check if labor_cost column exists, if not add it
    db.all("PRAGMA table_info(fertilizer_data)", (err, columns) => {
        if (err) {
            console.error('Error checking table info:', err);
            return;
        }

        const hasLaborCost = columns.some(col => col.name === 'labor_cost');
        const hasSupplier = columns.some(col => col.name === 'supplier');
        const hasNotes = columns.some(col => col.name === 'notes');

        console.log('Current fertilizer_data columns:', columns.map(c => c.name));

        if (!hasLaborCost) {
            console.log('Adding labor_cost column...');
            db.run("ALTER TABLE fertilizer_data ADD COLUMN labor_cost DECIMAL(10,2) DEFAULT 0", (err) => {
                if (err) {
                    console.error('Error adding labor_cost column:', err);
                } else {
                    console.log('✅ Added labor_cost column');
                }
            });
        }

        if (!hasSupplier) {
            console.log('Adding supplier column...');
            db.run("ALTER TABLE fertilizer_data ADD COLUMN supplier VARCHAR(255)", (err) => {
                if (err) {
                    console.error('Error adding supplier column:', err);
                } else {
                    console.log('✅ Added supplier column');
                }
            });
        }

        if (!hasNotes) {
            console.log('Adding notes column...');
            db.run("ALTER TABLE fertilizer_data ADD COLUMN notes TEXT", (err) => {
                if (err) {
                    console.error('Error adding notes column:', err);
                } else {
                    console.log('✅ Added notes column');
                }
            });
        }

        // Check palm_tree_data table
        db.all("PRAGMA table_info(palm_tree_data)", (err, columns) => {
            if (err) {
                console.error('Error checking palm_tree_data table:', err);
                return;
            }

            const hasTreeId = columns.some(col => col.name === 'tree_id');
            const hasHarvestDate = columns.some(col => col.name === 'harvest_date');
            const hasBunchCount = columns.some(col => col.name === 'bunch_count');

            console.log('Current palm_tree_data columns:', columns.map(c => c.name));

            if (!hasTreeId) {
                console.log('Adding tree_id column...');
                db.run("ALTER TABLE palm_tree_data ADD COLUMN tree_id VARCHAR(10)", (err) => {
                    if (err) {
                        console.error('Error adding tree_id column:', err);
                    } else {
                        console.log('✅ Added tree_id column');
                    }
                });
            }

            if (!hasHarvestDate) {
                console.log('Adding harvest_date column...');
                db.run("ALTER TABLE palm_tree_data ADD COLUMN harvest_date DATE", (err) => {
                    if (err) {
                        console.error('Error adding harvest_date column:', err);
                    } else {
                        console.log('✅ Added harvest_date column');
                    }
                });
            }

            if (!hasBunchCount) {
                console.log('Adding bunch_count column...');
                db.run("ALTER TABLE palm_tree_data ADD COLUMN bunch_count INTEGER", (err) => {
                    if (err) {
                        console.error('Error adding bunch_count column:', err);
                    } else {
                        console.log('✅ Added bunch_count column');
                    }
                });
            }

            console.log('🔧 Database schema update completed!');
            db.close();
        });
    });
});