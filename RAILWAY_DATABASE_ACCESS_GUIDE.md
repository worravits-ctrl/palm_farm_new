# 🗄️ วิธีดูฐานข้อมูลใน Railway Hobby Plan

## 📋 **ตัวเลือกการเข้าถึงฐานข้อมูล Railway:**

---

## 🌐 **วิธีที่ 1: ใช้ Web Database Viewer (ง่ายที่สุด)**

### **1.1 เข้าถึงผ่าน Web Interface:**
```
URL: https://api-server-production-4ba0.up.railway.app/db-viewer.html
Login: admin@palmoil.com / admin
```

### **1.2 ฟีเจอร์ที่ใช้งานได้:**
- 📊 **ดูตารางทั้งหมด** พร้อมจำนวนข้อมูล
- 📋 **ดูข้อมูลแต่ละตาราง** (50-500 รายการ)
- 🔍 **ดูโครงสร้างตาราง** (Schema)
- 📤 **Export ข้อมูล** เป็น JSON
- 🔒 **Admin เท่านั้น** ที่เข้าได้

---

## 🔧 **วิธีที่ 2: ใช้ Railway CLI (สำหรับ Advanced Users)**

### **2.1 ติดตั้ง Railway CLI:**
```bash
# Windows (PowerShell)
iwr "https://railway.app/install.ps1" | iex

# macOS/Linux
curl -fsSL "https://railway.app/install.sh" | sh

# หรือใช้ npm
npm install -g @railway/cli
```

### **2.2 Login และเชื่อมต่อ:**
```bash
# Login เข้า Railway
railway login

# Link กับ project
railway link

# หรือ link ด้วย project ID
railway link [project-id]
```

### **2.3 เข้าถึงฐานข้อมูล:**
```bash
# เข้า shell ของ service
railway shell

# เมื่อเข้า shell แล้ว ใช้คำสั่ง SQLite
sqlite3 database/palmoil.db

# ดูตารางทั้งหมด
.tables

# ดูโครงสร้างตาราง
.schema users

# Query ข้อมูล
SELECT * FROM users;
SELECT * FROM harvest_data LIMIT 5;
SELECT * FROM fertilizer_data LIMIT 5;

# ออกจาก SQLite
.quit

# ออกจาก Railway shell
exit
```

---

## 🛠️ **วิธีที่ 3: ใช้ API Endpoints โดยตรง**

### **3.1 ดึงข้อมูลผู้ใช้:**
```powershell
# Login และเก็บ token
$response = Invoke-RestMethod -Uri "https://api-server-production-4ba0.up.railway.app/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email": "admin@palmoil.com", "password": "admin"}'
$token = $response.token

# ดูข้อมูลผู้ใช้ทั้งหมด
$users = Invoke-RestMethod -Uri "https://api-server-production-4ba0.up.railway.app/api/users" -Method GET -Headers @{"Authorization"="Bearer $token"}
$users | Format-Table -Property id, username, email, role
```

### **3.2 ดึงข้อมูลแต่ละตาราง:**
```powershell
# ข้อมูลการเก็บเกี่ยว
$harvest = Invoke-RestMethod -Uri "https://api-server-production-4ba0.up.railway.app/api/harvest" -Method GET -Headers @{"Authorization"="Bearer $token"}
$harvest | Format-Table -Property id, date, total_weight, price_per_kg, net_profit

# ข้อมูลปุ๋ย
$fertilizer = Invoke-RestMethod -Uri "https://api-server-production-4ba0.up.railway.app/api/fertilizer" -Method GET -Headers @{"Authorization"="Bearer $token"}
$fertilizer | Format-Table -Property id, date, fertilizer_type, amount, total_cost

# ข้อมูลต้นปาล์ม
$palmtrees = Invoke-RestMethod -Uri "https://api-server-production-4ba0.up.railway.app/api/palmtrees" -Method GET -Headers @{"Authorization"="Bearer $token"}
$palmtrees | Format-Table -Property id, tree_id, harvest_date, bunch_count

# บันทึก
$notes = Invoke-RestMethod -Uri "https://api-server-production-4ba0.up.railway.app/api/notes" -Method GET -Headers @{"Authorization"="Bearer $token"}
$notes | Format-Table -Property id, date, title, content
```

