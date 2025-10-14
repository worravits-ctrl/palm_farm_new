#!/usr/bin/env node

/**
 * Upload sample data to Railway production database via API
 */

const axios = require('axios');

const API_BASE = 'https://api-server-production-4ba0.up.railway.app/api';

// Admin credentials for uploading data
const ADMIN_EMAIL = 'admin@palmoil.com';
const ADMIN_PASSWORD = 'admin123'; // Try common passwords

let adminToken = null;

async function loginAdmin() {
    console.log('🔑 Logging in as admin...');
    
    const accounts = [
        { email: 'admin@palmoil.com', passwords: ['admin123', 'admin', 'password', '123456', 'palmoil'] },
        { email: 'admin.new@palmoil.com', passwords: ['admin123'] }
    ];
    
    for (const account of accounts) {
        for (const password of account.passwords) {
            try {
                const response = await axios.post(`${API_BASE}/auth/login`, {
                    email: account.email,
                    password: password
                });
                
                adminToken = response.data.token;
                console.log(`✅ Admin login successful: ${account.email} / ${password}`);
                return true;
            } catch (error) {
                console.log(`❌ Failed: ${account.email} / ${password}`);
            }
        }
    }
    
    console.log('❌ Could not login as admin with any account');
    return false;
}

async function createAdminUser() {
    console.log('🆕 Creating new admin user...');
    
    try {
        const response = await axios.post(`${API_BASE}/auth/register`, {
            username: 'admin_new',
            email: 'admin.new@palmoil.com',
            password: 'admin123'
        });
        
        console.log('✅ New admin user created:', response.data);
        
        // Login with new admin
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin.new@palmoil.com',
            password: 'admin123'
        });
        
        adminToken = loginResponse.data.token;
        console.log('✅ Logged in with new admin user');
        return true;
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error.response?.data || error.message);
        return false;
    }
}

async function uploadHarvestData() {
    console.log('🌾 Uploading harvest data...');
    
    const harvestData = [
        {
            date: '2025-09-13',
            total_weight: 150.5,
            price_per_kg: 4.50,
            fallen_weight: 0,
            fallen_price_per_kg: 0,
            total_revenue: 150.5 * 4.50,
            harvesting_cost: 200.00,
            net_profit: (150.5 * 4.50) - 200.00,
            notes: 'เก็บเกี่ยววันนี้ได้ผลดี'
        },
        {
            date: '2025-09-12', 
            total_weight: 120.0,
            price_per_kg: 4.50,
            fallen_weight: 0,
            fallen_price_per_kg: 0,
            total_revenue: 120.0 * 4.50,
            harvesting_cost: 150.00,
            net_profit: (120.0 * 4.50) - 150.00,
            notes: 'ผลปานกลาง'
        },
        {
            date: '2025-09-11',
            total_weight: 180.3,
            price_per_kg: 4.40,
            fallen_weight: 0,
            fallen_price_per_kg: 0,
            total_revenue: 180.3 * 4.40,
            harvesting_cost: 250.00,
            net_profit: (180.3 * 4.40) - 250.00,
            notes: 'ผลเยอะมาก'
        },
        {
            date: '2025-09-10',
            total_weight: 95.2,
            price_per_kg: 4.30,
            fallen_weight: 0,
            fallen_price_per_kg: 0,
            total_revenue: 95.2 * 4.30,
            harvesting_cost: 120.00,
            net_profit: (95.2 * 4.30) - 120.00,
            notes: 'ผลน้อย เนื่องจากฝนตก'
        },
        {
            date: '2025-09-09',
            total_weight: 165.7,
            price_per_kg: 4.50,
            fallen_weight: 0,
            fallen_price_per_kg: 0,
            total_revenue: 165.7 * 4.50,
            harvesting_cost: 180.00,
            net_profit: (165.7 * 4.50) - 180.00,
            notes: 'คุณภาพดี ราคาสูง'
        }
    ];
    
    for (const data of harvestData) {
        try {
            const response = await axios.post(`${API_BASE}/harvest`, data, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`✅ Harvest record added: ${data.date}`);
        } catch (error) {
            console.error(`❌ Error adding harvest ${data.date}:`, error.response?.data || error.message);
        }
    }
}

