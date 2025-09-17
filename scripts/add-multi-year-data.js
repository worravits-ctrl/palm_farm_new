const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'palmoil.db');
const db = new sqlite3.Database(dbPath);

async function addMultiYearData() {
  console.log('📊 Adding multi-year sample data for charts...');
  
  try {
    // Add 2023 data
    console.log('📅 Adding 2023 data...');
    
    // Harvest data 2023
    const harvest2023 = [
      { user_id: 2, date: '2023-03-15', total_weight: 150.5, price_per_kg: 4.2, total_revenue: 632.1, harvesting_cost: 200, net_profit: 432.1 },
      { user_id: 2, date: '2023-06-20', total_weight: 200.0, price_per_kg: 4.5, total_revenue: 900.0, harvesting_cost: 250, net_profit: 650.0 },
      { user_id: 2, date: '2023-09-10', total_weight: 180.3, price_per_kg: 4.3, total_revenue: 775.29, harvesting_cost: 220, net_profit: 555.29 },
      { user_id: 2, date: '2023-12-05', total_weight: 220.8, price_per_kg: 4.8, total_revenue: 1059.84, harvesting_cost: 280, net_profit: 779.84 }
    ];
    
    for (const item of harvest2023) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO harvest_data (user_id, date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.user_id, item.date, item.total_weight, item.price_per_kg, item.total_revenue, item.harvesting_cost, item.net_profit],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    // Fertilizer data 2023
    const fertilizer2023 = [
      { user_id: 2, date: '2023-02-10', fertilizer_type: 'ปุ๋ยแม่น้ำโขง', amount: 8, cost_per_bag: 850, total_cost: 6800, supplier: 'ร้านเกษตร ABC', notes: 'ปุ๋ยคุณภาพดี' },
      { user_id: 2, date: '2023-08-15', fertilizer_type: 'ปุ๋ยอินทรีย์', amount: 6, cost_per_bag: 750, total_cost: 4500, supplier: 'ร้านปุ๋ยธรรมชาติ', notes: 'ปุ๋ยออร์แกนิค' }
    ];
    
    for (const item of fertilizer2023) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO fertilizer_data (user_id, date, fertilizer_type, amount, cost_per_bag, total_cost, supplier, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [item.user_id, item.date, item.fertilizer_type, item.amount, item.cost_per_bag, item.total_cost, item.supplier, item.notes],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    // Palm tree data 2023
    const palmtree2023 = [
      { user_id: 2, tree_id: 'A5', harvest_date: '2023-03-15', bunch_count: 4, notes: 'ทะลายโต' },
      { user_id: 2, tree_id: 'B8', harvest_date: '2023-03-20', bunch_count: 3, notes: 'คุณภาพดี' },
      { user_id: 2, tree_id: 'C2', harvest_date: '2023-06-10', bunch_count: 5, notes: 'ผลดี' },
      { user_id: 2, tree_id: 'D12', harvest_date: '2023-06-15', bunch_count: 2, notes: 'ทะลายเล็ก' },
      { user_id: 2, tree_id: 'E7', harvest_date: '2023-09-05', bunch_count: 6, notes: 'เก็บเกี่ยวดี' },
      { user_id: 2, tree_id: 'F15', harvest_date: '2023-09-12', bunch_count: 4, notes: 'คุณภาพปกติ' },
      { user_id: 2, tree_id: 'G3', harvest_date: '2023-12-01', bunch_count: 3, notes: 'ฤดูหนาว' },
      { user_id: 2, tree_id: 'H18', harvest_date: '2023-12-08', bunch_count: 5, notes: 'ผลิตภัณฑ์ดี' }
    ];
    
    for (const item of palmtree2023) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO palm_tree_data (user_id, tree_id, harvest_date, bunch_count, notes) VALUES (?, ?, ?, ?, ?)',
          [item.user_id, item.tree_id, item.harvest_date, item.bunch_count, item.notes],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    // Add 2024 data
    console.log('📅 Adding 2024 data...');
    
    // Harvest data 2024
    const harvest2024 = [
      { user_id: 2, date: '2024-01-15', total_weight: 165.2, price_per_kg: 4.6, total_revenue: 759.92, harvesting_cost: 210, net_profit: 549.92 },
      { user_id: 2, date: '2024-04-10', total_weight: 185.7, price_per_kg: 4.4, total_revenue: 817.08, harvesting_cost: 230, net_profit: 587.08 },
      { user_id: 2, date: '2024-07-22', total_weight: 195.3, price_per_kg: 4.7, total_revenue: 917.91, harvesting_cost: 240, net_profit: 677.91 },
      { user_id: 2, date: '2024-10-18', total_weight: 210.6, price_per_kg: 4.9, total_revenue: 1031.94, harvesting_cost: 260, net_profit: 771.94 },
      { user_id: 2, date: '2024-12-12', total_weight: 175.8, price_per_kg: 5.0, total_revenue: 879.0, harvesting_cost: 220, net_profit: 659.0 }
    ];
    
    for (const item of harvest2024) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO harvest_data (user_id, date, total_weight, price_per_kg, total_revenue, harvesting_cost, net_profit) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.user_id, item.date, item.total_weight, item.price_per_kg, item.total_revenue, item.harvesting_cost, item.net_profit],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    // Fertilizer data 2024
    const fertilizer2024 = [
      { user_id: 2, date: '2024-03-05', fertilizer_type: 'ปุ๋ยเคมี NPK', amount: 10, cost_per_bag: 900, total_cost: 9000, supplier: 'บริษัทปุ๋ย XYZ', notes: 'ปุ๋ยเคมีผสม' },
      { user_id: 2, date: '2024-09-18', fertilizer_type: 'ปุ๋ยคอก', amount: 12, cost_per_bag: 650, total_cost: 7800, supplier: 'ฟาร์มปศุสัตว์', notes: 'ปุ๋ยหมักคุณภาพดี' }
    ];
    
    for (const item of fertilizer2024) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO fertilizer_data (user_id, date, fertilizer_type, amount, cost_per_bag, total_cost, supplier, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [item.user_id, item.date, item.fertilizer_type, item.amount, item.cost_per_bag, item.total_cost, item.supplier, item.notes],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    // Palm tree data 2024
    const palmtree2024 = [
      { user_id: 2, tree_id: 'A8', harvest_date: '2024-01-20', bunch_count: 5, notes: 'ปีใหม่' },
      { user_id: 2, tree_id: 'B12', harvest_date: '2024-02-14', bunch_count: 4, notes: 'วาเลนไทน์' },
      { user_id: 2, tree_id: 'C15', harvest_date: '2024-04-15', bunch_count: 6, notes: 'ฤดูร้อน' },
      { user_id: 2, tree_id: 'D20', harvest_date: '2024-05-10', bunch_count: 3, notes: 'แห้งแล้ง' },
      { user_id: 2, tree_id: 'E25', harvest_date: '2024-07-25', bunch_count: 7, notes: 'ฤดูฝน' },
      { user_id: 2, tree_id: 'F10', harvest_date: '2024-08-30', bunch_count: 4, notes: 'หน้าฝน' },
      { user_id: 2, tree_id: 'G22', harvest_date: '2024-10-20', bunch_count: 5, notes: 'หลังฝน' },
      { user_id: 2, tree_id: 'H5', harvest_date: '2024-11-15', bunch_count: 6, notes: 'ฤดูเก็บเกี่ยว' },
      { user_id: 2, tree_id: 'I18', harvest_date: '2024-12-20', bunch_count: 4, notes: 'ปลายปี' }
    ];
    
    for (const item of palmtree2024) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO palm_tree_data (user_id, tree_id, harvest_date, bunch_count, notes) VALUES (?, ?, ?, ?, ?)',
          [item.user_id, item.tree_id, item.harvest_date, item.bunch_count, item.notes],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    console.log('✅ Multi-year data added successfully!');
    console.log('📊 Summary:');
    console.log('   🌾 2023: 4 harvest records, 2 fertilizer records, 8 palm tree records');
    console.log('   🌾 2024: 5 harvest records, 2 fertilizer records, 9 palm tree records');
    console.log('   🌾 2025: Existing data remains');
    console.log('');
    console.log('🎯 Now you can see year-over-year comparisons in the Reports page!');
    
  } catch (error) {
    console.error('❌ Error adding multi-year data:', error);
  } finally {
    db.close();
  }
}

addMultiYearData();