import { Box, Rows, Grid, Text, LoadingIndicator, Button } from "@canva/app-ui-kit";
import { addElementAtPoint, addElementAtCursor, setCurrentPageBackground } from "@canva/design";
import { upload, findFonts, requestFontSelection } from "@canva/asset";
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
  canva_asset_id?: string;
  company_logo_url?: string;
  company_slug?: string;
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
  const [designWidth, setDesignWidth] = useState(800);
  const [designHeight, setDesignHeight] = useState(600);
  const [selectedFont, setSelectedFont] = useState<{ ref: string; name: string } | null>(null);

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

  const selectFont = async () => {
    try {
      const fontResponse = await requestFontSelection();
      if (fontResponse.type === "completed") {
        setSelectedFont({
          ref: fontResponse.font.ref,
          name: fontResponse.font.name
        });
        console.log('Font selected:', fontResponse.font);
      } else {
        console.log('Font selection cancelled');
      }
    } catch (err) {
      console.error('Error selecting font:', err);
    }
  };

  const formatCompanySlug = (slug: string): string => {
    if (!slug) return '';
    
    // Replace dots with spaces and capitalize each word
    return slug
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to normalize font size based on text case
  const normalizeFontSize = (text: string, baseSize: number): number => {
    const hasUpper = /[A-Z]/.test(text);
    const isLower = !hasUpper && /[a-z]/.test(text);
    // Bump lowercase text up more to visually match mixed/uppercase text
    return isLower ? baseSize + 4 : baseSize;
  };

  const insertAsset = async (asset: Asset) => {
    try {
      setError(null);
      
      console.log('Inserting asset:', asset);
      
      let imageElement;
      
      // Try using Canva asset ID directly first if available, then fallback to upload
      let shouldTryCanvaAssetId = asset.canva_asset_id && asset.canva_asset_id.trim();
      
      // Calculate optimal image size and center position
      const maxImageWidth = Math.min(designWidth * 0.6, 500); // Max 60% of design width or 500px
      const maxImageHeight = Math.min(designHeight * 0.5, 300); // Max 50% of design height or 300px
      
      // Use the smaller constraint to maintain aspect ratio
      const imageWidth = Math.min(maxImageWidth, maxImageHeight * 1.5); // Assume ~1.5 aspect ratio
      const imageLeft = (designWidth - imageWidth) / 2; // Center horizontally
      const imageTop = (designHeight - maxImageHeight) / 2; // Center vertically

      if (shouldTryCanvaAssetId) {
        console.log('Will try Canva asset ID first:', asset.canva_asset_id);
        imageElement = {
          type: "image" as const,
          ref: asset.canva_asset_id,
          altText: { text: asset.name, decorative: false },
          top: imageTop,
          left: imageLeft,
          width: imageWidth,
          height: "auto" as const,
        };
      } else {
        console.log('No valid Canva asset ID, uploading image from URL:', asset.thumbnail);
        const uploadResult = await upload({
          type: "image",
          thumbnailUrl: asset.thumbnail,
          url: asset.thumbnail,
          mimeType: "image/jpeg",
          aiDisclosure: "none",
        });
        
        imageElement = {
          type: "image" as const,
          ref: uploadResult.ref,
          altText: { text: asset.name, decorative: false },
          top: imageTop,
          left: imageLeft,
          width: imageWidth,
          height: "auto" as const,
        };
        shouldTryCanvaAssetId = false;
      }

      // Upload and create logo element for top right corner
      const logoUrl = "https://res.cloudinary.com/dd6dkaan9/image/upload/v1756551917/WordmarkWhite_tv0jl9.png";
      const logoUploadResult = await upload({
        type: "image",
        thumbnailUrl: logoUrl,
        url: logoUrl,
        mimeType: "image/png",
        aiDisclosure: "none",
      });
      
      // Calculate PricingSaas logo position (based on 800x600 reference)
      // Reference: 628.8x from left, 558.2y from top in 800x600
      const pricingSaasLogoLeft = (628.8 / 800) * designWidth; // Scale left position
      const pricingSaasLogoTop = (558.2 / 600) * designHeight; // Scale top position
      
      const logoElement = {
        type: "image" as const,
        ref: logoUploadResult.ref,
        altText: { text: "PricingSaas logo", decorative: false },
        top: pricingSaasLogoTop,
        left: pricingSaasLogoLeft,
        width: 146.1, // Fixed size
        height: 28.8, // Fixed size
      };

      // Set page background color
      await setCurrentPageBackground({
        color: "#F7F7F7"
      });

      // Create footer rectangle element
      // Reference: 0x, 545.2y in 800x600 (which is 54.8px from bottom)
      const footerRectangleTop = designHeight - 54.8; // Always 54.8px from bottom
      const footerRectangleElement = {
        type: "shape" as const,
        paths: [
          {
            d: `M 0 0 L ${designWidth} 0 L ${designWidth} 54.8 L 0 54.8 Z`, // Full width rectangle
            fill: {
              color: "#132442"
            }
          }
        ],
        top: footerRectangleTop,
        left: 0, // Start at left edge
        width: designWidth, // Full width
        height: 54.8, // Fixed height
        viewBox: {
          top: 0,
          left: 0,
          width: designWidth,
          height: 54.8
        }
      };


      // Create company logo element at bottom (if available)
      let companyLogoElement = null;
      if (asset.company_logo_url && asset.company_logo_url.trim()) {
        try {
          // Ensure HTTPS URL for Canva upload
          const logoUrl = asset.company_logo_url.replace(/^http:\/\//, 'https://');
          console.log('Uploading company logo:', logoUrl);
          
          const companyLogoUploadResult = await upload({
            type: "image",
            thumbnailUrl: logoUrl,
            url: logoUrl,
            mimeType: "image/jpeg", // Changed to jpeg as most logos are jpg
            aiDisclosure: "none",
          });
          
          // Calculate company logo position (based on 800x600 reference)
          // Reference: 22.2x from left, 558.1y from top in 800x600
          const companyLogoLeft = (22.2 / 800) * designWidth; // Scale left position
          const companyLogoTop = (558.1 / 600) * designHeight; // Scale top position
          
          companyLogoElement = {
            type: "image" as const,
            ref: companyLogoUploadResult.ref,
            altText: { text: `${asset.company_slug || 'Company'} logo`, decorative: false },
            top: companyLogoTop,
            left: companyLogoLeft,
            width: 29.5, // Fixed size
            height: 28.9, // Fixed size
          };
        } catch (err) {
          console.log('Company logo upload failed, skipping:', err);
          // Continue without company logo if upload fails
        }
      }

      // Use selected font if available
      const fontRef = selectedFont?.ref || null;
      console.log('Using font for curated by text:', selectedFont?.name || 'default');

      // Create "curated by" text element (based on 800x600 reference)
      // Reference: 519.3x, 560.7y in 800x600
      const curatedByLeft = (519.3 / 800) * designWidth; // Scale left position
      const curatedByTop = (560.7 / 600) * designHeight; // Scale top position
      
      console.log('DEBUG: Curated by positioning:', {
        designWidth,
        designHeight,
        curatedByLeft,
        curatedByTop,
        referenceLeft: 519.3,
        referenceTop: 560.7,
        fontRef
      });
      
      const curatedByElement = {
        type: "text" as const,
        children: ["curated by"],
        top: curatedByTop,
        left: curatedByLeft,
        width: 89.8, // Fixed width
        fontSize: normalizeFontSize("curated by", 14), // Normalized for visual consistency
        fontWeight: "normal" as const, // Ensure same weight as company slug
        color: "#E4E4E4",
        textAlign: "end" as const,
        ...(fontRef && { fontRef }), // Only add fontRef if selected
      };
      
      const curatedByFontSize = normalizeFontSize("curated by", 14);
      console.log('DEBUG: Trying to add curated by element with properties:', {
        fontSize: curatedByFontSize,
        color: "#E4E4E4",
        textAlign: "end",
        fontRef,
        position: { top: curatedByTop, left: curatedByLeft, width: 89.8 }
      });
      
      console.log('DEBUG: Curated by element:', curatedByElement);

      // Create company slug text element (to the right of company logo)
      // Reference: 65.5x, 558.2y in 800x600, size 300x23.9
      let companySlugElement = null;
      if (asset.company_slug && asset.company_slug.trim()) {
        const formattedSlug = formatCompanySlug(asset.company_slug);
        const slugLeft = (65.5 / 800) * designWidth; // Scale left position
        const slugTop = (560.7 / 600) * designHeight; // Same Y as "curated by" text
        const slugWidth = (300 / 800) * designWidth; // Scale width
        
        const slugFontSize = normalizeFontSize("curated by", 14); // Same as curated by
        console.log('DEBUG: Company slug positioning:', {
          originalSlug: asset.company_slug,
          formattedSlug,
          designWidth,
          designHeight,
          slugLeft,
          slugTop,
          slugWidth,
          slugFontSize,
          referenceLeft: 65.5,
          referenceTop: 560.7,
          fontRef
        });
        
        companySlugElement = {
          type: "text" as const,
          children: [formattedSlug],
          top: slugTop,
          left: slugLeft,
          width: slugWidth,
          fontSize: normalizeFontSize("curated by", 14), // Same size as "curated by" text
          fontWeight: "bold" as const, // Bold styling for company name
          color: "#E4E4E4", // Same color as "curated by" text
          textAlign: "start" as const,
          ...(fontRef && { fontRef }), // Use selected font if available
        };
        
        console.log('DEBUG: Company slug element:', companySlugElement);
      }

      // Create text element centered horizontally and 100px from bottom
      const textWidth = 300;
      const textLeft = (designWidth - textWidth) / 2; // Center horizontally
      const textTop = designHeight - 100; // 100px from bottom
      const textElement = {
        type: "text" as const,
        children: ["Imported from PricingSaas"],
        top: textTop,
        left: textLeft,
        width: textWidth,
        fontSize: 13.5,
        textAlign: "center" as const,
      };

      // Add to design using the same pattern as reference app
      if (features.isSupported(addElementAtPoint)) {
        try {
          await addElementAtPoint(imageElement);
        } catch (err) {
          // If Canva asset ID failed, try uploading instead
          if (shouldTryCanvaAssetId && err.message.includes('invalid image media reference')) {
            console.log('Canva asset ID failed, retrying with upload:', err.message);
            const uploadResult = await upload({
              type: "image",
              thumbnailUrl: asset.thumbnail,
              url: asset.thumbnail,
              mimeType: "image/jpeg",
              aiDisclosure: "none",
            });
            
            imageElement = {
              ...imageElement,
              ref: uploadResult.ref,
              top: imageTop,
              left: imageLeft,
              width: imageWidth,
              height: "auto" as const,
            };
            
            await addElementAtPoint(imageElement);
          } else {
            throw err;
          }
        }
        
        // Add footer rectangle (behind logos)
        await addElementAtPoint(footerRectangleElement);
        
        // Add logo in top right corner
        await addElementAtPoint(logoElement);
        
        // Add company logo at bottom (if available)
        if (companyLogoElement) {
          await addElementAtPoint(companyLogoElement);
        }
        
        // Add company slug text (to the right of company logo)
        if (companySlugElement) {
          console.log('DEBUG: Adding company slug text element');
          await addElementAtPoint(companySlugElement);
          console.log('DEBUG: Company slug text element added successfully');
        }
        
        // Add "curated by" text
        console.log('DEBUG: Adding curated by text element');
        await addElementAtPoint(curatedByElement);
        console.log('DEBUG: Curated by text element added successfully');
        
        // Add text below
        await addElementAtPoint(textElement);
      } else if (features.isSupported(addElementAtCursor)) {
        await addElementAtCursor(imageElement);
        await addElementAtCursor(footerRectangleElement);
        await addElementAtCursor(logoElement);
        if (companyLogoElement) {
          await addElementAtCursor(companyLogoElement);
        }
        if (companySlugElement) {
          await addElementAtCursor(companySlugElement);
        }
        await addElementAtCursor(curatedByElement);
        await addElementAtCursor(textElement);
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

        {/* Design dimensions controls */}
        <Box paddingX="3u">
          <Box padding="2u" style={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px' 
          }}>
            <Rows spacing="2u">
              <Text size="medium" weight="medium">Design Dimensions</Text>
              <Grid columns="2" spacing="2u">
                <Box>
                  <Text size="small" tone="secondary" style={{ marginBottom: '4px' }}>Width (px)</Text>
                  <input
                    type="number"
                    value={designWidth}
                    onChange={(e) => setDesignWidth(Number(e.target.value) || 800)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="100"
                    max="2000"
                  />
                </Box>
                <Box>
                  <Text size="small" tone="secondary" style={{ marginBottom: '4px' }}>Height (px)</Text>
                  <input
                    type="number"
                    value={designHeight}
                    onChange={(e) => setDesignHeight(Number(e.target.value) || 600)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="100"
                    max="2000"
                  />
                </Box>
              </Grid>
              <Text size="small" tone="tertiary">
                Logo will be positioned 32px from top-right corner
              </Text>
            </Rows>
          </Box>
        </Box>

        {/* Font selection control */}
        <Box paddingX="3u">
          <Box padding="2u" style={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px' 
          }}>
            <Rows spacing="2u">
              <Text size="medium" weight="medium">Typography</Text>
              <Box>
                <Text size="small" tone="secondary" style={{ marginBottom: '8px' }}>
                  Font for "curated by" text: {selectedFont ? selectedFont.name : 'Default'}
                </Text>
                <Button 
                  variant="secondary" 
                  onClick={selectFont}
                  style={{ 
                    padding: '8px 16px',
                    borderRadius: '6px',
                  }}
                >
                  {selectedFont ? 'Change Font' : 'Select Font'}
                </Button>
              </Box>
              <Text size="small" tone="tertiary">
                Choose Aspekta or any other font for the "curated by" text
              </Text>
            </Rows>
          </Box>
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