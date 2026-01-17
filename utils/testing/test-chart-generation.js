#!/usr/bin/env node

/**
 * Local test script for chart generation
 * Tests fetching data from analytics API and generating chart via QuickChart
 *
 * Usage:
 *   node utils/testing/test-chart-generation.js
 *
 * Requirements:
 *   - ANALYTICS_API_KEY environment variable set
 */

// Sample graph configs from the report
const GRAPH_CONFIGS = {
  allEvents: {
    mode: 'diffs',
    diffsBreakdown: 'event_type',
    diffsEventCategory: 'all',
    diffsSelectedPeriods: [
      '2024Q2', '2024Q3', '2024Q4',
      '2025Q1', '2025Q2', '2025Q3',
      '2025Q4', '2026Q1'
    ],
    diffsRequireAllPeriods: true,
    diffsShiftQuarters: true,
    chartType: 'grouped',
    title: 'All Events by Type'
  },
  pricingEvents: {
    mode: 'diffs',
    diffsBreakdown: 'event_type',
    diffsEventCategory: 'pricing',
    diffsSelectedPeriods: [
      '2024Q2', '2024Q3', '2024Q4',
      '2025Q1', '2025Q2', '2025Q3',
      '2025Q4', '2026Q1'
    ],
    diffsRequireAllPeriods: true,
    diffsShiftQuarters: true,
    chartType: 'grouped',
    title: 'Pricing Events Over Time'
  },
  packagingEvents: {
    mode: 'diffs',
    diffsBreakdown: 'event_type',
    diffsEventCategory: 'packaging',
    diffsSelectedPeriods: [
      '2024Q2', '2024Q3', '2024Q4',
      '2025Q1', '2025Q2', '2025Q3',
      '2025Q4', '2026Q1'
    ],
    diffsRequireAllPeriods: true,
    diffsShiftQuarters: true,
    chartType: 'grouped',
    title: 'Packaging Events Over Time'
  },
  productEvents: {
    mode: 'diffs',
    diffsBreakdown: 'event_type',
    diffsEventCategory: 'product',
    diffsSelectedPeriods: [
      '2024Q2', '2024Q3', '2024Q4',
      '2025Q1', '2025Q2', '2025Q3',
      '2025Q4', '2026Q1'
    ],
    diffsRequireAllPeriods: true,
    diffsShiftQuarters: true,
    chartType: 'grouped',
    title: 'Product Events Over Time'
  }
};

// Select which config to use (change this to test different graphs)
const graphConfig = GRAPH_CONFIGS.pricingEvents;