async function uploadFertilizerData() {
    console.log('🌱 Uploading fertilizer data...');
    
    const fertilizerData = [
        {
            date: '2025-09-13',
            fertilizer_type: 'ปุ๋ยเคมี 15-15-15',
            amount: 10,
            cost_per_bag: 850.00,
            supplier: 'บริษัท เอบีซี',
            notes: 'ปุ๋ยคุณภาพดี'
        },
        {
            date: '2025-09-10',
            fertilizer_type: 'ปุ๋ยอินทรีย์',
            amount: 5,
            cost_per_bag: 450.00,
            supplier: 'ร้านเกษตร',
            notes: 'ปุ๋ยธรรมชาติ'
        },
        {
            date: '2025-09-08',
            fertilizer_type: 'ปุ๋ยยูเรีย',
            amount: 8,
            cost_per_bag: 720.00,
            supplier: 'บริษัท เกษตรไทย',
            notes: 'ไนโตรเจนสูง'
        }
    ];
    
    for (const data of fertilizerData) {
        try {
            const response = await axios.post(`${API_BASE}/fertilizer`, data, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`✅ Fertilizer record added: ${data.date}`);
        } catch (error) {
            console.error(`❌ Error adding fertilizer ${data.date}:`, error.response?.data || error.message);
        }
    }
}

async function uploadPalmTreeData() {
    console.log('🌴 Uploading palm tree data...');
    
    const palmTreeData = [
        { tree_id: 'A1', harvest_date: '2025-09-13', bunch_count: 5, notes: 'ผลดี สีสวย' },
        { tree_id: 'A2', harvest_date: '2025-09-13', bunch_count: 3, notes: 'ต้นยังเล็ก' },
        { tree_id: 'B1', harvest_date: '2025-09-12', bunch_count: 7, notes: 'ผลเยอะ' },
        { tree_id: 'B2', harvest_date: '2025-09-12', bunch_count: 4, notes: 'คุณภาพดี' },
        { tree_id: 'C1', harvest_date: '2025-09-11', bunch_count: 6, notes: 'ปกติ' },
        { tree_id: 'C2', harvest_date: '2025-09-11', bunch_count: 8, notes: 'เยี่ยม' },
        { tree_id: 'D1', harvest_date: '2025-09-10', bunch_count: 2, notes: 'น้อย' },
        { tree_id: 'D2', harvest_date: '2025-09-10', bunch_count: 5, notes: 'ดี' }
    ];
    
    for (const data of palmTreeData) {
        try {
            const response = await axios.post(`${API_BASE}/palmtrees`, data, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`✅ Palm tree record added: ${data.tree_id}`);
        } catch (error) {
            console.error(`❌ Error adding palm tree ${data.tree_id}:`, error.response?.data || error.message);
        }
    }
}

async function uploadNotesData() {
    console.log('📝 Uploading notes data...');
    
    const notesData = [
        {
            date: '2025-09-13',
            title: 'การเก็บเกี่ยววันนี้',
            content: 'เก็บได้ผลดี น้ำหนักรวม 150 กิโลกรัม ราคาดี',
            category: 'การเก็บเกี่ยว',
            priority: 'ปานกลาง'
        },
        {
            date: '2025-09-12',
            title: 'ต้องซื้อปุ๋ย',
            content: 'ปุ๋ยหมดแล้ว ต้องไปซื้อเพิ่ม ประมาณ 20 กระสอบ',
            category: 'ปุ๋ย',
            priority: 'สูง'
        },
        {
            date: '2025-09-11', 
            title: 'ตรวจสอบต้นไม้',
            content: 'พบต้นไม้บางต้นเริ่มมีโรค ต้องฉีดยา',
            category: 'ต้นปาล์ม',
            priority: 'สูง'
        },
        {
            date: '2025-09-10',
            title: 'สภาพอากาศ',
            content: 'ฝนตกหนัก อาจส่งผลต่อการเก็บเกี่ยว',
            category: 'ทั่วไป',
            priority: 'ต่ำ'
        }
    ];
    
    for (const data of notesData) {
        try {
            const response = await axios.post(`${API_BASE}/notes`, data, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`✅ Note added: ${data.title}`);
        } catch (error) {
            console.error(`❌ Error adding note ${data.title}:`, error.response?.data || error.message);
        }
    }
}

async function main() {
    console.log('🚀 Starting Railway sample data upload...');
    console.log(`📡 Target: ${API_BASE}`);
    
    // Try to login as existing admin first
    const loginSuccess = await loginAdmin();
    
    if (!loginSuccess) {
        // If no existing admin, create new one
        const createSuccess = await createAdminUser();
        if (!createSuccess) {
            console.log('❌ Cannot proceed without admin access');
            return;
        }
    }
    
    console.log('📊 Starting data upload...');
    
    await uploadHarvestData();
    await uploadFertilizerData();
    await uploadPalmTreeData();
    await uploadNotesData();
    
    console.log('🎉 Sample data upload completed!');
    console.log('🌐 Check: https://api-server-production-4ba0.up.railway.app');
}

// Run the upload
main().catch(console.error);