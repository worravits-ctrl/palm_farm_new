const express = require('express');
const { Pool } = require('pg');
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
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'palmoil-secret-key-2025';

console.log('🔍 Starting Palm Oil API Server...');
console.log('📴 Using Offline Search Engine (No external API required)');

// Database connection - PostgreSQL
let db;
if (process.env.DATABASE_URL) {
  console.log('🐘 Using PostgreSQL database');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Test connection
  db.query('SELECT version()', (err, result) => {
    if (err) {
      console.error('❌ PostgreSQL connection failed:', err);
    } else {
      console.log('✅ PostgreSQL connected successfully');
      console.log('📋 Version:', result.rows[0].version.split(' ')[0]);
    }
  });
} else {
  // Fallback to SQLite for local development
  console.log('📁 Using SQLite database (local development)');
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'database', 'palmoil.db');
  db = new sqlite3.Database(dbPath);
}

// Database query wrapper to handle both SQLite and PostgreSQL
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (process.env.DATABASE_URL) {
      // PostgreSQL
      db.query(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result.rows || result);
      });
    } else {
      // SQLite
      if (sql.toLowerCase().includes('select')) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ insertId: this.lastID, changes: this.changes });
        });
      }
    }
  });
};

// Get single row wrapper
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (process.env.DATABASE_URL) {
      // PostgreSQL
      db.query(sql + ' LIMIT 1', params, (err, result) => {
        if (err) reject(err);
        else resolve(result.rows ? result.rows[0] : null);
      });
    } else {
      // SQLite
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }
  });
};

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
                "https://unpkg.com",
                "https://cdn.tailwindcss.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "*.up.railway.app", "https://unpkg.com"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        ];
        
        // Add Railway domain if available
        if (process.env.RAILWAY_STATIC_URL) {
            allowedOrigins.push(process.env.RAILWAY_STATIC_URL);
        }
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('⚠️ CORS blocked origin:', origin);
            callback(null, true); // Allow all origins in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// JWT token verification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('🔒 Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

console.log('🚀 Palm Oil API Server running on http://localhost:' + PORT);
console.log('📊 Database:', process.env.DATABASE_URL ? 'PostgreSQL (Railway)' : 'SQLite (Local)');
console.log('🔑 JWT Secret:', JWT_SECRET.substring(0, 10) + '...');

// Initialize OfflineSearchEngine with appropriate database
let searchEngine;
if (process.env.DATABASE_URL) {
    // For PostgreSQL, we'll need to modify OfflineSearchEngine or create a new version
    console.log('⚠️ Note: OfflineSearchEngine currently supports SQLite only');
    console.log('📝 Consider implementing PostgreSQL version for full functionality');
} else {
    const dbPath = path.join(__dirname, 'database', 'palmoil.db');
    searchEngine = new OfflineSearchEngine(dbPath);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ===== AUTH ENDPOINTS =====

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', {
        email: email,
        password: '***',
        timestamp: new Date().toISOString()
    });

    try {
        // Adjust query for PostgreSQL vs SQLite
        const query = process.env.DATABASE_URL ? 
            'SELECT * FROM users WHERE email = $1' :
            'SELECT * FROM users WHERE email = ?';
            
        const user = await dbGet(query, [email]);

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

        // Password comparison
        console.log('🔍 Password comparison details:');
        console.log(`   Attempting to compare password for: ${user.email}`);
        console.log(`   Password from request: [hidden for security]`);
        console.log(`   Stored hash starts with: ${user.password.substring(0, 10)}`);
        console.log(`   Hash length: ${user.password.length}`);

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('   🔍 Password validation result:', isValidPassword);

        if (!isValidPassword) {
            console.log('❌ Invalid password for user:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                id: user.id // Add id for compatibility
            }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', user.email);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Database error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register endpoint  
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user exists
        const existingUserQuery = process.env.DATABASE_URL ?
            'SELECT * FROM users WHERE email = $1' :
            'SELECT * FROM users WHERE email = ?';
            
        const existingUser = await dbGet(existingUserQuery, [email]);

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const insertQuery = process.env.DATABASE_URL ?
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id' :
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
            
        const result = await dbQuery(insertQuery, [username, email, hashedPassword, 'user']);

        const userId = process.env.DATABASE_URL ? result[0].id : result.insertId;

        console.log('User registered successfully:', { id: userId, email, username });
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Continue with the rest of the API endpoints...
// [The rest of the code would need similar modifications for PostgreSQL compatibility]

// Export the app for testing
module.exports = app;

// Start the server
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
}