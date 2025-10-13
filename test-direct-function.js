const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ทดสอบ OfflineSearchEngine โดยตรงใน API server
const dbPath = path.join(__dirname, 'database', 'palmoil.db');

// Copy ฟังก์ชัน getNextHarvestDate มาทดสอบโดยตรง
async function getNextHarvestDate(userId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        
        const query = `
            SELECT date as last_harvest_date 
            FROM harvest_data 
            WHERE user_id = ? 
            ORDER BY date DESC 
            LIMIT 1
        `;

        db.get(query, [userId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                resolve("ไม่พบข้อมูลการเก็บเกี่ยวก่อนหน้า แนะนำให้เก็บเกี่ยวเมื่อผลปาล์มสุก (ประมาณทุก 15-20 วัน)");
                return;
            }

            try {
                // แปลงวันที่จากฐานข้อมูล (YYYY-MM-DD)
                const lastHarvestDate = new Date(row.last_harvest_date);
                
                // บวก 15 วัน
                const nextHarvestDate = new Date(lastHarvestDate);
                nextHarvestDate.setDate(lastHarvestDate.getDate() + 15);
                
                // แปลงเป็นรูปแบบไทย
                const thaiDate = nextHarvestDate.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                });
                
                // คำนวณจำนวนวันที่เหลือ
                const today = new Date();
                const diffTime = nextHarvestDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let message = `เก็บเกี่ยวครั้งต่อไป: วัน${thaiDate}`;
                
                if (diffDays > 0) {
                    message += ` (อีก ${diffDays} วัน)`;
                } else if (diffDays === 0) {
                    message += ` (วันนี้!)`;
                } else {
                    message += ` (เลยกำหนดแล้ว ${Math.abs(diffDays)} วัน)`;
                }
                
                // เพิ่มข้อมูลการเก็บเกี่ยวล่าสุด
                const lastHarvestThai = lastHarvestDate.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric'
                });
                message += `\n\nเก็บเกี่ยวครั้งล่าสุด: ${lastHarvestThai}`;
                
                resolve(message);
                
            } catch (error) {
                resolve(`เกิดข้อผิดพลาดในการคำนวณวันที่: ${error.message}`);
            }
            
            db.close();
        });
    });
}

// ทดสอบฟังก์ชัน
async function testDirectFunction() {
    console.log('🧪 ทดสอบฟังก์ชันโดยตรง');
    
    try {
        const result = await getNextHarvestDate(1);
        console.log('✅ Result:', result);
        return result;
    } catch (error) {
        console.error('❌ Error:', error);
        return 'เกิดข้อผิดพลาด';
    }
}

// รัน test
testDirectFunction().then(result => {
    console.log('\n🎯 Final Answer:', result);
    console.log('\nนี่คือคำตอบที่ถูกต้อง ให้เอาไปใช้ใน API');
}).catch(console.error);