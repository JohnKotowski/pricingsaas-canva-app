import { Box, Rows, Grid, Text, LoadingIndicator, Button } from "@canva/app-ui-kit";
import { addElementAtPoint, addElementAtCursor, setCurrentPageBackground, createRichtextRange, addPage } from "@canva/design";
import { upload } from "@canva/asset";
import { features } from "@canva/platform";
import "@canva/app-ui-kit/styles.css";
import { useState, useEffect, useRef } from "react";
import * as styles from "./index.css";
import { SizeSelection } from "./components/SizeSelection";
import { AssetGrid } from "./components/AssetGrid";
import { CollectionsList } from "./components/CollectionsList";
import { Asset, Collection, TabType, SizePreset, UploadCache, UploadProgress } from "./types";

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('collections');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [slugFilter, setSlugFilter] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [designWidth, setDesignWidth] = useState(1080);
  const [designHeight, setDesignHeight] = useState(1080);
  const [footerHeight, setFooterHeight] = useState(75);
  const [addBackground, setAddBackground] = useState(true);
  const [includeCuratedBy, setIncludeCuratedBy] = useState(true);
  const [includeFooterBar, setIncludeFooterBar] = useState(true);
  const [includeDateChip, setIncludeDateChip] = useState(true);
  const [logoSize, setLogoSize] = useState(58); // Default company logo size (was responsive: 58px at 1080px width)
  const [logoOffsetX, setLogoOffsetX] = useState(40); // Default company logo position from left
  const [logoOffsetY, setLogoOffsetY] = useState(1013); // Default Y position (in footer area for 1080px height)
  const [headerColor, setHeaderColor] = useState('#000000');
  const [subheaderColor, setSubheaderColor] = useState('#000000');
  const [imageAreaScale, setImageAreaScale] = useState(1.0); // Scale factor for image area (1.0 = 100%, 0.75 = 75%)
  const [headerX, setHeaderX] = useState(20); // Header X position from left
  const [headerY, setHeaderY] = useState(15); // Header Y position from top (matches current default)
  const [headerAlign, setHeaderAlign] = useState<'start' | 'center' | 'end'>('center'); // Header text alignment
  const [subheaderX, setSubheaderX] = useState(400); // Subheader X position from left (where category used to be)
  const [subheaderY, setSubheaderY] = useState(105); // Subheader Y position from top (where category used to be)
  const [subheaderAlign, setSubheaderAlign] = useState<'start' | 'center' | 'end'>('start'); // Subheader text alignment (left-aligned like category was)
  const [includeSubheader, setIncludeSubheader] = useState(true); // Toggle for subheader display
  const [includeCategoryLabel, setIncludeCategoryLabel] = useState(true); // Toggle for category display
  // Configurable labels above header/subheader/category (displayed in #D3DF66 color)
  const [headerLabel, setHeaderLabel] = useState('Metric Name'); // Label text above header
  const [subheaderLabel, setSubheaderLabel] = useState('Modality'); // Label text above subheader
  const [categoryLabel, setCategoryLabel] = useState('Category'); // Label text above category
  const [labelColor, setLabelColor] = useState('#D3DF66'); // Color for all labels
  const [categoryX, setCategoryX] = useState(400); // Category X position from left
  const [categoryY, setCategoryY] = useState(105); // Category Y position from top
  const [categoryAlign, setCategoryAlign] = useState<'start' | 'center' | 'end'>('start'); // Category text alignment (left-aligned)
  const [categoryColor, setCategoryColor] = useState('#F7F7F7'); // Category text color (light gray)
  const [categoryFontSize, setCategoryFontSize] = useState(36); // Category font size (matches header max size, 25% smaller)
  const [includeCompanyLink, setIncludeCompanyLink] = useState(true); // Toggle for company link display
  const [companyLinkY, setCompanyLinkY] = useState(850); // Company link Y position from top (above footer)
  const [companyLinkFontSize, setCompanyLinkFontSize] = useState(18); // Company link font size
  const [companyLinkColor, setCompanyLinkColor] = useState('#F7F7F7'); // Company link text color (light gray)
  const [uploadCache, setUploadCache] = useState<Map<string, UploadCache>>(new Map());
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const abortController = useRef<AbortController | null>(null);

  // Size selection state
  const [showSizeSelection, setShowSizeSelection] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<SizePreset>('1:1');
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);

  // Bulk insert state
  const [showBulkInsertModal, setShowBulkInsertModal] = useState(false);
  const [bulkInsertStep, setBulkInsertStep] = useState<'count' | 'sort' | 'processing'>('count');
  const [bulkInsertCount, setBulkInsertCount] = useState('');
  const [bulkInsertSort, setBulkInsertSort] = useState<'updated' | 'category' | 'header'>('updated');
  const [includeTitleSlides, setIncludeTitleSlides] = useState(false);
  const [includeIndexSlides, setIncludeIndexSlides] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Load collections on app start
  useEffect(() => {
    loadCollections();
  }, []);

  // Handle size selection
  const handleSizeSelection = (preset?: SizePreset) => {
    // Use the passed preset parameter if provided, otherwise fall back to state
    const presetToUse = preset || selectedPreset;

    switch (presetToUse) {
      case '1:1':
        setDesignWidth(1080);
        setDesignHeight(1080);
        break;
      case '16:9':
        setDesignWidth(1920);
        setDesignHeight(1080);
        break;
      case '816x1056':
        // Apply 816x1056 template settings
        setDesignWidth(816);
        setDesignHeight(1056);
        // Turn OFF all layout options
        setAddBackground(false);
        setIncludeCuratedBy(false);
        setIncludeFooterBar(false);
        setIncludeDateChip(false);
        // Set header/subheader colors to light gray
        setHeaderColor('#F7F7F7');
        setSubheaderColor('#F7F7F7');
        // Set logo position defaults for 816x1056
        setLogoOffsetX(82);
        setLogoOffsetY(930);
        // Shrink image area by 25% (set to 75%)
        setImageAreaScale(0.75);
        // Set header position and alignment for 816x1056
        setHeaderX(80);
        setHeaderY(105);
        setHeaderAlign('start');
        break;
      case 'custom':
        setDesignWidth(customWidth);
        setDesignHeight(customHeight);
        break;
    }
    setShowSizeSelection(false);
  };

  // Filter assets based on slug filter
  useEffect(() => {
    if (!slugFilter.trim()) {
      setFilteredAssets(assets);
    } else {
      const filtered = assets.filter(asset =>
        asset.slug?.toLowerCase().includes(slugFilter.toLowerCase())
      );
      setFilteredAssets(filtered);
    }
  }, [assets, slugFilter]);

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
        setFilteredAssets(data.resources);
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
    setFilteredAssets([]);
    setSlugFilter('');
    setError(null);
  };

  // Improved URL validation that tests actual accessibility and Canva requirements
  const validateImageUrl = async (url: string): Promise<boolean> => {
    if (!url || !url.trim()) {
      console.error('URL validation failed: empty URL');
      return false;
    }

    // Check Canva requirements
    if (!url.startsWith('https://')) {
      console.error('URL validation failed: must use HTTPS', url);
      return false;
    }

    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      console.error('URL validation failed: must not be localhost', url);
      return false;
    }

    if (url.length > 4096) {
      console.error('URL validation failed: exceeds 4096 characters', url);
      return false;
    }

    try {
      // First try a proper HTTP HEAD request (without no-cors)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok and content type is an image
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
          console.error('URL validation failed: invalid content-type', contentType, url);
          return false;
        }

        // Check if URL was redirected (Canva requirement: must not redirect)
        if (response.redirected) {
          // Still return true but warn - some redirects might work
        }

        return true;
      }

      console.error('URL validation failed: non-200 status', response.status, url);
      return false;
    } catch (error) {
      console.error('URL validation failed with fetch error:', error, url);
      // Fallback to image loading test
      try {
        return await new Promise<boolean>((resolve) => {
          const img = new Image();

          img.onload = () => {
            resolve(true);
          };
          img.onerror = () => {
            resolve(false);
          };

          // Don't set crossOrigin for better compatibility
          img.src = url;

          // Shorter timeout for faster fallback
          setTimeout(() => {
            console.error('URL validation timed out:', url);
            resolve(false);
          }, 5000);
        });
      } catch {
        console.error('URL validation completely failed:', url);
        return false;
      }
    }
  };

  const getProgressiveFallbackUrls = (asset: Asset): string[] => {
    const urls = [
      asset.primary_cropped_url,
      asset.primary_original_url
    ].filter(Boolean);

    // Apply HTTPS to all URLs, keeping original formats to avoid Cloudinary regeneration delays
    const processedUrls = urls.map(url => ensureHttps(url!));

    // Return processed URLs with unique entries only
    return [...new Set(processedUrls)];
  };

  const getOriginalUrls = (asset: Asset): string[] => {
    const urls = [
      asset.primary_cropped_url,
      asset.primary_original_url
    ].filter(Boolean);

    // Apply only HTTPS conversion, keep original format as-is
    const processedUrls = urls.map(url => ensureHttps(url!));

    // Return processed URLs with unique entries only
    return [...new Set(processedUrls)];
  };

  const ensureHttps = (url: string): string => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    // Only convert HTTP to HTTPS if it's already HTTP, don't force conversion
    if (url.startsWith('http://')) {
      return url.replace(/^http:/, 'https:');
    }
    return url;
  };

  const convertCloudinaryFormat = (url: string): string => {
    // No longer converting formats - use original URLs as-is
    // This prevents Cloudinary from generating new images on-the-fly
    // which can cause timing issues with Canva's image fetching
    return url;
  };

  const detectActualMimeType = async (url: string): Promise<string> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          return contentType;
        }
      }
    } catch (error) {
      // MIME type detection failed, will use fallback
    }

    // Fallback to extension-based detection
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.png') || lowerUrl.includes('/f_png/')) return 'image/png';
    if (lowerUrl.endsWith('.webp') || lowerUrl.includes('/f_webp/')) return 'image/webp';
    return 'image/jpeg';
  };

  const uploadWithRetry = async (urls: string[], config: any, maxRetries = 3): Promise<any> => {
    let lastError: Error | null = null;
    let validUrls: string[] = [];


    // Validate all URLs first
    for (const url of urls) {
      const isValid = await validateImageUrl(url);
      if (isValid) {
        validUrls.push(url);
      }
    }

    if (validUrls.length === 0) {
      throw new Error(`No valid URLs found for upload. Original URLs: ${urls.join(', ')}`);
    }

    for (const url of validUrls) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Detect actual MIME type from the URL (handles f_auto correctly)
          const actualMimeType = await detectActualMimeType(url);

          const uploadConfig = {
            ...config,
            url: url,
            thumbnailUrl: url,
            mimeType: actualMimeType  // Use detected MIME type
          };

          const result = await upload(uploadConfig);

          // Validate upload result
          if (!result || !result.ref) {
            throw new Error('Upload succeeded but no reference returned');
          }

          return result;
        } catch (error) {
          lastError = error as Error;

          if (attempt === maxRetries) break;

          // Exponential backoff with jitter
          const baseDelay = Math.pow(2, attempt) * 1000;
          const jitter = Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
        }
      }
    }

    const finalError = lastError || new Error('All upload attempts failed - no valid URLs found');
    throw finalError;
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

  const formatCompanySlug = (slug: string): string => {
    if (!slug) return '';

    // Replace dots with spaces and capitalize each word
    return slug
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getThumbnailUrl = (asset: Asset): string | null => {
    // Try different thumbnail sources in order of preference
    const sources = [
      asset.primary_cropped_url,
      asset.primary_original_url,
    ].filter(Boolean);

    for (const url of sources) {
      if (url && url.trim() !== '') {
        return ensureHttps(url);
      }
    }

    return null;
  };

  const insertSingleImage = async (asset: Asset, imageType: 'primary' | 'secondary') => {
    try {
      setError(null);

      // Set upload progress
      setUploadProgress(prev => new Map(prev).set(`${asset.id}-${imageType}`, {
        status: 'uploading',
        progress: 10,
        message: `Preparing ${imageType} image upload...`
      }));

      const assetType = asset.asset_type || asset.type || 'simple';

      // Get the appropriate URLs based on image type
      let urls: string[];
      if (imageType === 'primary') {
        urls = getProgressiveFallbackUrls(asset);
      } else {
        urls = [
          asset.secondary_cropped_url,
          asset.secondary_original_url
        ].filter(Boolean).map(url => ensureHttps(url!));
      }

      if (urls.length === 0) {
        throw new Error(`No ${imageType} image URL available`);
      }

      // Upload the image
      setUploadProgress(prev => new Map(prev).set(`${asset.id}-${imageType}`, {
        status: 'uploading',
        progress: 30,
        message: `Uploading ${imageType} image...`
      }));

      const uploadResult = await uploadWithRetry(urls, {
        type: "image",
        aiDisclosure: "none",
      });

      // Calculate image layout for single centered image
      const headerSpace = 110;
      const footerSpace = designWidth === 1920 && designHeight === 1080 ? Math.round(footerHeight * 1.25) : footerHeight;
      const versionLabelSpace = 40;
      const padding = 20;

      // Calculate original (unscaled) area dimensions
      const originalImageAreaHeight = designHeight - headerSpace - footerSpace - versionLabelSpace;
      const originalImageAreaWidth = designWidth - (padding * 2);

      // Apply scale factor
      const imageAreaHeight = originalImageAreaHeight * imageAreaScale;
      const imageAreaWidth = originalImageAreaWidth * imageAreaScale;

      // Center scaled area within original area
      const imageAreaTop = headerSpace + Math.round((originalImageAreaHeight - imageAreaHeight) / 2);
      const imageAreaLeft = padding + Math.round((originalImageAreaWidth - imageAreaWidth) / 2);

      // Calculate centered single image
      const aspectRatio = parseAspectRatio('1:1'); // Default aspect ratio since crop_aspect_ratio is deprecated
      const imageWidth = Math.min(imageAreaWidth, Math.round(imageAreaHeight * aspectRatio));
      const imageHeight = Math.round(imageWidth / aspectRatio);
      const imageLeft = imageAreaLeft + Math.round((imageAreaWidth - imageWidth) / 2);
      const imageTop = imageAreaTop + Math.round((imageAreaHeight - imageHeight) / 2);

      // Create single image element
      const imageElement = {
        type: "image" as const,
        ref: uploadResult.ref,
        altText: { text: `${asset.name} - ${imageType}`, decorative: false },
        top: imageTop,
        left: imageLeft,
        width: imageWidth,
        height: imageHeight,
      };

      setUploadProgress(prev => new Map(prev).set(`${asset.id}-${imageType}`, {
        status: 'verifying',
        progress: 80,
        message: `Inserting ${imageType} image...`
      }));

      // Insert the image
      if (features.isSupported(addElementAtPoint)) {
        await addElementAtPoint(imageElement);
      } else if (features.isSupported(addElementAtCursor)) {
        await addElementAtCursor(imageElement);
      } else {
        throw new Error("Image insertion not supported");
      }

      setUploadProgress(prev => new Map(prev).set(`${asset.id}-${imageType}`, {
        status: 'completed',
        progress: 100,
        message: `${imageType} image inserted successfully!`
      }));

      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.delete(`${asset.id}-${imageType}`);
          return updated;
        });
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to insert ${imageType} image`;
      setError(errorMessage);
      console.error(`Error inserting ${imageType} image:`, err);

      setUploadProgress(prev => new Map(prev).set(`${asset.id}-${imageType}`, {
        status: 'failed',
        progress: 0,
        message: errorMessage
      }));

      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.delete(`${asset.id}-${imageType}`);
          return updated;
        });
      }, 5000);
    }
  };

  const insertAsset = async (asset: Asset) => {
    try {
      setError(null);

      // Set upload progress
      setUploadProgress(prev => new Map(prev).set(asset.id, {
        status: 'uploading',
        progress: 0,
        message: 'Preparing upload...'
      }));

      // Abort any previous upload
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      const assetType = asset.asset_type || asset.type || 'simple';
      const comparisonMode = asset.comparison_mode || 'single';

      // Determine if we should show dual images based on AssetType
      const hasDualImages = assetType === 'diff' &&
        (asset.secondary_cropped_url || asset.secondary_original_url) &&
        (asset.secondary_cropped_url?.trim() !== '' || asset.secondary_original_url?.trim() !== '');


      // Get progressive fallback URLs for primary image
      const primaryUrls = getProgressiveFallbackUrls(asset);

      // Get secondary URLs if dual images
      const secondaryUrls = hasDualImages ? [
        asset.secondary_cropped_url,
        asset.secondary_original_url
      ].filter(Boolean).map(url => ensureHttps(url!)) : [];


      if (primaryUrls.length === 0) {
        throw new Error('No primary image URL available');
      }

      // Parse aspect ratio and determine layout - use original image aspect ratio if available
      let aspectRatio = parseAspectRatio('1:1'); // Default aspect ratio since crop_aspect_ratio is deprecated

      // Try to get original aspect ratio from the selected URLs
      if (primaryUrls[0]) {
        try {
          // Create a temporary image to get natural dimensions
          const img = new Image();
          img.crossOrigin = 'anonymous';

          const originalAspectRatio = await new Promise<number>((resolve) => {
            img.onload = () => {
              const ratio = img.naturalWidth / img.naturalHeight;
              resolve(ratio);
            };
            img.onerror = () => {
              resolve(aspectRatio); // fallback to crop aspect ratio
            };
            img.src = primaryUrls[0];
          });

          aspectRatio = originalAspectRatio;
        } catch (error) {
          // Keep the default aspectRatio since crop_aspect_ratio is deprecated
        }
      }

      // Calculate adjusted footer height first
      const adjustedFooterHeight = designWidth === 1920 && designHeight === 1080
        ? Math.round(footerHeight * 1.25)
        : footerHeight;

      // Calculate dynamic image area based on settings
      const headerSpace = 110; // Increased space for header and subheader (10% more from 100px)
      const footerSpace = adjustedFooterHeight; // Use adjusted footer height
      const versionLabelSpace = 40; // Space for version labels under images
      const padding = 20; // General padding

      // Calculate original (unscaled) area dimensions
      const originalImageAreaHeight = designHeight - headerSpace - footerSpace - versionLabelSpace;
      const originalImageAreaWidth = designWidth - (padding * 2);

      // Apply scale factor
      const imageAreaHeight = originalImageAreaHeight * imageAreaScale;
      const imageAreaWidth = originalImageAreaWidth * imageAreaScale;

      // Center scaled area within original area
      const imageAreaTop = headerSpace + Math.round((originalImageAreaHeight - imageAreaHeight) / 2);
      const imageAreaLeft = padding + Math.round((originalImageAreaWidth - imageAreaWidth) / 2);

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

      // Phase 1: Upload all images first
      setUploadProgress(prev => new Map(prev).set(asset.id, {
        status: 'uploading',
        progress: 10,
        message: 'Starting image uploads...'
      }));

      // Upload primary image
      const primaryCacheKey = primaryUrls[0];
      const cachedPrimary = uploadCache.get(primaryCacheKey);
      let primaryUploadResult: any;

      setUploadProgress(prev => new Map(prev).set(asset.id, {
        status: 'uploading',
        progress: 20,
        message: 'Uploading primary image...'
      }));

      if (cachedPrimary && Date.now() - cachedPrimary.timestamp < 300000) {
        // Use cached result if less than 5 minutes old
        primaryUploadResult = { ref: cachedPrimary.ref };
      } else {
        primaryUploadResult = await uploadWithRetry(primaryUrls, {
          type: "image",
          aiDisclosure: "none",
        });

        // Cache the result
        setUploadCache(prev => new Map(prev).set(primaryCacheKey, {
          ref: primaryUploadResult.ref,
          timestamp: Date.now(),
          url: primaryUrls[0]
        }));
      }

      setUploadProgress(prev => new Map(prev).set(asset.id, {
        status: 'uploading',
        progress: 50,
        message: 'Primary image uploaded successfully!'
      }));

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
        if (secondaryUrls.length === 0) {
          // Fall back to single image using the single image layout
          const imageConfig = imageLayout.images[0];
          imageElements = [{
            type: "image" as const,
            ref: primaryUploadResult.ref,
            altText: { text: imageConfig.altText, decorative: false },
            top: imageConfig.top,
            left: imageConfig.left,
            width: imageConfig.width,
            height: imageConfig.height,
          }];
        } else {
          // Upload secondary image
          setUploadProgress(prev => new Map(prev).set(asset.id, {
            status: 'uploading',
            progress: 60,
            message: 'Uploading secondary image...'
          }));

          const secondaryCacheKey = secondaryUrls[0];
          const cachedSecondary = uploadCache.get(secondaryCacheKey);
          let secondaryUploadResult: any;

          if (cachedSecondary && Date.now() - cachedSecondary.timestamp < 300000) {
            // Use cached result
            secondaryUploadResult = { ref: cachedSecondary.ref };
          } else {
            try {
              secondaryUploadResult = await uploadWithRetry(secondaryUrls, {
                type: "image",
                aiDisclosure: "none",
              });

              if (!secondaryUploadResult || !secondaryUploadResult.ref) {
                throw new Error('Secondary image upload failed - no reference returned');
              }

              // Cache the result
              setUploadCache(prev => new Map(prev).set(secondaryCacheKey, {
                ref: secondaryUploadResult.ref,
                timestamp: Date.now(),
                url: secondaryUrls[0]
              }));
            } catch (secondaryError) {
              console.error('Secondary image upload failed:', secondaryError);

              setUploadProgress(prev => new Map(prev).set(asset.id, {
                status: 'failed',
                progress: 0,
                message: 'Secondary image upload failed'
              }));

              throw new Error(`Secondary image upload failed: ${secondaryError}`);
            }
          }

          setUploadProgress(prev => new Map(prev).set(asset.id, {
            status: 'uploading',
            progress: 80,
            message: 'Secondary image uploaded successfully!'
          }));

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
      }

      // Phase 2: All uploads complete, now start insertion
      setUploadProgress(prev => new Map(prev).set(asset.id, {
        status: 'verifying',
        progress: 85,
        message: 'All images uploaded! Starting insertion...'
      }));

      // Upload and create logo element for top right corner
      const logoUrl = "https://res.cloudinary.com/dd6dkaan9/image/upload/v1756551917/WordmarkWhite_tv0jl9.png";
      const logoUploadResult = await upload({
        type: "image",
        thumbnailUrl: logoUrl,
        url: logoUrl,
        mimeType: "image/png",
        aiDisclosure: "none",
      });

      // Set page background color (if enabled)
      if (addBackground) {
        await setCurrentPageBackground({
          color: "#F7F7F7"
        });
      }

      // Create footer rectangle element - responsive to design width
      const footerRectangleHeight = adjustedFooterHeight;
      const footerRectangleTop = designHeight - footerRectangleHeight;

      // Position PricingSaas logo - responsive to design dimensions, top-right of footer
      const pricingSaasLogoWidth = Math.max(80, Math.min(146, designWidth * 0.135)); // 146px at 1080px width
      const pricingSaasLogoHeight = Math.max(16, Math.min(29, designWidth * 0.027)); // 29px at 1080px width
      // Position in top-right area of footer (40px from right edge)
      const pricingSaasLogoLeft = designWidth - pricingSaasLogoWidth - 40;
      const pricingSaasLogoTop = footerRectangleTop + (footerRectangleHeight / 2) - (pricingSaasLogoHeight / 2); // Centered in footer

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
      let companyLogoElement: any = null;
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

          // Position company logo - use custom size and offsets from settings
          const companyLogoLeft = logoOffsetX; // Custom X offset from left
          const companyLogoTop = logoOffsetY; // Custom Y offset from top of slide

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

      // Create header label element (smaller text above header in #D3DF66)
      let headerLabelElement: any = null;
      if (headerLabel && headerLabel.trim() && asset.header && asset.header.trim()) {
        const labelFontSize = Math.max(14, Math.min(24, designWidth * 0.022)); // Slightly smaller than header
        const labelTop = headerY - labelFontSize - 8; // Position above header

        headerLabelElement = {
          type: "text" as const,
          children: [headerLabel.trim()],
          top: labelTop,
          left: headerX,
          width: designWidth - headerX - 20,
          fontSize: labelFontSize,
          fontWeight: "normal" as const,
          color: labelColor,
          textAlign: headerAlign,
        };
      }

      // Create header text element - responsive to design width
      let headerElement: any = null;
      if (asset.header && asset.header.trim()) {
        const headerPadding = 20;
        // Use X and Y position from settings
        const headerLeft = headerX;
        const headerTop = headerY;
        const headerWidth = designWidth - headerLeft - headerPadding;

        // Scale font size based on design width (25% smaller than original)
        const fontSize = Math.max(18, Math.min(36, designWidth * 0.033)); // 36px at 1080px width

        headerElement = {
          type: "text" as const,
          children: [asset.header.trim()],
          top: headerTop,
          left: headerLeft,
          width: headerWidth,
          fontSize: fontSize,
          fontWeight: "bold" as const,
          color: headerColor,
          textAlign: headerAlign,
        };
      }

      // Create subheader label element (smaller text above subheader in #D3DF66)
      let subheaderLabelElement: any = null;
      if (includeSubheader && subheaderLabel && subheaderLabel.trim() && asset.subheader && asset.subheader.trim()) {
        const labelFontSize = Math.max(14, Math.min(24, designWidth * 0.022)); // Slightly smaller than subheader
        const labelTop = subheaderY - labelFontSize - 8; // Position above subheader

        subheaderLabelElement = {
          type: "text" as const,
          children: [subheaderLabel.trim()],
          top: labelTop,
          left: subheaderX,
          width: designWidth - subheaderX - 20,
          fontSize: labelFontSize,
          fontWeight: "normal" as const,
          color: labelColor,
          textAlign: subheaderAlign,
        };
      }

      // Create subheader text element - responsive to design width
      let subheaderElement: any = null;
      if (includeSubheader && asset.subheader && asset.subheader.trim()) {
        const subheaderPadding = 20;
        // Use X, Y position and alignment from settings
        const subheaderLeft = subheaderX;
        const subheaderTop = subheaderY;
        const subheaderWidth = designWidth - subheaderLeft - subheaderPadding;

        // Scale font size based on design width (same as header)
        const fontSize = Math.max(18, Math.min(36, designWidth * 0.033)); // 36px at 1080px width (same as header)

        subheaderElement = {
          type: "text" as const,
          children: [asset.subheader.trim()],
          top: subheaderTop,
          left: subheaderLeft,
          width: subheaderWidth,
          fontSize: fontSize,
          fontWeight: "bold" as const,
          color: subheaderColor,
          textAlign: subheaderAlign,
        };
      }


      // Create company link text element - displays link to PricingSaaS company page
      let companyLinkElement: any = null;
      if (includeCompanyLink && asset.slug && asset.slug.trim()) {
        // Extract the slug before the period (e.g., "aftership.returns" -> "aftership")
        const companySlug = asset.slug.split('.')[0];
        const linkUrl = `https://pricingsaas.com/companies/${companySlug}`;

        // Calculate position: centered below images and date pills
        // Find the bottom of the image area by getting the max top position from versionLabelPositions
        const maxLabelTop = Math.max(...imageLayout.versionLabelPositions.map(pos => pos.top));
        const datePillHeight = 32; // Height of date pill from line 1215
        const spacing = 15; // Space between date pills and link
        const linkTop = includeDateChip
          ? maxLabelTop + datePillHeight + spacing
          : maxLabelTop + spacing;

        const linkLeft = 20; // Left padding
        const linkWidth = designWidth - 40; // Width with padding on both sides

        // Create richtext range with clickable hyperlink
        const linkRange = createRichtextRange();
        linkRange.appendText(linkUrl, {
          link: linkUrl,
          decoration: "underline",
          color: companyLinkColor,
          fontWeight: "normal",
        });

        // Set paragraph alignment to center
        linkRange.formatParagraph({ index: 0, length: linkUrl.length }, { textAlign: "center" });

        companyLinkElement = {
          type: "richtext" as const,
          range: linkRange,
          top: linkTop,
          left: linkLeft,
          width: linkWidth,
          fontSize: companyLinkFontSize,
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

      // Create "curated by" text element - responsive positioning, moved 100px left from logo, same size as slug
      const curatedByFontSize = Math.max(19, Math.min(26, designWidth * 0.024)); // 26px at 1080px width (same as slug)
      const curatedByWidth = 150; // Increased width to prevent text wrapping
      // Position 100px to the left of the logo to prevent overlap
      const curatedByLeft = pricingSaasLogoLeft - curatedByWidth - 20; // 20px gap from logo
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

      // Create asset slug and category text elements - stacked next to logo
      let assetSlugElement: any = null;
      let categoryElement: any = null;
      let categoryLabelElement: any = null;

      if (asset.slug && asset.slug.trim()) {
        const formattedSlug = formatCompanySlug(asset.slug);
        const slugFontSize = Math.max(19, Math.min(26, designWidth * 0.024)); // 26px at 1080px width
        const categoryFontSizeCalc = Math.max(16, Math.min(22, designWidth * 0.020)); // Slightly smaller than slug
        const categoryLabelFontSize = Math.max(12, Math.min(18, designWidth * 0.017)); // Slightly smaller for label

        const slugLeft = logoOffsetX + logoSize + 15; // After logo + gap
        const slugWidth = curatedByLeft - slugLeft - 20; // Space between slug and "curated by"

        // Calculate vertical positioning to center both elements with logo
        const slugHeight = slugFontSize * 1.2; // Approximate line height
        const categoryLabelHeight = (includeCategoryLabel && asset.company_category && categoryLabel) ? categoryLabelFontSize * 1.2 : 0;
        const categoryHeight = (includeCategoryLabel && asset.company_category) ? categoryFontSizeCalc * 1.2 : 0;
        const totalTextHeight = slugHeight + categoryLabelHeight + categoryHeight + ((includeCategoryLabel && asset.company_category) ? 4 : 0); // gaps between elements
        const textTop = logoOffsetY + (logoSize - totalTextHeight) / 2;

        assetSlugElement = {
          type: "text" as const,
          children: [formattedSlug],
          top: textTop,
          left: slugLeft,
          width: slugWidth,
          fontSize: slugFontSize,
          fontWeight: "bold" as const,
          color: "#E4E4E4",
          textAlign: "start" as const,
        };

        // Create category label element (smaller text above category in #D3DF66)
        if (includeCategoryLabel && asset.company_category && asset.company_category.trim() && categoryLabel && categoryLabel.trim()) {
          categoryLabelElement = {
            type: "text" as const,
            children: [categoryLabel.trim()],
            top: textTop + slugHeight + 2, // 2px gap below slug
            left: slugLeft,
            width: slugWidth,
            fontSize: categoryLabelFontSize,
            fontWeight: "normal" as const,
            color: labelColor,
            textAlign: "start" as const,
          };
        }

        // Create category element below slug/label if category exists
        if (includeCategoryLabel && asset.company_category && asset.company_category.trim()) {
          const categoryTop = categoryLabelElement
            ? textTop + slugHeight + 2 + categoryLabelFontSize * 1.2 + 2 // After label
            : textTop + slugHeight + 2; // After slug
          categoryElement = {
            type: "text" as const,
            children: [asset.company_category.trim()],
            top: categoryTop,
            left: slugLeft,
            width: slugWidth,
            fontSize: categoryFontSizeCalc,
            fontWeight: "normal" as const,
            fontStyle: "italic" as const,
            color: categoryColor,
            textAlign: "start" as const,
          };
        }
      }

      // Helper function to add element with retry logic
      const addElementWithRetry = async (element: any, elementName: string, maxRetries = 3) => {
        // Validate element coordinates before attempting to add
        if (element.top < 0 || element.left < 0 || element.width <= 0 || element.height <= 0) {
          console.error(`Invalid coordinates for ${elementName}:`, {
            top: element.top,
            left: element.left,
            width: element.width,
            height: element.height
          });
          throw new Error(`Invalid coordinates for ${elementName}: position must be non-negative and size must be positive`);
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await addElementAtPoint(element);
            return;
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error(`Attempt ${attempt}/${maxRetries} failed for ${elementName}:`, errorMessage);

            if (attempt === maxRetries) {
              throw new Error(`Failed to add ${elementName} after ${maxRetries} attempts: ${errorMessage}`);
            }

            // Exponential backoff: wait longer between retries
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      // Add to design using the same pattern as reference app
      if (features.isSupported(addElementAtPoint)) {
        // Add all image elements (single or dual) with enhanced error handling
        for (const [index, imageElement] of imageElements.entries()) {
          try {
            // Add delay between images to prevent Canva conflicts (always add delay, even for first image)
            await new Promise(resolve => setTimeout(resolve, index === 0 ? 300 : 500));

            // Validate image element before adding
            if (!imageElement.ref) {
              throw new Error(`Invalid image reference for image ${index + 1}`);
            }

            await addElementWithRetry(imageElement, `image ${index + 1}`);

            // Update progress to show successful image addition
            setUploadProgress(prev => new Map(prev).set(asset.id, {
              status: 'verifying',
              progress: 88 + (index * 4),
              message: `Inserted image ${index + 1} into design...`
            }));

          } catch (err) {
            // If this is a dual image and the first image succeeded, continue with single image
            if (index === 1 && imageElements.length === 2) {
              setUploadProgress(prev => new Map(prev).set(asset.id, {
                status: 'verifying',
                progress: 70,
                message: 'Using single image layout...'
              }));
              break; // Continue with rest of the elements
            } else {
              throw err;
            }
          }
        }

        if (includeFooterBar) {
          try {
            await addElementWithRetry(footerRectangleElement, 'footer rectangle');
          } catch (err) {
            // Continue without footer rectangle if it fails
          }
        }

        // Add PricingSaaS logo (if "Curated by" branding is enabled)
        if (includeCuratedBy) {
          try {
            await addElementWithRetry(logoElement, 'PricingSaas logo');
          } catch (err) {
            // Continue without logo if it fails
          }
        }

        // Add company logo at bottom (if available)
        if (companyLogoElement) {
          try {
            await addElementWithRetry(companyLogoElement, 'company logo');
          } catch (err) {
            // Continue without company logo if it fails
          }
        }

        // Add asset slug text (to the right of company logo)
        if (assetSlugElement) {
          try {
            await addElementWithRetry(assetSlugElement, 'asset slug text');
          } catch (err) {
            // Continue without asset slug text if it fails
          }
        }

        // Add "curated by" text (if "Curated by" branding is enabled)
        if (includeCuratedBy) {
          try {
            await addElementWithRetry(curatedByElement, 'curated by text');
          } catch (err) {
            // Continue without curated by text if it fails
          }
        }

        // Add header label element (if available)
        if (headerLabelElement) {
          try {
            await addElementWithRetry(headerLabelElement, 'header label');
          } catch (err) {
            // Continue without header label if it fails
          }
        }

        // Add header text element (if available)
        if (headerElement) {
          try {
            await addElementWithRetry(headerElement, 'header text');
          } catch (err) {
            // Continue without header text if it fails
          }
        }

        // Add subheader label element (if available)
        if (subheaderLabelElement) {
          try {
            await addElementWithRetry(subheaderLabelElement, 'subheader label');
          } catch (err) {
            // Continue without subheader label if it fails
          }
        }

        // Add subheader text element (if available)
        if (subheaderElement) {
          try {
            await addElementWithRetry(subheaderElement, 'subheader text');
          } catch (err) {
            // Continue without subheader text if it fails
          }
        }

        // Add category label element (if available)
        if (categoryLabelElement) {
          try {
            await addElementWithRetry(categoryLabelElement, 'category label');
          } catch (err) {
            // Continue without category label if it fails
          }
        }

        // Add category text element (if available)
        if (categoryElement) {
          try {
            await addElementWithRetry(categoryElement, 'category text');
          } catch (err) {
            // Continue without category text if it fails
          }
        }

        // Add date pill rectangles (if enabled and available)
        if (includeDateChip) {
          for (const [index, rectangle] of datePillRectangleElements.entries()) {
            try {
              await addElementWithRetry(rectangle, `date pill rectangle ${index + 1}`);
            } catch (err) {
              // Continue without this date pill rectangle if it fails
            }
          }

          // Add date pill texts (if available)
          for (const [index, pill] of datePillElements.entries()) {
            try {
              await addElementWithRetry(pill, `date pill text ${index + 1}`);
            } catch (err) {
              // Continue without this date pill text if it fails
            }
          }
        }

        // Add company link text element (if available)
        if (companyLinkElement) {
          try {
            await addElementWithRetry(companyLinkElement, 'company link text');
          } catch (err) {
            // Continue without company link text if it fails
          }
        }

      } else if (features.isSupported(addElementAtCursor)) {
        // Add all image elements
        for (const imageElement of imageElements) {
          await addElementAtCursor(imageElement);
        }
        // Note: footerRectangleElement (shape) not supported by addElementAtCursor
        // Add PricingSaaS logo (if "Curated by" branding is enabled)
        if (includeCuratedBy) {
          await addElementAtCursor(logoElement);
        }

        // Add company logo and slug (if available)
        if (companyLogoElement) {
          await addElementAtCursor(companyLogoElement);
        }
        if (assetSlugElement) {
          await addElementAtCursor(assetSlugElement);
        }

        // Add "curated by" text (if "Curated by" branding is enabled)
        if (includeCuratedBy) {
          await addElementAtCursor(curatedByElement);
        }
        if (headerLabelElement) {
          await addElementAtCursor(headerLabelElement);
        }
        if (headerElement) {
          await addElementAtCursor(headerElement);
        }
        if (subheaderLabelElement) {
          await addElementAtCursor(subheaderLabelElement);
        }
        if (subheaderElement) {
          await addElementAtCursor(subheaderElement);
        }
        if (categoryLabelElement) {
          await addElementAtCursor(categoryLabelElement);
        }
        if (categoryElement) {
          await addElementAtCursor(categoryElement);
        }
        // Add date pill elements (if enabled)
        if (includeDateChip) {
          for (const rectangle of datePillRectangleElements) {
            await addElementAtCursor(rectangle);
          }
          for (const pill of datePillElements) {
            await addElementAtCursor(pill);
          }
        }
        // Add company link text element (if available)
        if (companyLinkElement) {
          await addElementAtCursor(companyLinkElement);
        }
      } else {
        throw new Error("Image insertion not supported");
      }

      // Mark insertion as completed
      setUploadProgress(prev => new Map(prev).set(asset.id, {
        status: 'completed',
        progress: 100,
        message: hasDualImages ? 'Dual images inserted successfully!' : 'Image inserted successfully!'
      }));

      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.delete(asset.id);
          return updated;
        });
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add elements to design';
      setError(errorMessage);
      console.error('Error inserting asset:', err);

      // Mark upload as failed
      setUploadProgress(prev => new Map(prev).set(asset.id, {
        status: 'failed',
        progress: 0,
        message: errorMessage
      }));

      // Clear progress after 5 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.delete(asset.id);
          return updated;
        });
      }, 5000);
    }
  };

  const insertAssetWithNewPage = async (asset: Asset) => {
    try {
      setError(null);

      // Set upload progress
      setUploadProgress(prev => new Map(prev).set(`${asset.id}-newpage`, {
        status: 'uploading',
        progress: 0,
        message: 'Creating new page...'
      }));

      // Add a new page
      await addPage({
        title: asset.name || 'New Page',
        background: addBackground ? {
          color: '#191a1b'
        } : undefined
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      setUploadProgress(prev => new Map(prev).set(`${asset.id}-newpage`, {
        status: 'uploading',
        progress: 10,
        message: 'New page created, adding background...'
      }));

      // Insert background image at position (0, 0)
      const backgroundImageUrl = 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1765338464/Pricing_Example_slide_d7ibnr.png';

      try {
        // Upload the background image to Canva using the same upload pattern
        const backgroundUploadResult = await uploadWithRetry([backgroundImageUrl], {
          type: "image",
          aiDisclosure: "none",
        });

        // Create the background image element at position (0, 0)
        const backgroundImageElement = {
          type: "image" as const,
          ref: backgroundUploadResult.ref,
          altText: { text: "Background Template", decorative: true },
          top: 0,
          left: 0,
          width: designWidth,
          height: designHeight,
        };

        // Add the background image to the page as the first layer
        if (features.isSupported(addElementAtPoint)) {
          await addElementAtPoint(backgroundImageElement);
        } else if (features.isSupported(addElementAtCursor)) {
          await addElementAtCursor(backgroundImageElement);
        } else {
          throw new Error("Image insertion not supported");
        }

        setUploadProgress(prev => new Map(prev).set(`${asset.id}-newpage`, {
          status: 'uploading',
          progress: 20,
          message: 'Background added, preparing asset upload...'
        }));
      } catch (bgError) {
        console.error('Error adding background image:', bgError);
        // Continue with asset insertion even if background fails
        setUploadProgress(prev => new Map(prev).set(`${asset.id}-newpage`, {
          status: 'uploading',
          progress: 15,
          message: 'Background skipped, preparing asset upload...'
        }));
      }

      // Now insert the asset normally (which will go into the new page)
      await insertAsset(asset);

      // Clear the newpage progress indicator
      setUploadProgress(prev => {
        const updated = new Map(prev);
        updated.delete(`${asset.id}-newpage`);
        return updated;
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add page and insert asset';
      setError(errorMessage);
      console.error('Error adding page and inserting asset:', error);

      // Show error in progress
      setUploadProgress(prev => new Map(prev).set(`${asset.id}-newpage`, {
        status: 'failed',
        progress: 0,
        message: errorMessage
      }));

      // Clear progress after 5 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.delete(`${asset.id}-newpage`);
          return updated;
        });
      }, 5000);
    }
  };

  const createTitleSlide = async (categoryName: string) => {
    try {
      // Add a new page for the title slide
      await addPage({
        title: `${categoryName} - Title Slide`,
        background: {
          color: '#191a1b'
        }
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      // Insert title slide background image at position (0, 0)
      const titleSlideBackgroundUrl = 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1761670032/100_Pricing_Metrics_5_akxzel.png';

      const backgroundUploadResult = await uploadWithRetry([titleSlideBackgroundUrl], {
        type: "image",
        aiDisclosure: "none",
      });

      const backgroundImageElement = {
        type: "image" as const,
        ref: backgroundUploadResult.ref,
        altText: { text: "Title Slide Background", decorative: true },
        top: 0,
        left: 0,
        width: designWidth,
        height: designHeight,
      };

      if (features.isSupported(addElementAtPoint)) {
        await addElementAtPoint(backgroundImageElement);
      } else if (features.isSupported(addElementAtCursor)) {
        await addElementAtCursor(backgroundImageElement);
      } else {
        throw new Error("Image insertion not supported");
      }

      // Add category text in the middle of the screen
      const categoryTextElement = {
        type: "text" as const,
        children: [categoryName],
        top: (designHeight / 2) - 40,
        left: designWidth * 0.1,
        width: designWidth * 0.8,
        fontSize: 80,
        fontWeight: "bold" as const,
        color: "#ffffff",
        textAlign: "center" as const,
      };

      if (features.isSupported(addElementAtPoint)) {
        await addElementAtPoint(categoryTextElement);
      } else if (features.isSupported(addElementAtCursor)) {
        await addElementAtCursor(categoryTextElement);
      } else {
        throw new Error("Text insertion not supported");
      }

    } catch (error) {
      console.error('Error creating title slide:', error);
      throw error;
    }
  };

  const createIndexSlide = async (categoryName: string, assets: Asset[]) => {
    try {
      // Add a new page for the index slide
      await addPage({
        title: `${categoryName} - Index`,
        background: {
          color: '#191a1b'
        }
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      // Insert index slide background image at position (0, 0)
      const indexSlideBackgroundUrl = 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1761670734/100_Pricing_Metrics_6_no2nar.png';

      const backgroundUploadResult = await uploadWithRetry([indexSlideBackgroundUrl], {
        type: "image",
        aiDisclosure: "none",
      });

      const backgroundImageElement = {
        type: "image" as const,
        ref: backgroundUploadResult.ref,
        altText: { text: "Index Slide Background", decorative: true },
        top: 0,
        left: 0,
        width: designWidth,
        height: designHeight,
      };

      if (features.isSupported(addElementAtPoint)) {
        await addElementAtPoint(backgroundImageElement);
      } else if (features.isSupported(addElementAtCursor)) {
        await addElementAtCursor(backgroundImageElement);
      } else {
        throw new Error("Image insertion not supported");
      }

      // Calculate spacing for index items
      const itemHeight = 90; // Increased spacing between lines (50% bigger)
      const startY = (designHeight - (assets.length * itemHeight)) / 2;
      const leftMargin = designWidth * 0.05;
      const logoSize = 45; // 50% bigger than 30
      const fontSize = 27; // 50% bigger than 18
      const spacing = 15; // 50% bigger than 10

      // Add each asset as a line item in the index
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const currentY = startY + (i * itemHeight);
        let currentX = leftMargin;

        // Upload and add logo if available
        if (asset.company_logo_url && asset.company_logo_url.trim()) {
          try {
            // Ensure HTTPS URL for Canva upload
            const logoUrl = asset.company_logo_url.replace(/^http:\/\//, 'https://');

            // Detect MIME type from file extension
            const mimeType = logoUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

            const logoUploadResult = await upload({
              type: "image",
              thumbnailUrl: logoUrl,
              url: logoUrl,
              mimeType: mimeType,
              aiDisclosure: "none",
            });

            const logoElement = {
              type: "image" as const,
              ref: logoUploadResult.ref,
              altText: { text: `${asset.company_name} logo`, decorative: true },
              top: currentY,
              left: currentX,
              width: logoSize,
              height: logoSize,
            };

            if (features.isSupported(addElementAtPoint)) {
              await addElementAtPoint(logoElement);
            } else if (features.isSupported(addElementAtCursor)) {
              await addElementAtCursor(logoElement);
            }

            currentX += logoSize + spacing;
          } catch (logoError) {
            console.error('Error adding logo to index:', logoError);
            // Continue without logo
            currentX += logoSize + spacing;
          }
        } else {
          currentX += logoSize + spacing;
        }

        // Build the text content: slug, header, subheader
        const textParts: string[] = [];
        if (asset.slug) textParts.push(asset.slug);
        if (asset.header) textParts.push(asset.header);
        if (asset.subheader) textParts.push(asset.subheader);
        const textContent = textParts.join(', ');

        if (textContent) {
          const textElement = {
            type: "text" as const,
            children: [textContent],
            top: currentY + 8,
            left: currentX,
            width: designWidth - currentX - leftMargin,
            fontSize: fontSize,
            fontWeight: "normal" as const,
            color: "#ffffff",
            textAlign: "start" as const,
          };

          if (features.isSupported(addElementAtPoint)) {
            await addElementAtPoint(textElement);
          } else if (features.isSupported(addElementAtCursor)) {
            await addElementAtCursor(textElement);
          }
        }
      }

    } catch (error) {
      console.error('Error creating index slide:', error);
      throw error;
    }
  };

  const handleBulkInsert = () => {
    // Open the modal
    setBulkInsertCount('');
    setBulkInsertStep('count');
    setShowBulkInsertModal(true);
  };

  const executeBulkInsert = async () => {
    try {
      setBulkInsertStep('processing');

      // Filter by favorites if enabled
      let assetsToProcess = [...filteredAssets];
      if (onlyFavorites) {
        assetsToProcess = assetsToProcess.filter(a => a.is_favorited);
      }

      if (assetsToProcess.length === 0) {
        setError(onlyFavorites ? 'No favorited assets found' : 'No assets found');
        setBulkInsertStep('count');
        return;
      }

      const count = bulkInsertCount.toLowerCase() === 'all' ? assetsToProcess.length : parseInt(bulkInsertCount);

      if (isNaN(count) || count <= 0) {
        setError('Please enter a valid number or "all"');
        setBulkInsertStep('count');
        return;
      }

      const actualCount = Math.min(count, assetsToProcess.length);

      let sortedAssets = [...assetsToProcess];

      if (bulkInsertSort === 'updated') {
        // Sort by last updated (newest first)
        sortedAssets.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
          const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
          return dateB - dateA; // Newest first
        });
      } else if (bulkInsertSort === 'header') {
        // Sort alphabetically by header
        sortedAssets.sort((a, b) => {
          const headerA = a.header || '';
          const headerB = b.header || '';
          return headerA.localeCompare(headerB);
        });
      } else {
        // Sort by category
        sortedAssets.sort((a, b) => {
          const catA = a.company_category || '';
          const catB = b.company_category || '';
          return catA.localeCompare(catB);
        });
      }

      // Take only the number of assets requested
      const assetsToInsert = sortedAssets.slice(0, actualCount);

      // Step 3: Insert each asset with new page
      let lastCategory: string | null = null;

      for (let i = 0; i < assetsToInsert.length; i++) {
        const asset = assetsToInsert[i];

        try {
          // If title slides are enabled and sorting by category, create title slide before new category
          if (includeTitleSlides && bulkInsertSort === 'category') {
            const currentCategory = asset.company_category || 'Uncategorized';

            // Create title slide if this is a new category
            if (currentCategory !== lastCategory) {
              await createTitleSlide(currentCategory);
              lastCategory = currentCategory;

              // Add a small delay after title slide
              await new Promise(resolve => setTimeout(resolve, 1000));

              // If index slides are also enabled, create index slide
              if (includeIndexSlides) {
                // Collect all assets in this category
                const categoryAssets = assetsToInsert.filter(
                  a => (a.company_category || 'Uncategorized') === currentCategory
                );

                await createIndexSlide(currentCategory, categoryAssets);

                // Add a small delay after index slide
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }

          await insertAssetWithNewPage(asset);

          // Add a small delay between insertions to avoid overwhelming the system
          if (i < assetsToInsert.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error inserting asset ${i + 1} (${asset.name}):`, error);
          // Continue with next asset even if this one fails
        }
      }

      setShowBulkInsertModal(false);
      setBulkInsertStep('count');

    } catch (error) {
      console.error('Bulk insert error:', error);
      setError('An error occurred during bulk insert. Please try again.');
      setBulkInsertStep('count');
    }
  };

  const insertAssetOriginal = async (asset: Asset) => {
    try {
      setError(null);

      // Set upload progress with different message for original format
      setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
        status: 'uploading',
        progress: 0,
        message: 'Preparing original format upload...'
      }));

      // Abort any previous upload
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      const assetType = asset.asset_type || asset.type || 'simple';
      const comparisonMode = asset.comparison_mode || 'single';

      // Determine if we should show dual images based on AssetType
      const hasDualImages = assetType === 'diff' &&
        (asset.secondary_cropped_url || asset.secondary_original_url) &&
        (asset.secondary_cropped_url?.trim() !== '' || asset.secondary_original_url?.trim() !== '');

      // Get original URLs for primary image (no PNG conversion)
      const primaryUrls = getOriginalUrls(asset);

      // Get secondary URLs if dual images (no PNG conversion)
      const secondaryUrls = hasDualImages ? [
        asset.secondary_cropped_url,
        asset.secondary_original_url
      ].filter(Boolean).map(url => ensureHttps(url!)) : [];

      if (primaryUrls.length === 0) {
        throw new Error('No primary image URL available');
      }

      // Parse aspect ratio and determine layout - use original image aspect ratio if available
      let aspectRatio = parseAspectRatio('1:1'); // Default aspect ratio since crop_aspect_ratio is deprecated

      // Try to get original aspect ratio from the selected URLs
      if (primaryUrls[0]) {
        try {
          // Create a temporary image to get natural dimensions
          const img = new Image();
          img.crossOrigin = 'anonymous';

          const originalAspectRatio = await new Promise<number>((resolve) => {
            img.onload = () => {
              const ratio = img.naturalWidth / img.naturalHeight;
              resolve(ratio);
            };
            img.onerror = () => {
              resolve(aspectRatio); // fallback to crop aspect ratio
            };
            img.src = primaryUrls[0];
          });

          aspectRatio = originalAspectRatio;
        } catch (error) {
          // Keep the default aspectRatio since crop_aspect_ratio is deprecated
        }
      }

      // Calculate adjusted footer height first
      const adjustedFooterHeight = designWidth === 1920 && designHeight === 1080
        ? Math.round(footerHeight * 1.25)
        : footerHeight;

      // Calculate dynamic image area based on settings
      const headerSpace = 110; // Increased space for header and subheader (10% more from 100px)
      const footerSpace = adjustedFooterHeight; // Use adjusted footer height
      const versionLabelSpace = 40; // Space for version labels under images
      const padding = 20; // General padding

      // Calculate original (unscaled) area dimensions
      const originalImageAreaHeight = designHeight - headerSpace - footerSpace - versionLabelSpace;
      const originalImageAreaWidth = designWidth - (padding * 2);

      // Apply scale factor
      const imageAreaHeight = originalImageAreaHeight * imageAreaScale;
      const imageAreaWidth = originalImageAreaWidth * imageAreaScale;

      // Center scaled area within original area
      const imageAreaTop = headerSpace + Math.round((originalImageAreaHeight - imageAreaHeight) / 2);
      const imageAreaLeft = padding + Math.round((originalImageAreaWidth - imageAreaWidth) / 2);

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

      // Phase 1: Upload all images first
      setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
        status: 'uploading',
        progress: 10,
        message: 'Starting original format image uploads...'
      }));

      // Upload primary image
      const primaryCacheKey = `${primaryUrls[0]}-original`;
      const cachedPrimary = uploadCache.get(primaryCacheKey);
      let primaryUploadResult: any;

      setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
        status: 'uploading',
        progress: 20,
        message: 'Uploading primary image in original format...'
      }));

      if (cachedPrimary && Date.now() - cachedPrimary.timestamp < 300000) {
        // Use cached result if less than 5 minutes old
        primaryUploadResult = { ref: cachedPrimary.ref };
      } else {
        primaryUploadResult = await uploadWithRetry(primaryUrls, {
          type: "image",
          aiDisclosure: "none",
        });

        // Cache the result
        setUploadCache(prev => new Map(prev).set(primaryCacheKey, {
          ref: primaryUploadResult.ref,
          timestamp: Date.now(),
          url: primaryUrls[0]
        }));
      }

      setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
        status: 'uploading',
        progress: 50,
        message: 'Primary image uploaded in original format!'
      }));

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
        if (secondaryUrls.length === 0) {
          // Fall back to single image using the single image layout
          const imageConfig = imageLayout.images[0];
          imageElements = [{
            type: "image" as const,
            ref: primaryUploadResult.ref,
            altText: { text: imageConfig.altText, decorative: false },
            top: imageConfig.top,
            left: imageConfig.left,
            width: imageConfig.width,
            height: imageConfig.height,
          }];
        } else {
          // Upload secondary image
          setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
            status: 'uploading',
            progress: 60,
            message: 'Uploading secondary image in original format...'
          }));

          const secondaryCacheKey = `${secondaryUrls[0]}-original`;
          const cachedSecondary = uploadCache.get(secondaryCacheKey);
          let secondaryUploadResult: any;

          if (cachedSecondary && Date.now() - cachedSecondary.timestamp < 300000) {
            // Use cached result
            secondaryUploadResult = { ref: cachedSecondary.ref };
          } else {
            try {
              secondaryUploadResult = await uploadWithRetry(secondaryUrls, {
                type: "image",
                aiDisclosure: "none",
              });

              if (!secondaryUploadResult || !secondaryUploadResult.ref) {
                throw new Error('Secondary image upload failed - no reference returned');
              }

              // Cache the result
              setUploadCache(prev => new Map(prev).set(secondaryCacheKey, {
                ref: secondaryUploadResult.ref,
                timestamp: Date.now(),
                url: secondaryUrls[0]
              }));
            } catch (secondaryError) {
              console.error('Secondary image upload failed:', secondaryError);

              setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
                status: 'failed',
                progress: 0,
                message: 'Secondary image upload failed'
              }));

              throw new Error(`Secondary image upload failed: ${secondaryError}`);
            }
          }

          setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
            status: 'uploading',
            progress: 80,
            message: 'Secondary image uploaded in original format!'
          }));

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
      }

      // Phase 2: All uploads complete, now start insertion
      setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
        status: 'verifying',
        progress: 85,
        message: 'All original format images uploaded! Starting insertion...'
      }));

      // Upload and create logo element for top right corner
      const logoUrl = "https://res.cloudinary.com/dd6dkaan9/image/upload/v1756551917/WordmarkWhite_tv0jl9.png";
      const logoUploadResult = await upload({
        type: "image",
        thumbnailUrl: logoUrl,
        url: logoUrl,
        mimeType: "image/png",
        aiDisclosure: "none",
      });

      // Set page background color (if enabled)
      if (addBackground) {
        await setCurrentPageBackground({
          color: "#F7F7F7"
        });
      }

      // Create footer rectangle element - responsive to design width
      const footerRectangleHeight = adjustedFooterHeight;
      const footerRectangleTop = designHeight - footerRectangleHeight;

      // Position PricingSaas logo - responsive to design dimensions, top-right of footer
      const pricingSaasLogoWidth = Math.max(80, Math.min(146, designWidth * 0.135)); // 146px at 1080px width
      const pricingSaasLogoHeight = Math.max(16, Math.min(29, designWidth * 0.027)); // 29px at 1080px width
      // Position in top-right area of footer (40px from right edge)
      const pricingSaasLogoLeft = designWidth - pricingSaasLogoWidth - 40;
      const pricingSaasLogoTop = footerRectangleTop + (footerRectangleHeight / 2) - (pricingSaasLogoHeight / 2); // Centered in footer

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
      let companyLogoElement: any = null;
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

          // Position company logo - use custom size and offsets from settings
          const companyLogoLeft = logoOffsetX; // Custom X offset from left
          const companyLogoTop = logoOffsetY; // Custom Y offset from top of slide

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

      // Create header label element (smaller text above header in #D3DF66)
      let headerLabelElement: any = null;
      if (headerLabel && headerLabel.trim() && asset.header && asset.header.trim()) {
        const labelFontSize = Math.max(14, Math.min(24, designWidth * 0.022)); // Slightly smaller than header
        const labelTop = headerY - labelFontSize - 8; // Position above header

        headerLabelElement = {
          type: "text" as const,
          children: [headerLabel.trim()],
          top: labelTop,
          left: headerX,
          width: designWidth - headerX - 20,
          fontSize: labelFontSize,
          fontWeight: "normal" as const,
          color: labelColor,
          textAlign: headerAlign,
        };
      }

      // Create header text element - responsive to design width
      let headerElement: any = null;
      if (asset.header && asset.header.trim()) {
        const headerPadding = 20;
        // Use X and Y position from settings
        const headerLeft = headerX;
        const headerTop = headerY;
        const headerWidth = designWidth - headerLeft - headerPadding;

        // Scale font size based on design width (25% smaller than original)
        const fontSize = Math.max(18, Math.min(36, designWidth * 0.033)); // 36px at 1080px width

        headerElement = {
          type: "text" as const,
          children: [asset.header.trim()],
          top: headerTop,
          left: headerLeft,
          width: headerWidth,
          fontSize: fontSize,
          fontWeight: "bold" as const,
          color: headerColor,
          textAlign: headerAlign,
        };
      }

      // Create subheader label element (smaller text above subheader in #D3DF66)
      let subheaderLabelElement: any = null;
      if (includeSubheader && subheaderLabel && subheaderLabel.trim() && asset.subheader && asset.subheader.trim()) {
        const labelFontSize = Math.max(14, Math.min(24, designWidth * 0.022)); // Slightly smaller than subheader
        const labelTop = subheaderY - labelFontSize - 8; // Position above subheader

        subheaderLabelElement = {
          type: "text" as const,
          children: [subheaderLabel.trim()],
          top: labelTop,
          left: subheaderX,
          width: designWidth - subheaderX - 20,
          fontSize: labelFontSize,
          fontWeight: "normal" as const,
          color: labelColor,
          textAlign: subheaderAlign,
        };
      }

      // Create subheader text element - responsive to design width
      let subheaderElement: any = null;
      if (includeSubheader && asset.subheader && asset.subheader.trim()) {
        const subheaderPadding = 20;
        // Use X, Y position and alignment from settings
        const subheaderLeft = subheaderX;
        const subheaderTop = subheaderY;
        const subheaderWidth = designWidth - subheaderLeft - subheaderPadding;

        // Scale font size based on design width (same as header)
        const fontSize = Math.max(18, Math.min(36, designWidth * 0.033)); // 36px at 1080px width (same as header)

        subheaderElement = {
          type: "text" as const,
          children: [asset.subheader.trim()],
          top: subheaderTop,
          left: subheaderLeft,
          width: subheaderWidth,
          fontSize: fontSize,
          fontWeight: "bold" as const,
          color: subheaderColor,
          textAlign: subheaderAlign,
        };
      }


      // Create company link text element - displays link to PricingSaaS company page
      let companyLinkElement: any = null;
      if (includeCompanyLink && asset.slug && asset.slug.trim()) {
        // Extract the slug before the period (e.g., "aftership.returns" -> "aftership")
        const companySlug = asset.slug.split('.')[0];
        const linkUrl = `https://pricingsaas.com/companies/${companySlug}`;

        // Calculate position: centered below images and date pills
        // Find the bottom of the image area by getting the max top position from versionLabelPositions
        const maxLabelTop = Math.max(...imageLayout.versionLabelPositions.map(pos => pos.top));
        const datePillHeight = 32; // Height of date pill from line 1215
        const spacing = 15; // Space between date pills and link
        const linkTop = includeDateChip
          ? maxLabelTop + datePillHeight + spacing
          : maxLabelTop + spacing;

        const linkLeft = 20; // Left padding
        const linkWidth = designWidth - 40; // Width with padding on both sides

        // Create richtext range with clickable hyperlink
        const linkRange = createRichtextRange();
        linkRange.appendText(linkUrl, {
          link: linkUrl,
          decoration: "underline",
          color: companyLinkColor,
          fontWeight: "normal",
        });

        // Set paragraph alignment to center
        linkRange.formatParagraph({ index: 0, length: linkUrl.length }, { textAlign: "center" });

        companyLinkElement = {
          type: "richtext" as const,
          range: linkRange,
          top: linkTop,
          left: linkLeft,
          width: linkWidth,
          fontSize: companyLinkFontSize,
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

      // Create "curated by" text element - responsive positioning, moved 100px left from logo, same size as slug
      const curatedByFontSize = Math.max(19, Math.min(26, designWidth * 0.024)); // 26px at 1080px width (same as slug)
      const curatedByWidth = 150; // Increased width to prevent text wrapping
      // Position 100px to the left of the logo to prevent overlap
      const curatedByLeft = pricingSaasLogoLeft - curatedByWidth - 20; // 20px gap from logo
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

      // Create asset slug and category text elements - stacked next to logo
      let assetSlugElement: any = null;
      let categoryElement: any = null;
      let categoryLabelElement: any = null;

      if (asset.slug && asset.slug.trim()) {
        const formattedSlug = formatCompanySlug(asset.slug);
        const slugFontSize = Math.max(19, Math.min(26, designWidth * 0.024)); // 26px at 1080px width
        const categoryFontSizeCalc = Math.max(16, Math.min(22, designWidth * 0.020)); // Slightly smaller than slug
        const categoryLabelFontSize = Math.max(12, Math.min(18, designWidth * 0.017)); // Slightly smaller for label

        const slugLeft = logoOffsetX + logoSize + 15; // After logo + gap
        const slugWidth = curatedByLeft - slugLeft - 20; // Space between slug and "curated by"

        // Calculate vertical positioning to center both elements with logo
        const slugHeight = slugFontSize * 1.2; // Approximate line height
        const categoryLabelHeight = (includeCategoryLabel && asset.company_category && categoryLabel) ? categoryLabelFontSize * 1.2 : 0;
        const categoryHeight = (includeCategoryLabel && asset.company_category) ? categoryFontSizeCalc * 1.2 : 0;
        const totalTextHeight = slugHeight + categoryLabelHeight + categoryHeight + ((includeCategoryLabel && asset.company_category) ? 4 : 0); // gaps between elements
        const textTop = logoOffsetY + (logoSize - totalTextHeight) / 2;

        assetSlugElement = {
          type: "text" as const,
          children: [formattedSlug],
          top: textTop,
          left: slugLeft,
          width: slugWidth,
          fontSize: slugFontSize,
          fontWeight: "bold" as const,
          color: "#E4E4E4",
          textAlign: "start" as const,
        };

        // Create category label element (smaller text above category in #D3DF66)
        if (includeCategoryLabel && asset.company_category && asset.company_category.trim() && categoryLabel && categoryLabel.trim()) {
          categoryLabelElement = {
            type: "text" as const,
            children: [categoryLabel.trim()],
            top: textTop + slugHeight + 2, // 2px gap below slug
            left: slugLeft,
            width: slugWidth,
            fontSize: categoryLabelFontSize,
            fontWeight: "normal" as const,
            color: labelColor,
            textAlign: "start" as const,
          };
        }

        // Create category element below slug/label if category exists
        if (includeCategoryLabel && asset.company_category && asset.company_category.trim()) {
          const categoryTop = categoryLabelElement
            ? textTop + slugHeight + 2 + categoryLabelFontSize * 1.2 + 2 // After label
            : textTop + slugHeight + 2; // After slug
          categoryElement = {
            type: "text" as const,
            children: [asset.company_category.trim()],
            top: categoryTop,
            left: slugLeft,
            width: slugWidth,
            fontSize: categoryFontSizeCalc,
            fontWeight: "normal" as const,
            fontStyle: "italic" as const,
            color: categoryColor,
            textAlign: "start" as const,
          };
        }
      }

      // Helper function to add element with retry logic
      const addElementWithRetry = async (element: any, elementName: string, maxRetries = 3) => {
        // Validate element coordinates before attempting to add
        if (element.top < 0 || element.left < 0 || element.width <= 0 || element.height <= 0) {
          console.error(`Invalid coordinates for ${elementName}:`, {
            top: element.top,
            left: element.left,
            width: element.width,
            height: element.height
          });
          throw new Error(`Invalid coordinates for ${elementName}: position must be non-negative and size must be positive`);
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await addElementAtPoint(element);
            return;
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error(`Attempt ${attempt}/${maxRetries} failed for ${elementName}:`, errorMessage);

            if (attempt === maxRetries) {
              throw new Error(`Failed to add ${elementName} after ${maxRetries} attempts: ${errorMessage}`);
            }

            // Exponential backoff: wait longer between retries
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      // Add to design using the same pattern as reference app
      if (features.isSupported(addElementAtPoint)) {
        // Add all image elements (single or dual) with enhanced error handling
        for (const [index, imageElement] of imageElements.entries()) {
          try {
            // Add delay between images to prevent Canva conflicts (always add delay, even for first image)
            await new Promise(resolve => setTimeout(resolve, index === 0 ? 300 : 500));

            // Validate image element before adding
            if (!imageElement.ref) {
              throw new Error(`Invalid image reference for image ${index + 1}`);
            }

            await addElementWithRetry(imageElement, `image ${index + 1}`);

            // Update progress to show successful image addition
            setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
              status: 'verifying',
              progress: 88 + (index * 4),
              message: `Inserted original format image ${index + 1} into design...`
            }));

          } catch (err) {
            // If this is a dual image and the first image succeeded, continue with single image
            if (index === 1 && imageElements.length === 2) {
              setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
                status: 'verifying',
                progress: 70,
                message: 'Using single image layout...'
              }));
              break; // Continue with rest of the elements
            } else {
              throw err;
            }
          }
        }

        if (includeFooterBar) {
          try {
            await addElementWithRetry(footerRectangleElement, 'footer rectangle');
          } catch (err) {
            // Continue without footer rectangle if it fails
          }
        }

        // Add PricingSaaS logo (if "Curated by" branding is enabled)
        if (includeCuratedBy) {
          try {
            await addElementWithRetry(logoElement, 'PricingSaas logo');
          } catch (err) {
            // Continue without logo if it fails
          }
        }

        // Add company logo at bottom (if available)
        if (companyLogoElement) {
          try {
            await addElementWithRetry(companyLogoElement, 'company logo');
          } catch (err) {
            // Continue without company logo if it fails
          }
        }

        // Add asset slug text (to the right of company logo)
        if (assetSlugElement) {
          try {
            await addElementWithRetry(assetSlugElement, 'asset slug text');
          } catch (err) {
            // Continue without asset slug text if it fails
          }
        }

        // Add "curated by" text (if "Curated by" branding is enabled)
        if (includeCuratedBy) {
          try {
            await addElementWithRetry(curatedByElement, 'curated by text');
          } catch (err) {
            // Continue without curated by text if it fails
          }
        }

        // Add header label element (if available)
        if (headerLabelElement) {
          try {
            await addElementWithRetry(headerLabelElement, 'header label');
          } catch (err) {
            // Continue without header label if it fails
          }
        }

        // Add header text element (if available)
        if (headerElement) {
          try {
            await addElementWithRetry(headerElement, 'header text');
          } catch (err) {
            // Continue without header text if it fails
          }
        }

        // Add subheader label element (if available)
        if (subheaderLabelElement) {
          try {
            await addElementWithRetry(subheaderLabelElement, 'subheader label');
          } catch (err) {
            // Continue without subheader label if it fails
          }
        }

        // Add subheader text element (if available)
        if (subheaderElement) {
          try {
            await addElementWithRetry(subheaderElement, 'subheader text');
          } catch (err) {
            // Continue without subheader text if it fails
          }
        }

        // Add category label element (if available)
        if (categoryLabelElement) {
          try {
            await addElementWithRetry(categoryLabelElement, 'category label');
          } catch (err) {
            // Continue without category label if it fails
          }
        }

        // Add category text element (if available)
        if (categoryElement) {
          try {
            await addElementWithRetry(categoryElement, 'category text');
          } catch (err) {
            // Continue without category text if it fails
          }
        }

        // Add date pill rectangles (if enabled and available)
        if (includeDateChip) {
          for (const [index, rectangle] of datePillRectangleElements.entries()) {
            try {
              await addElementWithRetry(rectangle, `date pill rectangle ${index + 1}`);
            } catch (err) {
              // Continue without this date pill rectangle if it fails
            }
          }

          // Add date pill texts (if available)
          for (const [index, pill] of datePillElements.entries()) {
            try {
              await addElementWithRetry(pill, `date pill text ${index + 1}`);
            } catch (err) {
              // Continue without this date pill text if it fails
            }
          }
        }

        // Add company link text element (if available)
        if (companyLinkElement) {
          try {
            await addElementWithRetry(companyLinkElement, 'company link text');
          } catch (err) {
            // Continue without company link text if it fails
          }
        }

      } else if (features.isSupported(addElementAtCursor)) {
        // Add all image elements
        for (const imageElement of imageElements) {
          await addElementAtCursor(imageElement);
        }
        // Note: footerRectangleElement (shape) not supported by addElementAtCursor
        // Add PricingSaaS logo (if "Curated by" branding is enabled)
        if (includeCuratedBy) {
          await addElementAtCursor(logoElement);
        }

        // Add company logo and slug (if available)
        if (companyLogoElement) {
          await addElementAtCursor(companyLogoElement);
        }
        if (assetSlugElement) {
          await addElementAtCursor(assetSlugElement);
        }

        // Add "curated by" text (if "Curated by" branding is enabled)
        if (includeCuratedBy) {
          await addElementAtCursor(curatedByElement);
        }
        if (headerLabelElement) {
          await addElementAtCursor(headerLabelElement);
        }
        if (headerElement) {
          await addElementAtCursor(headerElement);
        }
        if (subheaderLabelElement) {
          await addElementAtCursor(subheaderLabelElement);
        }
        if (subheaderElement) {
          await addElementAtCursor(subheaderElement);
        }
        if (categoryLabelElement) {
          await addElementAtCursor(categoryLabelElement);
        }
        if (categoryElement) {
          await addElementAtCursor(categoryElement);
        }
        // Add date pill elements (if enabled)
        if (includeDateChip) {
          for (const rectangle of datePillRectangleElements) {
            await addElementAtCursor(rectangle);
          }
          for (const pill of datePillElements) {
            await addElementAtCursor(pill);
          }
        }
        // Add company link text element (if available)
        if (companyLinkElement) {
          await addElementAtCursor(companyLinkElement);
        }
      } else {
        throw new Error("Image insertion not supported");
      }

      // Mark insertion as completed
      setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
        status: 'completed',
        progress: 100,
        message: hasDualImages ? 'Dual original format images inserted successfully!' : 'Original format image inserted successfully!'
      }));

      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.delete(`${asset.id}-original`);
          return updated;
        });
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add original format elements to design';
      setError(errorMessage);
      console.error('Error inserting original format asset:', err);

      // Mark upload as failed
      setUploadProgress(prev => new Map(prev).set(`${asset.id}-original`, {
        status: 'failed',
        progress: 0,
        message: errorMessage
      }));

      // Clear progress after 5 seconds
      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.delete(`${asset.id}-original`);
          return updated;
        });
      }, 5000);
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
            <AssetGrid
              assets={assets}
              filteredAssets={filteredAssets}
              slugFilter={slugFilter}
              setSlugFilter={setSlugFilter}
              uploadProgress={uploadProgress}
              onInsertAsset={insertAsset}
              onInsertOriginal={insertAssetWithNewPage}
              onBulkInsert={handleBulkInsert}
              getThumbnailUrl={getThumbnailUrl}
            />
          ) : (
            /* Collections list view */
            <CollectionsList
              collections={collections}
              onSelectCollection={selectCollection}
            />
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
            </Rows>
          </div>

          <Box paddingTop="2u">
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <Rows spacing="2u">
                <Text size="medium">Layout Options</Text>
                <Box>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={addBackground}
                      onChange={(e) => setAddBackground(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <Text size="small">Add background color (#F7F7F7)</Text>
                  </label>
                </Box>
                <Box>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={includeCuratedBy}
                      onChange={(e) => setIncludeCuratedBy(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <Text size="small">Include "Curated by" text and PricingSaaS logo</Text>
                  </label>
                </Box>
                <Box>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={includeFooterBar}
                      onChange={(e) => setIncludeFooterBar(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <Text size="small">Include footer background bar</Text>
                  </label>
                </Box>
                <Box>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={includeDateChip}
                      onChange={(e) => setIncludeDateChip(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <Text size="small">Include date chip</Text>
                  </label>
                </Box>
              </Rows>
            </div>
          </Box>

          <Box paddingTop="2u">
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <Rows spacing="2u">
                <Text size="medium">Company Logo & Slug Settings</Text>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Company Logo Size (px)</Text>
                  </div>
                  <input
                    type="number"
                    value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value) || 100)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="20"
                    max="300"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Offset X (px from left)</Text>
                  </div>
                  <input
                    type="number"
                    value={logoOffsetX}
                    onChange={(e) => setLogoOffsetX(Number(e.target.value) || 32)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0"
                    max="500"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Offset Y (px from top)</Text>
                  </div>
                  <input
                    type="number"
                    value={logoOffsetY}
                    onChange={(e) => setLogoOffsetY(Number(e.target.value) || 1013)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0"
                    max="1500"
                  />
                </Box>
                <Text size="small" tone="tertiary">
                  Controls company logo position: {logoOffsetX}px from left, {logoOffsetY}px from top
                </Text>
              </Rows>
            </div>
          </Box>

          {/* Image Area Scale Settings */}
          <Box padding="2u" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <Rows spacing="2u">
                <Text size="medium">Image Area Scale</Text>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Scale Factor (0.5 = 50%, 1.0 = 100%)</Text>
                  </div>
                  <input
                    type="number"
                    value={imageAreaScale}
                    onChange={(e) => setImageAreaScale(Math.max(0.1, Math.min(1.5, Number(e.target.value) || 1.0)))}
                    step="0.05"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0.1"
                    max="1.5"
                  />
                </Box>
                <Text size="small" tone="tertiary">
                  Scales the image area: {(imageAreaScale * 100).toFixed(0)}% of available space
                </Text>
              </Rows>
            </div>
          </Box>

          {/* Section Labels Settings */}
          <Box padding="2u" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <Rows spacing="2u">
                <Text size="medium">Section Labels (above header/subheader/category)</Text>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Header Label Text</Text>
                  </div>
                  <input
                    type="text"
                    value={headerLabel}
                    onChange={(e) => setHeaderLabel(e.target.value)}
                    placeholder="e.g., Metric Name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Subheader Label Text</Text>
                  </div>
                  <input
                    type="text"
                    value={subheaderLabel}
                    onChange={(e) => setSubheaderLabel(e.target.value)}
                    placeholder="e.g., Modality"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Category Label Text</Text>
                  </div>
                  <input
                    type="text"
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    placeholder="e.g., Category"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Label Color</Text>
                  </div>
                  <input
                    type="color"
                    value={labelColor}
                    onChange={(e) => setLabelColor(e.target.value)}
                    style={{
                      width: '60px',
                      height: '32px',
                      padding: '2px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  />
                </Box>
                <Text size="small" tone="tertiary">
                  Labels appear in {labelColor} color above each section. Leave empty to hide a label.
                </Text>
              </Rows>
            </div>
          </Box>

          {/* Header & Subheader Color Settings */}
          <Box padding="2u" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text size="medium">Header & Subheader Color Settings</Text>
            </div>
            <div style={{ marginTop: '12px' }}>
              <Rows spacing="2u">
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Header Color</Text>
                  </div>
                  <input
                    type="color"
                    value={headerColor}
                    onChange={(e) => setHeaderColor(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Subheader Color</Text>
                  </div>
                  <input
                    type="color"
                    value={subheaderColor}
                    onChange={(e) => setSubheaderColor(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  />
                </Box>
                <Text size="small" tone="tertiary">
                  Current colors: Header {headerColor}, Subheader {subheaderColor}
                </Text>
              </Rows>
            </div>
          </Box>

          {/* Header & Subheader Positioning Settings */}
          <Box padding="2u" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <Rows spacing="2u">
                <Text size="medium">Header Position & Alignment</Text>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Header X Position (px from left)</Text>
                  </div>
                  <input
                    type="number"
                    value={headerX}
                    onChange={(e) => setHeaderX(Number(e.target.value) || 20)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0"
                    max="1500"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Header Y Position (px from top)</Text>
                  </div>
                  <input
                    type="number"
                    value={headerY}
                    onChange={(e) => setHeaderY(Number(e.target.value) || 15)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0"
                    max="1500"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Header Alignment</Text>
                  </div>
                  <select
                    value={headerAlign}
                    onChange={(e) => setHeaderAlign(e.target.value as 'start' | 'center' | 'end')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="start">Start (Left)</option>
                    <option value="center">Center</option>
                    <option value="end">End (Right)</option>
                  </select>
                </Box>
                <Text size="small" tone="tertiary">
                  Header position: {headerX}px from left, {headerY}px from top, {headerAlign} aligned
                </Text>
              </Rows>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <Rows spacing="2u">
                <Text size="medium">Subheader Position & Alignment</Text>
                <Box>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={includeSubheader}
                      onChange={(e) => setIncludeSubheader(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <Text size="small">Show subheader</Text>
                  </label>
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Subheader X Position (px from left)</Text>
                  </div>
                  <input
                    type="number"
                    value={subheaderX}
                    onChange={(e) => setSubheaderX(Number(e.target.value) || 20)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0"
                    max="1500"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Subheader Y Position (px from top)</Text>
                  </div>
                  <input
                    type="number"
                    value={subheaderY}
                    onChange={(e) => setSubheaderY(Number(e.target.value) || 70)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0"
                    max="1500"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Subheader Alignment</Text>
                  </div>
                  <select
                    value={subheaderAlign}
                    onChange={(e) => setSubheaderAlign(e.target.value as 'start' | 'center' | 'end')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="start">Start (Left)</option>
                    <option value="center">Center</option>
                    <option value="end">End (Right)</option>
                  </select>
                </Box>
                <Text size="small" tone="tertiary">
                  Subheader position: {subheaderX}px from left, {subheaderY}px from top, {subheaderAlign} aligned
                </Text>
              </Rows>
            </div>
          </Box>

          {/* Company Category Position & Styling Settings */}
          <Box padding="2u" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <Rows spacing="2u">
                <Text size="medium">Company Category Display</Text>
                <Box>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeCategoryLabel}
                      onChange={(e) => setIncludeCategoryLabel(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <Text size="small">Show Company Category</Text>
                  </label>
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Category X Position (px from left)</Text>
                  </div>
                  <input
                    type="number"
                    value={categoryX}
                    onChange={(e) => setCategoryX(Number(e.target.value) || 400)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0"
                    max="1500"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Category Y Position (px from top)</Text>
                  </div>
                  <input
                    type="number"
                    value={categoryY}
                    onChange={(e) => setCategoryY(Number(e.target.value) || 105)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0"
                    max="1500"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Category Alignment</Text>
                  </div>
                  <select
                    value={categoryAlign}
                    onChange={(e) => setCategoryAlign(e.target.value as 'start' | 'center' | 'end')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="start">Start (Left)</option>
                    <option value="center">Center</option>
                    <option value="end">End (Right)</option>
                  </select>
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Font Size (px)</Text>
                  </div>
                  <input
                    type="number"
                    value={categoryFontSize}
                    onChange={(e) => setCategoryFontSize(Number(e.target.value) || 36)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="8"
                    max="100"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Text Color</Text>
                  </div>
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      height: '40px',
                      cursor: 'pointer',
                    }}
                  />
                </Box>
                <Text size="small" tone="tertiary">
                  Category position: {categoryX}px from left, {categoryY}px from top, {categoryAlign} aligned, {categoryFontSize}px font
                </Text>
              </Rows>
            </div>
          </Box>

          {/* Company Link Settings */}
          <Box padding="2u" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <Rows spacing="2u">
                <Text size="medium">Company Link Display</Text>
                <Box>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeCompanyLink}
                      onChange={(e) => setIncludeCompanyLink(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <Text size="small">Show Company Link</Text>
                  </label>
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Link Y Position (px from top)</Text>
                  </div>
                  <input
                    type="number"
                    value={companyLinkY}
                    onChange={(e) => setCompanyLinkY(Number(e.target.value) || 850)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="0"
                    max="1500"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Font Size (px)</Text>
                  </div>
                  <input
                    type="number"
                    value={companyLinkFontSize}
                    onChange={(e) => setCompanyLinkFontSize(Number(e.target.value) || 18)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                    min="8"
                    max="100"
                  />
                </Box>
                <Box>
                  <div style={{ marginBottom: '4px' }}>
                    <Text size="small" tone="secondary">Text Color</Text>
                  </div>
                  <input
                    type="color"
                    value={companyLinkColor}
                    onChange={(e) => setCompanyLinkColor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      height: '40px',
                      cursor: 'pointer',
                    }}
                  />
                </Box>
                <Text size="small" tone="tertiary">
                  Link positioned at {companyLinkY}px from top, centered, {companyLinkFontSize}px font
                </Text>
              </Rows>
            </div>
          </Box>
        </Box>
      );
    }

    return null;
  };

  // Show size selection first, then main app
  if (showSizeSelection) {
    return (
      <SizeSelection
        selectedPreset={selectedPreset}
        setSelectedPreset={setSelectedPreset}
        customWidth={customWidth}
        setCustomWidth={setCustomWidth}
        customHeight={customHeight}
        setCustomHeight={setCustomHeight}
        onContinue={handleSizeSelection}
      />
    );
  }

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

        {/* Current size indicator */}
        <Box paddingX="3u">
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '14px',
            color: '#1e40af'
          }}>
            Current size: {designWidth} × {designHeight} px
            <span style={{ marginLeft: '8px' }}>
              <Button
                variant="tertiary"
                onClick={() => setShowSizeSelection(true)}
              >
                Change Size
              </Button>
            </span>
          </div>
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

      {/* Bulk Insert Modal */}
      {showBulkInsertModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            {bulkInsertStep === 'count' && (
              <Rows spacing="2u">
                <Text size="large">Bulk Insert Assets</Text>
                <Box>
                  <div style={{ marginBottom: '8px' }}>
                    <Text size="small" tone="secondary">
                      How many assets would you like to insert?
                    </Text>
                  </div>
                  <input
                    type="text"
                    placeholder='Enter a number or "all"'
                    value={bulkInsertCount}
                    onChange={(e) => setBulkInsertCount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </Box>
                <Box>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: onlyFavorites ? '#fef3c7' : '#f8fafc',
                    border: onlyFavorites ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={onlyFavorites}
                      onChange={(e) => setOnlyFavorites(e.target.checked)}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <div>
                      <Text size="medium">Favorites Only</Text>
                      <Text size="small" tone="secondary">Only insert favorited assets</Text>
                    </div>
                  </label>
                </Box>
                <Grid columns={2} spacing="1u">
                  <Button
                    variant="tertiary"
                    onClick={() => {
                      setShowBulkInsertModal(false);
                      setBulkInsertStep('count');
                      setBulkInsertCount('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setBulkInsertStep('sort')}
                    disabled={!bulkInsertCount.trim()}
                  >
                    Next
                  </Button>
                </Grid>
              </Rows>
            )}

            {bulkInsertStep === 'sort' && (
              <Rows spacing="2u">
                <Text size="large">Select Sort Order</Text>
                <Box>
                  <Text size="small" tone="secondary">
                    Choose how to sort the assets before inserting
                  </Text>
                </Box>
                <Box>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    border: bulkInsertSort === 'updated' ? '2px solid #2563eb' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: bulkInsertSort === 'updated' ? '#eff6ff' : 'transparent',
                    marginBottom: '8px'
                  }}>
                    <input
                      type="radio"
                      name="sortOrder"
                      value="updated"
                      checked={bulkInsertSort === 'updated'}
                      onChange={(e) => setBulkInsertSort(e.target.value as 'updated' | 'category' | 'header')}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <Text size="medium">Last Updated</Text>
                      <Text size="small" tone="secondary">Newest first</Text>
                    </div>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    border: bulkInsertSort === 'header' ? '2px solid #2563eb' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: bulkInsertSort === 'header' ? '#eff6ff' : 'transparent',
                    marginBottom: '8px'
                  }}>
                    <input
                      type="radio"
                      name="sortOrder"
                      value="header"
                      checked={bulkInsertSort === 'header'}
                      onChange={(e) => setBulkInsertSort(e.target.value as 'updated' | 'category' | 'header')}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <Text size="medium">By Header (A-Z)</Text>
                      <Text size="small" tone="secondary">Alphabetical by header text</Text>
                    </div>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    border: bulkInsertSort === 'category' ? '2px solid #2563eb' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: bulkInsertSort === 'category' ? '#eff6ff' : 'transparent'
                  }}>
                    <input
                      type="radio"
                      name="sortOrder"
                      value="category"
                      checked={bulkInsertSort === 'category'}
                      onChange={(e) => setBulkInsertSort(e.target.value as 'updated' | 'category' | 'header')}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <Text size="medium">By Category</Text>
                      <Text size="small" tone="secondary">Alphabetical order</Text>
                    </div>
                  </label>
                </Box>
                {bulkInsertSort === 'category' && (
                  <>
                    <Box>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={includeTitleSlides}
                          onChange={(e) => setIncludeTitleSlides(e.target.checked)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <div>
                          <Text size="medium">Include Title Slides</Text>
                          <Text size="small" tone="secondary">Add a title slide before each category</Text>
                        </div>
                      </label>
                    </Box>
                    {includeTitleSlides && (
                      <Box>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px',
                          paddingLeft: '40px',
                          backgroundColor: '#f0f4f8',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={includeIndexSlides}
                            onChange={(e) => setIncludeIndexSlides(e.target.checked)}
                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                          />
                          <div>
                            <Text size="medium">Include Index Slides</Text>
                            <Text size="small" tone="secondary">Add an index after each title slide</Text>
                          </div>
                        </label>
                      </Box>
                    )}
                  </>
                )}
                <Grid columns={2} spacing="1u">
                  <Button
                    variant="tertiary"
                    onClick={() => setBulkInsertStep('count')}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={executeBulkInsert}
                  >
                    Start Insert
                  </Button>
                </Grid>
              </Rows>
            )}

            {bulkInsertStep === 'processing' && (
              <Rows spacing="3u">
                <Text size="large">Inserting Assets...</Text>
                <Box paddingY="3u">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block',
                      width: '40px',
                      height: '40px',
                      border: '4px solid #e5e7eb',
                      borderTop: '4px solid #2563eb',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  </div>
                </Box>
                <Text size="small" tone="secondary" align="center">
                  Please wait while we add your assets to the design...
                </Text>
              </Rows>
            )}
          </div>
        </div>
      )}
    </div>
  );
}