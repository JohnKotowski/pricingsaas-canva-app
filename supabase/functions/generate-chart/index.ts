// Supabase Edge Function for generating chart images
// Deploy this to your Supabase project using: supabase functions deploy generate-chart

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
  title?: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
  width?: number;
  height?: number;
}

interface GenerateChartRequest {
  chartConfig: ChartConfig;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { chartConfig } = await req.json() as GenerateChartRequest;

    if (!chartConfig) {
      throw new Error('chartConfig is required');
    }

    // Set defaults
    const width = chartConfig.width || 800;
    const height = chartConfig.height || 500;

    // Build Chart.js configuration
    const chartJsConfig = {
      type: chartConfig.type,
      data: {
        labels: chartConfig.labels,
        datasets: chartConfig.datasets
      },
      options: {
        plugins: {
          legend: {
            display: chartConfig.datasets.length > 1,
            position: 'top' as const,
            labels: {
              font: {
                size: 14,
                family: 'Arial, sans-serif'
              }
            }
          },
          title: {
            display: !!chartConfig.title,
            text: chartConfig.title || '',
            font: {
              size: 18,
              family: 'Arial, sans-serif',
              weight: 'bold' as const
            }
          }
        },
        responsive: false,
        maintainAspectRatio: false
      }
    };

    console.log('[DEBUG] Chart.js config:', JSON.stringify(chartJsConfig, null, 2));

    // Call QuickChart API to generate image
    const quickChartUrl = 'https://quickchart.io/chart';
    const params = new URLSearchParams({
      c: JSON.stringify(chartJsConfig),
      width: String(width),
      height: String(height),
      backgroundColor: 'white',
      format: 'png'
    });

    const chartImageUrl = `${quickChartUrl}?${params.toString()}`;

    console.log('[DEBUG] QuickChart URL generated (length):', chartImageUrl.length);

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