---

## 📊 **ข้อมูลปัจจุบันในฐานข้อมูล Railway:**

### **🗂️ ตารางที่มีข้อมูล:**

#### 1. **👥 users** (4 รายการ)
- admin@palmoil.com (Admin หลัก)
- worravit38@hotmail.com (Dear - Admin)
- worravits@gmail.com (Wave - User)  
- testuser@palmoil.com (Test User)

#### 2. **🌾 harvest_data** (6+ รายการ)
- ข้อมูลการเก็บเกี่ยว วันที่ 2025-09-09 ถึง 2025-10-14
- น้ำหนักรวม, ราคา, ต้นทุน, กำไร

#### 3. **🌱 fertilizer_data** (4+ รายการ)
- ปุ๋ยเคมี 15-15-15, ปุ๋ยอินทรีย์, ปุ๋ยยูเรีย
- จำนวนกระสอบ, ราคา, ต้นทุนรวม

#### 4. **🌴 palm_tree_data** (9+ รายการ)  
- รหัสต้น A1-D2
- วันที่เก็บเกี่ยว, จำนวนทะลาย

#### 5. **📝 notes_data** (12+ รายการ)
- บันทึกการเก็บเกี่ยว, ปุ๋ย, ต้นไม้, สภาพอากาศ

---

## 🎯 **วิธีที่แนะนำสำหรับ Hobby Plan:**

### **🥇 อันดับ 1: Web Database Viewer**
- ✅ **ใช้งานง่าย** - แค่เปิดเบราว์เซอร์
- ✅ **ไม่ต้องติดตั้งอะไร** - ใช้งานได้ทันที
- ✅ **GUI แบบสวยงาม** - ดูข้อมูลง่าย
- ✅ **Export ได้** - บันทึกข้อมูลเป็นไฟล์

### **🥈 อันดับ 2: API Endpoints**
- ✅ **ยืดหยุ่น** - เขียน script ได้
- ✅ **Real-time** - ข้อมูลล่าสุดเสมอ
- ⚠️ **ต้องมีความรู้** API calls

### **🥉 อันดับ 3: Railway CLI**
- ✅ **ควบคุมได้เต็มที่** - SQL commands ทั้งหมด
- ⚠️ **ต้องติดตั้ง CLI** - ซับซ้อนกว่า
- ⚠️ **ต้องมีความรู้ SQL**

---

## 🚀 **Quick Start - เริ่มใช้งานเลย:**

### **ขั้นตอนง่าย ๆ:**
1. **เปิดเบราว์เซอร์** ไปที่: https://api-server-production-4ba0.up.railway.app/db-viewer.html
2. **Login** ด้วย: admin@palmoil.com / admin
3. **คลิก "🔄 Refresh"** เพื่อดูตารางทั้งหมด
4. **คลิกตารางที่สนใจ** เพื่อดูข้อมูล
5. **คลิก "📤 Export JSON"** เพื่อบันทึกข้อมูล

---

## 🔐 **ข้อจำกัดและความปลอดภัย:**

### **Hobby Plan Limitations:**
- ⚠️ **ไม่มี PostgreSQL** - ใช้ SQLite แทน
- ⚠️ **ไม่มี persistent storage** - ข้อมูลอาจหายเมื่อ redeploy
- ⚠️ **Resource จำกัด** - CPU/Memory/Storage

### **การป้องกัน:**
- 🔒 **Admin เท่านั้น** - ต้อง JWT token
- 🔍 **Read-only** - ไม่สามารถแก้ไขข้อมูลได้
- 🛡️ **SQL Injection Protected** - Validate input ทั้งหมด

---

## 📱 **Mobile/Tablet Support:**

Database Viewer รองรับทุกอุปกรณ์:
- 💻 **Desktop** - ใช้งานเต็มรูปแบบ
- 📱 **Mobile** - Responsive design
- 🖥️ **Tablet** - ขนาดหน้าจอพอเหมาะ

---

## 🎉 **สำเร็จ!**

**ตอนนี้คุณสามารถดูฐานข้อมูลใน Railway Hobby Plan ได้แล้ว!**

**🌐 เข้าใช้งาน: https://api-server-production-4ba0.up.railway.app/db-viewer.html**