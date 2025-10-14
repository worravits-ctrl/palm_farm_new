# 🗄️ การจัดเก็บข้อมูลระบบจัดการธุรกิจน้ำมันปาล์ม

## 📊 ภาพรวมระบบฐานข้อมูล

### 🔧 เทคโนโลยีที่ใช้
- **SQLite** (Local Development): ไฟล์ `database/palmoil.db`
- **PostgreSQL** (Production on Railway): Cloud database
- **Node.js pg Pool**: Connection management
- **JWT Authentication**: User session management

### 🏗️ สถาปัตยกรรมข้อมูล
```
┌─────────────────────┐    ┌─────────────────────┐
│   Frontend (React)  │◄──►│   API Server        │
│  - localStorage     │    │  - Express.js       │
│  - Session Storage  │    │  - JWT Auth         │
└─────────────────────┘    └─────────────────────┘
                                      │
                           ┌─────────────────────┐
                           │   Database Layer    │
                           │  - SQLite (Dev)     │
                           │  - PostgreSQL (Prod)│
                           └─────────────────────┘
```

---

## 🗃️ โครงสร้างฐานข้อมูล

### 1. 👥 ตาราง `users` - ข้อมูลผู้ใช้งาน
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**การใช้งาน:**
- เก็บข้อมูลผู้ใช้ทั้งหมด (เกษตรกร, admin)
- Authentication และ authorization
- Multi-user support พร้อม role-based access

**ข้อมูลที่เก็บ:**
- `username`: ชื่อผู้ใช้งาน (ไม่ซ้ำ)
- `email`: อีเมล (ใช้สำหรับ login)
- `password_hash`: รหัสผ่านที่เข้ารหัสด้วย bcrypt
- `role`: บทบาท ('user', 'admin')
- `created_at`: วันที่สร้างบัญชี

### 2. 🌾 ตาราง `harvest_data` - ข้อมูลการเก็บเกี่ยว
```sql
CREATE TABLE harvest_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_weight DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(8,2) NOT NULL,
    harvesting_cost DECIMAL(10,2) DEFAULT 0,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_harvest_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);
```

**การใช้งาน:**
- บันทึกผลการเก็บเกี่ยวรายวัน
- คำนวณรายได้และกำไร
- วิเคราะห์แนวโน้มการผลิต

**ข้อมูลที่เก็บ:**
- `date`: วันที่เก็บเกี่ยว
- `total_weight`: น้ำหนักรวม (กิโลกรัม)
- `price_per_kg`: ราคาต่อกิโลกรัม (บาท)
- `harvesting_cost`: ต้นทุนการเก็บเกี่ยว
- `location`: สถานที่เก็บเกี่ยว
- `notes`: หมายเหตุเพิ่มเติม

### 3. 🌱 ตาราง `fertilizer_data` - ข้อมูลการใส่ปุ๋ย
```sql
CREATE TABLE fertilizer_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    fertilizer_type VARCHAR(100) NOT NULL,
    quantity_used DECIMAL(8,2) NOT NULL,
    cost_per_unit DECIMAL(8,2) NOT NULL,
    supplier VARCHAR(255),
    area_applied VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fertilizer_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);
```

**การใช้งาน:**
- ติดตามการใช้ปุ๋ยและสารเคมี
- คำนวณต้นทุนการผลิต
- วางแผนการใส่ปุ๋ย

**ข้อมูลที่เก็บ:**
- `fertilizer_type`: ชนิดปุ๋ย (NPK, ยูเรีย, ฯลฯ)
- `quantity_used`: ปริมาณที่ใช้ (กระสอบ/กิโลกรัม)
- `cost_per_unit`: ต้นทุนต่อหน่วย
- `supplier`: ผู้จำหน่าย/ร้านค้า
- `area_applied`: พื้นที่ที่ใส่ปุ๋ย

### 4. 🌴 ตาราง `palm_tree_data` - ข้อมูลต้นปาล์ม
```sql
CREATE TABLE palm_tree_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    tree_id VARCHAR(10) NOT NULL,
    harvest_date DATE NOT NULL,
    bunch_count INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_palmtree_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);
```

**การใช้งาน:**
- ติดตามผลผลิตของต้นปาล์มแต่ละต้น
- วิเคราะห์ประสิทธิภาพการผลิต
- วางแผนการจัดการสวน

**ข้อมูลที่เก็บ:**
- `tree_id`: รหัสต้นปาล์ม (A1, B5, C12, ฯลฯ)
- `harvest_date`: วันที่เก็บเกี่ยว
- `bunch_count`: จำนวนทะลาย
- `notes`: สภาพต้นไม้, โรคแมลง

### 5. 📝 ตาราง `notes_data` - บันทึกและหมายเหตุ
```sql
CREATE TABLE notes_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100) DEFAULT 'ทั่วไป',
    priority VARCHAR(50) DEFAULT 'ปานกลาง',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notes_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);
```

