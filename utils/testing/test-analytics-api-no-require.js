#!/usr/bin/env node

const ANALYTICS_API_KEY = 'ps_1Vk4LW9GmU0riTAdn7NXzfQQ9I6EJCKG0Lbr-3H_ctg';

const requestBody = {
  periods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
  options: {
    include_breakdowns: true,
    breakdown_by: ['category'],
    require_all_periods: false,  // Changed to false
    count_mode: 'unique'
  },
  filters: {}
};

async function test() {
  console.log('🔍 Testing Analytics API WITHOUT require_all_periods\n');
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

  console.log('Analysis:');
  console.log(`- Periods returned: ${data.periods?.length || 0}`);
  console.log(`- Pages with all periods: ${data.metadata?.pages_with_all_periods || 0}`);

  if (data.by_category) {
    const categories = Object.keys(data.by_category);
    console.log(`- Categories found: ${categories.length}`);
    console.log(`- Category names: ${categories.join(', ')}`);

    // Show first 3 categories with sample data
    categories.slice(0, 3).forEach(cat => {
      const periods = Object.keys(data.by_category[cat]);
      const firstPeriod = periods[0];
      const count = data.by_category[cat][firstPeriod]?.count || 0;
      console.log(`  - ${cat}: ${periods.length} periods, ${firstPeriod} = ${count} events`);
    });
  } else {
    console.log('- ⚠️ NO by_category data found!');
  }

  console.log(`\n- Overall total for 2024Q2: ${data.overall?.['2024Q2']?.total_events || 0} events`);
}

test().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
