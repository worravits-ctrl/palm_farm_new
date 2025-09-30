// สคริปต์อัปเดต keyword ใหม่ในหน้า palm-oil-database-app.html

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'palm-oil-database-app.html');

// อ่านไฟล์
let content = fs.readFileSync(filePath, 'utf-8');

console.log('🔧 อัปเดต keyword ตัวอย่างใหม่...');

// แทนที่ปุ่มตัวอย่างคำถาม
const oldButtonsPattern = /(<div className="space-y-1 text-sm text-gray-600">)([\s\S]*?)(<\/div>)/;

const newButtons = `
                              <button 
                                onClick={() => setGeminiInput('รายได้เดือนนี้เท่าไหร่?')}
                                className="block w-full text-left hover:text-green-600 hover:bg-white p-1 rounded"
                              >
                                💰 รายได้เดือนนี้เท่าไหร่?
                              </button>
                              <button 
                                onClick={() => setGeminiInput('รายได้เดือนที่แล้วเท่าไหร่?')}
                                className="block w-full text-left hover:text-green-600 hover:bg-white p-1 rounded"
                              >
                                💸 รายได้เดือนที่แล้วเท่าไหร่?
                              </button>
                              <button 
                                onClick={() => setGeminiInput('น้ำหนักรวมเดือนนี้เท่าไหร่')}
                                className="block w-full text-left hover:text-green-600 hover:bg-white p-1 rounded"
                              >
                                ⚖️ น้ำหนักรวมเดือนนี้เท่าไหร่
                              </button>
                              <button 
                                onClick={() => setGeminiInput('น้ำหนักรวมเดือนที่แล้วเท่าไหร่')}
                                className="block w-full text-left hover:text-green-600 hover:bg-white p-1 rounded"
                              >
                                📊 น้ำหนักรวมเดือนที่แล้วเท่าไหร่
                              </button>
                              <button 
                                onClick={() => setGeminiInput('ราคาเฉลี่ยต่อกิโลกรัมเดือนนี้เท่าไหร่')}
                                className="block w-full text-left hover:text-green-600 hover:bg-white p-1 rounded"
                              >
                                💲 ราคาเฉลี่ยต่อกิโลกรัมเดือนนี้เท่าไหร่
                              </button>
                              <button 
                                onClick={() => setGeminiInput('ราคาเฉลี่ยต่อกิโลกรัมเดือนที่แล้วเท่าไหร่')}
                                className="block w-full text-left hover:text-green-600 hover:bg-white p-1 rounded"
                              >
                                📈 ราคาเฉลี่ยต่อกิโลกรัมเดือนที่แล้วเท่าไหร่
                              </button>
                            `;

// ค้นหาและแทนที่
const buttonsSectionStart = content.indexOf('<div className="space-y-1 text-sm text-gray-600">');
const buttonsSectionEnd = content.indexOf('</div>', buttonsSectionStart) + 6;

if (buttonsSectionStart !== -1 && buttonsSectionEnd !== -1) {
    const before = content.substring(0, buttonsSectionStart);
    const after = content.substring(buttonsSectionEnd);
    
    content = before + '<div className="space-y-1 text-sm text-gray-600">' + newButtons + '</div>' + after;
    
    // เขียนไฟล์ใหม่
    fs.writeFileSync(filePath, content, 'utf-8');
    
    console.log('✅ อัปเดตปุ่มตัวอย่างคำถามเสร็จแล้ว');
    console.log('📝 keyword ใหม่:');
    console.log('  💰 รายได้เดือนนี้เท่าไหร่?');
    console.log('  💸 รายได้เดือนที่แล้วเท่าไหร่?');
    console.log('  ⚖️ น้ำหนักรวมเดือนนี้เท่าไหร่');
    console.log('  📊 น้ำหนักรวมเดือนที่แล้วเท่าไหร่');
    console.log('  💲 ราคาเฉลี่ยต่อกิโลกรัมเดือนนี้เท่าไหร่');
    console.log('  📈 ราคาเฉลี่ยต่อกิโลกรัมเดือนที่แล้วเท่าไหร่');
} else {
    console.log('❌ ไม่พบส่วนที่ต้องแทนที่');
}