**การใช้งาน:**
- บันทึกข้อมูลเพิ่มเติมและแผนการทำงาน
- เก็บความรู้และประสบการณ์
- สร้างรายงานและสรุป

**ข้อมูลที่เก็บ:**
- `title`: หัวข้อหมายเหตุ
- `content`: เนื้อหาโดยละเอียด
- `category`: หมวดหมู่ (การเก็บเกี่ยว, ปุ๋ย, โรคแมลง, ฯลฯ)
- `priority`: ระดับความสำคัญ

---

## 🔗 ความสัมพันธ์ของข้อมูล

### User-Centric Design
```
users (1) ──────── (n) harvest_data
  │
  ├─────────────── (n) fertilizer_data
  │
  ├─────────────── (n) palm_tree_data
  │
  └─────────────── (n) notes_data
```

**หลักการ:**
- ทุกข้อมูลเชื่อมโยงกับ `user_id`
- CASCADE DELETE: ลบ user = ลบข้อมูลทั้งหมด
- Multi-tenant: แต่ละ user เห็นเฉพาะข้อมูลของตัวเอง
- Admin role: เห็นข้อมูลทุก user

### Indexes สำหรับ Performance
```sql
-- Indexes สำหรับการค้นหาที่รวดเร็ว
CREATE INDEX idx_harvest_user_date ON harvest_data(user_id, date);
CREATE INDEX idx_fertilizer_user_date ON fertilizer_data(user_id, date);
CREATE INDEX idx_palmtree_user_tree ON palm_tree_data(user_id, tree_id);
CREATE INDEX idx_notes_user_category ON notes_data(user_id, category);
CREATE INDEX idx_users_email ON users(email);
```

---

## 💾 การจัดเก็บและการเข้าถึงข้อมูล

### 1. **API Layer** - ชั้นการเข้าถึงข้อมูล
```javascript
// Database Connection Pool
const { Pool } = require('pg');
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // จำกัดการเชื่อมต่อ
  idleTimeoutMillis: 30000
});

// Query Wrapper สำหรับความเข้ากันได้
const dbQuery = (sql, params) => {
  if (process.env.DATABASE_URL?.includes('postgresql')) {
    // PostgreSQL parameter binding ($1, $2, ...)
    return db.query(sql, params);
  } else {
    // SQLite parameter binding (?, ?, ...)
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    });
  }
};
```

### 2. **Authentication & Authorization**
```javascript
// JWT Token Management
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user; // { id, username, email, role }
    next();
  });
};

// User Data Isolation
const getUserData = async (req, res) => {
  const userId = req.user.id; // จาก JWT token
  const role = req.user.role;
  
  let query;
  let params;
  
  if (role === 'admin') {
    // Admin เห็นข้อมูลทั้งหมด
    query = 'SELECT * FROM harvest_data ORDER BY date DESC';
    params = [];
  } else {
    // User เห็นเฉพาะข้อมูลของตัวเอง
    query = 'SELECT * FROM harvest_data WHERE user_id = $1 ORDER BY date DESC';
    params = [userId];
  }
  
  const result = await dbQuery(query, params);
  res.json(result.rows);
};
```

### 3. **Data Validation & Processing**
```javascript
// Input Validation
const validateHarvestData = (data) => {
  const errors = [];
  
  if (!data.date || !isValidDate(data.date)) {
    errors.push('วันที่ไม่ถูกต้อง');
  }
  
  if (!data.total_weight || data.total_weight <= 0) {
    errors.push('น้ำหนักต้องมากกว่า 0');
  }
  
  if (!data.price_per_kg || data.price_per_kg <= 0) {
    errors.push('ราคาต้องมากกว่า 0');
  }
  
  return errors;
};

// Data Processing
const calculateRevenue = (weight, pricePerKg) => {
  return (parseFloat(weight) * parseFloat(pricePerKg)).toFixed(2);
};

const calculateNetProfit = (revenue, cost) => {
  return (parseFloat(revenue) - parseFloat(cost)).toFixed(2);
};
```

---

## 📈 การวิเคราะห์และรายงาน

### 1. **Dashboard Statistics**
```javascript
// สถิติหน้าแรก
const getDashboardStats = async (userId) => {
  const queries = {
    totalHarvests: `
      SELECT COUNT(*) as count 
      FROM harvest_data 
      WHERE user_id = $1
    `,
    totalRevenue: `
      SELECT SUM(total_weight * price_per_kg) as revenue 
      FROM harvest_data 
      WHERE user_id = $1
    `,
    monthlyRevenue: `
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(total_weight * price_per_kg) as revenue
      FROM harvest_data 
      WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
    `,
    topPalmTrees: `
      SELECT 
        tree_id,
        SUM(bunch_count) as total_bunches
      FROM palm_tree_data
      WHERE user_id = $1
      GROUP BY tree_id
      ORDER BY total_bunches DESC
      LIMIT 10
    `
  };
};
```

