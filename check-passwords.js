#!/usr/bin/env node

/**
 * 🔐 ตรวจสอบข้อมูล Users และ Password
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

console.log('🔐 ข้อมูล Users และรหัสผ่านในระบบ');
console.log('='.repeat(50));

// ดู users ทั้งหมด
db.all("SELECT id, username, email, password, role, created_at FROM users", (err, users) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('\n👥 รายการผู้ใช้ทั้งหมด:');
    console.log('-'.repeat(30));
    
    users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.created_at}`);
        console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
        
        // ทดสอบรหัสผ่านที่เป็นไปได้
        const possiblePasswords = [
            'admin123',
            'password123',
            '123456',
            'admin',
            user.username + '123',
            user.username
        ];
        
        console.log(`   Possible passwords:`);
        possiblePasswords.forEach(pwd => {
            try {
                const isMatch = bcrypt.compareSync(pwd, user.password);
                if (isMatch) {
                    console.log(`   ✅ PASSWORD FOUND: "${pwd}"`);
                }
            } catch (e) {
                // ถ้าไม่ใช่ hashed password อาจเป็น plain text
                if (user.password === pwd) {
                    console.log(`   ✅ PLAIN TEXT PASSWORD: "${pwd}"`);
                }
            }
        });
    });
    
    console.log('\n🔑 วิธีการ Login:');
    console.log('-'.repeat(20));
    console.log('URL: https://api-server-production-4ba0.up.railway.app');
    console.log('\n📧 Email และรหัสผ่านที่พบ:');
    
    db.close();
});