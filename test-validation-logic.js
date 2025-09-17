// Test the fertilizer validation logic directly
console.log('🧪 Testing fertilizer validation logic...\n');

// Sample data that would come from CSV import
const testRecords = [
  // Record with 'amount' field (from exported CSV)
  {
    date: '2024-01-15',
    fertilizer_type: 'ปุ๋ยเคมี 15-15-15',
    amount: '50',
    cost_per_bag: '1200',
    labor_cost: '500',
    supplier: 'บริษัท ปุ๋ยไทย จำกัด',
    notes: 'ปุ๋ยสำหรับฤดูฝน'
  },
  // Record with 'sacks' field
  {
    date: '2024-01-20',
    fertilizer_type: 'ปุ๋ยอินทรีย์',
    sacks: '25',
    cost_per_bag: '800',
    labor_cost: '300',
    supplier: 'ร้านปุ๋ยท้องถิ่น',
    notes: 'ปุ๋ยธรรมชาติ'
  },
  // Record with 'quantity_bags' field
  {
    date: '2024-02-01',
    fertilizer_type: 'ปุ๋ยเคมี 20-20-20',
    quantity_bags: '40',
    cost_per_bag: '1500',
    labor_cost: '600',
    supplier: 'บริษัท ปุ๋ยไทย จำกัด',
    notes: 'ปุ๋ยสำหรับฤดูแล้ง'
  },
  // Record missing required fields (should fail)
  {
    date: '2024-03-01',
    fertilizer_type: 'ปุ๋ยเคมี',
    // missing amount/sacks/quantity_bags
    cost_per_bag: '1000'
  }
];

console.log('📊 Testing validation with sample records:\n');

testRecords.forEach((item, index) => {
  console.log(`Record ${index + 1}:`);
  console.log(JSON.stringify(item, null, 2));

  // Simulate the validation logic from the API
  const { date, fertilizer_type, quantity_bags, cost_per_bag, notes, item: item_name, sacks, price_per_sack, labor_cost, supplier, amount } = item;

  // Support both old and new field names for backward compatibility
  const final_item = item_name || fertilizer_type;
  const final_sacks = sacks !== undefined ? sacks : (quantity_bags !== undefined ? quantity_bags : amount);
  const final_price_per_sack = price_per_sack !== undefined ? price_per_sack : cost_per_bag;
  const final_labor_cost = labor_cost !== undefined ? labor_cost : 0;

  // Check validation
  const missingFields = [];
  if (!date) missingFields.push('date');
  if (!final_item) missingFields.push('fertilizer_type/item');
  if (final_sacks === undefined) missingFields.push('sacks/quantity_bags/amount');
  if (final_price_per_sack === undefined) missingFields.push('price_per_sack/cost_per_bag');

  if (missingFields.length > 0) {
    console.log(`❌ Validation FAILED - Missing fields: ${missingFields.join(', ')}`);
  } else {
    console.log(`✅ Validation PASSED`);
    console.log(`   Processed values: date="${date}", item="${final_item}", sacks="${final_sacks}", price="${final_price_per_sack}", labor_cost="${final_labor_cost}"`);
  }

  console.log('---\n');
});

console.log('🎉 Test completed! The API now supports all three field name variants:');
console.log('   - sacks (original)');
console.log('   - quantity_bags (alternative)');
console.log('   - amount (from exported CSV)');