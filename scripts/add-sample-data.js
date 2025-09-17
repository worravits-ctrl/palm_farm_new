#!/usr/bin/env node

/**
 * Script to add sample data for testing
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');

console.log('🌱 Adding sample data...');
console.log(`📊 Database: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Add sample harvest data for user ID 2 (worravit38@hotmail.com)
    console.log('Adding sample harvest data...');
    db.run(`
        INSERT INTO harvest_data (user_id, date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit)
        VALUES 
        (2, '2025-09-13', 150.5, 4.50, 677.25, 200.00, 477.25),
        (2, '2025-09-12', 120.0, 4.50, 540.00, 150.00, 390.00),
        (2, '2025-09-11', 180.3, 4.40, 793.32, 250.00, 543.32)
    `, (err) => {
        if (err) console.error('Error adding harvest data:', err);
        else console.log('✅ Harvest data added');
    });

    // Add sample fertilizer data
    console.log('Adding sample fertilizer data...');
    db.run(`
        INSERT INTO fertilizer_data (user_id, date, fertilizer_type, amount, cost_per_bag, total_cost, supplier, notes)
        VALUES 
        (2, '2025-09-13', 'ปุ๋ยเคมี 15-15-15', 10, 850.00, 9000.00, 'บริษัท เอบีซี', 'ปุ๋ยคุณภาพดี'),
        (2, '2025-09-10', 'ปุ๋ยอินทรีย์', 5, 450.00, 2550.00, 'ร้านเกษตร', 'ปุ๋ยธรรมชาติ')
    `, (err) => {
        if (err) console.error('Error adding fertilizer data:', err);
        else console.log('✅ Fertilizer data added');
    });

    // Add sample palm tree data
    console.log('Adding sample palm tree data...');
    db.run(`
        INSERT INTO palm_tree_data (user_id, tree_id, harvest_date, bunch_count, notes)
        VALUES 
        (2, 'A1', '2025-09-13', 5, 'ผลดี สีสวย'),
        (2, 'A2', '2025-09-13', 3, 'ต้นยังเล็ก'),
        (2, 'B1', '2025-09-12', 7, 'ผลเยอะ'),
        (2, 'B2', '2025-09-12', 4, 'คุณภาพดี')
    `, (err) => {
        if (err) console.error('Error adding palm tree data:', err);
        else console.log('✅ Palm tree data added');
    });

    // Add sample notes data
    console.log('Adding sample notes data...');
    db.run(`
        INSERT INTO notes_data (user_id, date, title, content, category, priority)
        VALUES 
        (2, '2025-09-13', 'การเก็บเกี่ยววันนี้', 'เก็บได้ผลดี น้ำหนักรวม 150 กิโลกรัม', 'การเก็บเกี่ยว', 'ปานกลาง'),
        (2, '2025-09-12', 'ต้องซื้อปุ๋ย', 'ปุ๋ยหมดแล้ว ต้องไปซื้อเพิ่ม', 'ปุ๋ย', 'สูง'),
        (2, '2025-09-11', 'ตรวจสอบต้นไม้', 'พบต้นไม้บางต้นเริ่มมีโรค', 'ต้นปาล์ม', 'สูง')
    `, (err) => {
        if (err) console.error('Error adding notes data:', err);
        else console.log('✅ Notes data added');
        
        db.close();
        console.log('🎉 Sample data added successfully!');
    });
});