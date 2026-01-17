# Chart Generation Testing

This directory contains tools for testing chart generation locally without deploying to Supabase or using the Canva app.

## Test Script: `test-chart-generation.js`

Tests the complete chart generation pipeline:
1. Fetches data from the PricingSaaS Analytics API
2. Transforms the data to Chart.js format
3. Generates a chart image via QuickChart
4. Outputs the chart URL

### Prerequisites

1. **Set the Analytics API Key:**
   ```bash
   export ANALYTICS_API_KEY="your-analytics-api-key-here"
   ```

   Or add it to your `.env` file:
   ```bash
   echo "ANALYTICS_API_KEY=your-key-here" >> .env
   source .env
   ```

### Usage

```bash
# Run the test
node utils/testing/test-chart-generation.js
```

### Expected Output

```
🧪 Chart Generation Test
========================

✅ API key found

📊 Fetching data from analytics API...
Endpoint: POST https://api.pricingsaas.com/functions/v1/api/analytics/diffs
Periods: [ '2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1' ]
Breakdown by: event_type

✅ Data fetched successfully!
Total pages: 2446
Periods: 8
Event types: 24
Sample event types: price_increased, price_decreased, plan_added, plan_removed, pricing_restructured

🔄 Transforming data to Chart.js format...
  - Price Increased: 456 total events
  - Price Decreased: 234 total events
  - Plan Added: 189 total events
  ...

✅ Transformed to 24 datasets across 8 periods

🎨 Generating chart via QuickChart...
Chart config size: 12345 bytes
✅ Chart generated successfully!

================================================================================
🎉 SUCCESS!
================================================================================

📊 Chart URL:
https://quickchart.io/chart/render/abc123

💡 Open this URL in your browser to view the chart
================================================================================
```

### What It Tests

- ✅ Analytics API authentication
- ✅ Diffs API endpoint with correct request format
- ✅ Data transformation (event_type breakdown)
- ✅ Chart.js configuration building
- ✅ QuickChart API integration (POST endpoint for large configs)
- ✅ URL generation for large datasets (24 event types)

### Troubleshooting

**Error: ANALYTICS_API_KEY environment variable not set**
- Make sure you've exported the API key in your shell
- Or add it to your `.env` file and source it

**Error: Analytics API error: 401**
- Your API key is invalid or expired
- Get a new key from the PricingSaaS dashboard

**Error: Analytics API error: 500**
- The analytics API is down or having issues
- Check the API status or try again later

**Error: QuickChart API error: 400**
- The chart configuration is invalid
- Check the console output for the chart config
- Verify the data transformation is working correctly

**Chart URL returns 404**
- QuickChart short URLs may expire after some time
- Re-run the test to generate a fresh URL

### Modifying the Test

The script includes multiple pre-configured graph configs. Change the selected config at line 75:

```javascript
// Test different graphs by changing this line:
const graphConfig = GRAPH_CONFIGS.pricingEvents;  // Change to: allEvents, pricingEvents, packagingEvents, productEvents, yearlyComparison
```

Available configs:
- **`allEvents`** - All 24 event types (no filtering), periods on X-axis
- **`pricingEvents`** - Only 8 pricing event types (price_increased, discount_added, etc.), periods on X-axis
- **`packagingEvents`** - Only 13 packaging event types (plan_added, threshold_added, etc.), periods on X-axis
- **`productEvents`** - Only 3 product event types (feature_added, feature_removed, feature_changed), periods on X-axis
- **`yearlyComparison`** - All event types with yearly periods, event types on X-axis (grouped by year)

Or create your own custom config:

```javascript
const graphConfig = {
  mode: 'diffs',
  diffsBreakdown: 'event_type',
  diffsEventCategory: 'pricing',  // 'all', 'pricing', 'packaging', or 'product'
  diffsSelectedPeriods: [
    '2024Q2', '2024Q3', '2024Q4',
    '2025Q1', '2025Q2', '2025Q3',
    '2025Q4', '2026Q1'
  ],
  diffsRequireAllPeriods: true,
  diffsShiftQuarters: true,
  chartType: 'grouped',
  title: 'Your Custom Title'
};
```

### Integration with Edge Function

This test script mirrors exactly what the `generate-chart` Edge Function does:
- Same API calls
- Same data transformation
- Same chart generation logic

If the test works locally, the Edge Function should work the same way.
