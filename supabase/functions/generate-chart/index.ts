// Supabase Edge Function for generating chart images
// Deploy this to your Supabase project using: supabase functions deploy generate-chart

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch diffs data from analytics API
async function fetchDiffsData(config: any, apiKey: string) {
  const response = await fetch(
    'https://api.pricingsaas.com/functions/v1/api/analytics/diffs',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        periods: config.diffsSelectedPeriods || [],
        options: {
          include_breakdowns: true,
          breakdown_by: [config.diffsBreakdown || 'event_type'],
          require_all_periods: config.diffsRequireAllPeriods || false,
          count_mode: 'unique'
        },
        filters: {}
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Analytics API error: ${response.status}`);
  }

  return response.json();
}

// Event type categories for filtering
const EVENT_CATEGORIES: Record<string, string[]> = {
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
function filterEventsByCategory(
  eventTypeData: Record<string, any>,
  category: string
): Record<string, any> {
  if (category === 'all' || !category) {
    return eventTypeData; // No filtering
  }

  const allowedTypes = EVENT_CATEGORIES[category];
  if (!allowedTypes) {
    console.warn(`Unknown category: ${category}, returning all events`);
    return eventTypeData;
  }

  const filtered: Record<string, any> = {};
  for (const eventType of allowedTypes) {
    if (eventTypeData[eventType]) {
      filtered[eventType] = eventTypeData[eventType];
    }
  }

  console.log(`[DEBUG] Filtered from ${Object.keys(eventTypeData).length} to ${Object.keys(filtered).length} event types (category: ${category})`);

  return filtered;
}

// Transform diffs API response to Chart.js format (periods on X-axis)
function transformDiffsToChartJs(data: any, config: any) {
  const periods = data.periods || [];
  const breakdownKey = `by_${config.diffsBreakdown || 'event_type'}`;
  let breakdownData = data[breakdownKey] || {};

  // Apply category filter if specified
  if (config.diffsEventCategory && config.diffsEventCategory !== 'all') {
    breakdownData = filterEventsByCategory(breakdownData, config.diffsEventCategory);
  }

  // Format event type names for display
  const formatEventType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
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
  const datasets = Object.entries(breakdownData).map(([eventType, periodData]: [string, any], index: number) => ({
    label: formatEventType(eventType),
    data: periods.map((period: string) => periodData[period]?.count || 0),
    backgroundColor: colors[index % colors.length],
    borderColor: colors[index % colors.length],
    borderWidth: 1
  }));

  return {
    type: 'bar',
    labels: periods,
    datasets,
    title: config.title || 'Chart',
    subtitle: data.metadata?.pages_with_all_periods
      ? `${data.metadata.pages_with_all_periods} total pages`
      : undefined
  };
}

// Transform diffs API response to Chart.js format (event types on X-axis)
function transformDiffsToEventsChart(data: any, config: any) {
  const breakdownKey = `by_${config.diffsBreakdown || 'event_type'}`;
  let breakdownData = data[breakdownKey] || {};

  // Apply category filter if specified
  if (config.diffsEventCategory && config.diffsEventCategory !== 'all') {
    breakdownData = filterEventsByCategory(breakdownData, config.diffsEventCategory);
  }

  // Format event type names for display
  const formatEventType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  // Normalize period keys (remove Y suffix if present)
  const normalizePeriod = (period: string) => {
    return period.replace(/Y$/i, '');
  };

  // Get normalized periods from response (API returns "2024", not "2024Y")
  const rawPeriods = data.periods || [];
  const normalizedPeriods = rawPeriods.map(normalizePeriod);

  // Calculate totals for each event type and sort by total descending
  const eventTypesWithTotals = Object.entries(breakdownData).map(([eventType, periodData]: [string, any]) => {
    const total = normalizedPeriods.reduce((sum, period) => {
      return sum + (periodData[period]?.count || 0);
    }, 0);
    return { eventType, periodData, total };
  });

  // Sort by total descending
  eventTypesWithTotals.sort((a, b) => b.total - a.total);

  // Build labels (event types on X-axis)
  const labels = eventTypesWithTotals.map(({ eventType }) => formatEventType(eventType));

  // Color palette for periods - custom colors for yearly comparison
  const colors = [
    '#131c3b', // First year (2024)
    '#aebb36'  // Second year (2025)
  ];

  // Build datasets - one per period
  const datasets = normalizedPeriods.map((period, index) => ({
    label: period,
    data: eventTypesWithTotals.map(({ periodData }) => periodData[period]?.count || 0),
    backgroundColor: colors[index % colors.length],
    borderColor: colors[index % colors.length],
    borderWidth: 1
  }));

  console.log(`[DEBUG] Events chart: ${labels.length} event types, ${datasets.length} periods`);

  return {
    type: 'bar',
    labels,
    datasets,
    title: config.title || 'Chart',
    subtitle: data.metadata?.pages_with_all_periods
      ? `${data.metadata.pages_with_all_periods} total pages`
      : undefined
  };
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { chartConfig } = await req.json() as any;

    console.log('[DEBUG] Received chartConfig:', JSON.stringify(chartConfig, null, 2));

    if (!chartConfig) {
      throw new Error('chartConfig is required');
    }

    let finalChartConfig = chartConfig;

    // Check if this is a "diffs" mode config that needs data fetching
    if (chartConfig.mode === 'diffs') {
      console.log('[DEBUG] Detected diffs mode, fetching data from analytics API');

      const analyticsApiKey = Deno.env.get('ANALYTICS_API_KEY');
      if (!analyticsApiKey) {
        throw new Error('ANALYTICS_API_KEY not configured');
      }

      // Fetch data from analytics API
      const data = await fetchDiffsData(chartConfig, analyticsApiKey);
      console.log('[DEBUG] Fetched diffs data, transforming to Chart.js format');

      // Check if this is an events-based chart (event types on X-axis)
      if (chartConfig.diffsChartMode === 'events' && chartConfig.diffsBreakdown === 'event_type') {
        console.log('[DEBUG] Using events-based transform (event types on X-axis)');
        finalChartConfig = transformDiffsToEventsChart(data, chartConfig);
      } else {
        // Standard transform (periods on X-axis)
        console.log('[DEBUG] Using standard transform (periods on X-axis)');
        finalChartConfig = transformDiffsToChartJs(data, chartConfig);
      }
    }

    // Validate final chart config has required fields
    if (!finalChartConfig.type) {
      throw new Error('chartConfig.type is required (bar, line, pie, doughnut, or radar)');
    }

    if (!finalChartConfig.labels || !Array.isArray(finalChartConfig.labels)) {
      throw new Error('chartConfig.labels is required and must be an array');
    }

    if (!finalChartConfig.datasets || !Array.isArray(finalChartConfig.datasets)) {
      throw new Error('chartConfig.datasets is required and must be an array');
    }

    // Set defaults (1920x1080 for report slides)
    const width = finalChartConfig.width || 1920;
    const height = finalChartConfig.height || 1080;

    // Build Chart.js v2 configuration (QuickChart defaults to v2)
    const chartJsConfig = {
      type: finalChartConfig.type,
      data: {
        labels: finalChartConfig.labels,
        datasets: finalChartConfig.datasets
      },
      options: {
        legend: {
          display: finalChartConfig.datasets.length > 1,
          position: 'top' as const,
          labels: {
            fontSize: 24,
            fontFamily: 'Arial, sans-serif'
          }
        },
        title: {
          display: !!finalChartConfig.title,
          text: finalChartConfig.title || '',
          fontSize: 42,
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              fontSize: 24,
              fontFamily: 'Arial, sans-serif'
            }
          }],
          xAxes: [{
            ticks: {
              fontSize: 48,
              fontFamily: 'Arial, sans-serif'
            }
          }]
        },
        responsive: false,
        maintainAspectRatio: false
      }
    };

    console.log('[DEBUG] Chart.js config built, calling QuickChart API');

    // Use QuickChart POST endpoint for large configurations
    const quickChartResponse = await fetch('https://quickchart.io/chart', {
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

    if (!quickChartResponse.ok) {
      throw new Error(`QuickChart API error: ${quickChartResponse.status}`);
    }

    // QuickChart returns the image directly, we need to get a URL
    // Use the short URL endpoint instead
    const shortUrlResponse = await fetch('https://quickchart.io/chart/create', {
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

    if (!shortUrlResponse.ok) {
      throw new Error(`QuickChart short URL API error: ${shortUrlResponse.status}`);
    }

    const shortUrlData = await shortUrlResponse.json();
    const chartImageUrl = shortUrlData.url;

    console.log('[DEBUG] QuickChart short URL generated:', chartImageUrl);

    // Return the image URL
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: chartImageUrl,
        width,
        height
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating chart:', error);

    return new Response(
      JSON.stringify({
        success: false,
        errorCode: 'CHART_GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
