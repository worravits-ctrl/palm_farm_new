
// Add this code to the top of api-server.js after const db = new sqlite3.Database(dbPath);

function initializeMissingTables() {
    console.log('🔍 Checking database tables...');
    
    const tables = {
        'harvest_data': `
            CREATE TABLE IF NOT EXISTS harvest_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                total_weight REAL NOT NULL,
                price_per_kg REAL NOT NULL,
                fallen_weight REAL DEFAULT 0,
                fallen_price_per_kg REAL DEFAULT 0,
                total_revenue REAL NOT NULL,
                harvesting_cost REAL NOT NULL,
                net_profit REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `,
        'fertilizer_data': `
            CREATE TABLE IF NOT EXISTS fertilizer_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                fertilizer_type TEXT NOT NULL,
                amount INTEGER NOT NULL,
                cost_per_bag REAL NOT NULL,
                labor_cost REAL DEFAULT 0,
                total_cost REAL NOT NULL,
                supplier TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `,
        'palm_tree_data': `
            CREATE TABLE IF NOT EXISTS palm_tree_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                tree_id TEXT NOT NULL,
                harvest_date TEXT NOT NULL,
                bunch_count INTEGER NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `
    };
    
    Object.entries(tables).forEach(([tableName, createSql]) => {
        db.run(createSql, (err) => {
            if (err) {
                console.error(`❌ Error creating table ${tableName}:`, err.message);
            } else {
                console.log(`✅ Table ${tableName} ready`);
            }
        });
    });
    
    console.log('🎉 Database initialization completed');
}

// Call this function after db connection
initializeMissingTables();
