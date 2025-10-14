const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const OfflineSearchEngine = require('./OfflineSearchEngine');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // For local development, use 3001, Railway will override with PORT env var
const JWT_SECRET = process.env.JWT_SECRET || 'palmoil-secret-key-2025';

console.log('🔍 Starting Palm Oil API Server...');
console.log('📴 Using Offline Search Engine (No external API required)');

// Database connection
const dbPath = path.join(__dirname, 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

// Initialize missing database tables
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

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'",
                "https://unpkg.com", // Allow all from unpkg.com
                "https://unpkg.com/react@18/umd/react.development.js",
                "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
                "https://unpkg.com/@babel/standalone/babel.min.js",
                "https://unpkg.com/chart.js@4.4.0/dist/chart.umd.js",
                "https://cdn.tailwindcss.com"
            ],
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "*.up.railway.app", "https://unpkg.com"], // Production support for Railway
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// CORS configuration for production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl requests, etc.)
        if (!origin) return callback(null, true);
        
        // Allow localhost for development
        if (origin.includes('localhost')) return callback(null, true);
        
        // Allow Railway production domains
        if (origin.includes('.up.railway.app')) return callback(null, true);
        
        // Deny other origins
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

app.use(cors(corsOptions));
// Increase payload size limits for bulk imports (800+ rows CSV files)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs (increased for development)
});
app.use('/api/', limiter);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ==== AUTH ROUTES ====

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        searchMode: 'offline'
    });
});

// API status endpoint (no auth required)
app.get('/api/status', (req, res) => {
    res.json({ 
        server: 'Palm Oil API Server',
        version: '1.0.0',
        status: 'running',
        port: PORT,
        search: {
            mode: 'offline',
            description: 'Using local pattern-based search engine'
        },
        database: {
            path: dbPath
        },
        timestamp: new Date().toISOString()
    });
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log('Registration attempt:', { username, email, password: '***' });

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Database check error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (row) {
                console.log('User already exists:', email);
                return res.status(400).json({ error: 'Email already registered' });
            }

            try {
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);
                console.log('Password hashed successfully, hash length:', hashedPassword.length);
                console.log('Hash starts with:', hashedPassword.substring(0, 10) + '...');

                // Insert user
                db.run(
                    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                    [username, email, hashedPassword, 'user'],
                    function(err) {
                        if (err) {
                            console.error('Database insert error:', err);
                            return res.status(500).json({ error: 'Failed to create user' });
                        }
                        
                        console.log('User created successfully with ID:', this.lastID);
                        
                        res.status(201).json({ 
                            message: 'User registered successfully',
                            userId: this.lastID
                        });
                    }
                );
            } catch (hashError) {
                console.error('Password hashing error:', hashError);
                return res.status(500).json({ error: 'Password hashing error' });
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login attempt:', { email, password: '***', timestamp: new Date().toISOString() });

        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({ error: 'Email and password are required' });
        }

        db.get(
            'SELECT * FROM users WHERE email = ?',
            [email],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    console.log('❌ User not found:', email);
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                console.log('User found:', { 
                    id: user.id, 
                    email: user.email, 
                    role: user.role,
                    hashedPassword: user.password.substring(0, 10) + '...' 
                });

                // All users now use hashed passwords
                try {
                    console.log('🔍 Password comparison details:');
                    console.log('   Attempting to compare password for:', email);
                    console.log('   Password from request: [hidden for security]');
                    console.log('   Stored hash starts with:', user.password.substring(0, 10));
                    console.log('   Hash length:', user.password.length);
                    
                    const validPassword = await bcrypt.compare(password, user.password);
                    console.log('   🔍 Password validation result:', validPassword);
                    
                    if (!validPassword) {
                        console.log('❌ Password mismatch for user:', email);
                        console.log('   💡 Expected password for testing: "admin" for admin, "user" for user');
                        return res.status(401).json({ error: 'Invalid email or password' });
                    }

                    const token = jwt.sign(
                        { userId: user.id, email: user.email, role: user.role },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    console.log('Login successful for user:', email);
                    res.json({
                        token,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role
                        }
                    });
                } catch (bcryptError) {
                    console.error('Bcrypt error:', bcryptError);
                    return res.status(500).json({ error: 'Password validation error' });
                }
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==== USER ROUTES ====

// Get all users (Admin only)
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
    console.log('GET /api/users called by user:', req.user.email);
    db.all(
        'SELECT id, username, email, role, is_active, created_at FROM users ORDER BY created_at DESC',
        [],
        (err, rows) => {
            if (err) {
                console.error('Database error in /api/users:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Returning', rows.length, 'users');
            res.json(rows);
        }
    );
});

// Update user role (Admin only)
app.put('/api/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    db.run(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ message: 'User role updated successfully' });
        }
    );
});

// Toggle user active status (Admin only)
app.put('/api/users/:id/toggle', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    db.run(
        'UPDATE users SET is_active = NOT is_active WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ message: 'User status updated successfully' });
        }
    );
});

// Update user data (Admin only)
app.put('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { username, email, role, is_active, password } = req.body;

    // Validate role
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists for other users
    db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id],
        async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (row) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            // Prepare update data
            let updateQuery = 'UPDATE users SET username = ?, email = ?, role = ?, is_active = ?';
            let updateParams = [username, email, role, is_active ? 1 : 0];

            // Hash password if provided
            if (password && password.trim() !== '') {
                try {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    updateQuery += ', password = ?';
                    updateParams.push(hashedPassword);
                    console.log(`🔐 Password updated for user ID ${id}`);
                } catch (hashError) {
                    console.error('Password hashing error:', hashError);
                    return res.status(500).json({ error: 'Password hashing failed' });
                }
            }

            updateQuery += ' WHERE id = ?';
            updateParams.push(id);

            // Update user
            db.run(updateQuery, updateParams, function(err) {
                if (err) {
                    console.error('Database error updating user:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }
                
                console.log(`✅ User ${id} updated successfully${password ? ' (including password)' : ''}`);
                res.json({ message: 'User updated successfully' });
            });
        }
    );
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.run(
        'DELETE FROM users WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ message: 'User deleted successfully' });
        }
    );
});

// ==== HARVEST ROUTES ====

