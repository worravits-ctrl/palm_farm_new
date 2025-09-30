const OfflineSearchEngine = require('./OfflineSearchEngine');
const path = require('path');

// ทดสอบคำนวณวันเก็บเกี่ยวครั้งต่อไป
async function testNextHarvest() {
    const dbPath = path.join(__dirname, 'database', 'palmoil.db');
    const searchEngine = new OfflineSearchEngine(dbPath);
    
    try {
        console.log('🧪 ทดสอบการคำนวณวันเก็บเกี่ยวครั้งต่อไป');
        console.log('='.repeat(50));
        
        // ทดสอบกับ user_id = 1 (admin)
        console.log('\n📅 ทดสอบกับผู้ใช้ ID: 1');
        const result1 = await searchEngine.answerQuestion('เก็บเกี่ยวครั้งต่อไปเมื่อไหร่?', 1);
        console.log(result1);
        
        console.log('\n📅 ทดสอบคำถามรูปแบบอื่น:');
        
        const questions = [
            'เก็บเกี่ยวครั้งต่อไปเมื่อไร',
            'ครั้งต่อไปเก็บเกี่ยวเมื่อไหร่',
            'เมื่อไหร่จะเก็บเกี่ยวอีกครั้ง',
            'การเก็บเกี่ยวต่อไปวันไหน'
        ];
        
        for (const question of questions) {
            console.log(`\nQ: ${question}`);
            const answer = await searchEngine.answerQuestion(question, 1);
            console.log(`A: ${answer}`);
        }
        
        console.log('\n✅ ทดสอบเสร็จสิ้น');
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    }
}

// รัน test
testNextHarvest().then(() => {
    console.log('\nกด Ctrl+C เพื่อออกจากโปรแกรม');
}).catch(console.error);