# 🔐 ข้อมูล Login สำหรับระบบจัดการธุรกิจน้ำมันปาล์ม

## 🌐 **URL เข้าใช้งาน:**
**https://api-server-production-4ba0.up.railway.app**

---

## ✅ **บัญชีที่ใช้งานได้:**

### 🔑 **WORKING ADMIN ACCOUNT:**

#### Admin ใหม่ (ใช้งานได้)
- **Email**: `admin.new@palmoil.com`  
- **Password**: `admin123`
- **Role**: Admin
- **สถานะ**: ✅ ใช้งานได้

### 👤 **USER ACCOUNTS ที่สร้างใหม่:**

#### Test User
- **Email**: `test@test.com`
- **Password**: `test123`
- **Role**: User
- **สถานะ**: ✅ ใช้งานได้

#### DB Test User
- **Email**: `dbtest@test.com`
- **Password**: `test123` 
- **Role**: User
- **สถานะ**: ✅ ใช้งานได้

---

## ⚠️ **ปัญหาที่พบ:**

### 🗄️ **Database Schema ไม่สมบูรณ์:**
- ✅ ระบบ User authentication ทำงานได้
- ✅ ระบบ Notes ทำงานได้  
- ❌ ระบบ Harvest data ไม่ทำงาน (Database error)
- ❌ ระบบ Fertilizer data ไม่ทำงาน (Database error)  
- ❌ ระบบ Palm trees ไม่ทำงาน (Database error)

### 🔍 **สาเหตุ:**
Database schema บน Railway ไม่ได้ถูกสร้างครบถ้วน เฉพาะตาราง `users` และ `notes_data` เท่านั้นที่ทำงาน

---

## 💡 **วิธีแก้ไขเร่งด่วน:**

### **วิธีที่ 1: สร้างบัญชีใหม่** (แนะนำ)
1. **เปิดเว็บ**: https://api-server-production-4ba0.up.railway.app
2. **คลิก "สมัครสมาชิก"**
3. **สร้างบัญชีใหม่** ด้วยข้อมูลของคุณ
4. **เข้าใช้งาน** ระบบ Notes ได้ปกติ

### **วิธีที่ 2: ใช้บัญชีที่มีอยู่**
- **Email**: `admin.new@palmoil.com`
- **Password**: `admin123`

---

## 🚧 **ฟีเจอร์ที่ใช้งานได้:**

### ✅ **ส่วนที่ทำงาน:**
- 🔑 **Login/Register**: สร้างบัญชีและเข้าสู่ระบบ
- 📝 **Notes Management**: เขียนบันทึก ดูบันทึก แก้ไข ลบ
- 👥 **User Management**: จัดการผู้ใช้ (สำหรับ Admin)
- 🏠 **Dashboard**: หน้าแรกแสดงสถิติพื้นฐาน

### ❌ **ส่วนที่ยังไม่ทำงาน:**
- 🌾 **Harvest Data**: การเก็บเกี่ยว
- 🌱 **Fertilizer Data**: ข้อมูลปุ๋ย  
- 🌴 **Palm Tree Data**: ข้อมูลต้นปาล์ม
- 📊 **Reports**: รายงานและกราฟ

---

## 🛠️ **วิธีแก้ไขถาวร:**

### **สำหรับ Developer:**

1. **ตรวจสอบ Railway Logs:**
```bash
railway logs --tail
```

2. **เข้า Railway Shell:**
```bash  
railway shell
ls -la database/
sqlite3 database/palmoil.db ".tables"
```

3. **รัน Schema Script:**
```bash
sqlite3 database/palmoil.db < database/schema.sql
```

4. **หรือ Redeploy ด้วย Database Init:**
```bash
git add . && git commit -m "Fix database schema"
git push railway main
```

---

## 🎯 **Quick Start - วิธีใช้งานเร่งด่วน:**

### **ขั้นตอนง่าย ๆ:**

1. **เปิดเว็บ**: https://api-server-production-4ba0.up.railway.app
2. **Login ด้วย**: admin.new@palmoil.com / admin123  
3. **ไปที่ Notes**: ใช้งานระบบบันทึกได้ปกติ
4. **รอการแก้ไข**: ระบบอื่นๆ จะพร้อมใช้หลังแก้ Database

---

## 📊 **สถานะปัจจุบัน:**

- 🌐 **Web App**: ✅ Online และใช้งานได้
- 🗄️ **Database**: ⚠️ Schema ไม่สมบูรณ์  
- 🔐 **Authentication**: ✅ ทำงานปกติ
- 📝 **Notes System**: ✅ ใช้งานได้เต็มที่
- 📊 **Main Features**: ❌ รอแก้ไข Database

---

## 🌴 **สำเร็จบางส่วน!**

ระบบจัดการธุรกิจน้ำมันปาล์มอยู่บน Railway แล้ว
เข้าใช้งานส่วน **Notes** ได้เต็มที่!

**Demo**: https://api-server-production-4ba0.up.railway.app 🚀