# ⚠️ การ Deploy ต้องใช้ Railway Dashboard

## 🔗 ขั้นตอนที่ต้องทำใน Railway Dashboard:

### 1. ไปที่ Railway Dashboard:
```
https://railway.com/project/2cd7881d-f587-4423-b26e-2da6ad9f5f33
```

### 2. คลิกที่ PostgreSQL Service
- ไปที่ PostgreSQL database service
- เปิดแท็บ "Variables" หรือ "Connect"
- หา CONNECTION_STRING หรือ DATABASE_URL
- Format จะเป็น: `postgresql://username:password@host:port/database`

### 3. อัปเดต Environment Variables
คัดลอก DATABASE_URL ที่ถูกต้องแล้วรัน:
```bash
railway variables --set "DATABASE_URL=postgresql://[จาก Railway dashboard]"
```

### 4. อัปเดต .env file
```bash
DATABASE_URL=postgresql://[จาก Railway dashboard]
```

### 5. รัน Migration อีกครั้ง
```bash
npm run migrate
```

---

## 🚨 สาเหตุปัญหา
- URL ที่ใช้ตอนนี้: `postgresql://postgres-production-245e.up.railway.app:5432/railway`
- อาจจะขาด username/password หรือ SSL configuration
- ต้องได้ credentials ที่ถูกต้องจาก Railway

## 🔧 Alternative Solution
หากไม่สามารถเชื่อมต่อได้ ให้:

1. Deploy API server ก่อนโดยใช้ SQLite (ใช้ api-server.js)
2. หลังจาก deploy แล้วค่อยทำ migration ในภายหลัง

### Deploy with SQLite:
```bash
# อัปเดต railway.json
"startCommand": "npm start"  # ใช้ SQLite version

# Deploy
railway up
```

---

## 📞 ต้องการความช่วยเหลือ:
1. เข้า Railway dashboard: https://railway.com/project/2cd7881d-f587-4423-b26e-2da6ad9f5f33
2. หา PostgreSQL connection string ที่ถูกต้อง
3. หรือ deploy ด้วย SQLite ก่อน แล้วค่อย migrate ทีหลัง