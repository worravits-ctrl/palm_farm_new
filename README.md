# ระบบจัดการธุรกิจน้ำมันปาล์ม

ระบบจัดการธุรกิจครบวงจรสำหรับสวนปาล์มน้ำมัน พร้อมฐานข้อมูล SQLite และ API แบบ RESTful

## 🌟 คุณสมบัติหลัก

### 🔐 ระบบผู้ใช้งาน
- ✅ สมัครสมาชิก/เข้าสู่ระบบ
- ✅ JWT Authentication
- ✅ ระบบบทบาท (User/Admin)
- ✅ จัดการสมาชิก (Admin)

### 📊 จัดการข้อมูลธุรกิจ
- ✅ บันทึกการเก็บเกี่ยว (วันที่, น้ำหนัก, ราคา, ค่าแรงงาน)
- ✅ จัดการปุ๋ย (ประเภท, จำนวนกระสอบ, ราคา)
- ✅ ติดตามต้นปาล์ม (312 ต้น: A1-L26)
- ✅ บันทึกความ (วันที่, เนื้อหา)
- ✅ รายงานสถิติแบบ Real-time

### 🤖 AI Assistant
- ✅ แชทบอทตอบคำถาม
- ✅ สถิติธุรกิจ
- ✅ การวิเคราะห์ข้อมูล

## 🏗️ สถาปัตยกรรม

### Frontend
- **React 18** (ผ่าน CDN)
- **Tailwind CSS** (ผ่าน CDN)
- **Single Page Application**

### Backend
- **Node.js + Express**
- **SQLite Database**
- **JWT Authentication**
- **RESTful API**

### Security
- **bcryptjs** สำหรับเข้ารหัสรหัสผ่าน
- **helmet** สำหรับ security headers
- **Rate limiting** ป้องกันการโจมตี
- **CORS** สำหรับ cross-origin requests

## 📁 โครงสร้างโปรเจค

```
palm_oil_new/
├── database/
│   ├── schema.sql          # โครงสร้างฐานข้อมูล
│   └── palmoil.db         # ไฟล์ฐานข้อมูล SQLite
├── scripts/
│   └── init-database.js   # สคริปต์เริ่มต้นฐานข้อมูล
├── .github/
│   └── copilot-instructions.md # คู่มือสำหรับ AI
├── api-server.js          # API Backend Server
├── simple-server.js       # Frontend Server
├── palm-oil-database-app.html  # Frontend (Database Version)
├── palm-oil-app.html      # Frontend (LocalStorage Version)
├── package.json           # Dependencies
└── README.md             # คู่มือนี้
```

## 🚀 การติดตั้งและรัน

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. เริ่มต้นฐานข้อมูล
```bash
npm run init-db
```

### 3. เริ่มต้น API Server (Terminal 1)
```bash
node api-server.js
```
Server จะรันที่ `http://localhost:3001`

### 4. เริ่มต้น Frontend Server (Terminal 2)
```bash
node simple-server.js
```
Server จะรันที่ `http://localhost:3000`

### 5. เปิดเบราว์เซอร์
- **เวอร์ชันฐานข้อมูล**: `http://localhost:3000/`
- **เวอร์ชัน LocalStorage**: `http://localhost:3000/old`

## 👤 บัญชีผู้ใช้เริ่มต้น