### 2. **Monthly Reports**
```javascript
// รายงานรายเดือน
const getMonthlyReport = async (userId, year, month) => {
  return {
    harvest: await getMonthlyHarvest(userId, year, month),
    fertilizer: await getMonthlyFertilizer(userId, year, month),
    palmTrees: await getMonthlyPalmTrees(userId, year, month),
    summary: await getMonthlySummary(userId, year, month)
  };
};
```

### 3. **Data Export/Import**
```javascript
// CSV Export
const exportToCSV = (data, filename, headers) => {
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(field => 
        `"${row[field] || ''}"`
      ).join(',')
    )
  ].join('\n');
  
  return csv;
};

// CSV Import
const importFromCSV = async (csvContent, userId) => {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const record = { user_id: userId };
    headers.forEach((header, index) => {
      record[header.trim()] = values[index]?.replace(/"/g, '').trim();
    });
    return record;
  });
  
  // Bulk insert
  for (const record of data) {
    await insertHarvestData(record);
  }
};
```

---

## 🔐 ความปลอดภัยของข้อมูล

### 1. **Authentication Security**
```javascript
// Password Hashing
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### 2. **SQL Injection Prevention**
```javascript
// ใช้ Parameterized Queries เสมอ
const getUserById = async (id) => {
  // ✅ ปลอดภัย
  const query = 'SELECT * FROM users WHERE id = $1';
  return await db.query(query, [id]);
  
  // ❌ อันตราย - SQL Injection
  // const query = `SELECT * FROM users WHERE id = ${id}`;
};
```

### 3. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 1000, // จำกัด 1000 requests ต่อ IP
  message: 'Too many requests from this IP'
});

app.use('/api', limiter);
```

---

## 📊 สถิติข้อมูลปัจจุบัน

### ขนาดฐานข้อมูล (ณ วันที่ 14 ตุลาคม 2568)
```
📁 SQLite Database: 924 KB
├── users: 4 รายการ
├── harvest_data: 89 รายการ  
├── fertilizer_data: 16 รายการ
├── palm_tree_data: 1,411 รายการ
└── notes_data: 6 รายการ

รวม: 1,526 รายการ
```

### การคาดการณ์การเติบโต
```
ปี 1: ~2,000 รายการ (85 MB)
ปี 2: ~2,600 รายการ (110 MB)  
ปี 3: ~3,400 รายการ (143 MB)
ปี 5: ~5,700 รายการ (241 MB)

💡 Railway Hobby Plan (8 GB) รองรับได้ 10+ ปี
```

---

## 🚀 การ Backup และ Recovery

### 1. **Automated Backups (Railway)**
- Daily automated backups
- Point-in-time recovery
- 7-day retention period

### 2. **Manual Backups**
```bash
# Export ฐานข้อมูล
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Import ฐานข้อมูล
psql $DATABASE_URL < backup_20241014.sql

# Export เฉพาะข้อมูล (ไม่รวม schema)
pg_dump --data-only $DATABASE_URL > data_only.sql
```

### 3. **CSV Backups**
```javascript
// Export ข้อมูลสำคัญเป็น CSV
const exportAllData = async (userId) => {
  const harvest = await exportHarvestCSV(userId);
  const fertilizer = await exportFertilizerCSV(userId);
  const palmTrees = await exportPalmTreesCSV(userId);
  
  return { harvest, fertilizer, palmTrees };
};
```

---

## 📋 สรุปจุดเด่นของระบบ

### ✅ **ข้อดี**
1. **Multi-user Support**: รองรับหลายเกษตรกร
2. **Data Isolation**: ข้อมูลแยกตาม user
3. **Comprehensive Tracking**: ครอบคลุมทุกด้านการจัดการสวน
4. **Scalable**: รองรับการเติบโตระยะยาว
5. **Cloud Ready**: พร้อม deploy บน Railway/cloud
6. **Export/Import**: รองรับ CSV สำหรับ backup
7. **Real-time Analytics**: รายงานและกราฟแบบ real-time

### 🎯 **การใช้งานจริง**
- **เกษตรกรเดี่ยว**: ติดตามผลผลิตและต้นทุน
- **สหกรณ์**: จัดการข้อมูลสมาชิกหลายคน
- **ผู้จัดการสวน**: วิเคราะห์ประสิทธิภาพและวางแผน
- **Audit Trail**: ตรวจสอบการเปลี่ยนแปลงข้อมูล

**🌴 ระบบนี้ครอบคลุมการจัดเก็บข้อมูลทุกด้านของธุรกิจน้ำมันปาล์ม ตั้งแต่การเพาะปลูก การเก็บเกี่ยว ไปจนถึงการวิเคราะห์ผลกำไร!**