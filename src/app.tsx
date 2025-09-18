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
  slug?: string;
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
  primary_cropped_url?: string;
  primary_original_url?: string;
  secondary_markup_url?: string;
  secondary_cropped_url?: string;
  secondary_original_url?: string;
  type?: string;
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
  const [footerHeight, setFooterHeight] = useState(75);

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

  // Helper function to convert PNG URLs to JPEG for better Canva compatibility
  const convertPngToJpeg = (url: string): string => {
    if (!url) {
      return url;
    }

    // Convert any PNG URL to JPEG for better Canva compatibility (case insensitive)
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.png') || lowerUrl.includes('.png?') || lowerUrl.includes('.png&')) {
      if (url.includes('cloudinary.com')) {
        // For Cloudinary, we can use their format transformation
        let convertedUrl = url;
        if (url.includes('/upload/')) {
          // Insert format transformation in Cloudinary URL
          convertedUrl = url.replace('/upload/', '/upload/f_jpg/');
        } else {
          // Fallback: simple extension replacement
          convertedUrl = url.replace(/\.png/gi, '.jpeg');
        }
        return convertedUrl;
      } else {
        // For other services, try multiple approaches
        let convertedUrl = url;

        // First try: Add format parameter
        if (url.includes('?')) {
          convertedUrl = url + '&format=jpeg';
        } else {
          convertedUrl = url + '?format=jpeg';
        }

        // Also try changing extension
        convertedUrl = convertedUrl.replace(/\.png/gi, '.jpg');

        return convertedUrl;
      }
    }

    return url;
  };

  const insertAsset = async (asset: Asset) => {
    try {
      setError(null);

      const assetType = asset.asset_type || asset.type || 'simple';
      const comparisonMode = asset.comparison_mode || 'single';

      // Determine if we should show dual images based on AssetType
      const hasDualImages = assetType === 'diff' &&
        (asset.secondary_cropped_url || asset.secondary_original_url) &&
        (asset.secondary_cropped_url?.trim() !== '' || asset.secondary_original_url?.trim() !== '');

      // Prioritize cropped URLs, fall back to original URLs
      const primaryUrl = asset.primary_cropped_url || asset.primary_original_url || asset.primary_markup_url || asset.url || asset.thumbnail;
      const secondaryUrl = hasDualImages ? (asset.secondary_cropped_url || asset.secondary_original_url || asset.secondary_markup_url) : null;
      
      // Parse aspect ratio and determine layout - use original image aspect ratio if available
      let aspectRatio = parseAspectRatio(asset.crop_aspect_ratio || '1:1');
      
      // Try to get original aspect ratio from the selected URLs
      if (primaryUrl) {
        try {
          // Create a temporary image to get natural dimensions
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const originalAspectRatio = await new Promise<number>((resolve, reject) => {
            img.onload = () => {
              const ratio = img.naturalWidth / img.naturalHeight;
              resolve(ratio);
            };
            img.onerror = () => {
              resolve(aspectRatio); // fallback to crop aspect ratio
            };
            img.src = primaryUrl;
          });

          aspectRatio = originalAspectRatio;
        } catch (error) {
          // Keep the original aspectRatio from crop_aspect_ratio
        }
      }
      
      // Calculate dynamic image area based on settings
      const headerSpace = 110; // Increased space for header and subheader (10% more from 100px)
      const footerSpace = footerHeight; // Use footer height from settings
      const versionLabelSpace = 40; // Space for version labels under images
      const padding = 20; // General padding

      // Available image area
      const imageAreaTop = headerSpace;
      const imageAreaHeight = designHeight - headerSpace - footerSpace - versionLabelSpace;
      const imageAreaWidth = designWidth - (padding * 2);
      const imageAreaLeft = padding;

      // Check minimum viable image area
      if (imageAreaWidth < 200 || imageAreaHeight < 150) {
        throw new Error(`Design too small for images. Need at least 240x265px total, got ${designWidth}x${designHeight}px`);
      }


      // Calculate image layout based on AssetType and ComparisonMode
      let imageLayout: {
        images: Array<{
          top: number;
          left: number;
          width: number;
          height: number;
          ref?: any;
          altText: string;
        }>;
        versionLabelPositions: Array<{
          top: number;
          left: number;
          width: number;
        }>;
      };

      if (!hasDualImages) {
        // Single image layout
        const imageWidth = Math.min(imageAreaWidth, Math.round(imageAreaHeight * aspectRatio));
        const imageHeight = Math.round(imageWidth / aspectRatio);
        const imageLeft = imageAreaLeft + Math.round((imageAreaWidth - imageWidth) / 2);
        const imageTop = imageAreaTop + Math.round((imageAreaHeight - imageHeight) / 2);

        imageLayout = {
          images: [{
            top: imageTop,
            left: imageLeft,
            width: imageWidth,
            height: imageHeight,
            altText: asset.name
          }],
          versionLabelPositions: [{
            top: imageTop + imageHeight + 10,
            left: imageLeft,
            width: imageWidth
          }]
        };
      } else {
        // Dual image layout based on ComparisonMode
        if (comparisonMode === 'side_by_side') {
          // Side-by-side layout
          const gap = 20;
          const singleImageWidth = Math.round((imageAreaWidth - gap) / 2);
          const imageHeight = Math.min(imageAreaHeight, Math.round(singleImageWidth / aspectRatio));
          const imageTop = imageAreaTop + Math.round((imageAreaHeight - imageHeight) / 2);

          const primaryLeft = imageAreaLeft;
          const secondaryLeft = imageAreaLeft + singleImageWidth + gap;

          // Validate minimum width
          if (singleImageWidth < 80) {
            throw new Error(`Images too narrow for side-by-side layout. Available width per image: ${singleImageWidth}px (minimum: 80px)`);
          }

          imageLayout = {
            images: [
              {
                top: imageTop,
                left: primaryLeft,
                width: singleImageWidth,
                height: imageHeight,
                altText: `${asset.name} - Primary`
              },
              {
                top: imageTop,
                left: secondaryLeft,
                width: singleImageWidth,
                height: imageHeight,
                altText: `${asset.name} - Secondary`
              }
            ],
            versionLabelPositions: [
              {
                top: imageTop + imageHeight + 10,
                left: primaryLeft,
                width: singleImageWidth
              },
              {
                top: imageTop + imageHeight + 10,
                left: secondaryLeft,
                width: singleImageWidth
              }
            ]
          };
        } else {
          // Stacked layout
          const gap = 10;
          const imageWidth = Math.min(imageAreaWidth, Math.round((imageAreaHeight - gap) / 2 * aspectRatio));
          const singleImageHeight = Math.round(imageWidth / aspectRatio);
          const totalHeight = (singleImageHeight * 2) + gap;

          const imageLeft = imageAreaLeft + Math.round((imageAreaWidth - imageWidth) / 2);
          const startTop = imageAreaTop + Math.round((imageAreaHeight - totalHeight) / 2);

          const primaryTop = startTop;
          const secondaryTop = startTop + singleImageHeight + gap;

          // Validate minimum height
          if (singleImageHeight < 60) {
            throw new Error(`Images too short for stacked layout. Available height per image: ${singleImageHeight}px (minimum: 60px)`);
          }

          imageLayout = {
            images: [
              {
                top: primaryTop,
                left: imageLeft,
                width: imageWidth,
                height: singleImageHeight,
                altText: `${asset.name} - Primary`
              },
              {
                top: secondaryTop,
                left: imageLeft,
                width: imageWidth,
                height: singleImageHeight,
                altText: `${asset.name} - Secondary`
              }
            ],
            versionLabelPositions: [
              {
                top: primaryTop + singleImageHeight + 5,
                left: imageLeft,
                width: imageWidth
              },
              {
                top: secondaryTop + singleImageHeight + 5,
                left: imageLeft,
                width: imageWidth
              }
            ]
          };
        }
      }
      
      if (!primaryUrl) {
        throw new Error('No primary image URL available');
      }
      
      // Upload primary image
      let validPrimaryUrl = primaryUrl;
      if (!validPrimaryUrl.startsWith('http://') && !validPrimaryUrl.startsWith('https://')) {
        validPrimaryUrl = 'https://' + validPrimaryUrl;
      }

      // Convert PNG to JPEG for better Canva compatibility
      validPrimaryUrl = convertPngToJpeg(validPrimaryUrl);

      let primaryUploadResult;
      try {
        primaryUploadResult = await upload({
          type: "image",
          thumbnailUrl: validPrimaryUrl,
          url: validPrimaryUrl,
          mimeType: "image/jpeg",
          aiDisclosure: "none",
        });
      } catch (uploadError) {
        // Try with original primary URL
        const originalPrimaryUrl = primaryUrl.startsWith('http') ? primaryUrl : 'https://' + primaryUrl;

        // Detect actual MIME type from URL
        const actualMimeType = originalPrimaryUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

        primaryUploadResult = await upload({
          type: "image",
          thumbnailUrl: originalPrimaryUrl,
          url: originalPrimaryUrl,
          mimeType: actualMimeType,
          aiDisclosure: "none",
        });
      }
      

      // Create image elements using the calculated layout
      let imageElements: any[] = [];

      if (!hasDualImages) {
        // Single image
        const imageConfig = imageLayout.images[0];
        const imageElement = {
          type: "image" as const,
          ref: primaryUploadResult.ref,
          altText: { text: imageConfig.altText, decorative: false },
          top: imageConfig.top,
          left: imageConfig.left,
          width: imageConfig.width,
          height: imageConfig.height,
        };
        imageElements.push(imageElement);
      } else {
        // Dual images - upload secondary image and create layout based on ComparisonMode
        let validSecondaryUrl = secondaryUrl!;
        if (!validSecondaryUrl.startsWith('http://') && !validSecondaryUrl.startsWith('https://')) {
          validSecondaryUrl = 'https://' + validSecondaryUrl;
        }

        // Convert PNG to JPEG for better Canva compatibility
        validSecondaryUrl = convertPngToJpeg(validSecondaryUrl);

        // Upload secondary image
        let secondaryUploadResult;
        const originalSecondaryUrl = secondaryUrl!.startsWith('http') ? secondaryUrl! : 'https://' + secondaryUrl!;

        try {
          // Try with original URL first
          secondaryUploadResult = await upload({
            type: "image",
            thumbnailUrl: originalSecondaryUrl,
            url: originalSecondaryUrl,
            mimeType: originalSecondaryUrl.toLowerCase().includes('.png') ? "image/png" : "image/jpeg",
            aiDisclosure: "none",
          });
        } catch (originalError) {
          // Fallback to converted URL
          secondaryUploadResult = await upload({
            type: "image",
            thumbnailUrl: validSecondaryUrl,
            url: validSecondaryUrl,
            mimeType: "image/jpeg",
            aiDisclosure: "none",
          });
        }

        // Create dual image elements using the calculated layout
        const primaryConfig = imageLayout.images[0];
        const secondaryConfig = imageLayout.images[1];

        const primaryElement = {
          type: "image" as const,
          ref: primaryUploadResult.ref,
          altText: { text: primaryConfig.altText, decorative: false },
          top: primaryConfig.top,
          left: primaryConfig.left,
          width: primaryConfig.width,
          height: primaryConfig.height,
        };

        const secondaryElement = {
          type: "image" as const,
          ref: secondaryUploadResult.ref,
          altText: { text: secondaryConfig.altText, decorative: false },
          top: secondaryConfig.top,
          left: secondaryConfig.left,
          width: secondaryConfig.width,
          height: secondaryConfig.height,
        };

        imageElements.push(primaryElement, secondaryElement);
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
      
      // Set page background color
      await setCurrentPageBackground({
        color: "#F7F7F7"
      });

      // Create footer rectangle element - responsive to design width
      const footerRectangleHeight = footerSpace; // Use the calculated footer space
      const footerRectangleTop = designHeight - footerRectangleHeight;

      // Position PricingSaas logo - responsive to design dimensions
      const pricingSaasLogoWidth = Math.max(80, Math.min(146, designWidth * 0.135)); // 146px at 1080px width
      const pricingSaasLogoHeight = Math.max(16, Math.min(29, designWidth * 0.027)); // 29px at 1080px width
      // For 1080px width, use original positioning but adjusted, otherwise responsive
      const pricingSaasLogoLeft = designWidth === 1080 ? 880 : designWidth - pricingSaasLogoWidth - 40; // Moved left from 920 to 880, and increased margin from 20 to 40
      const pricingSaasLogoTop = footerRectangleTop + (footerRectangleHeight / 2) - (pricingSaasLogoHeight / 2); // Center vertically in footer

      const logoElement = {
        type: "image" as const,
        ref: logoUploadResult.ref,
        altText: { text: "PricingSaas logo", decorative: false },
        top: pricingSaasLogoTop,
        left: pricingSaasLogoLeft,
        width: pricingSaasLogoWidth,
        height: pricingSaasLogoHeight,
      };

      const footerRectangleElement = {
        type: "shape" as const,
        paths: [
          {
            d: `M 0 0 L ${designWidth} 0 L ${designWidth} ${footerRectangleHeight} L 0 ${footerRectangleHeight} Z`,
            fill: {
              color: "#132442"
            }
          }
        ],
        top: footerRectangleTop,
        left: 0,
        width: designWidth,
        height: footerRectangleHeight,
        viewBox: {
          top: 0,
          left: 0,
          width: designWidth,
          height: footerRectangleHeight
        }
      };


      // Create company logo element at bottom (if available)
      let companyLogoElement = null;
      if (asset.company_logo_url && asset.company_logo_url.trim()) {
        try {
          // Ensure HTTPS URL for Canva upload
          const logoUrl = asset.company_logo_url.replace(/^http:\/\//, 'https://');
          
          // Detect MIME type from file extension
          const mimeType = logoUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          
          const companyLogoUploadResult = await upload({
            type: "image",
            thumbnailUrl: logoUrl,
            url: logoUrl,
            mimeType: mimeType,
            aiDisclosure: "none",
          });
          
          // Position company logo - responsive to design dimensions
          const logoSize = Math.max(20, Math.min(39, designWidth * 0.036)); // 39px at 1080px width
          const companyLogoLeft = 20;
          const companyLogoTop = footerRectangleTop + (footerRectangleHeight / 2) - (logoSize / 2);

          companyLogoElement = {
            type: "image" as const,
            ref: companyLogoUploadResult.ref,
            altText: { text: `${asset.company_slug || 'Company'} logo`, decorative: false },
            top: companyLogoTop,
            left: companyLogoLeft,
            width: logoSize,
            height: logoSize,
          };
        } catch (err) {
          // Continue without company logo if upload fails
        }
      }


      // Create header text element - responsive to design width
      let headerElement = null;
      if (asset.header && asset.header.trim()) {
        const headerPadding = 20;
        const headerLeft = headerPadding;
        const headerTop = 15; // Increased from 10px for better spacing
        const headerWidth = designWidth - (headerPadding * 2);

        // Scale font size based on design width
        const fontSize = Math.max(24, Math.min(48, designWidth * 0.044)); // 48px at 1080px width

        headerElement = {
          type: "text" as const,
          children: [asset.header.trim()],
          top: headerTop,
          left: headerLeft,
          width: headerWidth,
          fontSize: fontSize,
          fontWeight: "bold" as const,
          color: "#132442",
          textAlign: "center" as const,
        };
      }

      // Create subheader text element - responsive to design width
      let subheaderElement = null;
      if (asset.subheader && asset.subheader.trim()) {
        const subheaderPadding = 20;
        const subheaderLeft = subheaderPadding;
        const subheaderTop = 70; // Increased from 60px for better spacing from header
        const subheaderWidth = designWidth - (subheaderPadding * 2);

        // Scale font size based on design width
        const fontSize = Math.max(16, Math.min(27, designWidth * 0.025)); // 27px at 1080px width

        subheaderElement = {
          type: "text" as const,
          children: [asset.subheader.trim()],
          top: subheaderTop,
          left: subheaderLeft,
          width: subheaderWidth,
          fontSize: fontSize,
          fontWeight: "normal" as const,
          color: "#132442",
          textAlign: "center" as const,
        };
      }

      // Create date pill elements using the calculated layout positions
      let datePillElements: any[] = [];
      let datePillRectangleElements: any[] = [];

      const primaryVersion = asset.version && asset.version.trim();
      const secondaryVersion = asset.secondary_version && asset.secondary_version.trim();

      // Create date pills based on layout positions
      if (primaryVersion || secondaryVersion) {
        const pillWidth = 120;
        const pillHeight = 32;

        imageLayout.versionLabelPositions.forEach((position, index) => {
          const versionToShow = index === 0 ? primaryVersion : secondaryVersion;
          if (!versionToShow) return;

          const formattedDate = formatVersionDate(versionToShow);
          if (!formattedDate) return;

          // Center the pill within the label position area
          const pillLeft = position.left + (position.width / 2) - (pillWidth / 2);
          const pillTop = position.top;

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
        });
      }

      // Create "curated by" text element - responsive positioning
      const curatedByFontSize = Math.max(10, Math.min(14, designWidth * 0.013)); // 14px at 1080px width
      const curatedByWidth = 100;
      // For 1080px width, use original positioning, otherwise responsive
      const curatedByLeft = designWidth === 1080 ? 754 : designWidth - curatedByWidth - 20;
      const curatedByTop = footerRectangleTop + (footerRectangleHeight / 2) - (curatedByFontSize / 2);

      const curatedByElement = {
        type: "text" as const,
        children: ["Curated by"],
        top: curatedByTop,
        left: curatedByLeft,
        width: curatedByWidth,
        fontSize: curatedByFontSize,
        fontWeight: "normal" as const,
        color: "#E4E4E4",
        textAlign: "end" as const,
      };
      

      // Create company slug text element - responsive positioning
      let companySlugElement = null;
      if (asset.company_slug && asset.company_slug.trim()) {
        const formattedSlug = formatCompanySlug(asset.company_slug);
        const slugFontSize = Math.max(10, Math.min(14, designWidth * 0.013)); // 14px at 1080px width
        const logoSize = Math.max(20, Math.min(39, designWidth * 0.036));
        const slugLeft = 20 + logoSize + 10; // After logo + 10px gap
        const slugWidth = designWidth - slugLeft - 120 - 20; // Leave space for "curated by" text
        const slugTop = footerRectangleTop + (footerRectangleHeight / 2) - (slugFontSize / 2);

        companySlugElement = {
          type: "text" as const,
          children: [formattedSlug],
          top: slugTop,
          left: slugLeft,
          width: slugWidth,
          fontSize: slugFontSize,
          fontWeight: "bold" as const,
          color: "#E4E4E4",
          textAlign: "start" as const,
        };
      }


      // Add to design using the same pattern as reference app
      if (features.isSupported(addElementAtPoint)) {
        // Add all image elements (single or dual)
        for (const [index, imageElement] of imageElements.entries()) {
          try {
            // Add small delay between images to prevent Canva conflicts
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }

            await addElementAtPoint(imageElement);
          } catch (err) {
            throw new Error(`Failed to add image ${index + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
        
        try {
          await addElementAtPoint(footerRectangleElement);
        } catch (err) {
          throw new Error(`Failed to add footer rectangle: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        try {
          await addElementAtPoint(logoElement);
        } catch (err) {
          throw new Error(`Failed to add PricingSaas logo: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        // Add company logo at bottom (if available)
        if (companyLogoElement) {
          try {
            await addElementAtPoint(companyLogoElement);
          } catch (err) {
            console.error('ERROR: Failed to add company logo:', err);
            throw new Error(`Failed to add company logo: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        // Add company slug text (to the right of company logo)
        if (companySlugElement) {
          try {
            await addElementAtPoint(companySlugElement);
          } catch (err) {
            console.error('ERROR: Failed to add company slug text:', err);
            throw new Error(`Failed to add company slug text: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        // Add "curated by" text
        try {
          await addElementAtPoint(curatedByElement);
        } catch (err) {
          console.error('ERROR: Failed to add curated by text:', err);
          throw new Error(`Failed to add curated by text: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        // Add header text element (if available)
        if (headerElement) {
          try {
            await addElementAtPoint(headerElement);
          } catch (err) {
            console.error('ERROR: Failed to add header text:', err);
            throw new Error(`Failed to add header text: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        // Add subheader text element (if available)
        if (subheaderElement) {
          try {
            await addElementAtPoint(subheaderElement);
          } catch (err) {
            console.error('ERROR: Failed to add subheader text:', err);
            throw new Error(`Failed to add subheader text: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        // Add date pill rectangles (if available)
        for (const [index, rectangle] of datePillRectangleElements.entries()) {
          try {
            await addElementAtPoint(rectangle);
          } catch (err) {
            console.error(`ERROR: Failed to add date pill rectangle ${index + 1}:`, err);
            throw new Error(`Failed to add date pill rectangle ${index + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        // Add date pill texts (if available)
        for (const [index, pill] of datePillElements.entries()) {
          try {
            await addElementAtPoint(pill);
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
                          backgroundImage: (asset.url || asset.thumbnail) ? `url(${asset.url || asset.thumbnail})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: (asset.url || asset.thumbnail) ? 'transparent' : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        {!(asset.url || asset.thumbnail) && (
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
              <Rows spacing="2u">
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
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Footer Height (px)</Text>
                  </div>
                  <input
                    type="number"
                    value={footerHeight}
                    onChange={(e) => setFooterHeight(Number(e.target.value) || 75)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="30"
                    max="200"
                  />
                </Box>
              </Rows>
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