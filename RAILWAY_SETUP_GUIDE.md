# 🚂 Railway Setup & Deployment Guide

## Step 1: สร้าง Railway Project

### 1.1 เข้าสู่ระบบ Railway
1. ไปที่ https://railway.app
2. Sign in ด้วย GitHub account
3. Click "New Project"

### 1.2 เชื่อมต่อ GitHub Repository
1. เลือก "Deploy from GitHub repo"
2. เลือก repository: `palm_farm_new`
3. Branch: `main`

## Step 2: เพิ่ม PostgreSQL Database

### 2.1 เพิ่ม Database Service
1. ใน Railway dashboard, click "+ New"
2. เลือก "Database" → "PostgreSQL"
3. รอการติดตั้ง (2-3 นาที)

### 2.2 รับ Database URL
1. Click ที่ PostgreSQL service
2. ไปที่ tab "Variables"
3. คัดลอก `DATABASE_URL`
4. Format จะเป็น: `postgresql://username:password@host:port/database`

## Step 3: ตั้งค่า Environment Variables

### 3.1 สำหรับ Railway Service (Web App)
```
NODE_ENV=production
DATABASE_URL=[PostgreSQL URL จาก step 2.2]
JWT_SECRET=palm_oil_secret_key_2024_railway
PORT=3001
GEMINI_API_KEY=[ใส่ถ้ามี]
```

### 3.2 สำหรับ Local Testing
สร้างไฟล์ `.env`:
```
DATABASE_URL=[PostgreSQL URL จาก Railway]
NODE_ENV=development
JWT_SECRET=palm_oil_secret_key_2024_railway
```

## Step 4: กำหนด Build & Deploy Settings

### 4.1 Start Command
ใน Railway service settings:
- **Build Command**: `npm install`
- **Start Command**: `npm run start:postgresql`

### 4.2 Root Directory
- Root Directory: `/` (default)

## Step 5: Deploy แอปพลิเคชัน

### 5.1 Automatic Deploy
1. Railway จะ deploy อัตโนมัติเมื่อ push to main branch
2. ดู deployment status ใน dashboard
3. รอให้ status เป็น "Success" (3-5 นาที)

### 5.2 ได้ App URL
1. ใน Railway dashboard → Web Service
2. Copy URL (format: https://your-app-name.railway.app)
3. ทดสอบ: `curl https://your-app.railway.app/health`

## Step 6: Run Database Migration

### 6.1 Setup Local Environment
```bash
# สร้าง .env file ด้วย DATABASE_URL จาก Railway
echo "DATABASE_URL=your_postgresql_url_here" > .env
echo "NODE_ENV=development" >> .env

# ติดตั้ง dependencies
npm install
```

### 6.2 Run Migration
```bash
# ทดสอบ connection ก่อน
npm run check-migration

# รัน migration
npm run migrate
```

### 6.3 ตรวจสอบข้อมูล
```bash
# ใช้ psql เชื่อมต่อ Railway database
psql $DATABASE_URL

# เช็คตาราง
\dt

# เช็คข้อมูล
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM harvest_data;
```

## Step 7: ทดสอบการทำงาน

### 7.1 ทดสอบ API Endpoints
```bash
# Health check
curl https://your-app.railway.app/health

# ทดสอบครบถ้วนด้วย script
npm run test:api https://your-app.railway.app
```

### 7.2 ทดสอบผ่าน Web Browser
1. เปิด https://your-app.railway.app
2. ทดสอบ login/register
3. ทดสอบ CRUD operations
4. ตรวจสอบ charts และ reports

## Step 8: Monitoring & Maintenance

### 8.1 Monitor Railway Dashboard
- CPU usage
- Memory usage  
- Network requests
- Error rates

### 8.2 Check Logs
```bash
# ใน Railway dashboard → Logs tab
# หรือใช้ Railway CLI:
railway logs
```

### 8.3 Performance Monitoring
```bash
# รัน performance test
npm run test:railway
```

---

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL

# Check SSL requirement
# Railway PostgreSQL ต้องใช้ SSL
```

### Migration Problems
```bash
# Check existing tables
psql $DATABASE_URL -c "\dt"

# Re-run migration
npm run migrate

# Manual table creation if needed
psql $DATABASE_URL < database/postgresql-schema.sql
```

### Deployment Failures
```bash
# Check Railway logs
# Common issues:
# - Missing start command
# - Wrong environment variables  
# - Build failures
```

---

## 📊 Expected Results

หลังจาก deploy สำเร็จ:

1. **API Health**: `GET /health` returns 200 OK
2. **Database**: มี 5 ตาราง + ข้อมูลจาก SQLite
3. **Authentication**: Login/register ทำงานได้
4. **CRUD Operations**: ทุก endpoint ทำงานปกติ
5. **Performance**: Response time < 2 วินาที
6. **Uptime**: > 99%

---

## 🎯 Next Steps After Deployment

1. **Update Frontend**: เปลี่ยน API URL จาก localhost เป็น Railway URL
2. **Custom Domain** (optional): Setup custom domain ใน Railway
3. **Monitoring**: Setup uptime monitoring
4. **Backup Strategy**: Railway auto-backup, แต่ควร export เป็นระยะ
5. **Performance Optimization**: Monitor และ optimize ตาม usage

**🚀 Ready to Deploy!**