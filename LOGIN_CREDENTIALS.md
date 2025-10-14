# 🔐 ข้อมูล Login สำหรับระบบจัดการธุรกิจน้ำมันปาล์ม

## 🌐 **URL เข้าใช้งาน:**
**https://api-server-production-4ba0.up.railway.app**

---

## 👥 **บัญชีผู้ใช้ที่มีอยู่:**

### 🔑 **ADMIN ACCOUNTS (สิทธิ์เต็ม):**

#### 1. Admin หลัก
- **Email**: `admin@palmoil.com`
- **Username**: `admin`
- **Role**: Admin
- **หมายเหตุ**: บัญชี admin เริ่มต้น

#### 2. Dear (Admin)
- **Email**: `worravit38@hotmail.com`
- **Username**: `dear`
- **Role**: Admin
- **หมายเหตุ**: Admin account ที่สร้างเพิ่ม

### 👤 **USER ACCOUNTS (สิทธิ์ผู้ใช้ทั่วไป):**

#### 3. Wave
- **Email**: `worravits@gmail.com`
- **Username**: `wave`
- **Role**: User
- **หมายเหตุ**: User account ปกติ

#### 4. Test User
- **Email**: `testuser@palmoil.com`
- **Username**: `Test User`
- **Role**: User
- **หมายเหตุ**: บัญชีทดสอบ

---

## ⚠️ **ปัญหารหัสผ่าน:**

### 🔍 **สถานการณ์:**
- รหัสผ่านทั้งหมดถูก hash ด้วย bcrypt (ความปลอดภัยสูง)
- ไม่สามารถดูรหัสผ่านจริงได้จากฐานข้อมูล
- Database บน Railway แยกจาก local database

### 💡 **วิธีแก้ไข:**

#### **วิธีที่ 1: สร้างบัญชีใหม่** (แนะนำ)
1. เข้า: https://api-server-production-4ba0.up.railway.app
2. คลิก "สมัครสมาชิก" หรือ "Register"
3. สร้างบัญชีใหม่ด้วยข้อมูลของคุณ

#### **วิธีที่ 2: ใช้ API สร้างบัญชี**
```bash
curl -X POST https://api-server-production-4ba0.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "email": "your_email@example.com", 
    "password": "your_password"
  }'
```

#### **วิธีที่ 3: Reset รหัสผ่าน (ต้องเข้าถึง Railway dashboard)**
1. เข้า Railway dashboard
2. เชื่อมต่อ PostgreSQL database 
3. รัน SQL command เพื่อ reset password

---

## 🚀 **การใช้งานที่แนะนำ:**

### **สำหรับผู้ดูแลระบบ:**
1. **สร้างบัญชี Admin ใหม่:**
   - Username: `admin_new`
   - Email: `admin@yourdomain.com`
   - Password: `YourSecurePassword123`

### **สำหรับเกษตรกร:**
1. **สร้างบัญชีเกษตรกรใหม่:**
   - Username: `farmer_name`
   - Email: `farmer@email.com`
   - Password: `FarmerPassword123`

---

## 🔧 **Features ที่ใช้งานได้:**

### **ทุก User:**
- ✅ ดู Dashboard
- ✅ บันทึกการเก็บเกี่ยว
- ✅ จัดการข้อมูลปุ๋ย
- ✅ ติดตามต้นปาล์ม
- ✅ เขียนบันทึก
- ✅ ดูรายงานและกราฟ
- ✅ Export ข้อมูล CSV

### **Admin เท่านั้น:**
- ✅ จัดการผู้ใช้ทั้งหมด
- ✅ ดูข้อมูลของทุกคน
- ✅ ลบ/แก้ไขข้อมูลใดๆ
- ✅ ตั้งค่าระบบ

---

## 📊 **ข้อมูลที่มีอยู่ในระบบ:**

- **👥 Users**: 4 คน
- **🌾 การเก็บเกี่ยว**: 89 รายการ 
- **🌱 การใส่ปุ๋ย**: 16 รายการ
- **🌴 ข้อมูลต้นปาล์ม**: 1,411 รายการ
- **📝 บันทึก**: 6 รายการ
- **💰 รายได้รวม**: 685,606.55 บาท
- **📈 กำไรสุทธิ**: 534,209.55 บาท

---

## 🎯 **Quick Start:**

### **ขั้นตอนง่าย ๆ เพื่อเริ่มใช้งาน:**

1. **เปิดเว็บ**: https://api-server-production-4ba0.up.railway.app
2. **สมัครสมาชิก**: คลิกปุ่ม "สมัครสมาชิก"
3. **Login**: ใช้ email/password ที่สร้าง
4. **เริ่มใช้งาน**: บันทึกข้อมูลการเก็บเกี่ยว

### **หรือใช้บัญชีที่มีอยู่ (ถ้าจำรหัสผ่านได้):**
- ลองรหัสผ่าน: `123456`, `password`, `admin123`
- หรือติดต่อผู้ดูแลระบบเพื่อ reset password

---

## 🌴 **สำเร็จแล้ว!**

ระบบจัดการธุรกิจน้ำมันปาล์มพร้อมใช้งานบน cloud!

**Live Demo**: https://api-server-production-4ba0.up.railway.app 🚀