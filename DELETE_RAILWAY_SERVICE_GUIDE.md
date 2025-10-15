# 🗑️ **วิธีลบ Railway Service: api-server-production-4ba0**

## 🎯 **เป้าหมาย:** 
ลบ `https://api-server-production-4ba0.up.railway.app/` ให้เหลือแค่ `https://palmfarmnew-production.up.railway.app/`

---

## 📋 **ข้อมูล Backup เรียบร้อย:**
✅ **Users Backup**: `users_backup_api-server.json` (3 คน)

```
👤 admin@palmoil.com      (admin)
👤 worravit38@hotmail.com (admin)  
👤 worravits@gmail.com    (user)
```

---

## 🚨 **ขั้นตอนการลบ Railway Service:**

### **Step 1: เข้า Railway Dashboard**
1. เปิด: https://railway.app/dashboard
2. Login ด้วย GitHub account
3. หา Project ที่มี Service ทั้งสอง

### **Step 2: ระบุ Service ที่จะลบ**
**🔍 หา Service นี้:**
- **ชื่อ**: `api-server-production-4ba0` หรือคล้าย ๆ กัน
- **URL**: `api-server-production-4ba0.up.railway.app`
- **ลักษณะ**: ไม่ใช่ `palmfarmnew-production`

### **Step 3: เข้าสู่การตั้งค่า**
1. **คลิก** service `api-server-production-4ba0`
2. **คลิก** ⚙️ **Settings** (ด้านซ้ายหรือด้านบน)
3. **Scroll ลง** ไปยัง **Danger Zone**

### **Step 4: ลบ Service**
1. **หา** 🔴 **Delete Service** button
2. **คลิก** Delete Service
3. **ยืนยัน** โดยพิมพ์ชื่อ service (ถ้าถูกถาม)
4. **คลิก** Delete/Confirm

---

## ⚠️ **คำเตือน:**
- ❌ **อย่า** ลบ `palmfarmnew-production` (ใช้ต่อ)
- ✅ **ลบเฉพาะ** `api-server-production-4ba0`
- 🔒 การลบจะไม่สามารถ **กู้คืน** ได้

---

## 🎯 **Result หลังลบ:**

### **✅ URL ที่เหลือ (ใช้ต่อ):**
```
🏠 Main: https://palmfarmnew-production.up.railway.app/app
🗄️ DB:   https://palmfarmnew-production.up.railway.app/db-viewer  
🔧 API:  https://palmfarmnew-production.up.railway.app/api/health
```

### **❌ URL ที่หายไป (ลบแล้ว):**
```
🚫 https://api-server-production-4ba0.up.railway.app/ (ลบแล้ว)
```

### **💰 ประหยัด:**
- จาก: **$10/month** (2 services)
- เป็น: **$5/month** (1 service)
- ประหยัด: **50%**

---

## 🔍 **วิธีตรวจสอบว่าลบสำเร็จ:**

### **1. ทดสอบ URL ที่ลบ:**
```powershell
# ควรได้ Error หรือไม่พบ
Invoke-RestMethod "https://api-server-production-4ba0.up.railway.app/api/health"
```

### **2. ทดสอบ URL ที่เหลือ:**
```powershell  
# ควรทำงานปกติ
Invoke-RestMethod "https://palmfarmnew-production.up.railway.app/api/health"
```

### **3. ตรวจ Railway Dashboard:**
- ควรเหลือ service เดียว: `palmfarmnew-production`
- ไม่มี `api-server-production-4ba0`

---

## 🎉 **เสร็จสิ้น!**

หลังลบเรียบร้อย:
1. ✅ **Bookmark** URL ใหม่: `palmfarmnew-production.up.railway.app`
2. ✅ **แจ้งทีม** ใช้ URL เดียว
3. ✅ **ตรวจสอบ** การทำงานปกติ
4. ✅ **ประหยัดเงิน** 50%