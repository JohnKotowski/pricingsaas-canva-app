import { Box, Rows, Grid, Text, LoadingIndicator, Button } from "@canva/app-ui-kit";
import { addElementAtPoint, addElementAtCursor, setCurrentPageBackground } from "@canva/design";
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
  company_logo_url?: string;
  company_slug?: string;
  header?: string;
  subheader?: string;
  version?: string;
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
  const [designWidth, setDesignWidth] = useState(1080);
  const [designHeight, setDesignHeight] = useState(1080);

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

  // Helper function to format version date (yyyymmdd to readable format)
  const formatVersionDate = (version: string): string => {
    if (!version || version.length !== 8) return '';
    
    const year = version.substring(0, 4);
    const month = version.substring(4, 6);
    const day = version.substring(6, 8);
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const insertAsset = async (asset: Asset) => {
    try {
      setError(null);
      
      console.log('Inserting asset:', asset);
      
      let imageElement;
      
      // Always upload images from thumbnail URL
      
      // Calculate image size and position (63% width, y=200)
      const imageWidth = Math.round(designWidth * 0.63); // 63% of design width, rounded
      const imageLeft = Math.round((designWidth - imageWidth) / 2); // Center horizontally, rounded
      const imageTop = 200; // Fixed y position at 200px
      
      // Validate dimensions are positive and within reasonable bounds
      if (imageWidth <= 0 || imageLeft < 0 || imageTop < 0) {
        throw new Error(`Invalid image dimensions: width=${imageWidth}, left=${imageLeft}, top=${imageTop}`);
      }

      // Use the actual asset URL
      const imageUrl = asset.url || asset.thumbnail;
      
      console.log('Using asset image URL:', imageUrl);
      
      console.log('Uploading image from URL:', imageUrl);
      
      // Ensure URL is properly formatted
      let validImageUrl = imageUrl;
      if (!validImageUrl.startsWith('http://') && !validImageUrl.startsWith('https://')) {
        validImageUrl = 'https://' + validImageUrl;
      }
      
      const uploadResult = await upload({
        type: "image",
        thumbnailUrl: validImageUrl,
        url: validImageUrl,
        mimeType: "image/jpeg", 
        aiDisclosure: "none",
      });
      
      // Use original aspect ratio
      const imageHeight = imageWidth; // Will be adjusted by aspectRatio property
      
      imageElement = {
        type: "image" as const,
        ref: uploadResult.ref,
        altText: { text: asset.name, decorative: false },
        top: imageTop,
        left: imageLeft,
        width: imageWidth,
        height: imageHeight,
        aspectRatio: "original",
      };

      // Upload and create logo element for top right corner
      const logoUrl = "https://res.cloudinary.com/dd6dkaan9/image/upload/v1756551917/WordmarkWhite_tv0jl9.png";
      const logoUploadResult = await upload({
        type: "image",
        thumbnailUrl: logoUrl,
        url: logoUrl,
        mimeType: "image/png",
        aiDisclosure: "none",
      });
      
      // Position PricingSaas logo using exact coordinates for 1080x1080, scale for other sizes
      let pricingSaasLogoLeft: number, pricingSaasLogoTop: number, pricingSaasLogoWidth: number, pricingSaasLogoHeight: number;
      
      if (designWidth === 1080 && designHeight === 1080) {
        // Use exact coordinates from design for 1080x1080
        pricingSaasLogoLeft = 920; // X coordinate from design
        pricingSaasLogoTop = 1028.1; // Y coordinate from design
        pricingSaasLogoWidth = 146.1; // Width from design
        pricingSaasLogoHeight = 28.8; // Height from design
      } else {
        // Scale coordinates proportionally for other dimensions
        pricingSaasLogoLeft = (920 / 1080) * designWidth;
        pricingSaasLogoTop = (1028.1 / 1080) * designHeight;
        pricingSaasLogoWidth = (146.1 / 1080) * designWidth;
        pricingSaasLogoHeight = (28.8 / 1080) * designHeight;
      }
      
      const logoElement = {
        type: "image" as const,
        ref: logoUploadResult.ref,
        altText: { text: "PricingSaas logo", decorative: false },
        top: pricingSaasLogoTop,
        left: pricingSaasLogoLeft,
        width: pricingSaasLogoWidth,
        height: pricingSaasLogoHeight,
      };

      // Set page background color
      await setCurrentPageBackground({
        color: "#F7F7F7"
      });

      // Create footer rectangle element
      const footerHeight = 75; // 75px tall as requested
      const footerRectangleTop = designHeight - footerHeight; // 75px from bottom
      const footerRectangleElement = {
        type: "shape" as const,
        paths: [
          {
            d: `M 0 0 L ${designWidth} 0 L ${designWidth} ${footerHeight} L 0 ${footerHeight} Z`, // Full width rectangle
            fill: {
              color: "#132442"
            }
          }
        ],
        top: footerRectangleTop,
        left: 0, // Start at left edge
        width: designWidth, // Full width
        height: footerHeight, // 75px height
        viewBox: {
          top: 0,
          left: 0,
          width: designWidth,
          height: footerHeight
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
          
          // Position company logo using exact coordinates for 1080x1080, scale for other sizes
          let companyLogoLeft: number, companyLogoTop: number;
          
          if (designWidth === 1080 && designHeight === 1080) {
            // Use exact coordinates from design for 1080x1080
            companyLogoLeft = 20.5;
            companyLogoTop = 1021.8;
          } else {
            // Scale coordinates proportionally for other dimensions
            companyLogoLeft = (20.5 / 1080) * designWidth;
            companyLogoTop = (1021.8 / 1080) * designHeight;
          }
          
          companyLogoElement = {
            type: "image" as const,
            ref: companyLogoUploadResult.ref,
            altText: { text: `${asset.company_slug || 'Company'} logo`, decorative: false },
            top: companyLogoTop,
            left: companyLogoLeft,
            width: 39, // Width from design
            height: 38.2, // Height from design
          };
        } catch (err) {
          console.log('Company logo upload failed, skipping:', err);
          // Continue without company logo if upload fails
        }
      }

      console.log('Using default font for text elements');

      // Create header text element using exact coordinates for 1080x1080, scale for other sizes
      let headerElement = null;
      if (asset.header && asset.header.trim()) {
        let headerLeft: number, headerTop: number, headerWidth: number;
        
        if (designWidth === 1080 && designHeight === 1080) {
          // Use exact coordinates from design for 1080x1080
          headerLeft = 90.9; // X coordinate from design
          headerTop = 52.7; // Y coordinate from design
          headerWidth = 864; // Width from design
        } else {
          // Scale coordinates proportionally for other dimensions
          headerLeft = (90.9 / 1080) * designWidth;
          headerTop = (52.7 / 1080) * designHeight;
          headerWidth = (864 / 1080) * designWidth;
        }
        
        headerElement = {
          type: "text" as const,
          children: [asset.header.trim()],
          top: headerTop,
          left: headerLeft,
          width: headerWidth,
          fontSize: 48,
          fontWeight: "bold" as const,
          color: "#132442",
          textAlign: "center" as const,
        };
      }

      // Create subheader text element using exact coordinates for 1080x1080, scale for other sizes
      let subheaderElement = null;
      if (asset.subheader && asset.subheader.trim()) {
        let subheaderLeft: number, subheaderTop: number, subheaderWidth: number;
        
        if (designWidth === 1080 && designHeight === 1080) {
          // Use exact coordinates from design for 1080x1080
          subheaderLeft = 108; // X coordinate from design
          subheaderTop = 134.5; // Y coordinate from design
          subheaderWidth = 864; // Width from design
        } else {
          // Scale coordinates proportionally for other dimensions
          subheaderLeft = (108 / 1080) * designWidth;
          subheaderTop = (134.5 / 1080) * designHeight;
          subheaderWidth = (864 / 1080) * designWidth;
        }
        
        subheaderElement = {
          type: "text" as const,
          children: [asset.subheader.trim()],
          top: subheaderTop,
          left: subheaderLeft,
          width: subheaderWidth,
          fontSize: 27,
          fontWeight: "normal" as const,
          color: "#132442",
          textAlign: "center" as const,
        };
      }

      // Create date pill element (bottom right corner)
      let datePillElement = null;
      let datePillRectangleElement = null;
      if (asset.version && asset.version.trim()) {
        const formattedDate = formatVersionDate(asset.version.trim());
        
        if (formattedDate) {
          // Position date pill using exact coordinates for 1080x1080, scale for other sizes
          let pillLeft: number, pillTop: number, pillWidth: number, pillHeight: number;
          
          if (designWidth === 1080 && designHeight === 1080) {
            // Use exact coordinates from design for 1080x1080
            pillLeft = 480; // X coordinate from design
            pillTop = 911.3; // Y coordinate from design
            pillWidth = 120; // Width from design
            pillHeight = 32; // Height from design
          } else {
            // Scale coordinates proportionally for other dimensions
            pillLeft = (480 / 1080) * designWidth;
            pillTop = (911.3 / 1080) * designHeight;
            pillWidth = (120 / 1080) * designWidth;
            pillHeight = (32 / 1080) * designHeight;
          }
          
          // Create background rectangle for date pill
          datePillRectangleElement = {
            type: "shape" as const,
            paths: [
              {
                d: `M 0 0 L ${pillWidth} 0 L ${pillWidth} ${pillHeight} L 0 ${pillHeight} Z`,
                fill: {
                  color: "#FFFFFF"
                }
              }
            ],
            top: pillTop,
            left: pillLeft,
            width: pillWidth,
            height: pillHeight,
            viewBox: {
              top: 0,
              left: 0,
              width: pillWidth,
              height: pillHeight
            }
          };

          // Create date text element
          datePillElement = {
            type: "text" as const,
            children: [formattedDate],
            top: pillTop + (pillHeight / 2) - 7, // Center vertically in pill (text height ~14px)
            left: pillLeft,
            width: pillWidth,
            fontSize: 14,
            fontWeight: "normal" as const,
            color: "#000000",
            textAlign: "center" as const,
            };
        }
      }

      // Create "curated by" text element using exact coordinates for 1080x1080, scale for other sizes
      let curatedByLeft: number, curatedByTop: number, curatedByWidth: number;
      
      if (designWidth === 1080 && designHeight === 1080) {
        // Use exact coordinates from design for 1080x1080
        curatedByLeft = 754.2; // X coordinate from design
        curatedByTop = 1031.8; // Y coordinate from design
        curatedByWidth = 149.8; // Width from design
      } else {
        // Scale coordinates proportionally for other dimensions
        curatedByLeft = (754.2 / 1080) * designWidth;
        curatedByTop = (1031.8 / 1080) * designHeight;
        curatedByWidth = (149.8 / 1080) * designWidth;
      }
      
      console.log('DEBUG: Curated by positioning:', {
        designWidth,
        designHeight,
        curatedByLeft,
        curatedByTop,
        referenceLeft: 519.3,
        referenceTop: 560.7,
      });
      
      const curatedByElement = {
        type: "text" as const,
        children: ["curated by"],
        top: curatedByTop,
        left: curatedByLeft,
        width: curatedByWidth, // Fixed width
        fontSize: normalizeFontSize("curated by", 14), // Normalized for visual consistency
        fontWeight: "normal" as const, // Ensure same weight as company slug
        color: "#E4E4E4",
        textAlign: "end" as const,
      };
      
      const curatedByFontSize = normalizeFontSize("curated by", 14);
      console.log('DEBUG: Trying to add curated by element with properties:', {
        fontSize: curatedByFontSize,
        color: "#E4E4E4",
        textAlign: "end",
        position: { top: curatedByTop, left: curatedByLeft, width: 89.8 }
      });
      
      console.log('DEBUG: Curated by element:', curatedByElement);

      // Create company slug text element (positioned at bottom for 1080x1080)
      let companySlugElement = null;
      if (asset.company_slug && asset.company_slug.trim()) {
        const formattedSlug = formatCompanySlug(asset.company_slug);
        // Position company slug using exact coordinates for 1080x1080, scale for other sizes
        let slugLeft: number, slugTop: number, slugWidth: number;
        
        if (designWidth === 1080 && designHeight === 1080) {
          // Use exact coordinates from design for 1080x1080
          slugLeft = 74.7; // X coordinate from design
          slugTop = 1031.8; // Y coordinate from design
          slugWidth = 880.2; // Width from design
        } else {
          // Scale coordinates proportionally for other dimensions
          slugLeft = (74.7 / 1080) * designWidth;
          slugTop = (1031.8 / 1080) * designHeight;
          slugWidth = (880.2 / 1080) * designWidth;
        }
        
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
 // Use hardcoded Aspekta font
        };
        
        console.log('DEBUG: Company slug element:', companySlugElement);
      }


      // Add to design using the same pattern as reference app
      if (features.isSupported(addElementAtPoint)) {
        try {
          console.log('DEBUG: Adding image element', imageElement);
          await addElementAtPoint(imageElement);
          console.log('DEBUG: Image element added successfully');
        } catch (err) {
          console.error('ERROR: Failed to add image element:', err);
          throw new Error(`Failed to add image element: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        try {
          console.log('DEBUG: Adding footer rectangle');
          await addElementAtPoint(footerRectangleElement);
          console.log('DEBUG: Footer rectangle added successfully');
        } catch (err) {
          console.error('ERROR: Failed to add footer rectangle:', err);
          throw new Error(`Failed to add footer rectangle: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        try {
          console.log('DEBUG: Adding PricingSaas logo');
          await addElementAtPoint(logoElement);
          console.log('DEBUG: PricingSaas logo added successfully');
        } catch (err) {
          console.error('ERROR: Failed to add PricingSaas logo:', err);
          throw new Error(`Failed to add PricingSaas logo: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        // Add company logo at bottom (if available)
        if (companyLogoElement) {
          try {
            console.log('DEBUG: Adding company logo');
            await addElementAtPoint(companyLogoElement);
            console.log('DEBUG: Company logo added successfully');
          } catch (err) {
            console.error('ERROR: Failed to add company logo:', err);
            throw new Error(`Failed to add company logo: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        // Add company slug text (to the right of company logo)
        if (companySlugElement) {
          try {
            console.log('DEBUG: Adding company slug text element');
            await addElementAtPoint(companySlugElement);
            console.log('DEBUG: Company slug text element added successfully');
          } catch (err) {
            console.error('ERROR: Failed to add company slug text:', err);
            throw new Error(`Failed to add company slug text: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        // Add "curated by" text
        try {
          console.log('DEBUG: Adding curated by text element');
          await addElementAtPoint(curatedByElement);
          console.log('DEBUG: Curated by text element added successfully');
        } catch (err) {
          console.error('ERROR: Failed to add curated by text:', err);
          throw new Error(`Failed to add curated by text: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        // Add header text element (if available)
        if (headerElement) {
          try {
            console.log('DEBUG: Adding header text element');
            await addElementAtPoint(headerElement);
            console.log('DEBUG: Header text element added successfully');
          } catch (err) {
            console.error('ERROR: Failed to add header text:', err);
            throw new Error(`Failed to add header text: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        // Add subheader text element (if available)
        if (subheaderElement) {
          try {
            console.log('DEBUG: Adding subheader text element');
            await addElementAtPoint(subheaderElement);
            console.log('DEBUG: Subheader text element added successfully');
          } catch (err) {
            console.error('ERROR: Failed to add subheader text:', err);
            throw new Error(`Failed to add subheader text: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        // Add date pill (if available)
        if (datePillRectangleElement) {
          try {
            console.log('DEBUG: Adding date pill rectangle');
            await addElementAtPoint(datePillRectangleElement);
            console.log('DEBUG: Date pill rectangle added successfully');
          } catch (err) {
            console.error('ERROR: Failed to add date pill rectangle:', err);
            throw new Error(`Failed to add date pill rectangle: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        if (datePillElement) {
          try {
            console.log('DEBUG: Adding date pill text');
            await addElementAtPoint(datePillElement);
            console.log('DEBUG: Date pill text added successfully');
          } catch (err) {
            console.error('ERROR: Failed to add date pill text:', err);
            throw new Error(`Failed to add date pill text: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
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
        if (headerElement) {
          await addElementAtCursor(headerElement);
        }
        if (subheaderElement) {
          await addElementAtCursor(subheaderElement);
        }
        if (datePillRectangleElement) {
          await addElementAtCursor(datePillRectangleElement);
        }
        if (datePillElement) {
          await addElementAtCursor(datePillElement);
        }
      } else {
        throw new Error("Image insertion not supported");
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add elements to design';
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