const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
console.log('🔍 Environment variables loaded:');
console.log('   GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('   GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log('   GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'undefined');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'palmoil-secret-key-2025';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-gemini-api-key-here';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Check API key configuration
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here' || GEMINI_API_KEY === 'AIzaSyD_your_actual_gemini_api_key_here') {
    console.warn('⚠️  WARNING: GEMINI_API_KEY is not configured properly!');
    console.warn('⚠️  Please set your actual Gemini API key in the .env file');
    console.warn('⚠️  Get your key from: https://makersuite.google.com/app/apikey');
} else {
    console.log('✅ GEMINI_API_KEY is configured correctly');
}

// Database connection
const dbPath = path.join(__dirname, 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

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
                "https://cdn.tailwindcss.com",
                "https://unpkg.com",
                "https://unpkg.com/react@18/umd/react.development.js",
                "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
                "https://unpkg.com/@babel/standalone/babel.min.js"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(cors());
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
    db.all('SELECT * FROM harvest_data ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            console.error('Database error in harvest:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Returning', rows.length, 'harvest records for user:', req.user.email);
        res.json(rows);
    });
});

// Add harvest data
app.post('/api/harvest', authenticateToken, (req, res) => {
    const { date, total_weight, price_per_kg, harvesting_cost } = req.body;
    const user_id = req.user.userId;

    console.log('POST /api/harvest - User:', req.user.email, 'UserId:', user_id, 'Data:', { date, total_weight, price_per_kg, harvesting_cost });

    if (!date || !total_weight || !price_per_kg || !harvesting_cost) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const total_revenue = total_weight * price_per_kg;
    const net_profit = total_revenue - harvesting_cost;

    db.run(
        'INSERT INTO harvest_data (user_id, date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit],
        function(err) {
            if (err) {
                console.error('Database error inserting harvest:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            console.log('Harvest data inserted successfully with ID:', this.lastID, 'for user:', req.user.email);
            res.status(201).json({
                id: this.lastID,
                message: 'Harvest data added successfully'
            });
        }
    );
});

// Update harvest data
app.put('/api/harvest/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { date, total_weight, price_per_kg, harvesting_cost } = req.body;
    const user_id = req.user.userId;

    if (!date || !total_weight || !price_per_kg || !harvesting_cost) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const total_revenue = total_weight * price_per_kg;
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
            'UPDATE harvest_data SET date = ?, total_weight = ?, price_per_kg = ?, total_revenue = ?, harvesting_cost = ?, net_profit = ? WHERE id = ?',
            [date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit, id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Harvest data updated successfully' });
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
    db.all('SELECT * FROM fertilizer_data ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            console.error('Database error in fertilizer:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Returning', rows.length, 'fertilizer records for user:', req.user.email);
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
    db.all('SELECT * FROM palm_tree_data ORDER BY harvest_date DESC', [], (err, rows) => {
        if (err) {
            console.error('Database error in palmtrees:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('📊 Total rows from database:', rows.length);
        console.log('🔍 First 3 rows:', rows.slice(0, 3));
        console.log('🔍 Last 3 rows:', rows.slice(-3));
        console.log('Returning', rows.length, 'palmtree records for user:', req.user.email);
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

// ==== NOTES ROUTES ====

// Get notes
app.get('/api/notes', authenticateToken, (req, res) => {
    // Return all notes for shared data model (no user filtering)
    const query = 'SELECT * FROM notes_data ORDER BY date DESC';
    const params = [];

    console.log('GET /api/notes - User:', req.user.email, 'Role:', req.user.role, 'Query:', query, 'Params:', params);

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error in notes:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Returning', rows.length, 'notes records for user:', req.user.email);
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
    // Return shared stats for all users (no user filtering)
    console.log('GET /api/stats - User:', req.user.email, 'Role:', req.user.role, 'UserId:', req.user.userId);
    
    const promises = [
        // Harvest stats - shared data
        new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count, SUM(total_revenue) as revenue, SUM(net_profit) as profit FROM harvest_data';
            const params = [];
            
            console.log('Stats harvest query:', query, 'params:', params);
            
            db.get(query, params, (err, row) => {
                if (err) {
                    console.error('Harvest stats error:', err);
                    reject(err);
                } else {
                    console.log('Harvest stats result:', row);
                    resolve({ harvest: row });
                }
            });
        }),
        
        // Fertilizer stats - shared data
        new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count, SUM(total_cost) as cost FROM fertilizer_data';
            const params = [];
            
            console.log('Stats fertilizer query:', query, 'params:', params);
            
            db.get(query, params, (err, row) => {
                if (err) {
                    console.error('Fertilizer stats error:', err);
                    reject(err);
                } else {
                    console.log('Fertilizer stats result:', row);
                    resolve({ fertilizer: row });
                }
            });
        }),
        
        // Palm tree stats - shared data
        new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(DISTINCT tree_id) as count FROM palm_tree_data';
            const params = [];
            
            console.log('Stats palmtree query:', query, 'params:', params);
            
            db.get(query, params, (err, row) => {
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
                   WHERE user_id = ? AND date IS NOT NULL
                   GROUP BY CASE
                       WHEN date LIKE '____-__-__' THEN strftime('%Y', date)
                       WHEN date LIKE '__/__/____' THEN substr(date, -4)
                       WHEN date LIKE '%____' THEN substr(date, -4)
                       ELSE substr(date, -4)
                   END
                   ORDER BY year`;
            const params = [userId];
            
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
               WHERE user_id = ?
               GROUP BY strftime('%Y', date)
               ORDER BY year`;
            const params = [userId];
            
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
                   WHERE user_id = ?
                   GROUP BY CASE
                       WHEN harvest_date LIKE '____-__-__' THEN strftime('%Y', harvest_date)
                       WHEN harvest_date LIKE '__/__/____' THEN substr(harvest_date, -4)
                       WHEN harvest_date LIKE '%____' THEN substr(harvest_date, -4)
                       ELSE substr(harvest_date, -4)
                   END
                   ORDER BY year`;
            const params = [userId];
            
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

// --- Helper Function for Date Parsing ---
const parseThaiDate = (text) => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-11
    let startDate, endDate;

    const thaiMonths = {
        'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3, 'พฤษภาคม': 4, 'มิถุนายน': 5,
        'กรกฎาคม': 6, 'สิงหาคม': 7, 'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
    };

    // Yearly patterns
    if (text.includes('ปีที่แล้ว')) {
        year -= 1;
        startDate = new Date(year, 0, 1); // Jan 1st
        endDate = new Date(year, 11, 31); // Dec 31st
    } else if (text.includes('ปีนี้') || text.includes('ทั้งปี')) {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
    }
    // Monthly patterns
    else if (text.includes('เดือนที่แล้ว')) {
        month -= 1;
        if (month < 0) {
            month = 11;
            year -= 1;
        }
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
    } else if (text.includes('เดือนนี้')) {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
    }
    // Specific month pattern
    else {
        const match = text.match(/(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s+(\d{4})/);
        if (match) {
            const thaiMonthName = match[1];
            const buddhistYear = parseInt(match[2], 10);
            
            if (thaiMonths.hasOwnProperty(thaiMonthName) && buddhistYear > 2500) {
                month = thaiMonths[thaiMonthName];
                year = buddhistYear - 543;
                startDate = new Date(year, month, 1);
                endDate = new Date(year, month + 1, 0);
            } else {
                return null; // Not a valid pattern
            }
        } else {
            return null; // No date pattern found
        }
    }

    return {
        startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD
        endDate: endDate.toISOString().split('T')[0]      // YYYY-MM-DD
    };
};


// Gemini AI Chat endpoint (Text-to-SQL Implementation)
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const user_id = req.user.userId;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`🤖 AI request from ${req.user.email} (User ID: ${user_id}): "${message}"`);

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // --- New Step: Intent Classification ---
        const intentPrompt = `
            Classify the user's intent into one of the following categories: 'database_query', 'greeting', 'general_chitchat', 'next_harvest_query'.
            - 'database_query': Asks for specific data, numbers, summaries, or records (e.g., "รายได้เท่าไหร่", "ใส่ปุ๋ยครั้งล่าสุด", "สรุปข้อมูลเดือนที่แล้ว").
            - 'greeting': Simple greetings (e.g., "สวัสดี", "ดีครับ", "hello").
            - 'general_chitchat': Questions not related to the database (e.g., "สบายดีไหม", "คุณคือใคร").
            - 'next_harvest_query': Asks about the next harvest date (e.g., "เก็บเกี่ยวครั้งต่อไปเมื่อไหร่", "ตัดปาล์มครั้งต่อไปเมื่อไหร่").

            User message: "${message}"
            Intent:
        `;
        
        console.log("--- Classifying Intent ---");
        const intentResult = await model.generateContent(intentPrompt);
        const intent = (await intentResult.response.text()).trim().toLowerCase();
        console.log(`Detected Intent: ${intent}`);

        // --- Handle non-database queries ---
        if (intent.includes('greeting') || intent.includes('general_chitchat')) {
            const friendlyResponsePrompt = `
                You are a friendly and helpful AI assistant for a palm oil farm management app.
                The user said: "${message}".
                Respond in a warm, friendly, and concise manner in Thai. If it's a greeting, greet them back. If it's a simple question, provide a simple answer.
            `;
            const friendlyResult = await model.generateContent(friendlyResponsePrompt);
            const friendlyMessage = (await friendlyResult.response.text()).trim();
            
            console.log(`✅ Responding with friendly message: "${friendlyMessage}"`);
            return res.json({
                message: friendlyMessage,
                timestamp: new Date().toISOString(),
            });
        }

        // --- Handle next harvest query ---
        if (intent.includes('next_harvest_query')) {
            console.log("--- Intent is next_harvest_query, calculating next harvest date ---");
            return new Promise((resolve, reject) => {
                db.get('SELECT MAX(date) as last_harvest_date FROM harvest_data WHERE user_id = ?', [user_id], (err, row) => {
                    if (err) {
                        console.error('Error fetching last harvest date:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    if (row && row.last_harvest_date) {
                        const lastHarvestDate = new Date(row.last_harvest_date);
                        lastHarvestDate.setDate(lastHarvestDate.getDate() + 15);
                        
                        const nextHarvestDate = lastHarvestDate.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        });

                        const responseMessage = `การเก็บเกี่ยวครั้งต่อไปคาดว่าจะประมาณวันที่ ${nextHarvestDate} ครับ`;
                        console.log(`✅ Responding with next harvest date: "${responseMessage}"`);
                        res.json({
                            message: responseMessage,
                            timestamp: new Date().toISOString(),
                        });
                    } else {
                        const responseMessage = "ไม่พบข้อมูลการเก็บเกี่ยวครั้งล่าสุดในระบบครับ";
                        console.log(`✅ Responding with no last harvest date: "${responseMessage}"`);
                        res.json({
                            message: responseMessage,
                            timestamp: new Date().toISOString(),
                        });
                    }
                });
            });
        }

        // --- Proceed with Text-to-SQL for database queries ---
        console.log("--- Intent is database_query, proceeding with Text-to-SQL ---");

        // --- Pre-process the message to find a date range ---
        const dateRange = parseThaiDate(message);
        let dateFilterContext = '';
        if (dateRange) {
            dateFilterContext = `The user is asking about a specific date range. Use the following condition for filtering: "date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'".`;
        }

        // --- 1. Define Database Schema for the AI ---
        const dbSchema = `
            CREATE TABLE users (id INTEGER, username TEXT, email TEXT, role TEXT);
            CREATE TABLE harvest_data (id INTEGER, user_id INTEGER, date TEXT, total_weight REAL, price_per_kg REAL, total_revenue REAL, harvesting_cost REAL, net_profit REAL);
            CREATE TABLE fertilizer_data (id INTEGER, user_id INTEGER, date TEXT, fertilizer_type TEXT, amount INTEGER, cost_per_bag REAL, labor_cost REAL, total_cost REAL, supplier TEXT, notes TEXT);
            CREATE TABLE palm_tree_data (id INTEGER, user_id INTEGER, harvest_date TEXT, tree_id TEXT, bunch_count INTEGER, notes TEXT);
            CREATE TABLE notes_data (id INTEGER, user_id INTEGER, date TEXT, title TEXT, content TEXT);
        `;

        // --- First AI Call: Generate SQL from User's Question ---
        const sqlGenerationPrompt = `
            Based on the database schema below, write a single SQLite query to answer the user's question.

            Schema:
            ${dbSchema}

            ---
            Query Examples:
            - User Question: "A14 ตัดไปแล้วเท่าไหร่" (How much has A14 been cut for?) or "รหัสต้นไม้ A14 มีการเก็บเกี่ยวแล้วกี่ทะลาย" (How many bunches has tree A14 been harvested for?)
              SQL Query: SELECT SUM(bunch_count) as total_bunches FROM palm_tree_data WHERE user_id = ${user_id} AND tree_id = 'A14';

            - User Question: "ต้นไหนให้ผลผลิตเยอะที่สุด" (Which tree has the highest yield?)
              SQL Query: SELECT tree_id, SUM(bunch_count) as total_bunches FROM palm_tree_data WHERE user_id = ${user_id} GROUP BY tree_id ORDER BY total_bunches DESC LIMIT 1;
            ---

            Important Rules:
            - **ALWAYS filter every query by the user's ID using "user_id = ${user_id}"**. This is a critical security requirement.
            - The current date is ${new Date().toISOString().split('T')[0]}.
            - ${dateFilterContext || 'Use standard SQLite date functions like date() and strftime() for any date operations.'}
            - For questions about "ครั้งก่อน" หรือ "ล่าสุด" (latest/last time), use ORDER BY date DESC or ORDER BY harvest_date DESC LIMIT 1.
            - Do not query the users table for personal data like email or password.
            - Respond with only the SQL query, nothing else.

            User Question: "${message}"
            
            SQL Query:
        `;

        console.log("--- Generating SQL Query ---");
        const sqlResult = await model.generateContent(sqlGenerationPrompt);
        const sqlQuery = (await sqlResult.response.text()).trim().replace(/`/g, '').replace(/sql/gi, '').trim();

        console.log(`Generated SQL: ${sqlQuery}`);

        // Basic validation to prevent harmful queries
        if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
            console.error("Validation failed: AI did not return a valid SELECT query.");
            // Fallback for when AI fails to generate SQL for a query-like question
            return res.json({ message: "ขออภัยครับ ผมไม่เข้าใจคำถามเกี่ยวกับข้อมูลที่คุณต้องการ ลองถามในรูปแบบอื่นได้ไหมครับ" });
        }
        if (!sqlQuery.includes(`user_id = ${user_id}`)) {
             console.error("Validation failed: Query is missing user_id filter.");
             return res.status(400).json({ message: "ไม่สามารถประมวลผลคำถามได้หรือไม่ได้รับอนุญาต" });
        }

        // --- 3. Execute the Generated SQL Query ---
        const dbQuery = (sql) => {
            return new Promise((resolve, reject) => {
                db.all(sql, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };

        console.log("--- Executing SQL Query ---");
        const queryResult = await dbQuery(sqlQuery);
        console.log("Query Result:", queryResult);

        // --- 4. Second AI Call: Summarize the Result in Thai ---
        const summarizationPrompt = `
            You are a helpful AI assistant for a palm oil farm. Your task is to answer the user's question based on the data provided.

            User's Original Question: "${message}"

            Data from the database (in JSON format):
            ${JSON.stringify(queryResult, null, 2)}

            Instructions:
            - Answer in Thai.
            - Be concise and clear.
            - If the data is empty or doesn't answer the question, say "ไม่พบข้อมูลที่เกี่ยวข้อง".
            - Format numbers and dates in a friendly, readable way (e.g., add commas to numbers, format dates as DD/MM/YYYY).
            - Do not show the user the raw JSON data.
            - Summarize the data to directly answer the user's question.
        `;

        console.log("--- Summarizing Result ---");
        const summaryResult = await model.generateContent(summarizationPrompt);
        const finalAnswer = (await summaryResult.response.text()).trim();

        console.log(`✅ Final Answer: "${finalAnswer}"`);

        res.json({
            message: finalAnswer,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ AI Text-to-SQL error:', error);
        res.status(500).json({
            error: 'AI service error',
            message: 'เกิดข้อผิดพลาดในการประมวลผลคำถามด้วย AI'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Palm Oil API Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbPath}`);
    console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
});

// Static files (serve frontend build)
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Serve main app for any non-API routes (catch-all for SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});