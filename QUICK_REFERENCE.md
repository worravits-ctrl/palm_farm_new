# 🔧 Quick Reference: Palm Oil Migration Commands

## 🚀 Migration Commands

```bash
# 1. เช็คความพร้อม migration
npm run check-migration

# 2. ติดตั้ง PostgreSQL dependency
npm install pg

# 3. โอนข้อมูลจาก SQLite ไป PostgreSQL
npm run migrate

# 4. รัน server แบบ PostgreSQL
npm run start:postgresql
```

## 🛠️ Development Commands

### SQLite (Local Development)
```bash
# เริ่มต้นฐานข้อมูล SQLite
npm run init-db

# รัน server แบบ SQLite
npm start
# หรือ
npm run dev

# เช็คข้อมูลในฐานข้อมูล
npm run check-db
```

### PostgreSQL (Production)
```bash
# รัน server แบบ PostgreSQL
npm run start:postgresql

# รัน development แบบ PostgreSQL (hot reload)
npm run dev:postgresql

# โอนข้อมูล (ต้องตั้ง DATABASE_URL ก่อน)
npm run migrate
```

## 🌐 Railway Deployment

### 1. Setup Railway Project
```bash
# ติดตั้ง Railway CLI
npm install -g @railway/cli

# Login เข้า Railway
railway login

# สร้าง project ใหม่
railway new palm-oil-production

# เพิ่ม PostgreSQL service
# (ทำใน Railway dashboard)
```

### 2. Environment Setup
```bash
# คัดลอก DATABASE_URL จาก Railway
# ใส่ใน .env file:
DATABASE_URL=postgresql://username:password@host:port/database

# Test connection
node -e "
const { Pool } = require('pg');
const db = new Pool({connectionString: process.env.DATABASE_URL});
db.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : 'Connected!', res ? res.rows[0] : '');
  db.end();
});
"
```

### 3. Deploy
```bash
# Link กับ Railway project
railway link

# Deploy
railway up

# ดู logs
railway logs
```

## 📊 Database Management

### SQLite Commands
```bash
# เปิดฐานข้อมูล SQLite
sqlite3 database/palmoil.db

# ดูตาราง
.tables

# ดูข้อมูลในตาราง
SELECT COUNT(*) FROM harvest_data;
SELECT COUNT(*) FROM users;

# Export ข้อมูล
.mode csv
.output export.csv
SELECT * FROM harvest_data;
```

### PostgreSQL Commands
```bash
# เชื่อมต่อฐานข้อมูล PostgreSQL
psql $DATABASE_URL

# ดูตาราง
\dt

# ดูข้อมูลในตาราง
SELECT COUNT(*) FROM harvest_data;

# Backup ฐานข้อมูล
pg_dump $DATABASE_URL > backup.sql

# Restore ฐานข้อมูล
psql $DATABASE_URL < backup.sql
```

## 🔍 Testing & Debugging

### API Testing
```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}'

# Test harvest endpoint (ต้องมี JWT token)
curl -X GET http://localhost:3001/api/harvest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Database Testing
```bash
# รัน test files ต่างๆ
node test-api-call.js
node test-all-endpoints.js
node test-harvest-ai.js
node test-fertilizer-api.js
```

## 📁 File Structure Reference

```
Configuration Files:
├── .env                    # Local environment
├── .env.railway           # Railway template
├── railway.json           # Railway config
└── package.json           # Dependencies & scripts

Database Files:
├── database/
│   ├── palmoil.db         # SQLite (source)
│   ├── postgresql-schema.sql # PostgreSQL schema
│   └── schema.sql         # SQLite schema

API Servers:
├── api-server.js          # SQLite version
└── api-server-postgresql.js # PostgreSQL version

Migration:
├── scripts/migrate-to-postgresql.js # Migration script
├── check-migration-status.js       # Status checker
└── DATABASE_MIGRATION_SUMMARY.md   # Full documentation
```

## 🚨 Troubleshooting

### Migration Issues
```bash
# หากมีปัญหา connection
# เช็ค DATABASE_URL format:
# postgresql://username:password@host:port/database?ssl=true

# หากมีปัญหา SSL
# เพิ่มใน connection:
ssl: { rejectUnauthorized: false }

# หากข้อมูลไม่ครบ
# เช็ค source database:
npm run check-db
```

### Railway Issues  
```bash
# หากมีปัญหา deploy
railway logs

# Re-deploy
railway up --detach

# เช็ค environment variables
railway variables

# รีสตาร์ท service
railway service restart
```

### Performance Issues
```bash
# เช็ค indexes ในฐานข้อมูล
# SQLite:
.schema harvest_data

# PostgreSQL:
\d+ harvest_data
```

## 🎯 Quick Tips

1. **Always backup** ก่อน migration:
   ```bash
   cp database/palmoil.db database/palmoil.db.backup
   ```

2. **Test locally** ก่อน deploy:
   ```bash
   npm run check-migration && npm run migrate
   ```

3. **Monitor resource usage** บน Railway dashboard

4. **Use environment variables** สำหรับ sensitive data

5. **Check logs regularly** สำหรับ errors:
   ```bash
   railway logs --tail
   ```