# 🔧 แก้ไขปัญหา 401 Unauthorized - Login ล้มเหลว

## 🐛 ปัญหาที่พบ

### Error Message
```
api/auth/login:1 Failed to load resource: the server responded with a status of 401 (Unauthorized)
Login response status: 401
Login response data: Object
Login error: Error: Invalid email or password
```

### สาเหตุที่เป็นไปได้
1. **URL Mismatch**: Browser ส่งไปยัง endpoint ผิด
2. **CORS Issues**: Cross-origin request blocked
3. **API Server Error**: Server ส่งกลับ 401
4. **Request Format**: ข้อมูลที่ส่งไม่ถูกรูปแบบ

## 🔍 การตรวจสอบและแก้ไข

### 1. เพิ่ม Debug Logs
```javascript
// เพิ่มใน login function
console.log('🔧 API_BASE_URL configured as:', API_BASE_URL);
console.log('🔧 Current hostname:', window.location.hostname);
console.log('🔗 Login URL:', loginUrl);
console.log('📡 Login response URL:', response.url);
console.log('📡 Content-Type:', contentType);
```

### 2. ปรับปรุง Error Handling
```javascript
try {
    const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        return data;
    } else {
        const text = await response.text();
        console.log('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
    }
} catch (error) {
    console.error('🚨 Fetch error:', error);
    throw error;
}
```

### 3. ตรวจสอบ API Server Status
```bash
# ทดสอบ server ยังทำงานอยู่
netstat -an | findstr ":3001"

# ทดสอบ login endpoint โดยตรง
node -e "const http = require('http'); const data = JSON.stringify({email:'admin@palmoil.com',password:'admin'}); const options = {hostname:'localhost',port:3001,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}}; const req = http.request(options, (res) => {let responseData = ''; res.on('data', (chunk) => responseData += chunk); res.on('end', () => console.log('Status:', res.statusCode, 'Data:', responseData.substring(0,100)));}); req.on('error', console.error); req.write(data); req.end();"
```

### 4. ตรวจสอบ CORS Configuration
```javascript
// ใน api-server.js
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl requests, etc.)
        if (!origin) return callback(null, true);
        
        // Allow localhost for development
        if (origin.includes('localhost')) return callback(null, true);
        
        // Allow Railway production domains
        if (origin.includes('.up.railway.app')) return callback(null, true);
        
        // Deny other origins
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};
```

## 🛠️ วิธีแก้ไขปัญหา

### Option 1: ตรวจสอบ Browser Network Tab
```
1. กด F12 เปิด DevTools
2. ไปที่แท็บ Network
3. พิมพ์ข้อมูล Login แล้วกด Submit
4. ดู request ที่ไปยัง /api/auth/login
5. ตรวจสอบ:
   - Request URL
   - Request Headers
   - Request Payload
   - Response Status
   - Response Headers
   - Response Body
```

### Option 2: ใช้ curl ทดสอบ
```bash
# ทดสอบจาก command line
curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@palmoil.com","password":"admin"}' \
     -v
```

### Option 3: ตรวจสอบ Server Logs
```
ดู terminal ที่รัน api-server.js ว่ามี log ออกมาไหม:
- 🔐 Login attempt: ...
- User found: ...
- Password validation result: ...
```

### Option 4: ลองเปลี่ยน API_BASE_URL
```javascript
// ทดสอบ hardcode URL
const API_BASE_URL = 'http://localhost:3001/api';
// หรือ
const API_BASE_URL = 'http://127.0.0.1:3001/api';
```

## 🧪 การทดสอบ

### Test Checklist
- [ ] API Server running (port 3001)
- [ ] Frontend Server running (port 3000)
- [ ] Browser can access both servers
- [ ] No CORS errors in console
- [ ] API returns valid JSON
- [ ] Credentials are correct

### Expected Behavior
1. **Browser sends**: `POST http://localhost:3001/api/auth/login`
2. **Server receives**: Login request with email/password
3. **Server validates**: Check database for user
4. **Server responds**: `200 OK` with JWT token
5. **Browser receives**: JSON with token and user data

### Debug Commands
```javascript
// ใน Browser Console
console.log('API_BASE_URL:', API_BASE_URL);
console.log('Current location:', window.location.href);

// Test API connectivity
fetch('http://localhost:3001/api/status')
  .then(res => res.json())
  .then(data => console.log('API Status:', data))
  .catch(err => console.error('API Error:', err));
```

## 🚨 หากยังแก้ไม่ได้

### ให้ส่งข้อมูลต่อไปนี้:
1. **Console Logs** ทั้งหมดหลังเพิ่ม debug
2. **Network Tab** screenshot ของ failed request
3. **Server Terminal** output หลัง login attempt
4. **Browser Version** และ OS

### Workaround ชั่วคราว
```javascript
// ใน Console ลอง manual fetch
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email:'admin@palmoil.com',password:'admin'})
})
.then(res => res.json())
.then(data => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  location.reload();
})
.catch(console.error);
```

## 🎯 Expected Resolution

หลังจากแก้ไข debug logs จะแสดง:
- ✅ `API_BASE_URL: http://localhost:3001/api`
- ✅ `Login URL: http://localhost:3001/api/auth/login`
- ✅ `Login response status: 200`
- ✅ `Login response data: {token: "...", user: {...}}`

และ login จะสำเร็จ พาไปยังหน้า Dashboard ได้