import { Box, Rows, Grid, Text, LoadingIndicator, Button } from "@canva/app-ui-kit";
import { addElementAtPoint, addElementAtCursor } from "@canva/design";
import { upload } from "@canva/asset";
import { features } from "@canva/platform";
import "@canva/app-ui-kit/styles.css";
import { useState, useEffect } from "react";
import * as styles from "./index.css";

interface Asset {
  id: string;
  name: string;
  thumbnail: string;
  url: string;
  collection_name?: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
}

export function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load collections on app start
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call edge function to get collections (no containerIds = root level)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/canva-get-images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          // Don't specify containerIds to get collections
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to load collections: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.containers) {
        setCollections(data.containers.map((container: any) => ({
          id: container.id,
          name: container.name,
          description: container.description,
        })));
      } else {
        throw new Error(data.message || 'Failed to load collections');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load collections';
      setError(errorMessage);
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async (collectionId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call edge function to get assets for specific collection
      const response = await fetch(`${SUPABASE_URL}/functions/v1/canva-get-images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          containerIds: [collectionId], // Specify collection to get its assets
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to load assets: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.resources) {
        setAssets(data.resources);
      } else {
        throw new Error(data.message || 'Failed to load assets');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assets';
      setError(errorMessage);
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCollection = async (collection: Collection) => {
    setSelectedCollection(collection);
    await loadAssets(collection.id);
  };

  const goBackToCollections = () => {
    setSelectedCollection(null);
    setAssets([]);
    setError(null);
  };

  const insertAsset = async (asset: Asset) => {
    try {
      setError(null);
      
      console.log('Inserting asset:', asset);
      
      // Always upload the image first, just like the reference app
      const uploadResult = await upload({
        type: "image",
        thumbnailUrl: asset.thumbnail, // Use thumbnailUrl parameter like reference app
        url: asset.thumbnail, // Also provide as main URL
        mimeType: "image/jpeg",
        aiDisclosure: "none",
      });
      
      // Create image element using the uploaded reference
      const imageElement = {
        type: "image" as const,
        ref: uploadResult.ref,
        altText: { text: asset.name, decorative: false },
      };

      // Add to design using the same pattern as reference app
      if (features.isSupported(addElementAtPoint)) {
        await addElementAtPoint(imageElement);
      } else if (features.isSupported(addElementAtCursor)) {
        await addElementAtCursor(imageElement);
      } else {
        throw new Error("Image insertion not supported");
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add image to design';
      setError(errorMessage);
      console.error('Error inserting asset:', err);
    }
  };

  return (
    <div className={styles.rootWrapper}>
      <Rows spacing="2u">
        {/* Header with conditional title and back button */}
        <Box paddingX="3u" paddingY="2u">
          {selectedCollection ? (
            <Rows spacing="2u">
              <Button 
                variant="secondary" 
                onClick={goBackToCollections} 
                style={{ 
                  alignSelf: 'flex-start',
                  padding: '0.75u 1.5u',
                  borderRadius: '8px',
                }}
              >
                ← Collections
              </Button>
              <Box>
                <Text size="xlarge" weight="bold">
                  {selectedCollection.name}
                </Text>
                <Text size="medium" tone="secondary">
                  Click any image to add it to your design
                </Text>
              </Box>
            </Rows>
          ) : (
            <Box>
              <Text size="xlarge" weight="bold">
                Your Collections
              </Text>
              <Text size="medium" tone="secondary">
                Select a collection to browse its images
              </Text>
            </Box>
          )}
        </Box>

        {/* Error display */}
        {error && (
          <Box paddingX="3u">
            <Box 
              padding="2u" 
              style={{ 
                backgroundColor: '#fef2f2', 
                border: '2px solid #fca5a5', 
                borderRadius: '12px' 
              }}
            >
              <Text size="medium" weight="medium" style={{ color: '#dc2626' }}>
                ⚠️ {error}
              </Text>
            </Box>
          </Box>
        )}

        {/* Loading state */}
        {loading ? (
          <Box paddingX="2u" paddingY="4u">
            <LoadingIndicator size="large" />
          </Box>
        ) : selectedCollection ? (
          /* Asset grid view */
          assets.length > 0 ? (
            <Box paddingX="3u">
              <Grid columns="2" spacing="3u">
                {assets.map((asset) => (
                  <Button
                    key={asset.id}
                    variant="tertiary"
                    onClick={() => insertAsset(asset)}
                    style={{
                      height: 'auto',
                      padding: '0',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box>
                      {/* Image thumbnail */}
                      <div
                        style={{
                          width: '100%',
                          height: '160px',
                          backgroundImage: asset.thumbnail ? `url(${asset.thumbnail})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: asset.thumbnail ? 'transparent' : '#f9fafb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!asset.thumbnail && (
                          <Text size="small" tone="tertiary">
                            No Preview
                          </Text>
                        )}
                      </div>
                      
                      {/* Asset name */}
                      <Box padding="2u">
                        <Text size="medium" weight="medium" align="left">
                          {asset.name}
                        </Text>
                        <Text size="small" tone="tertiary" align="left">
                          Click to add to design
                        </Text>
                      </Box>
                    </Box>
                  </Button>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box paddingX="3u" paddingY="6u">
              <Text align="center" tone="secondary">
                No assets found in this collection.
              </Text>
            </Box>
          )
        ) : (
          /* Collections grid view */
          collections.length > 0 ? (
            <Box paddingX="3u">
              <Grid columns="2" spacing="3u">
                {collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant="tertiary"
                    onClick={() => selectCollection(collection)}
                    style={{
                      height: 'auto',
                      padding: '0',
                      border: '2px solid #e5e7eb',
                      borderRadius: '16px',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      aspectRatio: '1',
                      minHeight: '140px',
                    }}
                  >
                    <Box padding="2u" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                      <Rows spacing="2u" align="center">
                        {/* Large folder icon */}
                        <Text size="xxlarge" style={{ fontSize: '48px', lineHeight: '1' }}>
                          📁
                        </Text>
                        
                        {/* Collection name */}
                        <Box>
                          <Text size="medium" weight="bold" align="center">
                            {collection.name}
                          </Text>
                          {collection.description && (
                            <Text size="small" tone="secondary" align="center">
                              {collection.description}
                            </Text>
                          )}
                        </Box>
                      </Rows>
                    </Box>
                  </Button>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box paddingX="3u" paddingY="6u">
              <Text align="center" tone="secondary">
                No collections found. Make sure your database has collections in the app_collections table.
              </Text>
            </Box>
          )
        )}
      </Rows>
    </div>
  );
}