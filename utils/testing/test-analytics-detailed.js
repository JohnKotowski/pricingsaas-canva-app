#!/usr/bin/env node

const ANALYTICS_API_KEY = 'ps_1Vk4LW9GmU0riTAdn7NXzfQQ9I6EJCKG0Lbr-3H_ctg';

const requestBody = {
  periods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
  options: {
    include_breakdowns: true,
    breakdown_by: ['category'],
    require_all_periods: false,
    count_mode: 'unique'
  },
  filters: {}
};

async function test() {
  console.log('🔍 Detailed API Response Analysis\n');

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

  console.log('Overall stats:');
  console.log(`- Total events in 2024Q2: ${data.overall?.['2024Q2']?.total_events || 0}`);
  console.log(`- Pages with all periods: ${data.metadata?.pages_with_all_periods || 0}`);
  console.log('');

  if (data.by_category) {
    const categories = Object.keys(data.by_category);
    console.log(`Categories found: ${categories.length}`);
    console.log('');

    // Show first category's full structure
    const firstCat = categories[0];
    console.log(`First category (${firstCat}):`);
    console.log(JSON.stringify(data.by_category[firstCat], null, 2));
    console.log('');

    // Show summary for each category
    console.log('Summary by category:');
    categories.forEach(cat => {
      const categoryData = data.by_category[cat];
      const q2Count = categoryData['2024Q2']?.count || 0;
      const q3Count = categoryData['2024Q3']?.count || 0;
      console.log(`  ${cat.substring(0, 8)}...: 2024Q2=${q2Count}, 2024Q3=${q3Count}`);
    });
  }
}

test().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
