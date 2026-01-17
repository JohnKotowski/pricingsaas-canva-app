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

// Transform diffs API response to Chart.js format
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

      // Transform to Chart.js format
      finalChartConfig = transformDiffsToChartJs(data, chartConfig);
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

    // Build Chart.js configuration
    const chartJsConfig = {
      type: finalChartConfig.type,
      data: {
        labels: finalChartConfig.labels,
        datasets: finalChartConfig.datasets
      },
      options: {
        plugins: {
          legend: {
            display: finalChartConfig.datasets.length > 1,
            position: 'top' as const,
            labels: {
              font: {
                size: 24,
                family: 'Arial, sans-serif'
              }
            }
          },
          title: {
            display: !!finalChartConfig.title,
            text: finalChartConfig.title || '',
            font: {
              size: 42,
              family: 'Arial, sans-serif',
              weight: 'bold' as const
            }
          },
          subtitle: finalChartConfig.subtitle ? {
            display: true,
            text: finalChartConfig.subtitle,
            font: {
              size: 32,
              family: 'Arial, sans-serif'
            }
          } : undefined
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 24
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 24
              }
            }
          }
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
