// Supabase Edge Function for template-pages
// Handles CRUD operations for Canva page templates
// Deploy: supabase functions deploy template-pages

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateRequest {
  action: 'list' | 'get' | 'create' | 'update' | 'delete';
  templateId?: string;
  templateData?: {
    name: string;
    description?: string;
    preview_image_url?: string;
    page_config: any; // PageConfig JSONB structure
  };
}

interface TemplateResponse {
  success: boolean;
  template?: any;
  templates?: any[];
  message?: string;
  errorCode?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as TemplateRequest;
    const { action, templateId, templateData } = requestData;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Extract user from JWT if provided (for RLS)
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (authError) {
        console.warn('Auth error:', authError);
      }
    }

    // Handle different actions
    switch (action) {
      case 'list': {
        const { data, error } = await supabase
          .from('app_template_pages')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Failed to list templates: ${error.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            templates: data || [],
          } as TemplateResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'get': {
        if (!templateId) {
          return new Response(
            JSON.stringify({
              success: false,
              errorCode: 'MISSING_TEMPLATE_ID',
              message: 'Template ID is required for get action',
            } as TemplateResponse),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        const { data, error } = await supabase
          .from('app_template_pages')
          .select('*')
          .eq('id', templateId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return new Response(
              JSON.stringify({
                success: false,
                errorCode: 'TEMPLATE_NOT_FOUND',
                message: 'Template not found',
              } as TemplateResponse),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
              }
            );
          }
          throw new Error(`Failed to get template: ${error.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            template: data,
          } as TemplateResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'create': {
        if (!templateData) {
          return new Response(
            JSON.stringify({
              success: false,
              errorCode: 'MISSING_TEMPLATE_DATA',
              message: 'Template data is required for create action',
            } as TemplateResponse),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        // Validate required fields
        if (!templateData.name || !templateData.page_config) {
          return new Response(
            JSON.stringify({
              success: false,
              errorCode: 'INVALID_TEMPLATE_DATA',
              message: 'Template name and page_config are required',
            } as TemplateResponse),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        // Use service role key for create to bypass RLS
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

        // Get current user for attribution (optional)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        const insertData = {
          ...templateData,
          user_id: user?.id || null, // Allow null for anonymous users
        };

        const { data, error } = await serviceClient
          .from('app_template_pages')
          .insert([insertData])
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create template: ${error.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            template: data,
          } as TemplateResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201,
          }
        );
      }

      case 'update': {
        if (!templateId || !templateData) {
          return new Response(
            JSON.stringify({
              success: false,
              errorCode: 'MISSING_DATA',
              message: 'Template ID and data are required for update action',
            } as TemplateResponse),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        const updateData = {
          ...templateData,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('app_template_pages')
          .update(updateData)
          .eq('id', templateId)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return new Response(
              JSON.stringify({
                success: false,
                errorCode: 'TEMPLATE_NOT_FOUND',
                message: 'Template not found or you do not have permission to update it',
              } as TemplateResponse),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
              }
            );
          }
          throw new Error(`Failed to update template: ${error.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            template: data,
          } as TemplateResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'delete': {
        if (!templateId) {
          return new Response(
            JSON.stringify({
              success: false,
              errorCode: 'MISSING_TEMPLATE_ID',
              message: 'Template ID is required for delete action',
            } as TemplateResponse),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        const { error } = await supabase
          .from('app_template_pages')
          .delete()
          .eq('id', templateId);

        if (error) {
          throw new Error(`Failed to delete template: ${error.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Template deleted successfully',
          } as TemplateResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            errorCode: 'INVALID_ACTION',
            message: `Invalid action: ${action}. Supported actions: list, get, create, update, delete`,
          } as TemplateResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
    }

  } catch (error) {
    console.error('Error in template-pages function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        errorCode: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      } as TemplateResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
