const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🔍 Testing Gemini API...');
console.log('API Key exists:', !!GEMINI_API_KEY);
console.log('API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
console.log('API Key starts with:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 10) + '...' : 'undefined');

async function testGemini() {
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
            throw new Error('GEMINI_API_KEY is not configured properly');
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        console.log('🤖 Sending test message to Gemini...');
        const result = await model.generateContent('สวัสดีครับ');
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini API test successful!');
        console.log('📝 Response:', text);
        return true;
    } catch (error) {
        console.error('❌ Gemini API test failed:', error.message);
        if (error.message.includes('API_KEY_INVALID')) {
            console.error('💡 API Key ไม่ถูกต้อง กรุณาตรวจสอบ API key ใน .env file');
        } else if (error.message.includes('PERMISSION_DENIED')) {
            console.error('💡 API Key ไม่มีสิทธิ์ หรือยังไม่ได้เปิดใช้งาน Gemini API');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            console.error('💡 เกิน quota ของ API ให้รอสักครู่แล้วลองใหม่');
        }
        return false;
    }
}

testGemini();