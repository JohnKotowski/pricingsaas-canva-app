#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://qulnbyjrczvoxemtrili.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bG5ieWpyY3p2b3hlbXRyaWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NTYxMzYsImV4cCI6MjA1MjEzMjEzNn0.Rinzz2_HBzxalwRnWVJheDpLC4ghoBEBweweTiwf1eI';

const tempDir = path.join(__dirname, 'temp-charts');

const chartConfig = {
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
};

async function generateChart() {
  console.log('📈 Generating: All Events by Type (Yearly)');

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

  console.log(`✅ Image URL: ${result.imageUrl}`);

  // Download image
  const filename = '1-all-events-by-type-yearly.png';
  const filepath = path.join(tempDir, filename);

  console.log(`💾 Downloading to: ${filename}`);

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(result.imageUrl, (response) => {
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

  console.log(`✅ Saved successfully: ${filepath}\n`);
}

generateChart().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
