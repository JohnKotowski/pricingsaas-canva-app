#!/usr/bin/env node

/**
 * Direct test script to generate chart images from graph configs
 * This bypasses the database and directly tests the Edge Function with predefined configs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://qulnbyjrczvoxemtrili.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bG5ieWpyY3p2b3hlbXRyaWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NTYxMzYsImV4cCI6MjA1MjEzMjEzNn0.Rinzz2_HBzxalwRnWVJheDpLC4ghoBEBweweTiwf1eI';
const ANALYTICS_API_KEY = process.env.ANALYTICS_API_KEY || 'ps_1Vk4LW9GmU0riTAdn7NXzfQQ9I6EJCKG0Lbr-3H_ctg';

// Create temp directory
const tempDir = path.join(__dirname, 'temp-charts');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Graph configurations from the report
const GRAPH_CONFIGS = [
  {
    name: '1-all-events-by-type-yearly',
    label: 'All Events by Type (Yearly)',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'event_type',
      diffsSelectedPeriods: ['2024Y', '2025Y'],
      diffsEventCategory: 'all',
      diffsRequireAllPeriods: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: true,
      diffsChartMode: 'events',
      diffsPeriodGranularity: 'yearly',
      chartType: 'grouped',
      title: 'All Events by Type'
    }
  },
  {
    name: '2-all-events-by-category',
    label: 'All Events by Category',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'category',
      diffsSelectedPeriods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
      diffsEventCategory: 'all',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: false,
      diffsChartMode: 'categories',
      chartType: 'bar',
      title: 'All events by category'
    }
  },
  {
    name: '3-pricing-events-over-time',
    label: 'Pricing Events Over Time',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'event_type',
      diffsSelectedPeriods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
      diffsEventCategory: 'pricing',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: false,
      chartType: 'grouped',
      title: 'Pricing Events Over Time'
    }
  },
  {
    name: '4-pricing-events-by-category',
    label: 'Pricing Events by Category',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'category',
      diffsSelectedPeriods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
      diffsEventCategory: 'pricing',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: true,
      diffsChartMode: 'categories',
      chartType: 'bar',
      title: 'Pricing Events by Category'
    }
  },
  {
    name: '5-packaging-events-over-time',
    label: 'Packaging Events Over Time',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'event_type',
      diffsSelectedPeriods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
      diffsEventCategory: 'packaging',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: false,
      chartType: 'grouped',
      title: 'Packaging Events Over Time'
    }
  },
  {
    name: '6-packaging-events-by-category',
    label: 'Packaging Events by Category',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'category',
      diffsSelectedPeriods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
      diffsEventCategory: 'packaging',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: true,
      diffsChartMode: 'categories',
      chartType: 'bar',
      title: 'Packaging Events by Category'
    }
  },
  {
    name: '7-product-events-over-time',
    label: 'Product Events Over Time',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'event_type',
      diffsSelectedPeriods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
      diffsEventCategory: 'product',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: false,
      chartType: 'grouped',
      title: 'Product Events Over Time'
    }
  },
  {
    name: '8-product-events-by-category',
    label: 'Product Events by Category',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'category',
      diffsSelectedPeriods: ['2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'],
      diffsEventCategory: 'product',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: true,
      diffsChartMode: 'categories',
      chartType: 'bar',
      title: 'Product Events by Category'
    }
  }
];

console.log('🧪 Direct Graph Generation Test');
console.log('=================================\n');
console.log(`Generating ${GRAPH_CONFIGS.length} charts...`);
console.log(`Output directory: ${tempDir}\n`);

// Generate chart image via Edge Function
async function generateChart(chartConfig, name, label) {
  console.log(`📈 [${name}] ${label}`);

  const url = `${SUPABASE_URL}/functions/v1/generate-chart`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ chartConfig })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chart generation failed: ${response.status} - ${error}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(`Chart generation failed: ${result.message}`);
  }

  console.log(`   ✅ Image URL: ${result.imageUrl}`);

  return result.imageUrl;
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Main test function
async function testGraphs() {
  const results = [];

  for (const graph of GRAPH_CONFIGS) {
    try {
      // Generate chart
      const imageUrl = await generateChart(graph.config, graph.name, graph.label);

      // Download image
      const filename = `${graph.name}.png`;
      const filepath = path.join(tempDir, filename);

      console.log(`   💾 Downloading to: ${filename}`);
      await downloadImage(imageUrl, filepath);
      console.log(`   ✅ Saved successfully\n`);

      results.push({
        name: graph.name,
        label: graph.label,
        filename,
        imageUrl,
        success: true
      });

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      results.push({
        name: graph.name,
        label: graph.label,
        error: error.message,
        success: false
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total graphs: ${GRAPH_CONFIGS.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  console.log(`\nImages saved to: ${tempDir}`);
  console.log('='.repeat(80) + '\n');

  // List successful images
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    console.log('Generated images:');
    successful.forEach(r => {
      console.log(`  ✅ ${r.name} - ${r.label}`);
      console.log(`     ${r.filename}`);
    });
    console.log('');
  }

  // List failures
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('Failed graphs:');
    failed.forEach(r => {
      console.log(`  ❌ ${r.name} - ${r.label}`);
      console.log(`     ${r.error}`);
    });
    console.log('');
  }
}

// Run the test
testGraphs().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error('\nStack trace:', err.stack);
  process.exit(1);
});
