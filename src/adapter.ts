import { auth } from "@canva/user";

interface SimpleRequest {
  containerIds?: string[];
  limit?: number;
  query?: string;
  sortBy?: string;
  filters?: Record<string, unknown>;
  types?: string[];
  containerId?: string;
  locale?: string;
}

interface SimpleResource {
  id: string;
  name: string;
  type: string; // "IMAGE" 
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  contentType?: string;
  parentContainerId?: string;
}

interface SimpleContainer {
  id: string;
  name: string;
  parentContainerId?: string;
}

interface SimpleResponse {
  type: "SUCCESS" | "ERROR";
  resources: SimpleResource[];
  containers?: SimpleContainer[];
  continuation?: string;
  errorCode?: string;
}

export async function findResources(
  request: SimpleRequest,
): Promise<SimpleResponse> {
  const userToken = await auth.getCanvaUserToken();

  // Connect to Supabase Edge Function for image resources
  const url = new URL(`${SUPABASE_URL}/functions/v1/canva-get-images`);

  try {
    // Debug: Log the request with types
    console.log("findResources called with:", request);
    console.log("SearchableListView requesting types:", request.types);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        ...request,
        canva_user_token: userToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase Edge Function failed (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const body = await response.json();
    
    // Debug: Log the response
    console.log("Edge function response:", body);

    if (body.success) {
      // Map containers (collections) separately - SearchableListView expects specific format
      const containers = (body.containers || []).map((container: Record<string, unknown>) => ({
        id: String(container.id),
        name: String(container.name),
        parentContainerId: String(container.parentContainerId || 'root'),
        // Don't include type, url, or thumbnail for containers
      }));
      
      // Map resources (images) separately 
      const resources = (body.resources || []).map((resource: Record<string, unknown>) => ({
        id: String(resource.id),
        name: String(resource.name),
        type: 'IMAGE',
        url: String(resource.url),
        thumbnail: String(resource.thumbnail || resource.url),
        width: Number(resource.width) || undefined,
        height: Number(resource.height) || undefined,
        contentType: String(resource.contentType || 'image/jpeg'),
        parentContainerId: String(resource.parentContainerId),
      }));

      // Debug: Log the final data
      console.log("Final containers:", containers);
      console.log("Final resources:", resources);
      
      // Check what types SearchableListView is requesting
      const requestedTypes = request.types || [];
      console.log("Filtering response for types:", requestedTypes);
      
      // Return different data based on what types are requested
      let finalContainers = containers;
      let finalResources = resources;
      
      // If specific types are requested, filter accordingly
      if (requestedTypes.length > 0) {
        if (requestedTypes.includes('FOLDER') && !requestedTypes.includes('IMAGE')) {
          // Only folders requested - return containers in resources array
          finalResources = containers.map(c => ({...c, type: 'FOLDER', url: ''}));
          finalContainers = [];
        } else if (requestedTypes.includes('IMAGE') && !requestedTypes.includes('FOLDER')) {
          // Only images requested
          finalContainers = [];
        }
      }
      
      console.log("Final response - containers:", finalContainers);
      console.log("Final response - resources:", finalResources);
      
      return {
        type: "SUCCESS",
        resources: finalResources,
        containers: finalContainers,
        continuation: body.continuation,
      };
    }

    throw new Error(`Supabase returned error: ${body.message || body.errorCode || 'Unknown error'}`);
  } catch (error) {
    // Log error for debugging (will be removed in production)
    // eslint-disable-next-line no-console
    console.error("Failed to fetch resources from Supabase:", error);
    
    return {
      type: "ERROR",
      resources: [],
      errorCode: "INTERNAL_ERROR",
    };
  }
}
