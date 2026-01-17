#!/usr/bin/env node

const ANALYTICS_API_KEY = 'ps_1Vk4LW9GmU0riTAdn7NXzfQQ9I6EJCKG0Lbr-3H_ctg';

const requestBody = {
  periods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
  options: {
    include_breakdowns: true,
    breakdown_by: ['category'],
    require_all_periods: true,
    count_mode: 'unique'
  },
  filters: {}
};

async function test() {
  console.log('🔍 Testing Analytics API directly\n');
  console.log('Request body:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n');

  const response = await fetch(
    'https://api.pricingsaas.com/functions/v1/api/analytics/diffs',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANALYTICS_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  console.log('Response:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n');

  // Check what we got
  console.log('Analysis:');
  console.log(`- Periods returned: ${data.periods?.length || 0}`);
  console.log(`- Periods: ${JSON.stringify(data.periods)}`);

  if (data.by_category) {
    const categories = Object.keys(data.by_category);
    console.log(`- Categories found: ${categories.length}`);
    console.log(`- Category names: ${categories.join(', ')}`);

    // Show first category detail
    if (categories.length > 0) {
      const firstCat = categories[0];
      console.log(`\n- Sample data for "${firstCat}":`);
      console.log(JSON.stringify(data.by_category[firstCat], null, 2));
    }
  } else {
    console.log('- ⚠️ NO by_category data found!');
    console.log('- Available keys:', Object.keys(data).join(', '));
  }
}

test().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
