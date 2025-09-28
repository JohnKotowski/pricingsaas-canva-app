// Example Supabase Edge Function for canva-get-images
// Deploy this to your Supabase project using: supabase functions deploy canva-get-images

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FindResourcesRequest {
  query?: string;
  continuation?: string;
  containerIds?: string[];
  limit?: number;
  sortBy?: string;
  filters?: Record<string, unknown>;
  canva_user_token?: string;
  getAllAssets?: boolean; // New flag for simple app mode
}

interface CanvaResource {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  contentType: string;
  tags?: string[];
  parentContainerId?: string;
}

interface CanvaContainer {
  id: string;
  name: string;
  parentContainerId?: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, continuation, limit = 1000, sortBy, filters, containerIds, getAllAssets } = await req.json() as FindResourcesRequest;
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const offset = continuation ? parseInt(continuation, 10) : 0;
    let resources: CanvaResource[] = [];
    let containers: CanvaContainer[] = [];

    // NEW: Handle getAllAssets mode for simple app
    if (getAllAssets) {
      // Get all assets from all collections with collection names
      const allAssetsQuery = supabase
        .from('app_assets')
        .select(`
          id,
          title,
          description,
          primary_image,
          secondary_image,
          cropped_image_url,
          original_image_url,
          canva_asset_id,
          collection_id,
          app_collections!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit * 4); // Get more since we want all assets

      const { data: allAssets, error: allAssetsError } = await allAssetsQuery;

      if (allAssetsError) {
        throw allAssetsError;
      }

      const formattedAssets = allAssets?.map((asset: any) => ({
        id: String(asset.id),
        name: String(asset.title || '') || 'Untitled Asset',
        thumbnail: String(asset.cropped_image_url || asset.primary_image || asset.original_image_url || ''),
        url: String(asset.primary_image || asset.cropped_image_url || ''),
        collection_name: String(asset.app_collections?.name || 'Unknown Collection'),
        header: String(asset.header || ''),
        subheader: String(asset.subheader || ''),
        version: String(asset.version || ''),
      })) || [];

      return new Response(
        JSON.stringify({
          success: true,
          allAssets: formattedAssets,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // EXISTING: Handle SearchableListView mode 
    if (!containerIds || containerIds.length === 0 || containerIds.includes('root')) {
      // Return app_collections as containers (folders)
      let collectionsQuery = supabase
        .from('app_collections')
        .select('id, name, description');

      if (query) {
        collectionsQuery = collectionsQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (sortBy) {
        const [column, direction] = sortBy.split(' ');
        collectionsQuery = collectionsQuery.order(column, { ascending: direction === 'ASC' });
      } else {
        collectionsQuery = collectionsQuery.order('created_at', { ascending: false });
      }

      collectionsQuery = collectionsQuery.range(offset, offset + limit - 1);

      const { data: collections, error: collectionsError } = await collectionsQuery;

      if (collectionsError) {
        throw collectionsError;
      }

      containers = collections?.map((collection: Record<string, unknown>) => ({
        id: String(collection.id),
        name: String(collection.name || 'Untitled Collection'),
        parentContainerId: 'root'
      })) || [];

    } else {
      // Return app_assets for the specified collection
      const collectionId = containerIds[0];
      
      let assetsQuery = supabase
        .from('app_assets')
        .select(`
          *,
          pages!app_assets_page_id_fkey(
            company_id,
            subslug,
            companies!pages_company_id_fkey(
              logo_url,
              slug
            )
          ),
          secondary_pages:pages!app_assets_secondary_page_id_fkey(
            company_id,
            subslug,
            companies!pages_company_id_fkey(
              logo_url,
              slug
            )
          )
        `)
        .eq('collection_id', collectionId);

      if (query) {
        assetsQuery = assetsQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Apply filters
      if (filters?.fileType) {
        assetsQuery = assetsQuery.ilike('content_type', `%${filters.fileType}%`);
      }

      if (sortBy) {
        const [column, direction] = sortBy.split(' ');
        assetsQuery = assetsQuery.order(column, { ascending: direction === 'ASC' });
      } else {
        assetsQuery = assetsQuery.order('created_at', { ascending: false });
      }

      assetsQuery = assetsQuery.range(offset, offset + limit - 1);

      const { data: assets, error: assetsError } = await assetsQuery;

      if (assetsError) {
        throw assetsError;
      }

      // Get company information by looking up pages that match asset slugs
      const companyLookup = new Map();
      if (assets && assets.length > 0) {
        // Get all unique asset slugs that we need to find companies for
        const assetSlugs = [...new Set(assets.map(asset => {
          const assetSlug = String(asset.slug || '');
          return assetSlug;
        }).filter(Boolean))];

        if (assetSlugs.length > 0) {
          // Look up pages that have these slugs as subslug, then get company info
          const { data: pages } = await supabase
            .from('pages')
            .select('subslug, company_id')
            .in('subslug', assetSlugs);

          if (pages && pages.length > 0) {
            // Get unique company IDs
            const companyIds = [...new Set(pages.map(page => page.company_id).filter(Boolean))];

            if (companyIds.length > 0) {
              // Look up companies by ID
              const { data: companies } = await supabase
                .from('companies')
                .select('id, slug, logo_url')
                .in('id', companyIds);

              if (companies) {
                // Create a map of company_id to company info
                const companyByIdMap = new Map();
                companies.forEach(company => {
                  companyByIdMap.set(company.id, company);
                });

                // Map asset slugs to company info
                pages.forEach(page => {
                  if (page.subslug && page.company_id) {
                    const company = companyByIdMap.get(page.company_id);
                    if (company) {
                      companyLookup.set(page.subslug, company);
                    }
                  }
                });
              }
            }
          }
        }

        // Also get direct company relationships from existing page relationships
        assets.forEach(asset => {
          const directCompanySlug = String((asset.pages as any)?.companies?.slug || '');
          const directCompanyLogo = String((asset.pages as any)?.companies?.logo_url || '');
          if (directCompanySlug && directCompanyLogo) {
            companyLookup.set(directCompanySlug, { slug: directCompanySlug, logo_url: directCompanyLogo });
          }
        });
      }

      resources = assets?.map((asset: Record<string, unknown>, index: number) => {
        // Get the thumbnail URL from cropped_image_url or other URL fields
        const thumbnailUrl = String(asset.cropped_image_url || asset.primary_image || asset.original_image_url || '');

        // For the main URL, use cropped_image_url as primary choice
        const assetUrl = String(asset.cropped_image_url || asset.primary_image || asset.original_image_url || '');

        if (!assetUrl) {
          console.warn(`No image URL found for asset ${asset.id}`);
        }

        // Use type and comparison_mode fields
        const assetType = String(asset.type || 'simple');
        const comparisonMode = String(asset.comparison_mode || 'single');

        // Get individual components
        const directCompanySlug = String((asset.pages as any)?.companies?.slug || '');
        const pageSubslug = String((asset.pages as any)?.subslug || '');
        const assetSlug = String(asset.slug || pageSubslug || '');

        // Get company info by looking up the asset slug in our company lookup
        let companyInfo = companyLookup.get(assetSlug); // Look up by asset slug first (e.g., "slack")
        if (!companyInfo && directCompanySlug) {
          companyInfo = companyLookup.get(directCompanySlug); // Fallback to direct company slug
        }

        const companySlug = String(companyInfo?.slug || directCompanySlug || '');
        const companyLogoUrl = String(companyInfo?.logo_url || (asset.pages as any)?.companies?.logo_url || '');

        return {
          id: String(asset.id),
          name: String(asset.title || asset.filename || '') || `Asset ${index + 1}`,
          slug: assetSlug,  // Use the actual asset slug from CSV
          url: assetUrl,
          thumbnail: thumbnailUrl,
          company_logo_url: companyLogoUrl,
          company_slug: companySlug,  // Use just the company slug
          header: String(asset.header || ''),
          subheader: String(asset.subheader || ''),
          version: String(asset.version || ''),
          secondary_version: String(asset.secondary_version || ''),
          crop_aspect_ratio: String(asset.crop_aspect_ratio || '1:1'),
          // Add all image URL fields for dual image support
          primary_image: String(asset.primary_image || ''),
          secondary_image: String(asset.secondary_image || ''),
          primary_original_url: String(asset.primary_original_url || ''),
          secondary_original_url: String(asset.secondary_original_url || ''),
          primary_cropped_url: String(asset.primary_cropped_url || ''),
          secondary_cropped_url: String(asset.secondary_cropped_url || ''),
          primary_markup_url: String(asset.primary_markup_url || ''),
          secondary_markup_url: String(asset.secondary_markup_url || ''),
          type: assetType,
          asset_type: assetType,
          comparison_mode: comparisonMode,
          // Secondary page company info (if different from primary)
          secondary_company_logo_url: String((asset.secondary_pages as any)?.companies?.logo_url || ''),
          secondary_company_slug: String((asset.secondary_pages as any)?.companies?.slug || ''),
          width: Number(asset.width) || undefined,
          height: Number(asset.height) || undefined,
          contentType: String(asset.content_type || asset.mime_type || 'image/jpeg'),
          tags: Array.isArray(asset.tags) ? asset.tags.map(String) : [],
          parentContainerId: String(collectionId),
        };
      }) || [];
    }

    // Calculate next continuation token
    const totalItems = resources.length + containers.length;
    const nextContinuation = totalItems === limit ? String(offset + limit) : undefined;

    return new Response(
      JSON.stringify({
        success: true,
        resources,
        containers,
        continuation: nextContinuation,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching images:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        errorCode: 'INTERNAL_ERROR',
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});