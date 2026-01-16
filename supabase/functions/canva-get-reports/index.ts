// Supabase Edge Function for canva-get-reports
// Deploy this to your Supabase project using: supabase functions deploy canva-get-reports

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetReportsRequest {
  canva_user_token?: string;
  limit?: number;
  continuation?: string;
}

interface ReportElement {
  id: string;
  type: string;
  content: string;
}

interface Report {
  id: string;
  name: string;
  description?: string;
  elements: ReportElement[];
  created_at: string;
  updated_at: string;
  element_count: number;
  set_definition?: any;
}

// Fetch summary data from PricingSaaS API
async function fetchSummaryData(setDefinition: any, apiKey: string): Promise<any> {
  const baseUrl = 'https://api.pricingsaas.com/functions/v1';

  // Only include filters if they have values (don't send empty arrays)
  const filters: any = {};
  if (setDefinition?.categories?.length > 0) {
    filters.category_id = setDefinition.categories;
  }
  if (setDefinition?.employees?.length > 0) {
    filters.employees = setDefinition.employees;
  }

  const request = {
    period: Array.isArray(setDefinition?.period)
      ? undefined
      : (setDefinition?.period || 'latest'),
    periods: Array.isArray(setDefinition?.period)
      ? setDefinition.period
      : undefined,
    filters
  };

  const response = await fetch(`${baseUrl}/api/analytics/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    console.error('Failed to fetch summary data:', response.status, response.statusText);
    throw new Error(`Analytics API error: ${response.status}`);
  }

  return response.json();
}

// Map metric name to API response value
function getMetricValue(metric: string, summaryData: any): number | string | null {
  const mappings: Record<string, any> = {
    total_companies: summaryData?.summary?.total_companies,
    total_pages: summaryData?.summary?.total_pages,
    companies_with_addons: summaryData?.summary?.companies_with_addons,
    companies_with_multiple_pages: summaryData?.summary?.companies_with_multiple_pages,
    companies_with_free_plan: summaryData?.pricing_models?.companies_with_freemium,
    companies_with_trial: summaryData?.pricing_models?.companies_with_trial,
    companies_with_enterprise: summaryData?.summary?.companies_with_enterprise,
    companies_without_pricing: summaryData?.summary?.companies_without_pricing,
    percent_with_public_pricing: summaryData?.pricing_models?.percent_with_public_pricing,
  };

  return mappings[metric] ?? null;
}

// Enrich tiles elements with actual values
function enrichTilesElement(element: ReportElement, summaryData: any): ReportElement {
  try {
    const content = JSON.parse(element.content);

    if (content.config?.tiles && Array.isArray(content.config.tiles)) {
      content.config.tiles = content.config.tiles.map((tile: any) => ({
        ...tile,
        value: getMetricValue(tile.metric, summaryData)
      }));
    }

    return {
      ...element,
      content: JSON.stringify(content)
    };
  } catch (error) {
    console.error('Error enriching tiles element:', error);
    return element;
  }
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { canva_user_token, limit = 50, continuation } = await req.json() as GetReportsRequest;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const offset = continuation ? parseInt(continuation, 10) : 0;

    // Query app_saved_reports table (include set_definition for API filters)
    // MVP: Show both 'public' and 'team' visibility reports (no user mapping needed initially)
    let reportsQuery = supabase
      .from('app_saved_reports')
      .select('id, name, description, elements, set_definition, created_at, updated_at')
      .in('visibility', ['public', 'team'])
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reportsData, error: reportsError } = await reportsQuery;

    if (reportsError) {
      throw reportsError;
    }

    // Get Analytics API key
    const analyticsApiKey = Deno.env.get('ANALYTICS_API_KEY');
    console.log('[DEBUG] ANALYTICS_API_KEY available:', !!analyticsApiKey);
    console.log('[DEBUG] API key length:', analyticsApiKey?.length || 0);

    // Format reports with element count
    const reports: Report[] = await Promise.all(
      (reportsData || []).map(async (report: any) => {
        let elements = Array.isArray(report.elements) ? report.elements : [];

        // Check if report has tiles elements and API key is available
        const hasTiles = elements.some((e: ReportElement) => e.type === 'tiles');
        console.log(`[DEBUG] Report ${report.id}: hasTiles=${hasTiles}, hasApiKey=${!!analyticsApiKey}`);

        if (hasTiles && analyticsApiKey) {
          try {
            console.log(`[DEBUG] Fetching summary data for report ${report.id} with set_definition:`, JSON.stringify(report.set_definition));

            // Fetch summary data from PricingSaaS API
            const summaryData = await fetchSummaryData(report.set_definition, analyticsApiKey);
            console.log(`[DEBUG] Summary data received, keys:`, Object.keys(summaryData || {}));

            // Enrich tiles elements with actual values
            elements = elements.map((element: ReportElement) => {
              if (element.type === 'tiles') {
                console.log(`[DEBUG] Enriching tiles element:`, element.content.substring(0, 200));
                const enriched = enrichTilesElement(element, summaryData);
                console.log(`[DEBUG] Enriched tiles element:`, enriched.content.substring(0, 300));
                return enriched;
              }
              return element;
            });
            console.log(`[DEBUG] Enrichment completed successfully for report ${report.id}`);
          } catch (error) {
            console.error(`[ERROR] Failed to enrich tiles for report ${report.id}:`, error);
            console.error('[ERROR] Error details:', error instanceof Error ? error.message : String(error));
            console.error('[ERROR] Stack:', error instanceof Error ? error.stack : 'N/A');
            // Continue without enrichment if API call fails
          }
        } else {
          console.log(`[DEBUG] Skipping enrichment: hasTiles=${hasTiles}, hasApiKey=${!!analyticsApiKey}`);
        }

        return {
          id: String(report.id),
          name: String(report.name || 'Untitled Report'),
          description: report.description ? String(report.description) : undefined,
          elements,
          created_at: String(report.created_at),
          updated_at: String(report.updated_at),
          element_count: elements.length,
        };
      })
    );

    // Calculate next continuation token
    const nextContinuation = reports.length === limit ? String(offset + limit) : undefined;

    return new Response(
      JSON.stringify({
        success: true,
        reports,
        continuation: nextContinuation,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fetching reports:', error);

    return new Response(
      JSON.stringify({
        success: false,
        errorCode: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
