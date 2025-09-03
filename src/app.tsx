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
  secondary_version?: string;
  crop_aspect_ratio?: string;
  primary_markup_url?: string;
  secondary_markup_url?: string;
  asset_type?: string;
  comparison_mode?: string;
  secondary_company_logo_url?: string;
  secondary_company_slug?: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
}

type TabType = 'collections' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('collections');
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

  // Helper function to parse aspect ratio string (e.g., "16:9", "1.91:1") into width/height ratio
  const parseAspectRatio = (aspectRatio: string): number => {
    if (!aspectRatio) return 1; // Default to 1:1 (square)
    
    // Handle decimal format like "1.91:1"
    if (aspectRatio.includes(':')) {
      const [widthStr, heightStr] = aspectRatio.split(':');
      const width = parseFloat(widthStr);
      const height = parseFloat(heightStr);
      return width / height;
    }
    
    // Handle simple decimal format like "1.91"
    return parseFloat(aspectRatio) || 1;
  };

  const insertAsset = async (asset: Asset) => {
    try {
      setError(null);
      
      console.log('Inserting asset:', asset);
      
      // Parse aspect ratio and determine layout
      const aspectRatio = parseAspectRatio(asset.crop_aspect_ratio || '1:1');
      const assetType = asset.asset_type || 'simple';
      const comparisonMode = asset.comparison_mode || 'single';
      
      // Determine if we should show dual images based on type and secondary URL availability
      const hasDualImages = assetType === 'diff' && asset.secondary_markup_url && asset.secondary_markup_url.trim() !== '';
      
      console.log('Asset type:', assetType, 'Comparison mode:', comparisonMode, 'Dual images:', hasDualImages);
      
      // Check minimum viable page size
      const minWidth = 400;
      const minHeight = 300;
      if (designWidth < minWidth || designHeight < minHeight) {
        throw new Error(`Page too small. Minimum size: ${minWidth}x${minHeight}, current: ${designWidth}x${designHeight}`);
      }
      
      // Calculate bounding box for images (76.23% width = 69.3% + 10%, y=200)
      const boundingWidth = Math.round(designWidth * 0.7623); // 69.3% * 1.1 = 76.23%
      const boundingLeft = Math.round((designWidth - boundingWidth) / 2);
      const boundingTop = 200;
      const boundingHeight = Math.round(boundingWidth / aspectRatio);
      
      console.log('Bounding box:', { boundingWidth, boundingLeft, boundingTop, boundingHeight });
      console.log('Design dimensions:', { designWidth, designHeight });
      
      // Validate dimensions and ensure elements fit within page bounds
      if (boundingWidth <= 0 || boundingLeft < 0 || boundingTop < 0 || boundingHeight <= 0) {
        throw new Error(`Invalid bounding dimensions: width=${boundingWidth}, left=${boundingLeft}, top=${boundingTop}, height=${boundingHeight}`);
      }
      
      // Check if bounding box fits within page
      if (boundingLeft + boundingWidth > designWidth || boundingTop + boundingHeight > designHeight) {
        throw new Error(`Elements exceed page bounds. Page: ${designWidth}x${designHeight}, Bounding box: ${boundingWidth}x${boundingHeight} at (${boundingLeft}, ${boundingTop})`);
      }

      // Determine image URLs to use
      const primaryUrl = asset.primary_markup_url || asset.url || asset.thumbnail;
      const secondaryUrl = hasDualImages ? asset.secondary_markup_url : null;
      
      if (!primaryUrl) {
        throw new Error('No primary image URL available');
      }
      
      console.log('Primary URL:', primaryUrl, 'Secondary URL:', secondaryUrl);
      
      // Upload primary image
      let validPrimaryUrl = primaryUrl;
      if (!validPrimaryUrl.startsWith('http://') && !validPrimaryUrl.startsWith('https://')) {
        validPrimaryUrl = 'https://' + validPrimaryUrl;
      }
      
      const primaryUploadResult = await upload({
        type: "image",
        thumbnailUrl: validPrimaryUrl,
        url: validPrimaryUrl,
        mimeType: "image/jpeg", 
        aiDisclosure: "none",
      });
      
      let imageElements: any[] = [];
      
      if (!hasDualImages) {
        // Single image - use full bounding box
        const imageElement = {
          type: "image" as const,
          ref: primaryUploadResult.ref,
          altText: { text: asset.name, decorative: false },
          top: boundingTop,
          left: boundingLeft,
          width: boundingWidth,
          height: boundingHeight,
        };
        imageElements.push(imageElement);
      } else {
        // Dual images - upload secondary and arrange based on layout
        let validSecondaryUrl = secondaryUrl!;
        if (!validSecondaryUrl.startsWith('http://') && !validSecondaryUrl.startsWith('https://')) {
          validSecondaryUrl = 'https://' + validSecondaryUrl;
        }
        
        const secondaryUploadResult = await upload({
          type: "image",
          thumbnailUrl: validSecondaryUrl,
          url: validSecondaryUrl,
          mimeType: "image/jpeg", 
          aiDisclosure: "none",
        });
        
        if (comparisonMode === 'stacked') {
          // Stacked layout - each image takes half the height
          const imageHeight = Math.round(boundingHeight / 2);
          
          const primaryElement = {
            type: "image" as const,
            ref: primaryUploadResult.ref,
            altText: { text: `${asset.name} - Primary`, decorative: false },
            top: boundingTop,
            left: boundingLeft,
            width: boundingWidth,
            height: imageHeight,
          };
          
          const secondaryElement = {
            type: "image" as const,
            ref: secondaryUploadResult.ref,
            altText: { text: `${asset.name} - Secondary`, decorative: false },
            top: boundingTop + imageHeight,
            left: boundingLeft,
            width: boundingWidth,
            height: imageHeight,
          };
          
          imageElements.push(primaryElement, secondaryElement);
        } else {
          // Side-by-side layout - center images at 30% and 70% width marks
          const imageWidth = Math.round(boundingWidth / 2);
          
          // Calculate positions to center images at 30% and 70% of design width
          const primaryCenterX = designWidth * 0.30;
          const secondaryCenterX = designWidth * 0.70;
          const primaryLeft = Math.round(primaryCenterX - (imageWidth / 2));
          const secondaryLeft = Math.round(secondaryCenterX - (imageWidth / 2));
          
          const primaryElement = {
            type: "image" as const,
            ref: primaryUploadResult.ref,
            altText: { text: `${asset.name} - Primary`, decorative: false },
            top: boundingTop,
            left: primaryLeft,
            width: imageWidth,
            height: boundingHeight,
          };
          
          const secondaryElement = {
            type: "image" as const,
            ref: secondaryUploadResult.ref,
            altText: { text: `${asset.name} - Secondary`, decorative: false },
            top: boundingTop,
            left: secondaryLeft,
            width: imageWidth,
            height: boundingHeight,
          };
          
          imageElements.push(primaryElement, secondaryElement);
        }
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

      // Create footer rectangle element with bounds checking
      const footerHeight = Math.min(75, designHeight - 50); // Cap at 75px or leave 50px margin from top
      const footerRectangleTop = Math.max(50, designHeight - footerHeight); // Ensure at least 50px from top
      
      // Validate footer positioning
      if (footerRectangleTop + footerHeight > designHeight) {
        console.warn(`Footer rectangle would exceed page bounds (${footerRectangleTop + footerHeight} > ${designHeight}), skipping footer`);
        throw new Error(`Page too small for footer. Need at least ${footerHeight + 50}px height, got ${designHeight}px`);
      }
      
      console.log('Footer positioning:', { footerHeight, footerRectangleTop, designHeight });
      
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
          
          // Detect MIME type from file extension
          const mimeType = logoUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          
          const companyLogoUploadResult = await upload({
            type: "image",
            thumbnailUrl: logoUrl,
            url: logoUrl,
            mimeType: mimeType,
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

      // Create date pill elements (bottom right corner) - handle both single and dual versions
      let datePillElements: any[] = [];
      let datePillRectangleElements: any[] = [];
      
      const primaryVersion = asset.version && asset.version.trim();
      const secondaryVersion = asset.secondary_version && asset.secondary_version.trim();
      
      if (primaryVersion || secondaryVersion) {
        if (!hasDualImages || !secondaryVersion) {
          // Single version pill (either single image or dual images with only primary version)
          const versionToShow = primaryVersion || secondaryVersion;
          const formattedDate = formatVersionDate(versionToShow!);
          
          if (formattedDate) {
            let pillLeft: number, pillTop: number, pillWidth: number, pillHeight: number;
            
            if (designWidth === 1080 && designHeight === 1080) {
              pillLeft = 480;
              pillTop = 911.3;
              pillWidth = 120;
              pillHeight = 32;
            } else {
              pillLeft = (480 / 1080) * designWidth;
              pillTop = (911.3 / 1080) * designHeight;
              pillWidth = (120 / 1080) * designWidth;
              pillHeight = (32 / 1080) * designHeight;
            }
            
            datePillRectangleElements.push({
              type: "shape" as const,
              paths: [
                {
                  d: `M 0 0 L ${pillWidth} 0 L ${pillWidth} ${pillHeight} L 0 ${pillHeight} Z`,
                  fill: { color: "#FFFFFF" }
                }
              ],
              top: pillTop,
              left: pillLeft,
              width: pillWidth,
              height: pillHeight,
              viewBox: { top: 0, left: 0, width: pillWidth, height: pillHeight }
            });

            datePillElements.push({
              type: "text" as const,
              children: [formattedDate],
              top: pillTop + (pillHeight / 2) - 7,
              left: pillLeft,
              width: pillWidth,
              fontSize: 14,
              fontWeight: "normal" as const,
              color: "#000000",
              textAlign: "center" as const,
            });
          }
        } else {
          // Dual version pills - position based on layout mode (stacked vs side-by-side)
          const primaryFormattedDate = formatVersionDate(primaryVersion);
          const secondaryFormattedDate = formatVersionDate(secondaryVersion);
          
          if (primaryFormattedDate || secondaryFormattedDate) {
            let pillWidth: number, pillHeight: number;
            let primaryPillTop: number, primaryPillLeft: number;
            let secondaryPillTop: number, secondaryPillLeft: number;
            
            if (designWidth === 1080 && designHeight === 1080) {
              pillWidth = 120; // Keep original pill width
              pillHeight = 32;
              
              if (comparisonMode === 'stacked') {
                // Stacked layout - position pills under their respective images
                const centerX = designWidth / 2;
                primaryPillLeft = centerX - (pillWidth / 2);
                secondaryPillLeft = centerX - (pillWidth / 2);
                
                // Position under the images (images are at boundingTop with boundingHeight/2 each)
                const imageHeight = Math.round(boundingHeight / 2);
                primaryPillTop = boundingTop + imageHeight - 40; // 40px from bottom of primary image
                secondaryPillTop = boundingTop + boundingHeight - 40; // 40px from bottom of secondary image
              } else {
                // Side-by-side layout - position at 30% and 70% width points
                primaryPillLeft = (designWidth * 0.30) - (pillWidth / 2);
                secondaryPillLeft = (designWidth * 0.70) - (pillWidth / 2);
                primaryPillTop = 911.3;
                secondaryPillTop = 911.3;
              }
            } else {
              pillWidth = (120 / 1080) * designWidth;
              pillHeight = (32 / 1080) * designHeight;
              
              if (comparisonMode === 'stacked') {
                // Stacked layout - center horizontally, position under images
                const centerX = designWidth / 2;
                primaryPillLeft = centerX - (pillWidth / 2);
                secondaryPillLeft = centerX - (pillWidth / 2);
                
                const imageHeight = Math.round(boundingHeight / 2);
                primaryPillTop = boundingTop + imageHeight - (40 / 1080) * designHeight;
                secondaryPillTop = boundingTop + boundingHeight - (40 / 1080) * designHeight;
              } else {
                // Side-by-side layout - position at 30% and 70% width points
                primaryPillLeft = (designWidth * 0.30) - (pillWidth / 2);
                secondaryPillLeft = (designWidth * 0.70) - (pillWidth / 2);
                primaryPillTop = (911.3 / 1080) * designHeight;
                secondaryPillTop = (911.3 / 1080) * designHeight;
              }
            }
            
            // Primary version pill
            if (primaryFormattedDate) {
              datePillRectangleElements.push({
                type: "shape" as const,
                paths: [
                  {
                    d: `M 0 0 L ${pillWidth} 0 L ${pillWidth} ${pillHeight} L 0 ${pillHeight} Z`,
                    fill: { color: "#FFFFFF" }
                  }
                ],
                top: primaryPillTop,
                left: primaryPillLeft,
                width: pillWidth,
                height: pillHeight,
                viewBox: { top: 0, left: 0, width: pillWidth, height: pillHeight }
              });

              datePillElements.push({
                type: "text" as const,
                children: [primaryFormattedDate],
                top: primaryPillTop + (pillHeight / 2) - 7,
                left: primaryPillLeft,
                width: pillWidth,
                fontSize: 14,
                fontWeight: "normal" as const,
                color: "#000000",
                textAlign: "center" as const,
              });
            }
            
            // Secondary version pill
            if (secondaryFormattedDate) {
              datePillRectangleElements.push({
                type: "shape" as const,
                paths: [
                  {
                    d: `M 0 0 L ${pillWidth} 0 L ${pillWidth} ${pillHeight} L 0 ${pillHeight} Z`,
                    fill: { color: "#FFFFFF" } // Same white background as primary
                  }
                ],
                top: secondaryPillTop,
                left: secondaryPillLeft,
                width: pillWidth,
                height: pillHeight,
                viewBox: { top: 0, left: 0, width: pillWidth, height: pillHeight }
              });

              datePillElements.push({
                type: "text" as const,
                children: [secondaryFormattedDate],
                top: secondaryPillTop + (pillHeight / 2) - 7,
                left: secondaryPillLeft,
                width: pillWidth,
                fontSize: 14,
                fontWeight: "normal" as const,
                color: "#000000",
                textAlign: "center" as const,
              });
            }
          }
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
        // Add all image elements
        for (const [index, imageElement] of imageElements.entries()) {
          try {
            console.log(`DEBUG: Adding image element ${index + 1}`, imageElement);
            await addElementAtPoint(imageElement);
            console.log(`DEBUG: Image element ${index + 1} added successfully`);
          } catch (err) {
            console.error(`ERROR: Failed to add image element ${index + 1}:`, err);
            throw new Error(`Failed to add image element ${index + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
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
        
        // Add date pill rectangles (if available)
        for (const [index, rectangle] of datePillRectangleElements.entries()) {
          try {
            console.log(`DEBUG: Adding date pill rectangle ${index + 1}`);
            await addElementAtPoint(rectangle);
            console.log(`DEBUG: Date pill rectangle ${index + 1} added successfully`);
          } catch (err) {
            console.error(`ERROR: Failed to add date pill rectangle ${index + 1}:`, err);
            throw new Error(`Failed to add date pill rectangle ${index + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        // Add date pill texts (if available)
        for (const [index, pill] of datePillElements.entries()) {
          try {
            console.log(`DEBUG: Adding date pill text ${index + 1}`);
            await addElementAtPoint(pill);
            console.log(`DEBUG: Date pill text ${index + 1} added successfully`);
          } catch (err) {
            console.error(`ERROR: Failed to add date pill text ${index + 1}:`, err);
            throw new Error(`Failed to add date pill text ${index + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
      } else if (features.isSupported(addElementAtCursor)) {
        // Add all image elements
        for (const imageElement of imageElements) {
          await addElementAtCursor(imageElement);
        }
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
        // Add date pill elements
        for (const rectangle of datePillRectangleElements) {
          await addElementAtCursor(rectangle);
        }
        for (const pill of datePillElements) {
          await addElementAtCursor(pill);
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

  const formatCollectionName = (name: string, maxWidth: number = 25): string => {
    if (name.length <= maxWidth) {
      // Pad with spaces if shorter than maxWidth
      return name + '.'.repeat(maxWidth - name.length);
    } else {
      // Truncate and add dots if longer than maxWidth
      return name.substring(0, maxWidth - 3) + '...';
    }
  };


  const renderTabContent = () => {
    if (activeTab === 'collections') {
      return (
        <>
          {/* Collections Header */}
          <Box paddingX="3u" paddingY="2u">
            {selectedCollection ? (
              <Rows spacing="2u">
                <Button 
                  variant="secondary" 
                  onClick={goBackToCollections}
                >
                  ← Collections
                </Button>
                <Box>
                  <Text size="large">
                    {selectedCollection.name}
                  </Text>
                  <Text size="medium" tone="secondary">
                    Click any image to add it to your design
                  </Text>
                </Box>
              </Rows>
            ) : (
              <Box>
                <Text size="large">
                  Your Collections
                </Text>
                <Text size="medium" tone="secondary">
                  Select a collection to browse its images
                </Text>
              </Box>
            )}
          </Box>

          {/* Collections Content */}
          {loading ? (
            <Box paddingX="2u" paddingY="4u">
              <LoadingIndicator size="medium" />
            </Box>
          ) : selectedCollection ? (
            /* Asset grid view */
            assets.length > 0 ? (
              <Box paddingX="4u" paddingY="3u">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '24px',
                  padding: '16px 0'
                }}>
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                      onClick={() => insertAsset(asset)}
                    >
                      {/* Image thumbnail */}
                      <div
                        style={{
                          width: '100%',
                          height: '200px',
                          backgroundImage: asset.thumbnail ? `url(${asset.thumbnail})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: asset.thumbnail ? 'transparent' : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        {!asset.thumbnail && (
                          <Text size="small" tone="tertiary">
                            No Preview Available
                          </Text>
                        )}
                        {/* Hover overlay */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          Click to Insert
                        </div>
                      </div>
                      
                      {/* Asset details */}
                      <div style={{ padding: '16px' }}>
                        <div style={{ 
                          fontWeight: '500',
                          marginBottom: '4px',
                          fontSize: '16px',
                          color: '#1f2937'
                        }}>
                          {asset.name}
                        </div>
                        <Text size="small" tone="secondary">
                          Ready to add to your design
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Box>
            ) : (
              <Box paddingX="3u" paddingY="6u">
                <Text tone="secondary">
                  No assets found in this collection.
                </Text>
              </Box>
            )
          ) : (
            /* Collections list view */
            collections.length > 0 ? (
              <Box paddingX="3u">
                <Rows spacing="2u">
                  {collections.map((collection) => (
                    <Button
                      key={collection.id}
                      variant="tertiary"
                      onClick={() => selectCollection(collection)}
                      style={{
                        width: '100%',
                        height: 'auto',
                        padding: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ fontSize: '16px', lineHeight: '1', marginTop: '2px' }}>
                          📁
                        </div>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                            {formatCollectionName(collection.name)}
                          </div>
                          {collection.description && (
                            <div style={{ marginTop: '4px' }}>
                              <Text size="small" tone="secondary">
                                {collection.description}
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </Rows>
              </Box>
            ) : (
              <Box paddingX="3u" paddingY="6u">
                <Text tone="secondary">
                  No collections found. Make sure your database has collections in the app_collections table.
                </Text>
              </Box>
            )
          )}
        </>
      );
    }

    if (activeTab === 'settings') {
      return (
        <Box paddingX="3u">
          <div style={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            padding: '16px'
          }}>
            <Rows spacing="2u">
              <Text size="medium">Design Dimensions</Text>
              <Grid columns={2} spacing="2u">
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Width (px)</Text>
                  </div>
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
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Height (px)</Text>
                  </div>
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
          </div>
        </Box>
      );
    }

    return null;
  };

  return (
    <div className={styles.rootWrapper}>
      <Rows spacing="2u">
        {/* Tab Navigation */}
        <Box paddingX="3u" paddingTop="2u">
          <Grid columns={2} spacing="1u">
            <Button
              variant={activeTab === 'collections' ? 'primary' : 'tertiary'}
              onClick={() => setActiveTab('collections')}
            >
              Collections
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'primary' : 'tertiary'}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </Button>
          </Grid>
        </Box>

        {/* Error display */}
        {error && (
          <Box paddingX="3u">
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '2px solid #fca5a5', 
              borderRadius: '12px',
              padding: '16px',
              color: '#dc2626'
            }}>
              <Text size="medium">
                ⚠️ {error}
              </Text>
            </div>
          </Box>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </Rows>
    </div>
  );
}