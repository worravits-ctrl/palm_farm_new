# 🌴 Palm Oil Business Management System

## 🚀 Migration to PostgreSQL on Railway

ระบบจัดการธุรกิจน้ำมันปาล์มได้รับการอัปเกรดเพื่อรองรับ PostgreSQL บน Railway cloud platform!

### 📊 สถานะปัจจุบัน

- ✅ **SQLite Database**: 924 KB (1,526 รายการข้อมูล)
- ✅ **PostgreSQL Schema**: พร้อมใช้งาน (5 ตาราง, 7 indexes)
- ✅ **Migration Script**: อัตโนมัติสำหรับโอนข้อมูล
- ✅ **API Server**: รองรับทั้ง SQLite และ PostgreSQL
- ✅ **Railway Config**: พร้อม deploy

### 🔧 Quick Start

#### สำหรับ Local Development (SQLite)
```bash
# ติดตั้ง dependencies
npm install

# เริ่มต้นฐานข้อมูล
npm run init-db

# รัน server
npm start
```

#### สำหรับ Cloud Deployment (PostgreSQL)
```bash
# เช็คความพร้อมสำหรับ migration
npm run check-migration

# ติดตั้ง PostgreSQL dependency  
npm install pg

# ตั้งค่า DATABASE_URL (ใน .env)
DATABASE_URL=postgresql://username:password@host:port/database

# โอนข้อมูลจาก SQLite ไป PostgreSQL
npm run migrate

# รัน server แบบ PostgreSQL
npm run start:postgresql
```

### 📖 เอกสารการ Migration

| ไฟล์ | รายละเอียด |
|------|------------|
| `DATABASE_MIGRATION_SUMMARY.md` | สรุปการเปลี่ยนแปลงและข้อมูลทั้งหมด |
| `RAILWAY_DEPLOYMENT_GUIDE.md` | คู่มือ deploy ไป Railway ทีละขั้นตอน |
| `check-migration-status.js` | เช็คความพร้อมสำหรับ migration |

### 🏗️ โครงสร้างโปรเจค

```
palm_oil_new/
├── 📊 database/
│   ├── palmoil.db              # SQLite (ปัจจุบัน)
│   ├── postgresql-schema.sql   # PostgreSQL schema
│   └── schema.sql              # SQLite schema
├── 🔄 scripts/
│   ├── migrate-to-postgresql.js  # Migration script
│   ├── init-database.js         # SQLite initializer
│   └── ...
├── 🌐 API Servers
│   ├── api-server.js            # SQLite version
│   └── api-server-postgresql.js # PostgreSQL version
├── 🎨 Frontend
│   ├── palm-oil-database-app.html
│   ├── Qwen_jsx_20250912_y4d6679zr.jsx
│   └── frontend/ (Vite + React)
└── ⚙️ Configuration
    ├── railway.json
    ├── .env.railway
    └── package.json
```

### 🎯 Features

- **👥 Multi-user**: รองรับผู้ใช้หลายคน พร้อม role-based access
- **🌾 Harvest Management**: บันทึกการเก็บเกี่ยวน้ำมันปาล์ม
- **🧪 Fertilizer Tracking**: จัดการข้อมูลปุ๋ยและต้นทุน
- **🌳 Palm Tree Records**: ติดตามข้อมูลต้นปาล์มรายต้น
- **📝 Notes System**: บันทึกข้อมูลเพิ่มเติม
- **📊 Analytics**: สถิติและรายงานทางธุรกิจ
- **🤖 AI Assistant**: Gemini AI สำหรับคำถามธุรกิจ
- **📱 Responsive UI**: ใช้งานได้ทุกอุปกรณ์

### 🔐 Database Schema

#### Users (4 รายการ)
```sql
- id: SERIAL PRIMARY KEY
- username: VARCHAR(50) UNIQUE
- email: VARCHAR(100) UNIQUE  
- password_hash: VARCHAR(255)
- role: VARCHAR(20) DEFAULT 'user'
- created_at: TIMESTAMP
```

