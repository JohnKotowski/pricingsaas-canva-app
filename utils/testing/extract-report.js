#!/usr/bin/env node

const fs = require('fs');

// Read the MCP output file
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// Extract the actual SQL result
const textContent = data[0].text;

// Find the data - it's between the SECOND occurrence of untrusted-data tags
const startTag = textContent.indexOf('<untrusted-data-');
const secondStartTag = textContent.indexOf('<untrusted-data-', startTag + 1);
const endTag = textContent.indexOf('</untrusted-data-', secondStartTag);

if (secondStartTag === -1 || endTag === -1) {
  console.error('Could not find data tags');
  process.exit(1);
}

// Extract JSON between second start tag and end tag
const startPos = textContent.indexOf('>', secondStartTag) + 1;
const jsonStr = textContent.substring(startPos + 1, endTag).trim(); // +1 to skip newline

// Parse the JSON
const sqlResult = JSON.parse(jsonStr);
const report = sqlResult[0].report;

// Write to output file
fs.writeFileSync(
  '/Users/john/Projects/pricingsaas-canva-app/utils/testing/report-data.json',
  JSON.stringify(report, null, 2)
);

console.log('Report extracted successfully');
console.log(`Name: ${report.name}`);
console.log(`Elements: ${report.elements.length}`);
console.log(`Graphs: ${report.elements.filter(e => e.type === 'graph').length}`);
