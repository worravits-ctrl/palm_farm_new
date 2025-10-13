const OfflineSearchEngine = require('./OfflineSearchEngine');
const path = require('path');

// ทดสอบจำลอง API call
async function testAPISimulation() {
    console.log('🧪 จำลอง API Chat การทำงาน');
    console.log('='.repeat(50));
    
    try {
        // ข้อมูลจำลอง request
        const mockRequest = {
            body: { message: 'เก็บเกี่ยวครั้งต่อไปเมื่อไหร่?' },
            user: { userId: 1, email: 'admin@palmoil.com' }
        };
        
        console.log('📨 Request data:');
        console.log('- Message:', mockRequest.body.message);
        console.log('- User ID:', mockRequest.user.userId);
        console.log('- Email:', mockRequest.user.email);
        
        // ทำตาม logic API
        const { message } = mockRequest.body;
        const user_id = mockRequest.user.userId;
        
        console.log('\n🔍 Processing...');
        console.log('- Message after extraction:', message);
        console.log('- User ID after extraction:', user_id);
        
        // ตรวจสอบข้อความ
        if (!message || message.trim() === '') {
            console.log('❌ Message validation failed');
            return;
        }
        
        console.log('✅ Message validation passed');
        
        // เริ่ม search engine
        const dbPath = path.join(__dirname, 'database', 'palmoil.db');
        console.log('- DB Path:', dbPath);
        
        const searchEngine = new OfflineSearchEngine(dbPath);
        console.log('✅ OfflineSearchEngine initialized');
        
        // ทำการค้นหา
        console.log('\n🤖 Calling answerQuestion...');
        const answer = await searchEngine.answerQuestion(message, user_id);
        
        console.log('\n📤 API Response:');
        console.log('Answer:', answer);
        
        // สร้าง response object
        const response = {
            message: answer,
            timestamp: new Date().toISOString()
        };
        
        console.log('\n📦 Final response object:');
        console.log(JSON.stringify(response, null, 2));
        
        // ทดสอบกับคำถามอื่นๆ
        console.log('\n🔄 ทดสอบคำถามเพิ่มเติม:');
        const additionalQuestions = [
            'รายได้เดือนนี้',
            'กำไรสุทธิ',
            'ต้นไหนให้ผลผลิตเยอะที่สุด'
        ];
        
        for (const q of additionalQuestions) {
            console.log(`\nQ: ${q}`);
            const a = await searchEngine.answerQuestion(q, user_id);
            console.log(`A: ${a}`);
        }
        
    } catch (error) {
        console.error('❌ Error in simulation:', error.message);
        console.error('Stack:', error.stack);
    }
}

// รัน test
testAPISimulation().then(() => {
    console.log('\n🏁 Simulation complete');
}).catch(console.error);