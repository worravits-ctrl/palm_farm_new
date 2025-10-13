const axios = require('axios');

// ใช้ JWT token ของ admin
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDk0NDMyMDB9.3ox5T1Rg9wJC8VNWRfa_PSynBV0Fg6BBCrp8nTeH-C4';

const API_URL = 'http://localhost:3001';

// ทดสอบคำถามต่างๆ
const testQuestions = [
    'สวัสดีครับ',
    'วันนี้วันที่เท่าไหร่',
    'เก็บเกี่ยวครั้งต่อไปเมื่อไหร่',
    'รายได้ทั้งหมดเท่าไหร่',
    'ต้นไหนให้ผลเยอะที่สุด',
    'A14 ตัดไปแล้วเท่าไหร่',
    'ใส่ปุ๋ยครั้งล่าสุดเมื่อไหร่',
    'สรุปข้อมูลเดือนนี้',
    'คุณคือใครครับ',
    'การเกษตรสำคัญอย่างไร'
];

async function testOfflineChat() {
    console.log('🧪 ทดสอบระบบ Offline Chat\n');

    for (const [index, question] of testQuestions.entries()) {
        try {
            console.log(`${index + 1}. คำถาม: "${question}"`);
            
            const response = await axios.post(`${API_URL}/api/chat`, {
                message: question,
                context: {
                    currentDate: new Date().toLocaleDateString('th-TH'),
                    currentDateISO: new Date().toISOString().split('T')[0],
                    currentYear: new Date().getFullYear(),
                    buddhistYear: new Date().getFullYear() + 543,
                    currentMonth: new Date().getMonth() + 1,
                    userName: 'admin'
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${JWT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`   ✅ คำตอบ: "${response.data.message}"`);
            console.log('');
            
            // รอ 1 วินาทีระหว่างคำถาม
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.log(`   ❌ ข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
            console.log('');
        }
    }
}

// รัน test
testOfflineChat().then(() => {
    console.log('🎉 ทดสอบเสร็จสิ้น');
    process.exit(0);
}).catch((error) => {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error);
    process.exit(1);
});