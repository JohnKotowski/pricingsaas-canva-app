#!/usr/bin/env node

const ANALYTICS_API_KEY = 'ps_1Vk4LW9GmU0riTAdn7NXzfQQ9I6EJCKG0Lbr-3H_ctg';

const requestBody = {
  periods: ['2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4'],
  options: {
    include_breakdowns: true,
    breakdown_by: ['category', 'event_type'],
    require_all_periods: false,
    count_mode: 'unique'
  },
  filters: {}
};

async function test() {
  console.log('🔍 Testing dual breakdown (category + event_type)\n');
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

  console.log('Response keys:', Object.keys(data));
  console.log('\nFull response:');
  console.log(JSON.stringify(data, null, 2));
}

test().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
