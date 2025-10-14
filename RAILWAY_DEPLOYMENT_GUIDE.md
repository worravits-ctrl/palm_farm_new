# Railway Deployment Guide for Palm Oil Management System

## 📋 ขั้นตอนการ Deploy ไปยัง Railway

### 1. เตรียม PostgreSQL Database

1. เข้าไปที่ [Railway.app](https://railway.app)
2. สร้าง Project ใหม่
3. เพิ่ม PostgreSQL service:
   ```
   + New → Database → PostgreSQL
   ```
4. คัดลอก DATABASE_URL จาก Variables tab

### 2. ตั้งค่า Environment Variables

ในหน้า Variables ของ Railway project ให้เพิ่ม:

```
DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway
JWT_SECRET=your-super-secret-jwt-key-2025
NODE_ENV=production
PORT=3001
```

### 3. Deploy API Server

1. เชื่อมต่อ GitHub repository:
   ```
   + New → GitHub Repo → palm_farm_new
   ```

2. ตั้งค่า Build Command:
   ```
   Build Command: npm install
   Start Command: npm run start:postgresql
   ```

3. ตั้งค่า Root Directory (ถ้าจำเป็น):
   ```
   Root Directory: /
   ```

### 4. Run Database Migration

หลังจาก deploy สำเร็จ:

1. เข้าไปที่ Railway console
2. รัน migration command:
   ```bash
   npm run migrate
   ```

หรือ manual migration:

1. เชื่อมต่อ PostgreSQL ด้วย psql หรือ pgAdmin
2. รัน SQL script จาก `/database/postgresql-schema.sql`
3. Import ข้อมูลจาก SQLite (ใช้ migration script)

### 5. ทดสอบการทำงาน

1. ตรวจสอบ Health Check:
   ```
   GET https://your-app.up.railway.app/health
   ```

2. ทดสอบ Login:
   ```
   POST https://your-app.up.railway.app/api/auth/login
   {
     "email": "admin@palmoil.com", 
     "password": "admin"
   }
   ```

## 🔧 Configuration Files

### railway.json (Optional)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Procfile (Alternative)
```
web: npm run start:postgresql
```

## 📊 Database Schema

Schema อยู่ที่: `/database/postgresql-schema.sql`

ตารางหลัก:
- `users` - ข้อมูลผู้ใช้
- `harvest_data` - ข้อมูลการเก็บเกี่ยว  
- `fertilizer_data` - ข้อมูลปุ๋ย
- `palm_tree_data` - ข้อมูลต้นปาล์ม
- `notes_data` - บันทึกย่อ

## 🚀 Migration Command

```bash
# ติดตั้ง pg dependency
npm install pg

# ตั้งค่า environment variables
export DATABASE_URL="postgresql://..."

# รัน migration
npm run migrate
```

## 🔍 Troubleshooting

### Connection Issues
```javascript
// Test connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT version()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
```

### Migration Errors
- ตรวจสอบ DATABASE_URL ให้ถูกต้อง
- ตรวจสอบ SSL configuration
- ดู logs ใน Railway dashboard

## 📱 Frontend Configuration

อัปเดต API endpoint ใน frontend:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.up.railway.app/api'
  : 'http://localhost:3001/api';
```

## 🔐 Security Checklist

- ✅ ใช้ HTTPS ใน production
- ✅ ตั้ง JWT_SECRET ที่แข็งแรง
- ✅ เปิดใช้ SSL สำหรับ PostgreSQL
- ✅ ตั้งค่า CORS ให้เหมาะสม
- ✅ เปิดใช้ Rate Limiting