- **Email**: admin@palmoil.com
- **Password**: admin123
- **Role**: Admin

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/register` - สมัครสมาชิก

### Users (Admin only)
- `GET /api/users` - รายการสมาชิกทั้งหมด
- `PUT /api/users/:id/role` - เปลี่ยนบทบาท
- `PUT /api/users/:id/toggle` - เปิด/ปิดการใช้งาน
- `DELETE /api/users/:id` - ลบสมาชิก

### Harvest Data
- `GET /api/harvest` - ข้อมูลการเก็บเกี่ยว
- `POST /api/harvest` - เพิ่มข้อมูลการเก็บเกี่ยว

### Fertilizer Data
- `GET /api/fertilizer` - ข้อมูลปุ๋ย
- `POST /api/fertilizer` - เพิ่มข้อมูลปุ๋ย

### Palm Trees
- `GET /api/palmtrees` - ข้อมูลต้นปาล์ม
- `POST /api/palmtrees` - เพิ่มข้อมูลต้นปาล์ม

### Notes
- `GET /api/notes` - บันทึกความ
- `POST /api/notes` - เพิ่มบันทึก
- `DELETE /api/notes/:id` - ลบบันทึก

### Statistics
- `GET /api/stats` - สถิติภาพรวม

## 📊 ฐานข้อมูล

### ตารางหลัก
1. **users** - ข้อมูลสมาชิก
2. **harvest_data** - ข้อมูลการเก็บเกี่ยว
3. **fertilizer_data** - ข้อมูลปุ๋ย
4. **palm_tree_data** - ข้อมูลต้นปาล์ม
5. **notes_data** - บันทึกความ

### ความสัมพันธ์
- ทุกตารางข้อมูลธุรกิจมี `user_id` เชื่อมโยงกับตาราง `users`
- Foreign Key Constraints พร้อม CASCADE DELETE
- Index สำหรับเพิ่มประสิทธิภาพการค้นหา

## 🔒 ความปลอดภัย

- รหัสผ่านเข้ารหัสด้วย bcrypt
- JWT Token พร้อม expiration
- Rate limiting (100 requests/15 minutes)
- CORS protection
- SQL injection protection
- XSS protection ผ่าน helmet

## 🎯 วิธีใช้งาน

### สำหรับผู้ใช้ทั่วไป
1. สมัครสมาชิกผ่านหน้าเว็บ
2. เข้าสู่ระบบ
3. บันทึกข้อมูลการเก็บเกี่ยว, ปุ๋ย, ต้นปาล์ม
4. ดูสถิติในแดชบอร์ด
5. ใช้ AI Assistant สอบถามข้อมูล

### สำหรับผู้ดูแลระบบ
1. เข้าสู่ระบบด้วยบัญชี admin
2. จัดการสมาชิก (เปลี่ยนบทบาท, ระงับ, ลบ)
3. ดูข้อมูลของสมาชิกทั้งหมด
4. ตรวจสอบสถิติรวม

## 🚧 การพัฒนาต่อ

### ฟีเจอร์ที่อาจเพิ่มเติม
- 📈 กราฟแสดงสถิติ
- 📤 Export ข้อมูลเป็น CSV/PDF
- 📅 ระบบปฏิทินการทำงาน
- 📱 Mobile responsive ที่ดีขึ้น
- 🔔 ระบบแจ้งเตือน
- 🌤️ API สภาพอากาศ
- 💰 คำนวณภาษี/กำไรขาดทุน

### การปรับปรุงเทคนิค
- Migration system สำหรับฐานข้อมูล
- Unit tests
- Docker containerization
- CI/CD pipeline
- Logging system
- Backup/Restore system

## 📞 การสนับสนุน

หากมีปัญหาหรือข้อสงสัย สามารถ:
1. ตรวจสอบ Console ของเบราว์เซอร์
2. ดู log ของ API server
3. ตรวจสอบฐานข้อมูลใน `database/palmoil.db`

## 📝 หมายเหตุ

- ระบบนี้เหมาะสำหรับสวนปาล์มขนาดเล็กถึงกลาง
- ข้อมูลถูกเก็บในฐานข้อมูล SQLite (single file)
- สามารถ backup ได้ง่ายโดยคัดลอกไฟล์ `palmoil.db`
- รองรับ Multi-user แต่ Performance จะขึ้นกับขนาดของข้อมูล

---

**เวอร์ชัน**: 1.0.0  
**วันที่สร้าง**: 13 กันยายน 2025  
**ระบบปฏิบัติการที่รองรับ**: Windows, macOS, Linux