// Get harvest data - All users see the same shared data
app.get('/api/harvest', authenticateToken, (req, res) => {
    db.all('SELECT * FROM harvest_data ORDER BY date DESC', (err, rows) => {
        if (err) {
            console.error('Database error in harvest:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Returning', rows.length, 'harvest records (shared data) for user:', req.user.email);
        res.json(rows);
    });
});

// Add harvest data
app.post('/api/harvest', authenticateToken, (req, res) => {
    const { 
        date, 
        total_weight, 
        price_per_kg, 
        fallen_weight = 0, 
        fallen_price_per_kg = 0, 
        total_revenue, 
        harvesting_cost,
        net_profit 
    } = req.body;
    
    const user_id = req.user.userId;

    console.log('POST /api/harvest - User:', req.user.email, 'UserId:', user_id, 'Data:', { 
        date, total_weight, price_per_kg, fallen_weight, fallen_price_per_kg, total_revenue, harvesting_cost, net_profit 
    });

    if (!date || !total_weight || !price_per_kg || harvesting_cost === undefined) {
        return res.status(400).json({ error: 'Required fields: date, total_weight, price_per_kg, harvesting_cost' });
    }

    // ใช้ค่าที่คำนวณมาจาก frontend หรือคำนวณใหม่ถ้าไม่มี
    let calculatedTotalRevenue = total_revenue;
    let calculatedNetProfit = net_profit;
    
    if (!calculatedTotalRevenue || !calculatedNetProfit) {
        const normalRevenue = total_weight * price_per_kg;
        const fallenRevenue = (fallen_weight || 0) * (fallen_price_per_kg || 0);
        calculatedTotalRevenue = normalRevenue + fallenRevenue;
        calculatedNetProfit = calculatedTotalRevenue - harvesting_cost;
    }

    db.run(
        `INSERT INTO harvest_data (
            user_id, date, total_weight, price_per_kg, 
            fallen_weight, fallen_price_per_kg, 
            total_revenue, harvesting_cost, net_profit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            user_id, date, total_weight, price_per_kg, 
            fallen_weight || 0, fallen_price_per_kg || 0,
            calculatedTotalRevenue, harvesting_cost, calculatedNetProfit
        ],
        function(err) {
            if (err) {
                console.error('Database error inserting harvest:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            console.log('Harvest data inserted successfully with ID:', this.lastID, 'for user:', req.user.email);
            res.status(201).json({
                id: this.lastID,
                message: 'Harvest data added successfully',
                data: {
                    total_revenue: calculatedTotalRevenue,
                    net_profit: calculatedNetProfit,
                    fallen_revenue: (fallen_weight || 0) * (fallen_price_per_kg || 0)
                }
            });
        }
    );
});

// Update harvest data
app.put('/api/harvest/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { 
        date, 
        total_weight, 
        price_per_kg, 
        fallen_weight = 0, 
        fallen_price_per_kg = 0, 
        harvesting_cost 
    } = req.body;
    const user_id = req.user.userId;

    if (!date || !total_weight || !price_per_kg || harvesting_cost === undefined) {
        return res.status(400).json({ error: 'Required fields: date, total_weight, price_per_kg, harvesting_cost' });
    }

    // คำนวณรายได้และกำไรใหม่
    const normalRevenue = total_weight * price_per_kg;
    const fallenRevenue = (fallen_weight || 0) * (fallen_price_per_kg || 0);
    const total_revenue = normalRevenue + fallenRevenue;
    const net_profit = total_revenue - harvesting_cost;

    // Check if user owns this record or is admin
    const checkQuery = req.user.role === 'admin' 
        ? 'SELECT id FROM harvest_data WHERE id = ?'
        : 'SELECT id FROM harvest_data WHERE id = ? AND user_id = ?';
    const checkParams = req.user.role === 'admin' ? [id] : [id, user_id];

    db.get(checkQuery, checkParams, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Harvest record not found or access denied' });
        }

        db.run(
            `UPDATE harvest_data SET 
                date = ?, total_weight = ?, price_per_kg = ?, 
                fallen_weight = ?, fallen_price_per_kg = ?,
                total_revenue = ?, harvesting_cost = ?, net_profit = ? 
            WHERE id = ?`,
            [
                date, total_weight, price_per_kg, 
                fallen_weight || 0, fallen_price_per_kg || 0,
                total_revenue, harvesting_cost, net_profit, id
            ],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ 
                    message: 'Harvest data updated successfully',
                    data: {
                        total_revenue,
                        net_profit,
                        fallen_revenue: (fallen_weight || 0) * (fallen_price_per_kg || 0)
                    }
                });
            }
        );
    });
});

// Delete all harvest data (Admin only)
app.delete('/api/harvest/delete-all', authenticateToken, requireAdmin, (req, res) => {
    console.log('🗑️ DELETE ALL /api/harvest/delete-all - Admin:', req.user.email);
    
    db.run('DELETE FROM harvest_data', [], function(err) {
        if (err) {
            console.error('Database error deleting all harvest data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log(`✅ Deleted ${this.changes} harvest records`);
        res.json({ 
            message: 'All harvest data deleted successfully',
            deletedCount: this.changes
        });
    });
});

// Delete harvest data
app.delete('/api/harvest/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const user_id = req.user.userId;

    // Check if user owns this record or is admin
    const checkQuery = req.user.role === 'admin' 
        ? 'SELECT id FROM harvest_data WHERE id = ?'
        : 'SELECT id FROM harvest_data WHERE id = ? AND user_id = ?';
    const checkParams = req.user.role === 'admin' ? [id] : [id, user_id];

    db.get(checkQuery, checkParams, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Harvest record not found or access denied' });
        }

        db.run('DELETE FROM harvest_data WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Harvest data deleted successfully' });
        });
    });
});

// ==== BULK IMPORT ROUTES ====

// Bulk import harvest data
app.post('/api/harvest/bulk', authenticateToken, (req, res) => {
    const { data } = req.body;
    const user_id = req.user.userId;

    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: 'Data array is required' });
    }

    console.log(`🚀 Bulk import harvest - User: ${req.user.email}, Records: ${data.length}`);

    const stmt = db.prepare('INSERT INTO harvest_data (user_id, date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            for (const item of data) {
                const { date, total_weight, price_per_kg, harvesting_cost } = item;
                
                if (!date || !total_weight || !price_per_kg || !harvesting_cost) {
                    errorCount++;
                    continue;
                }
                
                const total_revenue = parseFloat(total_weight) * parseFloat(price_per_kg);
                const net_profit = total_revenue - parseFloat(harvesting_cost);
                
                stmt.run([user_id, date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit]);
                successCount++;
            }
            
            db.run('COMMIT');
            console.log(`✅ Bulk import harvest completed - Success: ${successCount}, Errors: ${errorCount}`);
            res.json({ message: `Bulk import completed - ${successCount} records added, ${errorCount} errors` });
            
        } catch (error) {
            db.run('ROLLBACK');
            console.error('Bulk import error:', error);
            res.status(500).json({ error: 'Bulk import failed' });
        } finally {
            stmt.finalize();
        }
    });
});

// Bulk import fertilizer data
app.post('/api/fertilizer/bulk', authenticateToken, (req, res) => {
    const { data } = req.body;
    const user_id = req.user.userId;

    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: 'Data array is required' });
    }

    console.log(`🚀 Bulk import fertilizer - User: ${req.user.email}, Records: ${data.length}`);

    const stmt = db.prepare('INSERT INTO fertilizer_data (user_id, date, fertilizer_type, amount, cost_per_bag, labor_cost, total_cost, supplier, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            for (const item of data) {
                const { date, fertilizer_type, quantity_bags, cost_per_bag, notes, item: item_name, sacks, price_per_sack, labor_cost, supplier, amount } = item;
                
                // Support both old and new field names for backward compatibility
                const final_item = item_name || fertilizer_type;
                const final_sacks = sacks !== undefined ? sacks : (quantity_bags !== undefined ? quantity_bags : amount);
                const final_price_per_sack = price_per_sack !== undefined ? price_per_sack : cost_per_bag;
                const final_labor_cost = labor_cost !== undefined ? labor_cost : 0;
                
                // Detailed validation logging
                const missingFields = [];
                if (!date) missingFields.push('date');
                if (!final_item) missingFields.push('fertilizer_type/item');
                if (final_sacks === undefined) missingFields.push('sacks/quantity_bags/amount');
                if (final_price_per_sack === undefined) missingFields.push('price_per_sack/cost_per_bag');
                
                if (missingFields.length > 0) {
                    console.log(`❌ Record validation failed - Missing fields: ${missingFields.join(', ')}`);
                    console.log(`   Raw record data:`, JSON.stringify(item));
                    console.log(`   Processed values - date: "${date}", item: "${final_item}", sacks: "${final_sacks}", price: "${final_price_per_sack}"`);
                    errorCount++;
                    continue;
                }
                
                const total_cost = parseFloat(final_sacks) * parseFloat(final_price_per_sack) + parseFloat(final_labor_cost);
                
                stmt.run([user_id, date, final_item, final_sacks, final_price_per_sack, final_labor_cost, total_cost, supplier || null, notes || null]);
                successCount++;
            }
            
            db.run('COMMIT');
            console.log(`✅ Bulk import fertilizer completed - Success: ${successCount}, Errors: ${errorCount}`);
            res.json({ message: `Bulk import completed - ${successCount} records added, ${errorCount} errors` });
            
        } catch (error) {
            db.run('ROLLBACK');
            console.error('Bulk import error:', error);
            res.status(500).json({ error: 'Bulk import failed' });
        } finally {
            stmt.finalize();
        }
    });
});

// Bulk import palm tree data
app.post('/api/palmtrees/bulk', authenticateToken, (req, res) => {
    const { data } = req.body;
    const user_id = req.user.userId;

    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: 'Data array is required' });
    }

    console.log(`🚀 Bulk import palmtrees - User: ${req.user.email}, Records: ${data.length}`);

    const stmt = db.prepare('INSERT INTO palm_tree_data (user_id, tree_id, harvest_date, bunch_count, notes) VALUES (?, ?, ?, ?, ?)');
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            for (const item of data) {
                const { tree_id, harvest_date, bunch_count, notes, palm_tree, date, bunches } = item;
                
                // Support both old and new field names for backward compatibility
                const final_tree_id = palm_tree || tree_id;
                const final_harvest_date = date || harvest_date;
                // Ensure bunch_count is a number, default to 0 if missing or invalid
                const final_bunch_count = bunches !== undefined && bunches !== '' ? parseInt(bunches) : (bunch_count !== undefined && bunch_count !== '' ? parseInt(bunch_count) : 0);

                if (!final_tree_id || !final_harvest_date) {
                    console.warn(`⚠️ Skipping row due to missing tree_id or harvest_date:`, item);
                    errorCount++;
                    continue;
                }
                
                stmt.run([user_id, final_tree_id, final_harvest_date, final_bunch_count, notes || '']);
                successCount++;
            }
            
            db.run('COMMIT');
            console.log(`✅ Bulk import palmtrees completed - Success: ${successCount}, Errors: ${errorCount}`);
            res.json({ message: `Bulk import completed - ${successCount} records added, ${errorCount} errors` });
            
        } catch (error) {
            db.run('ROLLBACK');
            console.error('Bulk import error:', error);
            res.status(500).json({ error: 'Bulk import failed' });
        } finally {
            stmt.finalize();
        }
    });
});

// Bulk import notes data
app.post('/api/notes/bulk', authenticateToken, (req, res) => {
    const { data } = req.body;
    const user_id = req.user.userId;

    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: 'Data array is required' });
    }

    console.log(`🚀 Bulk import notes - User: ${req.user.email}, Records: ${data.length}`);

    const stmt = db.prepare('INSERT INTO notes_data (user_id, date, title, content) VALUES (?, ?, ?, ?)');     db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            for (const item of data) {
                const { date, title, content, category } = item;
                
                if (!date || !title || !content) {
                    errorCount++;
                    continue;
                }
                
                stmt.run([user_id, date, title, content]);
                successCount++;
            }
            
            db.run('COMMIT');
            console.log(`✅ Bulk import notes completed - Success: ${successCount}, Errors: ${errorCount}`);
            res.json({ message: `Bulk import completed - ${successCount} records added, ${errorCount} errors` });
            
        } catch (error) {
            db.run('ROLLBACK');
            console.error('Bulk import error:', error);
            res.status(500).json({ error: 'Bulk import failed' });
        } finally {
            stmt.finalize();
        }
    });
});

// ==== FERTILIZER ROUTES ====

// Get fertilizer data - All users see the same shared data
app.get('/api/fertilizer', authenticateToken, (req, res) => {
    db.all('SELECT * FROM fertilizer_data ORDER BY date DESC', (err, rows) => {
        if (err) {
            console.error('Database error in fertilizer:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Returning', rows.length, 'fertilizer records (shared data) for user:', req.user.email);
        res.json(rows);
    });
});

// Add fertilizer data
app.post('/api/fertilizer', authenticateToken, (req, res) => {
    const { date, fertilizer_type, amount, cost_per_bag, supplier, notes, item, sacks, price_per_sack, labor_cost } = req.body;
    const user_id = req.user.userId;

    // Support both old and new field names for backward compatibility
    const final_item = item || fertilizer_type;
    const final_sacks = sacks !== undefined ? sacks : amount;
    const final_price_per_sack = price_per_sack !== undefined ? price_per_sack : cost_per_bag;
    const final_labor_cost = labor_cost !== undefined ? labor_cost : 0;

    if (!date || !final_item || final_sacks === undefined || final_price_per_sack === undefined) {
        return res.status(400).json({ error: 'Date, fertilizer type, amount, and cost per bag are required' });
    }

    const total_cost = final_sacks * final_price_per_sack + final_labor_cost;

    db.run(
        'INSERT INTO fertilizer_data (user_id, date, fertilizer_type, amount, cost_per_bag, labor_cost, total_cost, supplier, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, date, final_item, final_sacks, final_price_per_sack, final_labor_cost, total_cost, supplier || null, notes || null],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.status(201).json({
                id: this.lastID,
                message: 'Fertilizer data added successfully'
            });
        }
    );
});

// Update fertilizer data
app.put('/api/fertilizer/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { date, fertilizer_type, amount, cost_per_bag, supplier, notes, item, sacks, price_per_sack, labor_cost } = req.body;
    const user_id = req.user.userId;

    // Support both old and new field names for backward compatibility
    const final_item = item || fertilizer_type;
    const final_sacks = sacks !== undefined ? sacks : amount;
    const final_price_per_sack = price_per_sack !== undefined ? price_per_sack : cost_per_bag;
    const final_labor_cost = labor_cost !== undefined ? labor_cost : 0;

    if (!date || !final_item || final_sacks === undefined || final_price_per_sack === undefined) {
        return res.status(400).json({ error: 'Date, fertilizer type, amount, and cost per bag are required' });
    }

    const total_cost = final_sacks * final_price_per_sack + final_labor_cost;

    // Check if user owns this record or is admin
    const checkQuery = req.user.role === 'admin' 
        ? 'SELECT id FROM fertilizer_data WHERE id = ?'
        : 'SELECT id FROM fertilizer_data WHERE id = ? AND user_id = ?';
    const checkParams = req.user.role === 'admin' ? [id] : [id, user_id];

    db.get(checkQuery, checkParams, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Fertilizer record not found or access denied' });
        }

        db.run(
            'UPDATE fertilizer_data SET date = ?, fertilizer_type = ?, amount = ?, cost_per_bag = ?, labor_cost = ?, total_cost = ?, supplier = ?, notes = ? WHERE id = ?',
            [date, final_item, final_sacks, final_price_per_sack, final_labor_cost, total_cost, supplier || null, notes || null, id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Fertilizer data updated successfully' });
            }
        );
    });
});

// Delete fertilizer data
app.delete('/api/fertilizer/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const user_id = req.user.userId;

    // Check if user owns this record or is admin
    const checkQuery = req.user.role === 'admin' 
        ? 'SELECT id FROM fertilizer_data WHERE id = ?'
        : 'SELECT id FROM fertilizer_data WHERE id = ? AND user_id = ?';
    const checkParams = req.user.role === 'admin' ? [id] : [id, user_id];

    db.get(checkQuery, checkParams, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Fertilizer record not found or access denied' });
        }

        db.run('DELETE FROM fertilizer_data WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Fertilizer data deleted successfully' });
        });
    });
});

// ==== PALM TREE ROUTES ====

// Get palm tree data - All users see the same shared data
app.get('/api/palmtrees', authenticateToken, (req, res) => {
    db.all('SELECT * FROM palm_tree_data ORDER BY harvest_date DESC', (err, rows) => {
        if (err) {
            console.error('Database error in palmtrees:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('📊 Total shared palmtree rows:', rows.length);
        console.log('🔍 First 3 rows:', rows.slice(0, 3));
        console.log('🔍 Last 3 rows:', rows.slice(-3));
        console.log('Returning', rows.length, 'palmtree records (shared data) for user:', req.user.email);
        res.json(rows);
    });
});

// Add palm tree data
app.post('/api/palmtrees', authenticateToken, (req, res) => {
    const { tree_id, harvest_date, bunch_count, notes, palm_tree, date, bunches } = req.body;
    const user_id = req.user.userId;

    // Support both old and new field names for backward compatibility
    const final_tree_id = palm_tree || tree_id;
    const final_harvest_date = date || harvest_date;
    const final_bunch_count = bunches !== undefined ? bunches : bunch_count;

    if (!final_tree_id || !final_harvest_date || final_bunch_count === undefined) {
        return res.status(400).json({ error: 'Tree ID, harvest date, and bunch count are required' });
    }

    db.run(
        'INSERT INTO palm_tree_data (user_id, tree_id, harvest_date, bunch_count, notes) VALUES (?, ?, ?, ?, ?)',
        [user_id, final_tree_id, final_harvest_date, final_bunch_count, notes || null],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(201).json({
                id: this.lastID,
                message: 'Palm tree harvest data added successfully'
            });
        }
    );
});

// Update palm tree data
app.put('/api/palmtrees/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { tree_id, harvest_date, bunch_count, notes, palm_tree, date, bunches } = req.body;
    const user_id = req.user.userId;

    // Support both old and new field names for backward compatibility
    const final_tree_id = palm_tree || tree_id;
    const final_harvest_date = date || harvest_date;
    const final_bunch_count = bunches !== undefined ? bunches : bunch_count;

    if (!final_tree_id || !final_harvest_date || final_bunch_count === undefined) {
        return res.status(400).json({ error: 'Tree ID, harvest date, and bunch count are required' });
    }

    // Check if user owns this record or is admin
    const checkQuery = req.user.role === 'admin' 
        ? 'SELECT id FROM palm_tree_data WHERE id = ?'
        : 'SELECT id FROM palm_tree_data WHERE id = ? AND user_id = ?';
    const checkParams = req.user.role === 'admin' ? [id] : [id, user_id];

    db.get(checkQuery, checkParams, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Palm tree record not found or access denied' });
        }

        db.run(
            'UPDATE palm_tree_data SET tree_id = ?, harvest_date = ?, bunch_count = ?, notes = ? WHERE id = ?',
            [final_tree_id, final_harvest_date, final_bunch_count, notes || null, id],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Palm tree harvest data updated successfully' });
            }
        );
    });
});

// Delete all palm tree data (Admin only)
app.delete('/api/palmtrees/all', authenticateToken, requireAdmin, (req, res) => {
    console.log('🗑️ DELETE ALL /api/palmtrees/all - Admin:', req.user.email);
    
    db.run('DELETE FROM palm_tree_data', [], function(err) {
        if (err) {
            console.error('❌ Error deleting all palm tree data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log(`✅ Deleted ${this.changes} palm tree records`);
        res.json({ 
            message: 'All palm tree harvest data deleted successfully',
            deletedCount: this.changes
        });
    });
});

// Delete palm tree data
app.delete('/api/palmtrees/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const user_id = req.user.userId;

    // Check if user owns this record or is admin
    const checkQuery = req.user.role === 'admin' 
        ? 'SELECT id FROM palm_tree_data WHERE id = ?'
        : 'SELECT id FROM palm_tree_data WHERE id = ? AND user_id = ?';
    const checkParams = req.user.role === 'admin' ? [id] : [id, user_id];

    db.get(checkQuery, checkParams, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Palm tree record not found or access denied' });
        }

        db.run('DELETE FROM palm_tree_data WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Palm tree harvest data deleted successfully' });
        });
    });
});

// Get unique palm trees for icon display (all 312 trees A1-L26)
app.get('/api/palmtrees/list', authenticateToken, (req, res) => {
    // Generate all possible tree IDs from A1-L26
    const treeIds = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    
    rows.forEach(row => {
        for (let i = 1; i <= 26; i++) {
            treeIds.push(`${row}${i}`);
        }
    });

    console.log('Generated tree IDs:', treeIds.length, 'trees');
    
    // Get harvest counts and latest harvest date for each tree
    const query = `
        SELECT 
            tree_id,
            COUNT(*) as harvest_count,
            MAX(harvest_date) as latest_harvest,
            SUM(bunch_count) as total_bunches
        FROM palm_tree_data 
        GROUP BY tree_id
    `;
    
    db.all(query, (err, harvestData) => {
        if (err) {
            console.error('Database error in palmtrees/list:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Create map for quick lookup
        const harvestMap = {};
        harvestData.forEach(row => {
            harvestMap[row.tree_id] = row;
        });

        // Generate complete tree list with harvest statistics
        const completeTreeList = treeIds.map(treeId => {
            const harvestInfo = harvestMap[treeId] || {
                harvest_count: 0,
                latest_harvest: null,
                total_bunches: 0
            };
            
            return {
                tree_id: treeId,
                harvest_count: harvestInfo.harvest_count,
                latest_harvest: harvestInfo.latest_harvest,
                total_bunches: harvestInfo.total_bunches,
                status: harvestInfo.harvest_count > 0 ? 'active' : 'inactive'
            };
        });

        console.log('Returning', completeTreeList.length, 'complete tree list with harvest statistics');
        res.json(completeTreeList);
    });
});

// Get harvest history for specific tree
app.get('/api/palmtrees/:treeId/history', authenticateToken, (req, res) => {
    const treeId = req.params.treeId;
    
    const query = `
        SELECT 
            harvest_date,
            bunch_count,
            notes,
            created_at
        FROM palm_tree_data 
        WHERE tree_id = ?
        ORDER BY harvest_date DESC
    `;
    
    db.all(query, [treeId], (err, rows) => {
        if (err) {
            console.error('Database error in palmtree history:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log(`Returning ${rows.length} harvest records for tree ${treeId}`);
        res.json({
            tree_id: treeId,
            harvest_history: rows
        });
    });
});

// ==== NOTES ROUTES ====

// Get notes
app.get('/api/notes', authenticateToken, (req, res) => {
    // Return all notes (shared data)
    const query = 'SELECT * FROM notes_data ORDER BY date DESC';

    console.log('GET /api/notes - User:', req.user.email, 'Role:', req.user.role, 'Query:', query);

    db.all(query, (err, rows) => {
        if (err) {
            console.error('Database error in notes:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Returning', rows.length, 'notes records (shared data) for user:', req.user.email);
        res.json(rows);
    });
});

// Add note
app.post('/api/notes', authenticateToken, (req, res) => {
    const { date, title, content, category, priority } = req.body;
    const user_id = req.user.userId;

    if (!date || !title || !content) {
        return res.status(400).json({ error: 'Date, title, and content are required' });
    }

    db.run(
        'INSERT INTO notes_data (user_id, date, title, content) VALUES (?, ?, ?, ?)',
        [user_id, date, title, content],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({
                id: this.lastID,
                message: 'Note added successfully'
            });
        }
    );
});

// Update note
app.put('/api/notes/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { date, title, content, category, priority } = req.body;
    const user_id = req.user.userId;

    if (!date || !title || !content) {
        return res.status(400).json({ error: 'Date, title, and content are required' });
    }

    // Check if user owns this record or is admin
    const checkQuery = req.user.role === 'admin' 
        ? 'SELECT id FROM notes_data WHERE id = ?'
        : 'SELECT id FROM notes_data WHERE id = ? AND user_id = ?';
    const checkParams = req.user.role === 'admin' ? [id] : [id, user_id];

    db.get(checkQuery, checkParams, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Note not found or access denied' });
        }

        db.run(
            'UPDATE notes_data SET date = ?, title = ?, content = ? WHERE id = ?',
            [date, title, content, id],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                // Return the updated note data
                db.get('SELECT * FROM notes_data WHERE id = ?', [id], (err, updatedNote) => {
                    if (err) {
                        console.error('Error fetching updated note:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json(updatedNote);
                });
            }
        );
    });
});

// Delete note
app.delete('/api/notes/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const user_id = req.user.userId;

    // Check if user owns this record or is admin
    const checkQuery = req.user.role === 'admin' 
        ? 'SELECT id FROM notes_data WHERE id = ?'
        : 'SELECT id FROM notes_data WHERE id = ? AND user_id = ?';
    const checkParams = req.user.role === 'admin' ? [id] : [id, user_id];

    db.get(checkQuery, checkParams, (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Note not found or access denied' });
        }

        db.run('DELETE FROM notes_data WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Note deleted successfully' });
        });
    });
});

// Search notes endpoint
app.get('/api/notes/search', authenticateToken, (req, res) => {
    const { q, category, priority, limit = 10 } = req.query;
    const user_id = req.user.userId;

    let query = 'SELECT * FROM notes_data WHERE 1=1';
    const params = [];

    // Add user filter (admin can see all, regular users see only their own)
    if (req.user.role !== 'admin') {
        query += ' AND user_id = ?';
        params.push(user_id);
    }

    // Add search query filter
    if (q && q.trim()) {
        query += ' AND (title LIKE ? OR content LIKE ?)';
        params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }

    // Order by date descending and limit results
    query += ' ORDER BY date DESC LIMIT ?';
    params.push(parseInt(limit) || 10);

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows || []);
    });
});

// Get notes by category
app.get('/api/notes/categories', authenticateToken, (req, res) => {
    const user_id = req.user.userId;

    let query = 'SELECT COUNT(*) as count FROM notes_data WHERE 1=1';
    const params = [];

    // Add user filter
    if (req.user.role !== 'admin') {
        query += ' AND user_id = ?';
        params.push(user_id);
    }

    query += ' GROUP BY 1 ORDER BY count DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows || []);
    });
});

// ==== DASHBOARD STATS ====

app.get('/api/stats', authenticateToken, (req, res) => {
    // Return stats filtered by user_id
    console.log('GET /api/stats - User:', req.user.email, 'Role:', req.user.role, 'UserId:', req.user.userId);
    
    const userId = req.user.userId;
    
    const promises = [
        // Harvest stats - all data (shared)
        new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count, SUM(total_revenue) as revenue, SUM(net_profit) as profit FROM harvest_data';
            
            console.log('Stats harvest query:', query);
            
            db.get(query, (err, row) => {
                if (err) {
                    console.error('Harvest stats error:', err);
                    reject(err);
                } else {
                    console.log('Harvest stats result:', row);
                    resolve({ harvest: row });
                }
            });
        }),
        
        // Fertilizer stats - all data (shared)
        new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count, SUM(total_cost) as cost FROM fertilizer_data';
            
            console.log('Stats fertilizer query:', query);
            
            db.get(query, (err, row) => {
                if (err) {
                    console.error('Fertilizer stats error:', err);
                    reject(err);
                } else {
                    console.log('Fertilizer stats result:', row);
                    resolve({ fertilizer: row });
                }
            });
        }),
        
        // Palm tree stats - all data (shared)
        new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(DISTINCT tree_id) as count FROM palm_tree_data';
            
            console.log('Stats palmtree query:', query);
            
            db.get(query, (err, row) => {
                if (err) {
                    console.error('Palmtree stats error:', err);
                    reject(err);
                } else {
                    console.log('Palmtree stats result:', row);
                    resolve({ palmtrees: row });
                }
            });
        }),

        // User stats (admin only)
        new Promise((resolve, reject) => {
            if (req.user.role !== 'admin') {
                resolve({ users: null });
                return;
            }
            
            db.get(
                'SELECT COUNT(*) as total, SUM(is_active) as active FROM users',
                [],
                (err, row) => {
                    if (err) {
                        console.error('User stats error:', err);
                        reject(err);
                    } else {
                        console.log('User stats result:', row);
                        resolve({ users: row });
                    }
                }
            );
        })
    ];

    Promise.all(promises)
        .then(results => {
            const stats = Object.assign({}, ...results);
            console.log('Final stats for user', req.user.email, ':', stats);
            res.json(stats);
        })
        .catch(err => {
            console.error('Stats error:', err);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        });
});

// Get yearly statistics for reports
app.get('/api/yearly-stats', authenticateToken, (req, res) => {
    // Return yearly stats for the authenticated user
    console.log('🔍 GET /api/yearly-stats - User:', req.user.email, 'Role:', req.user.role, 'User ID:', req.user.userId);
    
    const userId = req.user.userId;
    
    const promises = [
        // Yearly harvest stats - filtered by user_id
        new Promise((resolve, reject) => {
            const query = `
                SELECT
                    CASE
                        WHEN date LIKE '____-__-__' THEN strftime('%Y', date)
                        WHEN date LIKE '__/__/____' THEN substr(date, -4)
                        WHEN date LIKE '%____' THEN substr(date, -4)
                        ELSE substr(date, -4)
                    END as year,
                    COUNT(*) as harvest_count,
                    SUM(total_weight) as total_weight,
                    SUM(total_revenue) as total_revenue,
                    SUM(net_profit) as total_profit
                   FROM harvest_data
                   WHERE date IS NOT NULL
                   GROUP BY CASE
                       WHEN date LIKE '____-__-__' THEN strftime('%Y', date)
                       WHEN date LIKE '__/__/____' THEN substr(date, -4)
                       WHEN date LIKE '%____' THEN substr(date, -4)
                       ELSE substr(date, -4)
                   END
                   ORDER BY year`;
            const params = [];
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('❌ Yearly harvest stats error:', err);
                    reject(err);
                } else {
                    console.log('✅ Yearly harvest stats for user', userId, ':', rows);
                    resolve({ harvest: rows || [] });
                }
            });
        }),

        // Yearly fertilizer stats - filtered by user_id
        new Promise((resolve, reject) => {
            const query = `SELECT 
                strftime('%Y', date) as year,
                COUNT(*) as fertilizer_count,
                SUM(amount) as total_amount,
                SUM(total_cost) as total_cost
               FROM fertilizer_data 
               WHERE date IS NOT NULL
               GROUP BY strftime('%Y', date)
               ORDER BY year`;
            const params = [];
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('❌ Yearly fertilizer stats error:', err);
                    reject(err);
                } else {
                    console.log('✅ Yearly fertilizer stats for user', userId, ':', rows);
                    resolve({ fertilizer: rows || [] });
                }
            });
        }),

        // Yearly palm tree stats - filtered by user_id
        new Promise((resolve, reject) => {
            const query = `
                SELECT
                    CASE
                        WHEN harvest_date LIKE '____-__-__' THEN strftime('%Y', harvest_date)
                        WHEN harvest_date LIKE '__/__/____' THEN substr(harvest_date, -4)
                        WHEN harvest_date LIKE '%____' THEN substr(harvest_date, -4)
                        ELSE substr(harvest_date, -4)
                    END as year,
                    COUNT(*) as tree_harvest_count,
                    COUNT(DISTINCT tree_id) as unique_trees,
                    SUM(bunch_count) as total_bunches
                   FROM palm_tree_data
                   WHERE harvest_date IS NOT NULL
                   GROUP BY CASE
                       WHEN harvest_date LIKE '____-__-__' THEN strftime('%Y', harvest_date)
                       WHEN harvest_date LIKE '__/__/____' THEN substr(harvest_date, -4)
                       WHEN harvest_date LIKE '%____' THEN substr(harvest_date, -4)
                       ELSE substr(harvest_date, -4)
                   END
                   ORDER BY year`;
            const params = [];
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('❌ Yearly palm tree stats error:', err);
                    reject(err);
                } else {
                    console.log('✅ Yearly palm tree stats for user', userId, ':', rows);
                    resolve({ palmtrees: rows || [] });
                }
            });
        })
    ];    Promise.all(promises)
        .then(results => {
            const yearlyStats = Object.assign({}, ...results);
            console.log('📊 Final yearly stats for user', req.user.email, ':', yearlyStats);
            res.json(yearlyStats);
        })
        .catch(err => {
            console.error('❌ Yearly stats error:', err);
            res.status(500).json({ error: 'Failed to fetch yearly statistics' });
        });
});

// Serve main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'palm-oil-database-app.html'));
});

// Serve database app
app.get('/palm-oil-database-app.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'palm-oil-database-app.html'));
});

// Serve other HTML files
app.get('/:filename.html', (req, res) => {
    const filename = req.params.filename + '.html';
    const filePath = path.join(__dirname, filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('File not found');
        }
    });
});





// Offline Chat endpoint (No external API required)
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const user_id = req.user.userId;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`🔍 Offline search request from ${req.user.email} (User ID: ${user_id}): "${message}"`);
        console.log(`📍 DB Path: ${dbPath}`);
        console.log(`🔤 Message toLowerCase: "${message.toLowerCase()}"`);
        console.log(`🧪 Contains เก็บเกี่ยว: ${message.toLowerCase().includes('เก็บเกี่ยว')}`);
        console.log(`🧪 Contains ต่อไป: ${message.toLowerCase().includes('ต่อไป')}`);
        console.log(`🧪 Contains ปุ๋ย: ${message.toLowerCase().includes('ปุ๋ย')}`);
        console.log(`🧪 Contains ล่าสุด: ${message.toLowerCase().includes('ล่าสุด')}`);
        console.log(`🧪 Contains เมื่อไหร่: ${message.toLowerCase().includes('เมื่อไหร่')}`);

        // Direct answer logic for specific questions
        const questionLower = message.toLowerCase();
        let answer;
        
        // รายได้เดือนที่แล้วเท่าไหร่?
        if (questionLower.includes('รายได้') && questionLower.includes('เดือนที่แล้ว')) {
            console.log('💸 Detected last month revenue question');
            
            answer = await new Promise((resolve, reject) => {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                
                const query = `
                    SELECT 
                        SUM(total_revenue) as total_revenue,
                        SUM(total_weight) as total_weight,
                        COUNT(*) as total_harvests
                    FROM harvest_data 
                    WHERE date BETWEEN ? AND ?
                `;
                
                db.get(query, [
                    lastMonth.toISOString().split('T')[0],
                    lastMonthEnd.toISOString().split('T')[0]
                ], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const monthName = lastMonth.toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long' 
                    });
                    
                    if (!row.total_revenue || row.total_revenue === 0) {
                        resolve(`ไม่มีข้อมูลรายได้ในเดือน${monthName}`);
                    } else {
                        resolve(`รายได้เดือน${monthName}: ${Number(row.total_revenue).toLocaleString()} บาท จากการเก็บเกี่ยว ${row.total_harvests} ครั้ง`);
                    }
                });
            });
            
        // น้ำหนักรวมเดือนนี้เท่าไหร่
        } else if (questionLower.includes('น้ำหนักรวม') && questionLower.includes('เดือนนี้')) {
            console.log('⚖️ Detected this month weight question');
            
            answer = await new Promise((resolve, reject) => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                
                const query = `
                    SELECT 
                        SUM(total_weight) as total_weight,
                        SUM(fallen_weight) as fallen_weight,
                        COUNT(*) as total_harvests
                    FROM harvest_data 
                    WHERE date BETWEEN ? AND ?
                `;
                
                db.get(query, [
                    firstDay.toISOString().split('T')[0],
                    lastDay.toISOString().split('T')[0]
                ], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const monthName = today.toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long' 
                    });
                    
                    const totalWeight = (row.total_weight || 0);
                    const fallenWeight = (row.fallen_weight || 0);
                    const grandTotal = totalWeight + fallenWeight;
                    
                    if (grandTotal === 0) {
                        resolve(`ไม่มีข้อมูลการเก็บเกี่ยวในเดือน${monthName}`);
                    } else {
                        let message = `น้ำหนักรวมเดือน${monthName}: ${grandTotal.toLocaleString()} กิโลกรัม`;
                        message += `\n• น้ำหนักปาล์มปกติ: ${totalWeight.toLocaleString()} กิโลกรัม`;
                        if (fallenWeight > 0) {
                            message += `\n• น้ำหนักปาล์มร่วง: ${fallenWeight.toLocaleString()} กิโลกรัม`;
                        }
                        message += `\nจากการเก็บเกี่ยว ${row.total_harvests} ครั้ง`;
                        resolve(message);
                    }
                });
            });
            
        // น้ำหนักรวมเดือนที่แล้วเท่าไหร่
        } else if (questionLower.includes('น้ำหนักรวม') && questionLower.includes('เดือนที่แล้ว')) {
            console.log('📊 Detected last month weight question');
            
            answer = await new Promise((resolve, reject) => {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                
                const query = `
                    SELECT 
                        SUM(total_weight) as total_weight,
                        SUM(fallen_weight) as fallen_weight,
                        COUNT(*) as total_harvests
                    FROM harvest_data 
                    WHERE date BETWEEN ? AND ?
                `;
                
                db.get(query, [
                    lastMonth.toISOString().split('T')[0],
                    lastMonthEnd.toISOString().split('T')[0]
                ], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const monthName = lastMonth.toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long' 
                    });
                    
                    const totalWeight = (row.total_weight || 0);
                    const fallenWeight = (row.fallen_weight || 0);
                    const grandTotal = totalWeight + fallenWeight;
                    
                    if (grandTotal === 0) {
                        resolve(`ไม่มีข้อมูลการเก็บเกี่ยวในเดือน${monthName}`);
                    } else {
                        let message = `น้ำหนักรวมเดือน${monthName}: ${grandTotal.toLocaleString()} กิโลกรัม`;
                        message += `\n• น้ำหนักปาล์มปกติ: ${totalWeight.toLocaleString()} กิโลกรัม`;
                        if (fallenWeight > 0) {
                            message += `\n• น้ำหนักปาล์มร่วง: ${fallenWeight.toLocaleString()} กิโลกรัม`;
                        }
                        message += `\nจากการเก็บเกี่ยว ${row.total_harvests} ครั้ง`;
                        resolve(message);
                    }
                });
            });
            
        // ราคาเฉลี่ยต่อกิโลกรัมเดือนนี้เท่าไหร่
        } else if (questionLower.includes('ราคาเฉลี่ย') && questionLower.includes('เดือนนี้')) {
            console.log('💲 Detected this month average price question');
            
            answer = await new Promise((resolve, reject) => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                
                const query = `
                    SELECT 
                        AVG(price_per_kg) as avg_price,
                        MIN(price_per_kg) as min_price,
                        MAX(price_per_kg) as max_price,
                        COUNT(*) as total_harvests
                    FROM harvest_data 
                    WHERE date BETWEEN ? AND ? AND total_weight > 0
                `;
                
                db.get(query, [
                    firstDay.toISOString().split('T')[0],
                    lastDay.toISOString().split('T')[0]
                ], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const monthName = today.toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long' 
                    });
                    
                    if (!row.avg_price || row.total_harvests === 0) {
                        resolve(`ไม่มีข้อมูลราคาในเดือน${monthName}`);
                    } else {
                        let message = `ราคาเฉลี่ยเดือน${monthName}: ${Number(row.avg_price).toFixed(2)} บาท/กิโลกรัม`;
                        message += `\n• ราคาต่ำสุด: ${Number(row.min_price).toFixed(2)} บาท/กิโลกรัม`;
                        message += `\n• ราคาสูงสุด: ${Number(row.max_price).toFixed(2)} บาท/กิโลกรัม`;
                        message += `\nจากข้อมูล ${row.total_harvests} ครั้ง`;
                        resolve(message);
                    }
                });
            });
            
        // ราคาเฉลี่ยต่อกิโลกรัมเดือนที่แล้วเท่าไหร่
        } else if (questionLower.includes('ราคาเฉลี่ย') && questionLower.includes('เดือนที่แล้ว')) {
            console.log('📈 Detected last month average price question');
            
            answer = await new Promise((resolve, reject) => {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                
                const query = `
                    SELECT 
                        AVG(price_per_kg) as avg_price,
                        MIN(price_per_kg) as min_price,
                        MAX(price_per_kg) as max_price,
                        COUNT(*) as total_harvests
                    FROM harvest_data 
                    WHERE date BETWEEN ? AND ? AND total_weight > 0
                `;
                
                db.get(query, [
                    lastMonth.toISOString().split('T')[0],
                    lastMonthEnd.toISOString().split('T')[0]
                ], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const monthName = lastMonth.toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long' 
                    });
                    
                    if (!row.avg_price || row.total_harvests === 0) {
                        resolve(`ไม่มีข้อมูลราคาในเดือน${monthName}`);
                    } else {
                        let message = `ราคาเฉลี่ยเดือน${monthName}: ${Number(row.avg_price).toFixed(2)} บาท/กิโลกรัม`;
                        message += `\n• ราคาต่ำสุด: ${Number(row.min_price).toFixed(2)} บาท/กิโลกรัม`;
                        message += `\n• ราคาสูงสุด: ${Number(row.max_price).toFixed(2)} บาท/กิโลกรัม`;
                        message += `\nจากข้อมูล ${row.total_harvests} ครั้ง`;
                        resolve(message);
                    }
                });
            });
            
        } else if (questionLower.includes('ปุ๋ย') && (questionLower.includes('ครั้งล่าสุด') || questionLower.includes('ล่าสุด')) && questionLower.includes('เมื่อไหร่')) {
            console.log('🌱 Detected last fertilizer question');
            
            // ค้นหาข้อมูลการใส่ปุ๋ยครั้งล่าสุด
            answer = await new Promise((resolve, reject) => {
                const query = `
                    SELECT date, fertilizer_type, amount, total_cost, labor_cost
                    FROM fertilizer_data 
                    ORDER BY date DESC 
                    LIMIT 1
                `;

                db.get(query, (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve("ไม่พบข้อมูลการใส่ปุ๋ยในระบบ");
                        return;
                    }

                    try {
                        // แปลงวันที่จากฐานข้อมูล (YYYY-MM-DD)
                        const fertilizerDate = new Date(row.date);
                        
                        // แปลงเป็นรูปแบบไทย
                        const thaiDate = fertilizerDate.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                        });
                        
                        // คำนวณจำนวนวันที่ผ่านมา
                        const today = new Date();
                        const diffTime = today - fertilizerDate;
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        
                        let message = `ใส่ปุ๋ยครั้งล่าสุด: วัน${thaiDate}`;
                        
                        if (diffDays === 0) {
                            message += ` (วันนี้)`;
                        } else if (diffDays === 1) {
                            message += ` (เมื่อวาน)`;
                        } else {
                            message += ` (${diffDays} วันที่แล้ว)`;
                        }
                        
                        // เพิ่มรายละเอียดปุ๋ย
                        message += `\n\nรายละเอียด:`;
                        message += `\n• ปุ๋ยที่ใช้: ${row.fertilizer_type}`;
                        message += `\n• ปริมาณ: ${row.amount} กระสอบ`;
                        message += `\n• ค่าปุ๋ย: ${Number(row.total_cost).toLocaleString()} บาท`;
                        
                        if (row.labor_cost && row.labor_cost > 0) {
                            message += `\n• ค่าแรงงาน: ${Number(row.labor_cost).toLocaleString()} บาท`;
                            const totalCost = Number(row.total_cost) + Number(row.labor_cost);
                            message += `\n• รวมทั้งหมด: ${totalCost.toLocaleString()} บาท`;
                        }
                        
                        resolve(message);
                        
                    } catch (error) {
                        resolve(`เกิดข้อผิดพลาดในการดึงข้อมูลปุ๋ย: ${error.message}`);
                    }
                });
            });
            
        } else if (questionLower.includes('เก็บเกี่ยว') && (questionLower.includes('ครั้งต่อไป') || questionLower.includes('ต่อไป') || questionLower.includes('เมื่อไหร่'))) {
            console.log('🎯 Detected next harvest question');
            
            // คำนวณวันเก็บเกี่ยวครั้งต่อไป
            answer = await new Promise((resolve, reject) => {
                const query = `
                    SELECT date as last_harvest_date 
                    FROM harvest_data 
                    ORDER BY date DESC 
                    LIMIT 1
                `;

                db.get(query, (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        resolve("ไม่พบข้อมูลการเก็บเกี่ยวก่อนหน้า แนะนำให้เก็บเกี่ยวเมื่อผลปาล์มสุก (ประมาณทุก 15-20 วัน)");
                        return;
                    }

                    try {
                        // แปลงวันที่จากฐานข้อมูล (YYYY-MM-DD)
                        const lastHarvestDate = new Date(row.last_harvest_date);
                        
                        // บวก 15 วัน
                        const nextHarvestDate = new Date(lastHarvestDate);
                        nextHarvestDate.setDate(lastHarvestDate.getDate() + 15);
                        
                        // แปลงเป็นรูปแบบไทย
                        const thaiDate = nextHarvestDate.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                        });
                        
                        // คำนวณจำนวนวันที่เหลือ
                        const today = new Date();
                        const diffTime = nextHarvestDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let message = `เก็บเกี่ยวครั้งต่อไป: วัน${thaiDate}`;
                        
                        if (diffDays > 0) {
                            message += ` (อีก ${diffDays} วัน)`;
                        } else if (diffDays === 0) {
                            message += ` (วันนี้!)`;
                        } else {
                            message += ` (เลยกำหนดแล้ว ${Math.abs(diffDays)} วัน)`;
                        }
                        
                        // เพิ่มข้อมูลการเก็บเกี่ยวล่าสุด
                        const lastHarvestThai = lastHarvestDate.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric'
                        });
                        message += `\n\nเก็บเกี่ยวครั้งล่าสุด: ${lastHarvestThai}`;
                        
                        resolve(message);
                        
                    } catch (error) {
                        resolve(`เกิดข้อผิดพลาดในการคำนวณวันที่: ${error.message}`);
                    }
                });
            });
            
        } else {
            // ใช้ OfflineSearchEngine สำหรับคำถามอื่นๆ
            const OfflineSearchEngine = require('./OfflineSearchEngine');
            const searchEngine = new OfflineSearchEngine(dbPath);
            answer = await searchEngine.answerQuestion(message, user_id);
        }

        console.log(`✅ Offline answer: "${answer}"`);

        res.json({
            message: answer,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ Offline search error:', error);
        res.status(500).json({
            error: 'Search service error',
            message: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล'
        });
    }
});

// Search endpoint (alias for chat functionality)
app.post('/api/search', authenticateToken, async (req, res) => {
    try {
        const { question } = req.body;
        const user_id = req.user.userId;

        if (!question || question.trim() === '') {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log(`🔍 Search request from ${req.user.email} (User ID: ${user_id}): "${question}"`);

        // ใช้ OfflineSearchEngine เหมือน chat endpoint
        const OfflineSearchEngine = require('./OfflineSearchEngine');
        const searchEngine = new OfflineSearchEngine(dbPath);
        const answer = await searchEngine.answerQuestion(question, user_id);

        console.log(`✅ Search answer: "${answer}"`);

        res.json({
            answer: answer,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({
            error: 'Search service error',
            message: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล'
        });
    }
});

// Database Viewer Endpoint (สำหรับดูข้อมูลใน Production)
app.get('/api/admin/db-viewer', authenticateToken, (req, res) => {
    // ตรวจสอบว่าเป็น admin เท่านั้น
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { table, limit = 100 } = req.query;
    
    // รายการตารางที่อนุญาต
    const allowedTables = ['users', 'harvest_data', 'fertilizer_data', 'palm_tree_data', 'notes_data'];
    
    if (!table) {
        // แสดงรายการตารางทั้งหมด
        const queries = allowedTables.map(tableName => {
            return new Promise((resolve, reject) => {
                db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, row) => {
                    if (err) reject(err);
                    else resolve({ table: tableName, count: row.count });
                });
            });
        });
        
        Promise.all(queries).then(results => {
            res.json({
                message: 'Database Tables Overview',
                tables: results,
                usage: 'Add ?table=table_name&limit=50 to view data'
            });
        }).catch(err => {
            res.status(500).json({ error: err.message });
        });
        return;
    }
    
    if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: 'Invalid table name', allowed: allowedTables });
    }
    
    const sql = `SELECT * FROM ${table} ORDER BY id DESC LIMIT ?`;
    db.all(sql, [parseInt(limit)], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({
                table: table,
                count: rows.length,
                limit: parseInt(limit),
                data: rows
            });
        }
    });
});

// Database Schema Viewer
app.get('/api/admin/db-schema', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const sql = `SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({
                message: 'Database Schema',
                tables: rows
            });
        }
    });
});

