const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'palmoil-secret-key-2025';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🔍 Environment variables loaded:');
console.log('   GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('   GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

// Initialize Gemini AI
let genAI = null;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized');
} else {
    console.log('⚠️  Gemini AI not initialized - missing API key');
}

// Database connection
const dbPath = path.join(__dirname, 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
    console.log('✅ Database connected successfully');
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Simple authentication middleware
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

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Simple login - accept any email/password for testing
    const token = jwt.sign(
        { userId: 1, email: email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        token,
        user: { id: 1, username: 'admin', email: email, role: 'admin' }
    });
});

// Stats endpoint
app.get('/api/stats', authenticateToken, (req, res) => {
    const promises = [
        new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count, SUM(total_revenue) as revenue, SUM(net_profit) as profit FROM harvest_data', (err, row) => {
                if (err) reject(err);
                else resolve({ harvest: row });
            });
        }),
        new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count, SUM(total_cost) as cost FROM fertilizer_data', (err, row) => {
                if (err) reject(err);
                else resolve({ fertilizer: row });
            });
        }),
        new Promise((resolve, reject) => {
            db.get('SELECT COUNT(DISTINCT tree_id) as count FROM palm_tree_data', (err, row) => {
                if (err) reject(err);
                else resolve({ palmtrees: row });
            });
        })
    ];

    Promise.all(promises)
        .then(results => {
            const stats = Object.assign({}, ...results);
            res.json(stats);
        })
        .catch(err => {
            console.error('Stats error:', err);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        });
});

// Chat endpoint
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!genAI) {
            return res.status(500).json({ error: 'AI service not configured' });
        }

        console.log(`🤖 Chat request: ${message.substring(0, 100)}...`);

        // Query database for context
        const dbData = await new Promise((resolve, reject) => {
            const queries = [
                {
                    name: 'harvest',
                    query: 'SELECT COUNT(*) as total_records, SUM(total_revenue) as total_revenue, SUM(net_profit) as total_profit FROM harvest_data'
                },
                {
                    name: 'fertilizer',
                    query: 'SELECT COUNT(*) as total_records, SUM(total_cost) as total_cost FROM fertilizer_data'
                },
                {
                    name: 'palmtree',
                    query: 'SELECT COUNT(*) as total_records, COUNT(DISTINCT tree_id) as unique_trees, SUM(bunch_count) as total_bunches FROM palm_tree_data'
                }
            ];

            const results = {};
            let completed = 0;

            queries.forEach(q => {
                db.get(q.query, [], (err, row) => {
                    if (err) {
                        console.error(`Database error for ${q.name}:`, err);
                        results[q.name] = { error: 'Database query failed' };
                    } else {
                        results[q.name] = row || { total_records: 0 };
                    }

                    completed++;
                    if (completed === queries.length) {
                        resolve(results);
                    }
                });
            });
        });

        // Create AI prompt
        const systemPrompt = `คุณเป็นผู้ช่วย AI สำหรับธุรกิจน้ำมันปาล์มในประเทศไทย
คุณมีข้อมูลล่าสุดจากฐานข้อมูลดังนี้:

ข้อมูลการเก็บเกี่ยว:
- จำนวนรายการ: ${dbData.harvest?.total_records || 0} รายการ
- รายได้รวม: ${dbData.harvest?.total_revenue ? dbData.harvest.total_revenue.toLocaleString() : 0} บาท
- กำไรสุทธิ: ${dbData.harvest?.total_profit ? dbData.harvest.total_profit.toLocaleString() : 0} บาท

ข้อมูลปุ๋ย:
- จำนวนรายการ: ${dbData.fertilizer?.total_records || 0} รายการ
- ค่าใช้จ่ายรวม: ${dbData.fertilizer?.total_cost ? dbData.fertilizer.total_cost.toLocaleString() : 0} บาท

ข้อมูลต้นปาล์ม:
- จำนวนการเก็บเกี่ยว: ${dbData.palmtree?.total_records || 0} ครั้ง
- จำนวนต้นไม้ที่เก็บเกี่ยว: ${dbData.palmtree?.unique_trees || 0} ต้น
- ทะลายรวม: ${dbData.palmtree?.total_bunches || 0} ทะลาย

คำถามของผู้ใช้: ${message}

กรุณาตอบเป็นภาษาไทยและให้ข้อมูลที่เป็นประโยชน์โดยอ้างอิงข้อมูลจากฐานข้อมูล`;

        // Generate AI response
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const aiMessage = response.text();

        console.log(`✅ AI response generated (${aiMessage.length} chars)`);

        res.json({
            message: aiMessage,
            timestamp: new Date().toISOString(),
            dataUsed: Object.keys(dbData)
        });

    } catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({
            error: 'AI service error',
            message: 'ขออภัยครับ ระบบ AI ไม่สามารถตอบคำถามได้ในขณะนี้'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Simple Palm Oil API Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbPath}`);
    console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});