#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://qulnbyjrczvoxemtrili.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bG5ieWpyY3p2b3hlbXRyaWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NTYxMzYsImV4cCI6MjA1MjEzMjEzNn0.Rinzz2_HBzxalwRnWVJheDpLC4ghoBEBweweTiwf1eI';

const graphs = [
  {
    num: 6,
    filename: '6-packaging-changes-by-category.png',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'category',
      diffsSelectedPeriods: ['2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4'],
      diffsEventCategory: 'packaging',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: true,
      diffsChartMode: 'categories',
      diffsPeriodGranularity: 'quarterly',
      chartType: 'bar',
      title: 'Packaging Changes by category'
    }
  },
  {
    num: 7,
    filename: '7-product-events-over-time.png',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'event_type',
      diffsSelectedPeriods: ['2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4'],
      diffsEventCategory: 'product',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: false,
      diffsChartMode: 'periods',
      diffsPeriodGranularity: 'quarterly',
      chartType: 'grouped',
      title: 'Product Events Over Time'
    }
  },
  {
    num: 8,
    filename: '8-product-events-by-category.png',
    config: {
      mode: 'diffs',
      diffsBreakdown: 'category',
      diffsSelectedPeriods: ['2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4'],
      diffsEventCategory: 'product',
      diffsRequireAllPeriods: true,
      diffsShiftQuarters: true,
      diffsCountMode: 'unique',
      diffsShowTrendLine: true,
      diffsChartMode: 'categories',
      diffsPeriodGranularity: 'quarterly',
      chartType: 'bar',
      title: 'Product Events by Category'
    }
  }
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      res.pipe(file);
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

async function generateGraph(graph) {
  console.log(`\n📈 Generating graph #${graph.num}: ${graph.config.title}`);

  const url = `${SUPABASE_URL}/functions/v1/generate-chart`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ chartConfig: graph.config })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed: ${response.status} - ${error}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(`Failed: ${result.message}`);
  }

  // Download
  const tempDir = path.join(__dirname, 'temp-charts');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filepath = path.join(tempDir, graph.filename);

  await downloadImage(result.imageUrl, filepath);

  const stats = fs.statSync(filepath);
  console.log(`   ✅ Saved: ${(stats.size / 1024).toFixed(2)} KB`);
}

async function main() {
  console.log('🎨 Generating graphs 6-8...');

  for (const graph of graphs) {
    try {
      await generateGraph(graph);
    } catch (err) {
      console.error(`   ❌ Error on graph #${graph.num}:`, err.message);
    }
  }

  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
