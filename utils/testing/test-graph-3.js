#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://qulnbyjrczvoxemtrili.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bG5ieWpyY3p2b3hlbXRyaWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NTYxMzYsImV4cCI6MjA1MjEzMjEzNn0.Rinzz2_HBzxalwRnWVJheDpLC4ghoBEBweweTiwf1eI';

const config = {
  mode: 'diffs',
  diffsBreakdown: 'event_type',
  diffsSelectedPeriods: ['2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4'],
  diffsEventCategory: 'pricing',
  diffsRequireAllPeriods: true,
  diffsShiftQuarters: true,
  diffsCountMode: 'unique',
  diffsShowTrendLine: false,
  diffsChartMode: 'periods',
  diffsPeriodGranularity: 'quarterly',
  chartType: 'grouped',
  title: 'Pricing Events Over Time'
};

async function test() {
  console.log('📈 Testing graph #3: Pricing Events Over Time\n');

  const url = `${SUPABASE_URL}/functions/v1/generate-chart`;

  console.log('Calling Edge Function with config:');
  console.log(JSON.stringify(config, null, 2));
  console.log('');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ chartConfig: config })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed: ${response.status} - ${error}`);
  }

  const result = await response.json();

  console.log('Edge Function response:');
  console.log(JSON.stringify(result, null, 2));
  console.log('');

  if (!result.success) {
    throw new Error(`Failed: ${result.message}`);
  }

  console.log(`✅ Chart generated successfully`);
  console.log(`📊 Image URL: ${result.imageUrl}`);
  console.log('');

  // Download
  const tempDir = path.join(__dirname, 'temp-charts');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filepath = path.join(tempDir, '3-pricing-events-over-time.png');

  console.log(`💾 Downloading to: ${filepath}`);

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(result.imageUrl, (res) => {
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

  console.log(`✅ Saved successfully`);

  // Check file size
  const stats = fs.statSync(filepath);
  console.log(`📦 File size: ${(stats.size / 1024).toFixed(2)} KB`);
}

test().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