// ==== DATABASE VIEWER API (Admin Only) ====

// Get database tables info
app.get('/api/admin/db-tables', authenticateToken, requireAdmin, (req, res) => {
    console.log('🗄️ DB Tables request from admin:', req.user.email);
    
    // Get all table names
    db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, (err, tables) => {
        if (err) {
            console.error('Error getting tables:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Get count for each table
        const tablePromises = tables.map(table => {
            return new Promise((resolve, reject) => {
                db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            name: table.name,
                            count: result.count
                        });
                    }
                });
            });
        });
        
        Promise.all(tablePromises)
            .then(tablesWithCounts => {
                res.json({
                    message: 'Database tables',
                    tables: tablesWithCounts
                });
            })
            .catch(err => {
                console.error('Error counting table rows:', err);
                res.status(500).json({ error: 'Database error' });
            });
    });
});

// Get table data
app.get('/api/admin/db-data/:table', authenticateToken, requireAdmin, (req, res) => {
    const { table } = req.params;
    const limit = req.query.limit || 100;
    const offset = req.query.offset || 0;
    
    console.log(`🗄️ DB Data request for table: ${table}, limit: ${limit}, offset: ${offset}`);
    
    // Validate table name to prevent SQL injection
    const allowedTables = ['users', 'harvest_data', 'fertilizer_data', 'palm_tree_data', 'notes_data'];
    if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: 'Invalid table name' });
    }
    
    db.all(`SELECT * FROM ${table} ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {
        if (err) {
            console.error(`Error getting data from ${table}:`, err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({
            message: `Data from ${table}`,
            table: table,
            data: rows,
            count: rows.length
        });
    });
});

// Get table schema
app.get('/api/admin/db-schema/:table', authenticateToken, requireAdmin, (req, res) => {
    const { table } = req.params;
    
    console.log(`🗄️ DB Schema request for table: ${table}`);
    
    db.all(`PRAGMA table_info(${table})`, (err, columns) => {
        if (err) {
            console.error(`Error getting schema for ${table}:`, err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({
            message: `Schema for ${table}`,
            table: table,
            columns: columns
        });
    });
});

// Execute custom SQL query (Admin only, read-only)
app.post('/api/admin/db-query', authenticateToken, requireAdmin, (req, res) => {
    const { query } = req.body;
    
    console.log(`🗄️ Custom query from admin: ${req.user.email}`);
    console.log(`Query: ${query}`);
    
    // Only allow SELECT queries for safety
    if (!query.trim().toLowerCase().startsWith('select')) {
        return res.status(400).json({ error: 'Only SELECT queries are allowed' });
    }
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Query execution error:', err);
            return res.status(500).json({ 
                error: 'Query execution error',
                details: err.message 
            });
        }
        
        res.json({
            message: 'Query executed successfully',
            query: query,
            data: rows,
            count: rows.length
        });
    });
});

// Serve database viewer directly with relaxed CSP
app.get('/db-viewer.html', (req, res) => {
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; " +
        "script-src-attr 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' *.up.railway.app https:; " +
        "font-src 'self' https: data:;"
    );
    res.sendFile(path.join(__dirname, 'simple-db-viewer.html'));
});

app.get('/db-viewer', (req, res) => {
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; " +
        "script-src-attr 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' *.up.railway.app https:; " +
        "font-src 'self' https: data:;"
    );
    res.sendFile(path.join(__dirname, 'simple-db-viewer.html'));
});

// Serve main palm oil app
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'palm-oil-database-app.html'));
});

// Root path - show menu
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🌴 ระบบจัดการธุรกิจน้ำมันปาล์ม</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
            <div class="container mx-auto px-4 py-16">
                <div class="max-w-4xl mx-auto">
                    <div class="text-center mb-12">
                        <h1 class="text-4xl font-bold text-gray-800 mb-4">🌴 ระบบจัดการธุรกิจน้ำมันปาล์ม</h1>
                        <p class="text-xl text-gray-600">Palm Oil Management System on Railway Cloud</p>
                        <div class="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                            <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            ออนไลน์และพร้อมใช้งาน
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Main Application -->
                        <div class="bg-white p-8 rounded-xl shadow-lg border-l-4 border-blue-500">
                            <h2 class="text-2xl font-semibold text-gray-800 mb-4">🏠 แอปพลิเคชันหลัก</h2>
                            <p class="text-gray-600 mb-6">
                                ระบบจัดการข้อมูลการเก็บเกี่ยว ปุ๋ย ต้นปาล์ม และรายงานแบบครบวงจร
                            </p>
                            <div class="space-y-3 mb-6">
                                <div class="flex items-center text-sm text-gray-600">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    การจัดการข้อมูลการเก็บเกี่ยว
                                </div>
                                <div class="flex items-center text-sm text-gray-600">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    ติดตามการใส่ปุ๋ยและต้นทุน
                                </div>
                                <div class="flex items-center text-sm text-gray-600">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    รายงานและกราฟแสดงผล
                                </div>
                            </div>
                            <a href="/app" 
                               class="inline-block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200">
                                เข้าใช้งานระบบ
                            </a>
                        </div>

                        <!-- Database Viewer -->
                        <div class="bg-white p-8 rounded-xl shadow-lg border-l-4 border-purple-500">
                            <h2 class="text-2xl font-semibold text-gray-800 mb-4">🗄️ ดูฐานข้อมูล</h2>
                            <p class="text-gray-600 mb-6">
                                เข้าถึงและดูข้อมูลฐานข้อมูลโดยตรง สำหรับผู้ดูแลระบบ
                            </p>
                            <div class="space-y-3 mb-6">
                                <div class="flex items-center text-sm text-gray-600">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    ดูตารางและข้อมูลทั้งหมด
                                </div>
                                <div class="flex items-center text-sm text-gray-600">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Export ข้อมูลเป็น JSON
                                </div>
                                <div class="flex items-center text-sm text-gray-600">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    เฉพาะ Admin เท่านั้น
                                </div>
                            </div>
                            <a href="/db-viewer.html" 
                               class="inline-block w-full text-center bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200">
                                เข้าดูฐานข้อมูล
                            </a>
                        </div>
                    </div>

                    <!-- API Documentation -->
                    <div class="mt-12 bg-white p-8 rounded-xl shadow-lg">
                        <h2 class="text-2xl font-semibold text-gray-800 mb-4">🔧 API Information</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 class="font-semibold text-gray-700 mb-2">Health Check</h3>
                                <code class="text-sm text-gray-600">GET /api/health</code>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-700 mb-2">Authentication</h3>
                                <code class="text-sm text-gray-600">POST /api/auth/login</code>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-700 mb-2">Data APIs</h3>
                                <code class="text-sm text-gray-600">GET /api/harvest</code>
                            </div>
                        </div>
                        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                            <p class="text-sm text-gray-600">
                                <strong>Admin Login:</strong> admin@palmoil.com / admin
                                <br>
                                <strong>Base URL:</strong> https://api-server-production-4ba0.up.railway.app
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="text-center mt-12 text-gray-500">
                        <p>🚀 Powered by Railway Cloud Platform</p>
                        <p class="text-sm">Build: ${new Date().toISOString()}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Static files (serve public directory and frontend build)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Palm Oil API Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbPath}`);
    console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
    console.log(`📁 Serving static files from: public/ and frontend/dist/`);
});

// Serve main app for any non-API routes (catch-all for SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});