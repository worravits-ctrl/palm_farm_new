const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ทดสอบฟังก์ชันปุ๋ยโดยตรง
const dbPath = path.join(__dirname, 'database', 'palmoil.db');

async function testFertilizerQuestion() {
    console.log('🌱 ทดสอบคำถามปุ๋ยครั้งล่าสุด');
    console.log('='.repeat(40));
    
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        
        const query = `
            SELECT date, fertilizer_type, amount, total_cost, labor_cost
            FROM fertilizer_data 
            WHERE user_id = ? 
            ORDER BY date DESC 
            LIMIT 1
        `;

        db.get(query, [1], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                resolve("ไม่พบข้อมูลการใส่ปุ๋ยในระบบ");
                return;
            }

            try {
                console.log('📊 Raw data:', JSON.stringify(row, null, 2));
                
                // แปลงวันที่จากฐานข้อมูล (YYYY-MM-DD)
                const fertilizerDate = new Date(row.date);
                
                // แปลงเป็นรูปแบบไทย
                const thaiDate = fertilizerDate.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                });
                
                // คำนวณจำนวนวันที่ผ่านมา
                const today = new Date();
                const diffTime = today - fertilizerDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                let message = `ใส่ปุ๋ยครั้งล่าสุด: วัน${thaiDate}`;
                
                if (diffDays === 0) {
                    message += ` (วันนี้)`;
                } else if (diffDays === 1) {
                    message += ` (เมื่อวาน)`;
                } else {
                    message += ` (${diffDays} วันที่แล้ว)`;
                }
                
                // เพิ่มรายละเอียดปุ๋ย
                message += `\n\nรายละเอียด:`;
                message += `\n• ปุ๋ยที่ใช้: ${row.fertilizer_type}`;
                message += `\n• ปริมาณ: ${row.amount} กระสอบ`;
                message += `\n• ค่าปุ๋ย: ${Number(row.total_cost).toLocaleString()} บาท`;
                
                if (row.labor_cost && row.labor_cost > 0) {
                    message += `\n• ค่าแรงงาน: ${Number(row.labor_cost).toLocaleString()} บาท`;
                    const totalCost = Number(row.total_cost) + Number(row.labor_cost);
                    message += `\n• รวมทั้งหมด: ${totalCost.toLocaleString()} บาท`;
                }
                
                resolve(message);
                
            } catch (error) {
                resolve(`เกิดข้อผิดพลาดในการดึงข้อมูลปุ๋ย: ${error.message}`);
            }
            
            db.close();
        });
    });
}

// รัน test
testFertilizerQuestion().then(result => {
    console.log('\n✅ ผลลัพธ์:');
    console.log(result);
    console.log('\n🎯 คำตอบนี้ควรจะแสดงผ่าน API');
}).catch(error => {
    console.error('❌ Error:', error);
});