// Fetch diffs data from analytics API
async function fetchDiffsData(config, apiKey) {
  console.log('\n📊 Fetching data from analytics API...');
  console.log('Endpoint: POST https://api.pricingsaas.com/functions/v1/api/analytics/diffs');
  console.log('Periods:', config.diffsSelectedPeriods);
  console.log('Breakdown by:', config.diffsBreakdown);

  const requestBody = {
    periods: config.diffsSelectedPeriods || [],
    options: {
      include_breakdowns: true,
      breakdown_by: [config.diffsBreakdown || 'event_type'],
      require_all_periods: config.diffsRequireAllPeriods || false,
      count_mode: 'unique'
    },
    filters: {}
  };

  console.log('\nRequest body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    'https://api.pricingsaas.com/functions/v1/api/analytics/diffs',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analytics API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('\n✅ Data fetched successfully!');
  console.log('Total pages:', data.metadata?.pages_with_all_periods || 'N/A');
  console.log('Periods:', data.periods?.length || 0);

  const breakdownKey = `by_${config.diffsBreakdown || 'event_type'}`;
  const eventTypes = Object.keys(data[breakdownKey] || {});
  console.log('Event types:', eventTypes.length);
  console.log('Sample event types:', eventTypes.slice(0, 5).join(', '));

  return data;
}

// Event type categories for filtering
const EVENT_CATEGORIES = {
  pricing: [
    'price_increased',
    'price_decreased',
    'price_hidden',
    'price_revealed',
    'discount_added',
    'discount_removed',
    'discount_changed',
    'pricing_restructured'
  ],
  packaging: [
    'plan_added',
    'plan_removed',
    'plan_renamed',
    'threshold_added',
    'threshold_removed',
    'capacity_increased',
    'capacity_decreased',
    'addon_added',
    'addon_removed',
    'addon_changed',
    'trial_changed',
    'freemium_changed',
    'pricing_metric_changed'
  ],
  product: [
    'feature_added',
    'feature_removed',
    'feature_changed'
  ]
};

// Filter event types by category
function filterEventsByCategory(eventTypeData, category) {
  if (category === 'all' || !category) {
    return eventTypeData; // No filtering
  }

  const allowedTypes = EVENT_CATEGORIES[category];
  if (!allowedTypes) {
    console.warn(`Unknown category: ${category}, returning all events`);
    return eventTypeData;
  }

  const filtered = {};
  for (const eventType of allowedTypes) {
    if (eventTypeData[eventType]) {
      filtered[eventType] = eventTypeData[eventType];
    }
  }

  console.log(`  ℹ️  Filtered from ${Object.keys(eventTypeData).length} to ${Object.keys(filtered).length} event types (category: ${category})`);

  return filtered;
}

// Transform diffs API response to Chart.js format
function transformDiffsToChartJs(data, config) {
  console.log('\n🔄 Transforming data to Chart.js format...');

  const periods = data.periods || [];
  const breakdownKey = `by_${config.diffsBreakdown || 'event_type'}`;
  let breakdownData = data[breakdownKey] || {};

  // Apply category filter if specified
  if (config.diffsEventCategory && config.diffsEventCategory !== 'all') {
    breakdownData = filterEventsByCategory(breakdownData, config.diffsEventCategory);
  }

  // Format event type names for display
  const formatEventType = (type) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Color palette for event types
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#6366f1', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
    '#8b5cf6', '#84cc16', '#f43f5e', '#0ea5e9', '#a855f7',
    '#22c55e', '#eab308', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#10b981', '#f59e0b', '#3b82f6'
  ];

  // Build datasets - one per event type
  const datasets = Object.entries(breakdownData).map(([eventType, periodData], index) => {
    const formattedName = formatEventType(eventType);
    const counts = periods.map((period) => periodData[period]?.count || 0);
    const total = counts.reduce((sum, count) => sum + count, 0);

    console.log(`  - ${formattedName}: ${total} total events`);

    return {
      label: formattedName,
      data: counts,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1
    };
  });

  const chartData = {
    type: 'bar',
    labels: periods,
    datasets,
    title: config.title || 'Chart',
    subtitle: data.metadata?.pages_with_all_periods
      ? `${data.metadata.pages_with_all_periods} total pages`
      : undefined
  };

  console.log(`\n✅ Transformed to ${datasets.length} datasets across ${periods.length} periods`);

  return chartData;
}

// Generate chart via QuickChart
async function generateChart(chartData) {
  console.log('\n🎨 Generating chart via QuickChart...');

  const width = 1920;
  const height = 1080;

  const chartJsConfig = {
    type: chartData.type,
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets
    },
    options: {
      plugins: {
        legend: {
          display: chartData.datasets.length > 1,
          position: 'top',
          labels: {
            font: {
              size: 10,
              family: 'Arial, sans-serif'
            }
          }
        },
        title: {
          display: !!chartData.title,
          text: chartData.title || '',
          font: {
            size: 18,
            family: 'Arial, sans-serif',
            weight: 'bold'
          }
        },
        subtitle: chartData.subtitle ? {
          display: true,
          text: chartData.subtitle,
          font: {
            size: 14,
            family: 'Arial, sans-serif'
          }
        } : undefined
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 10
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 10
            }
          }
        }
      },
      responsive: false,
      maintainAspectRatio: false
    }
  };

  console.log('Chart config size:', JSON.stringify(chartJsConfig).length, 'bytes');

  // Use QuickChart's short URL endpoint for large configs
  const response = await fetch('https://quickchart.io/chart/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chart: chartJsConfig,
      width,
      height,
      backgroundColor: 'white',
      format: 'png'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickChart API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Chart generated successfully!');

  return result.url;
}

// Main test function
async function testChartGeneration() {
  console.log('🧪 Chart Generation Test');
  console.log('========================\n');

  // Check for API key
  const apiKey = process.env.ANALYTICS_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: ANALYTICS_API_KEY environment variable not set');
    console.log('\nSet it with:');
    console.log('  export ANALYTICS_API_KEY="your-api-key-here"');
    console.log('  node utils/testing/test-chart-generation.js');
    process.exit(1);
  }

  console.log('✅ API key found');

  try {
    // Step 1: Fetch data
    const data = await fetchDiffsData(graphConfig, apiKey);

    // Step 2: Transform data
    const chartData = transformDiffsToChartJs(data, graphConfig);

    // Step 3: Generate chart
    const chartUrl = await generateChart(chartData);

    // Output results
    console.log('\n' + '='.repeat(80));
    console.log('🎉 SUCCESS!');
    console.log('='.repeat(80));
    console.log('\n📊 Chart URL:');
    console.log(chartUrl);
    console.log('\n💡 Open this URL in your browser to view the chart');
    console.log('='.repeat(80) + '\n');

    return chartUrl;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testChartGeneration();
