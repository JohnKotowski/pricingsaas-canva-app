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

// Fetch crosstab data from analytics API (for category + event_type breakdown)
async function fetchCrosstabData(config: any, apiKey: string) {
  const response = await fetch(
    'https://api.pricingsaas.com/functions/v1/api/analytics/diffs/crosstab',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        periods: config.diffsSelectedPeriods || [],
        group_by: config.diffsBreakdown || 'category',
        filters: {},
        options: {}
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Analytics Crosstab API error: ${response.status}`);
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

// Inverse mapping: event_type -> category
const EVENT_TYPE_TO_CATEGORY: Record<string, string> = {};
for (const [category, eventTypes] of Object.entries(EVENT_CATEGORIES)) {
  for (const eventType of eventTypes) {
    EVENT_TYPE_TO_CATEGORY[eventType] = category;
  }
}

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

// Aggregate event types into categories
function aggregateEventsByCategory(eventTypeData: Record<string, any>): Record<string, any> {
  const categoryData: Record<string, any> = {
    pricing: {},
    packaging: {},
    product: {}
  };

  // Iterate through all event types
  for (const [eventType, periodData] of Object.entries(eventTypeData)) {
    const category = EVENT_TYPE_TO_CATEGORY[eventType];

    if (!category) {
      console.warn(`Unknown event type: ${eventType}, skipping`);
      continue;
    }

    // Sum counts for each period into the category
    for (const [period, value] of Object.entries(periodData as Record<string, any>)) {
      if (!categoryData[category][period]) {
        categoryData[category][period] = { total_events: 0 };
      }

      // Add count from this event type to the category total
      // Handle both object format {count: N} and primitive number format
      let countToAdd = 0;
      if (typeof value === 'number') {
        countToAdd = value;
      } else if (typeof value === 'object' && value !== null) {
        countToAdd = value.count || 0;
      }
      categoryData[category][period].total_events += countToAdd;
    }
  }

  // Add category_name field for display
  categoryData.pricing.category_name = 'Pricing';
  categoryData.packaging.category_name = 'Packaging';
  categoryData.product.category_name = 'Product';

  return categoryData;
}

// Transform diffs API response to Chart.js format (periods on X-axis)
function transformDiffsToChartJs(data: any, config: any) {
  const periods = data.periods || [];

  // Check if we should aggregate event types into categories FIRST
  let breakdownData: Record<string, any>;
  let actualBreakdown = config.diffsBreakdown || 'event_type';

  if (config.diffsGroupByCategory === true) {
    // Aggregate event types into 3 categories
    const eventTypeData = data.by_event_type || {};
    breakdownData = aggregateEventsByCategory(eventTypeData);
    actualBreakdown = 'category';
  } else {
    // Use the breakdown specified in config
    const breakdownKey = `by_${config.diffsBreakdown || 'event_type'}`;
    breakdownData = data[breakdownKey] || {};

    // Apply category filter only if breakdown is by event_type
    if (config.diffsBreakdown === 'event_type' && config.diffsEventCategory && config.diffsEventCategory !== 'all') {
      breakdownData = filterEventsByCategory(breakdownData, config.diffsEventCategory);
    }
  }

  // Format period labels (e.g., "2024Q1" -> "2024 Q1")
  const formatPeriod = (period: string) => {
    return period.replace(/Q(\d)/, 'Q$1').replace(/(\d{4})Q/, '$1 Q');
  };

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

  // Calculate totals and sort by occurrence (highest to lowest)
  const itemsWithTotals = Object.entries(breakdownData)
    .filter(([key]) => !key.startsWith('_') && key !== 'category_name')
    .map(([key, periodData]: [string, any]) => {
      // Calculate total across all periods
      const total = periods.reduce((sum: number, period: string) => {
        const value = periodData[period];
        if (!value) return sum;

        if (actualBreakdown === 'category') {
          return sum + (value.total_events || value.total_diffs || 0);
        }
        return sum + (value.count || 0);
      }, 0);

      return { key, periodData, total };
    });

  // Sort by total descending (highest to lowest)
  itemsWithTotals.sort((a, b) => b.total - a.total);

  // Build datasets - one per event type or category
  const datasets = itemsWithTotals.map(({ key, periodData }, index: number) => {
    // Extract label based on breakdown type
    const label = actualBreakdown === 'category'
      ? (periodData.category_name || key)
      : formatEventType(key);

    // Extract count based on breakdown type
    const data = periods.map((period: string) => {
      const value = periodData[period];
      if (!value) return 0;

      // For category breakdown, use total_events field
      if (actualBreakdown === 'category') {
        return value.total_events || value.total_diffs || 0;
      }

      // For event_type breakdown, use count field
      return value.count || 0;
    });

    return {
      label,
      data,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1
    };
  });

  return {
    type: 'bar',
    labels: periods.map(formatPeriod),
    datasets,
    stacked: config.diffsStacked || false,
    title: config.title || 'Chart',
    subtitle: data.metadata?.pages_with_all_periods
      ? `${data.metadata.pages_with_all_periods} total pages`
      : undefined
  };
}

// Transform diffs API response to Chart.js format (event types on X-axis)
function transformDiffsToEventsChart(data: any, config: any) {
  // Check if we should aggregate event types into categories FIRST
  // When diffsGroupByCategory is true, always start from by_event_type data
  if (config.diffsGroupByCategory === true) {
    const eventTypeData = data.by_event_type || {};

    // Aggregate event types into 3 categories
    const breakdownData = aggregateEventsByCategory(eventTypeData);

    // Override config to use category breakdown
    config.diffsBreakdown = 'category';

    // Continue with the aggregated data
    return buildEventsChart(data, config, breakdownData);
  }

  // Normal path: use the breakdown specified in config
  const breakdownKey = `by_${config.diffsBreakdown || 'event_type'}`;
  let breakdownData = data[breakdownKey] || {};

  // Apply category filter if specified
  if (config.diffsEventCategory && config.diffsEventCategory !== 'all') {
    breakdownData = filterEventsByCategory(breakdownData, config.diffsEventCategory);
  }

  return buildEventsChart(data, config, breakdownData);
}

// Helper function to build the events chart from breakdown data
function buildEventsChart(data: any, config: any, breakdownData: Record<string, any>) {

  // Format period labels (e.g., "2024Q1" -> "2024 Q1", "2024" stays "2024")
  const formatPeriod = (period: string) => {
    return period.replace(/Q(\d)/, 'Q$1').replace(/(\d{4})Q/, '$1 Q');
  };

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
  // Filter out debug keys
  const eventTypesWithTotals = Object.entries(breakdownData)
    .filter(([key]) => !key.startsWith('_'))
    .map(([eventType, periodData]: [string, any]) => {
    const total = normalizedPeriods.reduce((sum, period) => {
      const value = periodData[period];
      if (!value) return sum;

      // For category breakdown, use total_events field
      if (config.diffsBreakdown === 'category') {
        return sum + (value.total_events || value.total_diffs || 0);
      }

      // For event_type breakdown, use count field
      return sum + (value.count || 0);
    }, 0);
    return { eventType, periodData, total };
  });

  // Sort by total descending
  eventTypesWithTotals.sort((a, b) => b.total - a.total);

  // Build labels (event types or categories on X-axis)
  const labels = eventTypesWithTotals.map(({ eventType, periodData }) => {
    // For category breakdown, use category_name
    if (config.diffsBreakdown === 'category') {
      return periodData.category_name || eventType;
    }
    // For event_type breakdown, format the event type name
    return formatEventType(eventType);
  });

  // Color palette for periods - using brand colors and darker derivatives
  const colors = [
    '#131c3b', // Navi
    '#aebb36', // Dark Lime
    '#3e5dc2', // Blue
    '#a8b334', // Darker Lime (derivative of Lime)
    '#5d6dc4', // Darker Purple (derivative of Purple)
    '#191919', // Black
    '#2d4591', // Darker Blue (derivative of Blue)
    '#8a9628'  // Darkest Lime (derivative of Dark Lime)
  ];

  // Build datasets - one per period
  const datasets = normalizedPeriods.map((period, index) => {
    const data = eventTypesWithTotals.map(({ periodData }) => {
      const value = periodData[period];
      if (!value) return 0;

      // For category breakdown, use total_events field
      if (config.diffsBreakdown === 'category') {
        return value.total_events || value.total_diffs || 0;
      }

      // For event_type breakdown, use count field
      return value.count || 0;
    });

    return {
      label: formatPeriod(period),
      data,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1
    };
  });

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

// Transform crosstab API response to stacked bar chart (categories on X-axis, event types stacked)
function transformCrosstabToStackedChart(data: any, config: any) {
  // Extract categories from data array
  let categoryData = data.data || [];

  // Get all unique event types
  const allEventTypes = new Set<string>();
  categoryData.forEach((item: any) => {
    Object.keys(item.event_counts || {}).forEach(eventType => allEventTypes.add(eventType));
  });

  // Filter event types by category if specified
  let filteredEventTypes = Array.from(allEventTypes);
  if (config.diffsEventCategory && config.diffsEventCategory !== 'all') {
    const allowedTypes = EVENT_CATEGORIES[config.diffsEventCategory];
    if (allowedTypes) {
      filteredEventTypes = filteredEventTypes.filter(eventType => allowedTypes.includes(eventType));
      console.log(`[DEBUG] Filtered to ${filteredEventTypes.length} ${config.diffsEventCategory} event types`);
    }
  }

  // Recalculate totals based on filtered event types and sort
  categoryData = categoryData.map((item: any) => {
    const filteredTotal = filteredEventTypes.reduce((sum: number, eventType: string) => {
      return sum + (item.event_counts[eventType] || 0);
    }, 0);
    return { ...item, filteredTotal };
  });
  categoryData.sort((a: any, b: any) => b.filteredTotal - a.filteredTotal);

  // Build labels (categories on X-axis)
  const labels = categoryData.map((item: any) => item.category);

  // Format event type names for display
  const formatEventType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  // Color palette with high contrast and distinct hues
  const colors = [
    '#131c3b', // Dark Navy (brand)
    '#aebb36', // Lime Green (brand)
    '#e63946', // Red
    '#3e5dc2', // Blue (brand)
    '#f77f00', // Orange
    '#06aed5', // Cyan
    '#191919', // Black (brand)
    '#9d4edd', // Purple
    '#2a9d8f', // Teal
    '#e76f51', // Coral
    '#457b9d', // Steel Blue
    '#c9184a', // Crimson
    '#ffba08', // Gold
    '#6a4c93', // Deep Purple
    '#06d6a0', // Mint
    '#ef476f', // Pink
    '#118ab2', // Ocean Blue
    '#073b4c', // Dark Teal
    '#ffd166', // Yellow
    '#8338ec', // Violet
    '#fb5607', // Bright Orange
    '#4361ee', // Royal Blue
    '#a8dadc', // Light Blue
    '#d90429'  // Dark Red
  ];

  // Sort filtered event types by total count (highest to lowest)
  const eventTypeTotals = filteredEventTypes.map(eventType => {
    const total = categoryData.reduce((sum: number, item: any) => {
      return sum + (item.event_counts[eventType] || 0);
    }, 0);
    return { eventType, total };
  });
  eventTypeTotals.sort((a, b) => b.total - a.total);

  // Build datasets - one per event type (will be stacked)
  const datasets = eventTypeTotals.map(({ eventType }, index) => {
    const data = categoryData.map((item: any) => item.event_counts[eventType] || 0);

    return {
      label: formatEventType(eventType),
      data,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1
    };
  });

  console.log(`[DEBUG] Crosstab stacked chart: ${labels.length} categories, ${datasets.length} event types`);

  return {
    type: 'bar',
    labels,
    datasets,
    title: config.title || 'Chart',
    subtitle: data.totals
      ? `${data.totals.companies} companies, ${data.totals.events} total events`
      : undefined,
    stacked: true
  };
}

// Transform diffs API response to stacked bar chart (categories on X-axis, periods stacked)
function transformDiffsToStackedCategories(data: any, config: any) {
  const periods = data.periods || [];
  const breakdownKey = `by_${config.diffsBreakdown || 'category'}`;
  const breakdownData = data[breakdownKey] || {};

  // Format period labels (e.g., "2024Q1" -> "2024 Q1")
  const formatPeriod = (period: string) => {
    return period.replace(/Q(\d)/, 'Q$1').replace(/(\d{4})Q/, '$1 Q');
  };

  // Extract categories and their names
  const categoriesWithData = Object.entries(breakdownData).map(([key, periodData]: [string, any]) => {
    const categoryName = config.diffsBreakdown === 'category'
      ? (periodData.category_name || key)
      : key;

    // Calculate total across all periods
    const total = periods.reduce((sum: number, period: string) => {
      const value = periodData[period];
      if (!value) return sum;
      if (config.diffsBreakdown === 'category') {
        return sum + (value.total_events || value.total_diffs || 0);
      }
      return sum + (value.count || 0);
    }, 0);

    return { key, periodData, categoryName, total };
  });

  // Sort categories by total descending
  categoriesWithData.sort((a, b) => b.total - a.total);

  // Build labels (categories on X-axis)
  const labels = categoriesWithData.map(({ categoryName }) => categoryName);

  // Color palette for periods - using brand colors and darker derivatives
  const colors = [
    '#131c3b', // Navi
    '#aebb36', // Dark Lime
    '#3e5dc2', // Blue
    '#a8b334', // Darker Lime (derivative of Lime)
    '#5d6dc4', // Darker Purple (derivative of Purple)
    '#191919', // Black
    '#2d4591', // Darker Blue (derivative of Blue)
    '#8a9628'  // Darkest Lime (derivative of Dark Lime)
  ];

  // Build datasets - one per period (will be stacked)
  const datasets = periods.map((period: string, index: number) => {
    const data = categoriesWithData.map(({ periodData }) => {
      const value = periodData[period];
      if (!value) return 0;

      // For category breakdown, use total_events field
      if (config.diffsBreakdown === 'category') {
        return value.total_events || value.total_diffs || 0;
      }

      // For event_type breakdown, use count field
      return value.count || 0;
    });

    return {
      label: formatPeriod(period),
      data,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1
    };
  });

  console.log(`[DEBUG] Stacked categories chart: ${labels.length} categories, ${datasets.length} period layers`);

  return {
    type: 'bar',
    labels,
    datasets,
    title: config.title || 'Chart',
    subtitle: data.metadata?.pages_with_all_periods
      ? `${data.metadata.pages_with_all_periods} total pages`
      : undefined,
    stacked: true
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

      // Check if we should use crosstab endpoint (categories on X with event type breakdown)
      // BUT: if diffsGroupByCategory is true, use regular diffs endpoint with aggregation instead
      if (chartConfig.diffsChartMode === 'categories' && chartConfig.diffsBreakdown === 'category' && !chartConfig.diffsGroupByCategory) {
        console.log('[DEBUG] Using crosstab endpoint for category + event_type breakdown');
        const data = await fetchCrosstabData(chartConfig, analyticsApiKey);
        console.log('[DEBUG] Fetched crosstab data, transforming to stacked chart');
        finalChartConfig = transformCrosstabToStackedChart(data, chartConfig);
      } else {
        // Fetch data from regular diffs API
        // If diffsGroupByCategory is true, force breakdown to event_type
        const configForFetch = chartConfig.diffsGroupByCategory
          ? { ...chartConfig, diffsBreakdown: 'event_type' }
          : chartConfig;

        const data = await fetchDiffsData(configForFetch, analyticsApiKey);

        // Check if this is a stacked chart (categories on X-axis, periods stacked)
        if (chartConfig.diffsChartMode === 'categories_stacked') {
          console.log('[DEBUG] Using stacked categories transform (categories on X-axis, periods stacked)');
          finalChartConfig = transformDiffsToStackedCategories(data, chartConfig);
        } else if (chartConfig.diffsChartMode === 'events' || chartConfig.diffsChartMode === 'categories') {
          // Breakdown items on X-axis (grouped bars)
          console.log('[DEBUG] Using breakdown-on-X transform (categories/events on X-axis)');
          finalChartConfig = transformDiffsToEventsChart(data, chartConfig);
        } else {
          // Standard transform (periods on X-axis)
          console.log('[DEBUG] Using standard transform (periods on X-axis)');
          finalChartConfig = transformDiffsToChartJs(data, chartConfig);
        }
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
            stacked: finalChartConfig.stacked || false,
            ticks: {
              beginAtZero: true,
              fontSize: 24,
              fontFamily: 'Arial, sans-serif'
            }
          }],
          xAxes: [{
            stacked: finalChartConfig.stacked || false,
            ticks: {
              fontSize: 28,
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