#### Harvest Data (89 รายการ)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FK)
- date: DATE
- total_weight: DECIMAL(10,2)
- price_per_kg: DECIMAL(10,2)
- total_revenue: DECIMAL(10,2)
- harvesting_cost: DECIMAL(10,2)
- net_profit: DECIMAL(10,2)
```

#### Fertilizer Data (16 รายการ)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FK)
- date: DATE
- fertilizer_type: VARCHAR(100)
- quantity_sacks: INTEGER
- cost_per_sack: DECIMAL(10,2)
- total_cost: DECIMAL(10,2)
- supplier: VARCHAR(255)
```

#### Palm Tree Data (1,411 รายการ)
```sql
- id: SERIAL PRIMARY KEY  
- user_id: INTEGER (FK)
- tree_id: VARCHAR(10)
- harvest_date: DATE
- bunch_count: INTEGER
- notes: TEXT
```

#### Notes Data (6 รายการ)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FK)
- title: VARCHAR(200)
- content: TEXT
- category: VARCHAR(100) DEFAULT 'ทั่วไป'
- priority: VARCHAR(50) DEFAULT 'ปานกลาง'
- created_at: TIMESTAMP
```

### 📈 Business Logic

- **สกุลเงิน**: บาทไทย (THB) ความละเอียด 2 ตำแหน่ง
- **หน่วย**: ทะลาย (bunches), กระสอบ (sacks), กิโลกรัม (kg)
- **การคำนวณ**: `กำไรสุทธิ = รายได้ทั้งหมด - ต้นทุนเก็บเกี่ยว`
- **วันที่**: รองรับปฏิทินไทย และ ISO format

### 🌍 Environment Variables

```bash
# Database (ปรับตามการใช้งาน)
DATABASE_URL=postgresql://user:pass@host:port/db  # PostgreSQL
# หรือใช้ SQLite (ค่าเริ่มต้น)

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Server Configuration  
PORT=3001
NODE_ENV=production

# Railway (เมื่อ deploy)
RAILWAY_TOKEN=your-railway-token
```

### 🔄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/register` | สมัครสมาชิก |
| GET | `/api/harvest` | ดึงข้อมูลการเก็บเกี่ยว |
| POST | `/api/harvest` | บันทึกการเก็บเกี่ยว |
| GET | `/api/fertilizer` | ดึงข้อมูลปุ๋ย |
| POST | `/api/fertilizer` | บันทึกข้อมูลปุ๋ย |
| GET | `/api/palmtrees` | ดึงข้อมูลต้นปาล์ม |
| POST | `/api/palmtrees` | บันทึกข้อมูลต้นปาล์ม |
| GET | `/api/notes` | ดึงข้อมูลบันทึก |
| POST | `/api/notes` | เพิ่มบันทึกใหม่ |
| GET | `/api/stats/monthly-revenue` | สถิติรายได้รายเดือน |

### 📊 Migration Benefits

#### ✅ Advantages
- **🚀 Performance**: Query ที่เร็วขึ้นสำหรับผู้ใช้พร้อมกัน
- **☁️ Cloud Ready**: Deploy บน Railway ได้ง่าย
- **🔒 ACID Compliance**: ความปลอดภัยของข้อมูลดีขึ้น
- **🔍 Advanced Features**: JSON support, full-text search
- **💾 Auto Backup**: Railway จัดการ backup อัตโนมัติ
- **📈 Scalability**: รองรับการขยายตัวในอนาคต

#### ⚠️ Considerations
- **📚 Learning Curve**: Syntax PostgreSQL แตกต่างจาก SQLite
- **🌐 Network Dependency**: ต้องเชื่อมต่อ internet
- **💰 Cost**: Railway มีข้อจำกัดการใช้งาน
- **⏰ Migration Time**: ต้องใช้เวลาตั้งค่าครั้งแรก

### 🎉 ขั้นตอนถัดไป

1. **🔍 Check Status**: `npm run check-migration`
2. **🛠️ Setup Railway**: ตาม `RAILWAY_DEPLOYMENT_GUIDE.md`
3. **🔄 Migrate Data**: `npm run migrate`
4. **🚀 Deploy**: Push โค้ดไป Railway
5. **✅ Test**: ทดสอบทุก features บน cloud

---

**Migration Status**: ✅ **READY FOR DEPLOYMENT**  
**Documentation**: 📖 Complete  
**Data Safety**: 🔒 Backup ready  
**Deployment Platform**: 🚄 Railway PostgreSQL