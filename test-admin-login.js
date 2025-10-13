const http = require('http');

// ทดสอบ admin login และตรวจสอบข้อมูล
async function testAdminLogin() {
    console.log('🧪 Testing Admin Login Process...\n');

    // 1. ทดสอบ Login
    const loginData = JSON.stringify({
        email: 'admin@palmoil.com',
        password: 'admin'
    });

    const loginOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };

    return new Promise((resolve, reject) => {
        console.log('1️⃣ Testing login...');
        
        const req = http.request(loginOptions, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const loginResult = JSON.parse(responseData);
                    
                    if (res.statusCode === 200) {
                        console.log('✅ Login Success!');
                        console.log('   User ID:', loginResult.user.id);
                        console.log('   Email:', loginResult.user.email);
                        console.log('   Role:', loginResult.user.role);
                        console.log('   Username:', loginResult.user.username);
                        console.log('   Token length:', loginResult.token.length);
                        
                        // 2. ทดสอบ Users API
                        testUsersAPI(loginResult.token, loginResult.user);
                    } else {
                        console.log('❌ Login Failed:', responseData);
                        reject(new Error('Login failed'));
                    }
                } catch (e) {
                    console.log('❌ JSON Parse Error:', e.message);
                    console.log('Raw response:', responseData);
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            reject(error);
        });

        req.write(loginData);
        req.end();
    });
}

function testUsersAPI(token, user) {
    console.log('\n2️⃣ Testing Users API...');
    
    const usersOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/users',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(usersOptions, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            console.log('   Status Code:', res.statusCode);
            
            if (res.statusCode === 200) {
                try {
                    const users = JSON.parse(responseData);
                    console.log('✅ Users API Success!');
                    console.log('   Total Users:', users.length);
                    console.log('   Admin Users:', users.filter(u => u.role === 'admin').length);
                    console.log('   Regular Users:', users.filter(u => u.role === 'user').length);
                    
                    // 3. แสดงข้อมูล Frontend simulation
                    simulateFrontendLogic(user, users);
                } catch (e) {
                    console.log('❌ JSON Parse Error:', e.message);
                }
            } else {
                console.log('❌ Users API Failed:', responseData);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Users API Request Error:', error.message);
    });

    req.end();
}

function simulateFrontendLogic(currentUser, users) {
    console.log('\n3️⃣ Frontend Logic Simulation...');
    
    // จำลอง logic ในหน้าเว็บ
    const isAdmin = currentUser?.role === 'admin';
    console.log('   currentUser?.role === "admin":', isAdmin);
    
    // จำลองการสร้าง tabs
    const baseTabs = [
        {key: 'dashboard', label: 'แดชบอร์ด'}, 
        {key: 'harvest', label: 'การเก็บเกี่ยว'}, 
        {key: 'fertilizer', label: 'ปุ๋ย'}, 
        {key: 'palmtrees', label: 'ต้นปาล์ม'}, 
        {key: 'notes', label: 'บันทึก'}, 
        {key: 'search', label: 'ค้นหาข้อมูล'}, 
        {key: 'reports', label: 'รายงาน'}
    ];
    
    const adminTabs = isAdmin ? [{key: 'users', label: 'จัดการสมาชิก'}] : [];
    const allTabs = [...baseTabs, ...adminTabs];
    
    console.log('   Available tabs:');
    allTabs.forEach(tab => {
        console.log(`     - ${tab.key}: ${tab.label}`);
    });
    
    console.log('\n4️⃣ Summary:');
    console.log('   ✅ API Login:', 'Working');
    console.log('   ✅ User Role:', currentUser.role);
    console.log('   ✅ Admin Access:', isAdmin ? 'Granted' : 'Denied');
    console.log('   ✅ Users Tab:', isAdmin ? 'Should Show' : 'Hidden');
    console.log('   ✅ Users API:', 'Working');
    
    if (isAdmin) {
        console.log('\n🎉 Admin login should work properly!');
        console.log('💡 If tabs are not showing:');
        console.log('   - Check browser console for errors');
        console.log('   - Clear localStorage and login again');
        console.log('   - Check if currentUser state is set correctly');
    } else {
        console.log('\n❌ User is not admin!');
    }
}

// รัน test
testAdminLogin().catch(console.error);