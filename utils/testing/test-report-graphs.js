#!/usr/bin/env node

/**
 * Test script to generate chart images for all graph elements in a report
 *
 * Usage:
 *   node utils/testing/test-report-graphs.js <report-id>
 *
 * Example:
 *   node utils/testing/test-report-graphs.js 724b15a8-9898-4780-9e59-ebd10235f017
 *
 * Requirements:
 *   - ANALYTICS_API_KEY environment variable set
 *   - SUPABASE_URL environment variable set
 *   - SUPABASE_ANON_KEY environment variable set
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Get report ID from command line args
const reportId = process.argv[2];

if (!reportId) {
  console.error('❌ Error: Report ID is required');
  console.log('\nUsage:');
  console.log('  node utils/testing/test-report-graphs.js <report-id>');
  console.log('\nExample:');
  console.log('  node utils/testing/test-report-graphs.js 724b15a8-9898-4780-9e59-ebd10235f017');
  process.exit(1);
}

// Check for required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qulnbyjrczvoxemtrili.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bG5ieWpyY3p2b3hlbXRyaWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NTYxMzYsImV4cCI6MjA1MjEzMjEzNn0.Rinzz2_HBzxalwRnWVJheDpLC4ghoBEBweweTiwf1eI';
const ANALYTICS_API_KEY = process.env.ANALYTICS_API_KEY;

if (!ANALYTICS_API_KEY) {
  console.error('❌ Error: ANALYTICS_API_KEY environment variable required for graph generation');
  console.log('\nSet it with:');
  console.log('  export ANALYTICS_API_KEY="your-api-key"');
  console.log('  node utils/testing/test-report-graphs.js 724b15a8-9898-4780-9e59-ebd10235f017');
  console.log('\nOr add to .env file:');
  console.log('  echo "ANALYTICS_API_KEY=your-key" >> .env');
  process.exit(1);
}

// Create temp directory
const tempDir = path.join(__dirname, 'temp-charts');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

console.log('🧪 Report Graph Generation Test');
console.log('================================\n');
console.log('Report ID:', reportId);
console.log('Output directory:', tempDir);
console.log('');

// Fetch report from Supabase (using function to bypass RLS)
async function fetchReport(reportId) {
  console.log('📊 Fetching report from database...');

  const url = `${SUPABASE_URL}/rest/v1/rpc/get_report_for_canva`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ report_id: reportId })
  });

  if (!response.ok) {
    // Try direct SQL query as fallback
    console.log('   ℹ️  RPC function not available, using direct query...');
    const directUrl = `${SUPABASE_URL}/rest/v1/app_saved_reports?id=eq.${reportId}&select=id,name,elements`;

    const directResponse = await fetch(directUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      }
    });

    if (!directResponse.ok) {
      throw new Error(`Failed to fetch report: ${directResponse.status} ${directResponse.statusText}`);
    }

    const data = await directResponse.json();

    if (data.length === 0) {
      throw new Error(`Report not found: ${reportId}. This may be due to RLS policies. Try using a service role key.`);
    }

    const report = data[0];
    console.log(`✅ Found report: "${report.name}"`);
    console.log(`   Elements: ${report.elements.length} total`);

    return report;
  }

  const report = await response.json();

  if (!report) {
    throw new Error(`Report not found: ${reportId}`);
  }

  console.log(`✅ Found report: "${report.name}"`);
  console.log(`   Elements: ${report.elements.length} total`);

  return report;
}

// Extract graph elements from report
function extractGraphElements(report) {
  const graphElements = report.elements.filter(el => el.type === 'graph');
  console.log(`   Graphs: ${graphElements.length}`);
  console.log('');

  return graphElements;
}

// Generate chart image via Edge Function
async function generateChart(chartConfig, index, label) {
  console.log(`📈 [${index + 1}] Generating: ${label}`);

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

// Sanitize filename
function sanitizeFilename(name) {
  return name
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

// Main test function
async function testReportGraphs() {
  try {
    // Fetch report
    const report = await fetchReport(reportId);

    // Extract graph elements
    const graphElements = extractGraphElements(report);

    if (graphElements.length === 0) {
      console.log('⚠️  No graph elements found in this report');
      return;
    }

    console.log('🎨 Generating charts...\n');

    // Generate each chart
    const results = [];
    for (let i = 0; i < graphElements.length; i++) {
      const element = graphElements[i];
      const label = element.label || `Graph ${i + 1}`;

      try {
        // Parse chart config
        let chartConfig;
        try {
          const parsed = JSON.parse(element.content);
          chartConfig = parsed.config || parsed;
        } catch (e) {
          console.log(`   ⚠️  Skipping: Invalid JSON in content`);
          continue;
        }

        // Generate chart
        const imageUrl = await generateChart(chartConfig, i, label);

        // Download image
        const filename = `${i + 1}-${sanitizeFilename(label)}.png`;
        const filepath = path.join(tempDir, filename);

        console.log(`   💾 Downloading to: ${filename}`);
        await downloadImage(imageUrl, filepath);
        console.log(`   ✅ Saved successfully\n`);

        results.push({
          index: i + 1,
          label,
          filename,
          imageUrl,
          success: true
        });

      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}\n`);
        results.push({
          index: i + 1,
          label,
          error: error.message,
          success: false
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total graphs: ${graphElements.length}`);
    console.log(`Successful: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);
    console.log(`\nImages saved to: ${tempDir}`);
    console.log('='.repeat(80) + '\n');

    // List successful images
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
      console.log('Generated images:');
      successful.forEach(r => {
        console.log(`  ${r.index}. ${r.label} → ${r.filename}`);
      });
      console.log('');
    }

    // List failures
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('Failed graphs:');
      failed.forEach(r => {
        console.log(`  ${r.index}. ${r.label} - ${r.error}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testReportGraphs();
