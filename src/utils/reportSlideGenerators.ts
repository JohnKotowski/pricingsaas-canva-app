import { addPage, addElementAtPoint, addElementAtCursor, createRichtextRange } from "@canva/design";
import { features } from "@canva/platform";

// Helper delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to add element with fallback
const addElement = async (element: any) => {
  if (features.isSupported(addElementAtPoint)) {
    await addElementAtPoint(element);
  } else if (features.isSupported(addElementAtCursor)) {
    await addElementAtCursor(element);
  } else {
    throw new Error("Element insertion not supported");
  }
};

// Helper function to add multiple elements in batch with rate limiting
const addElementsBatch = async (elements: any[], delayBetween: number = 200) => {
  for (const element of elements) {
    await addElement(element);
    await delay(delayBetween);
  }
};

// Helper function to add elements in chunks with longer pauses between chunks
const addElementsInChunks = async (elements: any[], chunkSize: number = 10, delayBetweenElements: number = 300, delayBetweenChunks: number = 5000) => {
  for (let i = 0; i < elements.length; i += chunkSize) {
    const chunk = elements.slice(i, i + chunkSize);
    console.log(`Adding chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(elements.length / chunkSize)} (${chunk.length} elements)`);

    for (const element of chunk) {
      await addElement(element);
      await delay(delayBetweenElements);
    }

    // Pause between chunks (except after the last chunk)
    if (i + chunkSize < elements.length) {
      console.log(`Chunk complete, waiting ${delayBetweenChunks}ms before next chunk...`);
      await delay(delayBetweenChunks);
    }
  }
};

/**
 * Calculate scaled dimensions based on design width
 * Base reference: 1080px width
 */
function getScaledBranding(designWidth: number, designHeight: number) {
  const scaleFactor = designWidth / 1080;

  return {
    footerHeight: Math.max(40, Math.min(60, 60 * scaleFactor)),
    logoWidth: Math.max(80, Math.min(146, 146 * scaleFactor)),
    logoHeight: Math.max(16, Math.min(29, 29 * scaleFactor)),
    logoMarginRight: Math.max(20, Math.min(40, 40 * scaleFactor)),
    curatedByFontSize: Math.max(14, Math.min(26, 26 * scaleFactor)),
    curatedByWidth: Math.max(60, Math.min(100, 100 * scaleFactor)),
  };
}

/**
 * Adds PricingSaaS branding elements to a slide
 * Call this after creating page content but before finishing
 */
async function addBrandingElements(
  designWidth: number,
  designHeight: number,
  uploadWithRetry?: (urls: string[], options: any) => Promise<any>
) {
  const branding = getScaledBranding(designWidth, designHeight);

  // Fixed footer dimensions and position
  const footerWidth = 2239.7;
  const footerHeight = 708.2;
  const footerX = -169.6;
  const footerY = 717.9;

  // 1. Add footer bar rectangle
  const footerBar = {
    type: "shape" as const,
    paths: [
      {
        d: `M 0 0 L ${footerWidth} 0 L ${footerWidth} ${footerHeight} L 0 ${footerHeight} Z`,
        fill: {
          color: "#132442"
        }
      }
    ],
    top: footerY,
    left: footerX,
    width: footerWidth,
    height: footerHeight,
    viewBox: {
      top: 0,
      left: 0,
      width: footerWidth,
      height: footerHeight
    }
  };
  await addElement(footerBar);

  // 2. Upload and add PricingSaaS logo (if uploadWithRetry provided)
  if (uploadWithRetry) {
    try {
      const logoUrl = 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1756551917/WordmarkWhite_tv0jl9.png';
      const logoUpload = await uploadWithRetry([logoUrl], {
        type: "image",
        aiDisclosure: "none"
      });

      // Fixed logo/curated by area positioning (bottom right)
      const brandingAreaX = 1196.2;
      const brandingAreaY = 983.6;
      const brandingAreaWidth = 577.8;
      const brandingAreaHeight = 44;

      // Logo dimensions and position
      const logoElement = {
        type: "image" as const,
        ref: logoUpload.ref,
        altText: { text: "PricingSaaS", decorative: true },
        top: 972,
        left: 1571.8,
        width: 240.2,
        height: 44
      };
      await addElement(logoElement);

      // 3. Add "Curated by" text
      const curatedByElement = {
        type: "text" as const,
        children: ["Curated by"],
        top: 979.9,
        left: 1415.6,
        width: 156.1,
        height: 30.8,
        fontSize: branding.curatedByFontSize,
        fontWeight: "normal" as const,
        color: "#E4E4E4",
        textAlign: "start" as const
      };
      await addElement(curatedByElement);

      // 4. Add circular gradient graphic
      try {
        const circleGraphicUrl = 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1768703531/footer-circular-gradient-v2.png';
        const circleGraphicUpload = await uploadWithRetry([circleGraphicUrl], {
          type: "image",
          aiDisclosure: "none"
        });

        const circleGraphicElement = {
          type: "image" as const,
          ref: circleGraphicUpload.ref,
          altText: { text: "Decorative Gradient", decorative: true },
          top: 829.9,
          left: -858.3,
          width: 1245.5,
          height: 1245.5
        };
        await addElement(circleGraphicElement);
      } catch (error) {
        console.error('Error adding circular gradient graphic:', error);
        // Continue without graphic if it fails
      }

    } catch (error) {
      console.error('Error adding logo branding:', error);
      // Continue without logo if it fails
    }
  }
}

/**
 * Creates a title element slide
 */
export async function createTitleElementSlide(
  content: string,
  designWidth: number,
  designHeight: number,
  uploadWithRetry?: (urls: string[], options: any) => Promise<any>
) {
  let titleText = 'Untitled';

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);
    titleText = parsed.text || parsed.title || 'Untitled';
  } catch {
    // If not JSON, use the content directly (remove quotes if present)
    titleText = content.replace(/^["']|["']$/g, '');
  }

  await addPage({
    title: titleText.substring(0, 255),
    background: { color: '#ffffff' }
  });

  await delay(500);

  // Add branding elements first (so they appear behind other content)
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);

  const titleElement = {
    type: "text" as const,
    children: [titleText],
    top: (designHeight / 2) - 60,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 72,
    fontWeight: "bold" as const,
    color: "#191919",
    textAlign: "center" as const
  };

  await addElement(titleElement);
}

/**
 * Creates a text element slide
 */
export async function createTextElementSlide(
  content: string,
  designWidth: number,
  designHeight: number,
  uploadWithRetry?: (urls: string[], options: any) => Promise<any>
) {
  let text = '';

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);
    text = parsed.text || '';
  } catch {
    // If not JSON, use the content directly (remove quotes if present)
    text = content.replace(/^["']|["']$/g, '');
  }

  await addPage({
    title: 'Text Content',
    background: { color: '#ffffff' }
  });

  await delay(500);

  // Add branding elements first (so they appear behind other content)
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);

  // Split into paragraphs (basic markdown handling)
  const paragraphs = text.split('\n\n').filter((p: string) => p.trim());
  let currentY = 100;
  const padding = 60;
  const lineHeight = 80;
  const maxParagraphs = 5;
  const maxY = designHeight - 100; // Leave room for footer

  for (let i = 0; i < Math.min(paragraphs.length, maxParagraphs); i++) {
    const paragraph = paragraphs[i];
    // Strip markdown formatting
    const cleanText = paragraph.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s+/gm, '');

    if (currentY > maxY) break;

    const textElement = {
      type: "text" as const,
      children: [cleanText],
      top: currentY,
      left: padding,
      width: designWidth - (padding * 2),
      fontSize: 20,
      fontWeight: "normal" as const,
      color: "#191919",
      textAlign: "start" as const
    };

    await addElement(textElement);
    currentY += lineHeight;
  }
}

/**
 * Creates a section header slide
 */
export async function createSectionHeaderSlide(
  content: string,
  designWidth: number,
  designHeight: number,
  uploadWithRetry?: (urls: string[], options: any) => Promise<any>
) {
  let headerText = 'Section';

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);
    headerText = parsed.text || parsed.header || 'Section';
  } catch {
    // If not JSON, use the content directly (remove quotes if present)
    headerText = content.replace(/^["']|["']$/g, '');
  }

  await addPage({
    title: headerText.substring(0, 255),
    background: { color: '#ffffff' }
  });

  await delay(500);

  // Add branding elements first (so they appear behind other content)
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);

  const headerElement = {
    type: "text" as const,
    children: [headerText],
    top: (designHeight / 2) - 40,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 56,
    fontWeight: "bold" as const,
    color: "#191919",
    textAlign: "center" as const
  };

  await addElement(headerElement);
}

/**
 * Creates an example slide with before/after images
 */
export async function createExampleSlide(
  content: string,
  designWidth: number,
  designHeight: number,
  uploadWithRetry: (urls: string[], options: any) => Promise<any>
) {
  let config: any = {};
  let caption = 'Example Comparison';

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);
    config = parsed.config || parsed;
    caption = config.caption || 'Example Comparison';
  } catch {
    // If not JSON, we can't create the example slide
    throw new Error('Example element requires JSON config with image URLs');
  }

  await addPage({
    title: caption.substring(0, 255),
    background: { color: '#ffffff' }
  });

  await delay(500);

  // Add branding elements first (so they appear behind other content)
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);

  // Add "2025 Q2" badge (simple rectangle)
  const badgeWidth = 220.8;
  const badgeHeight = 63.8;
  const badgeX = 90.4;
  const badgeY = 156.9;

  // Create rectangle background
  const badgeBackground = {
    type: "shape" as const,
    paths: [{
      d: `M 0 0 L ${badgeWidth} 0 L ${badgeWidth} ${badgeHeight} L 0 ${badgeHeight} Z`,
      fill: { color: "#D3D3D3" }
    }],
    top: badgeY,
    left: badgeX,
    width: badgeWidth,
    height: badgeHeight,
    viewBox: { top: 0, left: 0, width: badgeWidth, height: badgeHeight }
  };
  await addElement(badgeBackground);

  // Add "2025 Q2" text on top of badge
  const badgeTextElement = {
    type: "text" as const,
    children: ["2025 Q2"],
    top: badgeY + 12,
    left: badgeX + 10,
    width: badgeWidth - 20,
    fontSize: 28,
    fontWeight: "bold" as const,
    color: "#191919",
    textAlign: "center" as const
  };
  await addElement(badgeTextElement);

  // Calculate layout with 470:300 ratio
  const imageRatio = 470 / 300; // 1.5667
  const sideMargin = 80;
  const centerGap = 60;
  const imageWidth = 850; // Fixed width for consistent layout
  const imageHeight = imageWidth * (300 / 470); // 542.5px
  const imageTop = 270;

  // Positions
  const beforeImageLeft = sideMargin;
  const afterImageLeft = sideMargin + imageWidth + centerGap; // 990

  try {
    // Get image URLs from config - prefer new cropped URLs (already at 1200x600)
    let beforeUrl = config.beforeCroppedUrl || config.beforeImageUrl || config.before_image_url;
    let afterUrl = config.afterCroppedUrl || config.afterImageUrl || config.after_image_url;

    if (!beforeUrl || !afterUrl) {
      throw new Error('Missing before/after image URLs');
    }

    // Convert old S3 URLs to Cloudinary proxy format
    if (beforeUrl.includes('s3.amazonaws.com')) {
      beforeUrl = `https://res.cloudinary.com/pricing-explorer/image/fetch/${encodeURIComponent(beforeUrl)}`;
    }
    if (afterUrl.includes('s3.amazonaws.com')) {
      afterUrl = `https://res.cloudinary.com/pricing-explorer/image/fetch/${encodeURIComponent(afterUrl)}`;
    }

    // Get markers (optional red/green dots) - prefer cropped coordinates
    const beforeMarker = config.beforeCroppedMarker || config.beforeMarker;
    const afterMarker = config.afterCroppedMarker || config.afterMarker;

    console.log('[createExampleSlide] Uploading before image:', beforeUrl);
    let beforeUpload;
    try {
      beforeUpload = await uploadWithRetry([beforeUrl], {
        type: "image",
        aiDisclosure: "none"
      });
    } catch (error) {
      console.error('[createExampleSlide] Failed to upload before image:', beforeUrl, error);
      throw new Error(`Failed to upload before image from ${beforeUrl.substring(0, 100)}: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('[createExampleSlide] Uploading after image:', afterUrl);
    let afterUpload;
    try {
      afterUpload = await uploadWithRetry([afterUrl], {
        type: "image",
        aiDisclosure: "none"
      });
    } catch (error) {
      console.error('[createExampleSlide] Failed to upload after image:', afterUrl, error);
      throw new Error(`Failed to upload after image from ${afterUrl.substring(0, 100)}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Extract dates from image URLs (format: filename_YYYYMMDD.ext)
    const extractDateFromUrl = (url: string): string | null => {
      const match = url.match(/_(\d{8})\.[a-z]+/i);
      if (match) {
        const dateStr = match[1]; // YYYYMMDD
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);

        // Format as "Month Day, Year"
        const date = new Date(`${year}-${month}-${day}`);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[date.getMonth()]} ${parseInt(day)}, ${year}`;
      }
      return null;
    };

    // Get dates from URLs, fallback to config, then simple labels
    const beforeDate = extractDateFromUrl(beforeUrl) ||
                       config.beforeDate ||
                       config.before_date ||
                       "Before";
    const afterDate = extractDateFromUrl(afterUrl) ||
                      config.afterDate ||
                      config.after_date ||
                      "After";

    // Date label dimensions and positions
    const dateLabelWidth = 220;
    const dateLabelHeight = 50;
    const dateLabelGap = 15; // Gap between image bottom and date label

    // Center labels under their respective images
    const beforeDateBgX = beforeImageLeft + (imageWidth - dateLabelWidth) / 2; // 395
    const beforeDateBgY = imageTop + imageHeight + dateLabelGap;

    const afterDateBgX = afterImageLeft + (imageWidth - dateLabelWidth) / 2; // 1305
    const afterDateBgY = imageTop + imageHeight + dateLabelGap;

    // Add date label backgrounds (below images)
    const beforeDateBackground = {
      type: "shape" as const,
      paths: [{
        d: `M 0 0 L ${dateLabelWidth} 0 L ${dateLabelWidth} ${dateLabelHeight} L 0 ${dateLabelHeight} Z`,
        fill: { color: "#d3df66" }
      }],
      top: beforeDateBgY,
      left: beforeDateBgX,
      width: dateLabelWidth,
      height: dateLabelHeight,
      viewBox: { top: 0, left: 0, width: dateLabelWidth, height: dateLabelHeight }
    };
    await addElement(beforeDateBackground);

    // Before date label text
    const beforeLabelElement = {
      type: "text" as const,
      children: [beforeDate],
      top: beforeDateBgY + 10,
      left: beforeDateBgX + 10,
      width: dateLabelWidth - 20,
      fontSize: 20,
      fontWeight: "bold" as const,
      color: "#191919",
      textAlign: "center" as const
    };
    await addElement(beforeLabelElement);

    const afterDateBackground = {
      type: "shape" as const,
      paths: [{
        d: `M 0 0 L ${dateLabelWidth} 0 L ${dateLabelWidth} ${dateLabelHeight} L 0 ${dateLabelHeight} Z`,
        fill: { color: "#d3df66" }
      }],
      top: afterDateBgY,
      left: afterDateBgX,
      width: dateLabelWidth,
      height: dateLabelHeight,
      viewBox: { top: 0, left: 0, width: dateLabelWidth, height: dateLabelHeight }
    };
    await addElement(afterDateBackground);

    // After date label text
    const afterLabelElement = {
      type: "text" as const,
      children: [afterDate],
      top: afterDateBgY + 10,
      left: afterDateBgX + 10,
      width: dateLabelWidth - 20,
      fontSize: 20,
      fontWeight: "bold" as const,
      color: "#191919",
      textAlign: "center" as const
    };
    await addElement(afterLabelElement);

    // Add light lime header background
    const headerBackground = {
      type: "shape" as const,
      paths: [{
        d: `M 0 0 L 2005.7 0 L 2005.7 309.9 L 0 309.9 Z`,
        fill: { color: "#d3df66" }
      }],
      top: -198.3,
      left: 0,
      width: 2005.7,
      height: 309.9,
      viewBox: { top: 0, left: 0, width: 2005.7, height: 309.9 }
    };
    await addElement(headerBackground);

    // Add header text (e.g., "Case Study: ...")
    const headerText = config.header || '';
    if (headerText) {
      const headerTextElement = {
        type: "text" as const,
        children: [headerText],
        top: 38.2,
        left: 94.7,
        width: 1744.6,
        fontSize: 34,
        fontWeight: "bold" as const,
        color: "#7A7A7A", // Gray color from the image
        textAlign: "start" as const
      };
      await addElement(headerTextElement);
    }

    // Add circular gradient graphic to header (right side)
    try {
      const headerCircleGraphicUrl = 'https://res.cloudinary.com/dd6dkaan9/image/upload/v1768703531/footer-circular-gradient-v2.png';
      const headerCircleGraphicUpload = await uploadWithRetry([headerCircleGraphicUrl], {
        type: "image",
        aiDisclosure: "none"
      });

      const headerCircleGraphicElement = {
        type: "image" as const,
        ref: headerCircleGraphicUpload.ref,
        altText: { text: "Decorative Gradient", decorative: true },
        top: -365.6,
        left: 1528.6,
        width: 1245.5,
        height: 1245.5
      };
      await addElement(headerCircleGraphicElement);
    } catch (error) {
      console.error('Error adding header circular gradient graphic:', error);
    }

    // Caption with dynamic font sizing based on length
    if (caption) {
      // Calculate font size based on caption length (optimized for 1920x1080)
      let fontSize = 24; // Default for short captions
      const captionLength = caption.length;

      if (captionLength > 200) {
        fontSize = 16; // Long captions
      } else if (captionLength > 120) {
        fontSize = 20; // Medium-long captions
      } else if (captionLength > 60) {
        fontSize = 22; // Medium captions
      }

      const captionElement = {
        type: "text" as const,
        children: [caption],
        top: 164.1,
        left: 345.7,
        width: 1228.6, // Width to fit between left margin and right edge
        fontSize: fontSize,
        fontWeight: "normal" as const,
        color: "#191919",
        textAlign: "start" as const
      };
      await addElement(captionElement);
    }

    // Add company name to footer (if available)
    const companyName = config.companyName || config.company_name;
    if (companyName) {
      const branding = getScaledBranding(designWidth, designHeight);
      const companyNameElement = {
        type: "text" as const,
        children: [companyName],
        top: 983.6,
        left: 271.3,
        width: 156.1,
        height: 30.8,
        fontSize: branding.curatedByFontSize,
        fontWeight: "normal" as const,
        color: "#E4E4E4",
        textAlign: "start" as const
      };
      await addElement(companyNameElement);
    }

    // Add company logo to footer (if available)
    const companyLogoUrl = config.companyLogoUrl || config.company_logo_url;
    if (companyLogoUrl) {
      try {
        const logoUpload = await uploadWithRetry([companyLogoUrl], {
          type: "image",
          aiDisclosure: "none"
        });

        const companyLogoElement = {
          type: "image" as const,
          ref: logoUpload.ref,
          altText: { text: `${companyName || 'Company'} logo`, decorative: true },
          top: 969.6,
          left: 190.4,
          width: 58,
          height: 58
        };
        await addElement(companyLogoElement);
      } catch (error) {
        console.error('Error adding company logo to footer:', error);
        // Continue without logo if it fails
      }
    }

    // Add images LAST to ensure they appear on top layer
    // Before image border (1px grey)
    const borderWidth = 2; // 1px on each side
    const beforeBorderElement = {
      type: "shape" as const,
      paths: [{
        d: `M 0 0 L ${imageWidth + borderWidth} 0 L ${imageWidth + borderWidth} ${imageHeight + borderWidth} L 0 ${imageHeight + borderWidth} Z`,
        fill: { color: "#CCCCCC" }
      }],
      top: imageTop - 1,
      left: beforeImageLeft - 1,
      width: imageWidth + borderWidth,
      height: imageHeight + borderWidth,
      viewBox: { top: 0, left: 0, width: imageWidth + borderWidth, height: imageHeight + borderWidth }
    };
    await addElement(beforeBorderElement);

    // Before image
    const beforeImageElement = {
      type: "image" as const,
      ref: beforeUpload.ref,
      altText: { text: beforeDate, decorative: false },
      top: imageTop,
      left: beforeImageLeft,
      width: imageWidth,
      height: imageHeight
    };
    await addElement(beforeImageElement);

    // Add before marker (red dot) if present
    if (beforeMarker && beforeMarker.x !== undefined && beforeMarker.y !== undefined) {
      const markerRadius = 12;
      const scaleFactor = imageWidth / 1200; // Scale from 1200px source to display width
      const markerX = beforeImageLeft + (beforeMarker.x * scaleFactor);
      const markerY = imageTop + (beforeMarker.y * scaleFactor);

      const beforeMarkerCircle = {
        type: "shape" as const,
        paths: [{
          d: `M ${markerRadius} 0 A ${markerRadius} ${markerRadius} 0 0 1 ${markerRadius} ${markerRadius * 2} A ${markerRadius} ${markerRadius} 0 0 1 ${markerRadius} 0 Z`,
          fill: { color: "#ef4444" } // Red
        }],
        top: markerY - markerRadius,
        left: markerX - markerRadius,
        width: markerRadius * 2,
        height: markerRadius * 2,
        viewBox: { top: 0, left: 0, width: markerRadius * 2, height: markerRadius * 2 }
      };
      await addElement(beforeMarkerCircle);
    }

    // After image border (1px grey)
    const afterBorderElement = {
      type: "shape" as const,
      paths: [{
        d: `M 0 0 L ${imageWidth + borderWidth} 0 L ${imageWidth + borderWidth} ${imageHeight + borderWidth} L 0 ${imageHeight + borderWidth} Z`,
        fill: { color: "#CCCCCC" }
      }],
      top: imageTop - 1,
      left: afterImageLeft - 1,
      width: imageWidth + borderWidth,
      height: imageHeight + borderWidth,
      viewBox: { top: 0, left: 0, width: imageWidth + borderWidth, height: imageHeight + borderWidth }
    };
    await addElement(afterBorderElement);

    // After image
    const afterImageElement = {
      type: "image" as const,
      ref: afterUpload.ref,
      altText: { text: afterDate, decorative: false },
      top: imageTop,
      left: afterImageLeft,
      width: imageWidth,
      height: imageHeight
    };
    await addElement(afterImageElement);

    // Add after marker (green dot) if present
    if (afterMarker && afterMarker.x !== undefined && afterMarker.y !== undefined) {
      const markerRadius = 12;
      const scaleFactor = imageWidth / 1200; // Scale from 1200px source to display width
      const markerX = afterImageLeft + (afterMarker.x * scaleFactor);
      const markerY = imageTop + (afterMarker.y * scaleFactor);

      const afterMarkerCircle = {
        type: "shape" as const,
        paths: [{
          d: `M ${markerRadius} 0 A ${markerRadius} ${markerRadius} 0 0 1 ${markerRadius} ${markerRadius * 2} A ${markerRadius} ${markerRadius} 0 0 1 ${markerRadius} 0 Z`,
          fill: { color: "#84cc16" } // Green
        }],
        top: markerY - markerRadius,
        left: markerX - markerRadius,
        width: markerRadius * 2,
        height: markerRadius * 2,
        viewBox: { top: 0, left: 0, width: markerRadius * 2, height: markerRadius * 2 }
      };
      await addElement(afterMarkerCircle);
    }

  } catch (error) {
    console.error('Error creating example slide:', error);
    throw error;
  }
}

/**
 * Creates a tiles slide with metric cards
 */
export async function createTilesSlide(
  content: string,
  designWidth: number,
  designHeight: number,
  uploadWithRetry?: (urls: string[], options: any) => Promise<any>
) {
  console.log('createTilesSlide called with content:', content);
  let tiles: any[] = [];
  let title = 'Metrics';

  try {
    const parsed = JSON.parse(content);
    const config = parsed.config || parsed;
    tiles = config.tiles || [];
    title = config.title || 'Metrics';
    console.log('Parsed tiles:', JSON.stringify(tiles, null, 2));
  } catch (error) {
    console.error('Error parsing tiles content:', error);
    throw new Error('Tiles element requires JSON config with tiles array');
  }

  await addPage({
    title: title.substring(0, 255),
    background: { color: '#ffffff' }
  });

  await delay(500);

  // Add branding elements first (so they appear behind other content)
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);

  // Add title
  const titleElement = {
    type: "text" as const,
    children: [title],
    top: 60,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 48,
    fontWeight: "bold" as const,
    color: "#191919",
    textAlign: "center" as const
  };
  await addElement(titleElement);

  // Calculate tile layout - adjust for footer
  const tilesPerRow = 2;
  const tileWidth = 350;
  const tileHeight = 200;
  const gapX = 60;
  const gapY = 40;
  const startY = 180;
  const maxGridHeight = designHeight - 100; // Leave room for footer

  // Center the tiles horizontally
  const totalWidth = (tilesPerRow * tileWidth) + ((tilesPerRow - 1) * gapX);
  const startX = (designWidth - totalWidth) / 2;

  // Create tiles - limit based on available space
  const maxTiles = Math.min(tiles.length, 6);
  for (let i = 0; i < maxTiles; i++) {
    const tile = tiles[i];
    const row = Math.floor(i / tilesPerRow);
    const col = i % tilesPerRow;

    const tileX = startX + (col * (tileWidth + gapX));
    const tileY = startY + (row * (tileHeight + gapY));

    // Stop if tile would overlap footer
    if (tileY + tileHeight > maxGridHeight) break;

    // Format metric name (e.g., "total_companies" -> "Total Companies")
    const metricName = tile.metric || tile.name || `Metric ${i + 1}`;
    const formattedMetric = metricName
      .split('_')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Extract value - try multiple possible field names
    let metricValue = tile.value ?? tile.count ?? tile.number ?? tile.total ?? tile.amount;
    console.log(`Tile ${i}: metric=${tile.metric}, value=${metricValue}, tile=`, tile);

    // Format the value for display
    let displayValue = '—';
    if (metricValue !== undefined && metricValue !== null) {
      // If it's a number, format with commas
      if (typeof metricValue === 'number' || !isNaN(Number(metricValue))) {
        const numValue = typeof metricValue === 'number' ? metricValue : Number(metricValue);
        displayValue = numValue.toLocaleString('en-US');
        console.log(`Tile ${i}: formatted displayValue=${displayValue}`);
      } else {
        // If it's a string, use as-is
        displayValue = String(metricValue);
        console.log(`Tile ${i}: string displayValue=${displayValue}`);
      }
    } else {
      console.log(`Tile ${i}: No value found, using dash`);
    }

    // Tile background (colored rectangle)
    const tileColor = i % 4 === 0 ? '#3b82f6' : i % 4 === 1 ? '#8b5cf6' : i % 4 === 2 ? '#ec4899' : '#f59e0b';
    const tileBackground = {
      type: "shape" as const,
      paths: [
        {
          d: `M 0 0 L ${tileWidth} 0 L ${tileWidth} ${tileHeight} L 0 ${tileHeight} Z`,
          fill: {
            color: tileColor
          }
        }
      ],
      top: tileY,
      left: tileX,
      width: tileWidth,
      height: tileHeight,
      viewBox: {
        top: 0,
        left: 0,
        width: tileWidth,
        height: tileHeight
      }
    };
    await addElement(tileBackground);

    // Metric value (large and prominent)
    const valueElement = {
      type: "text" as const,
      children: [displayValue],
      top: tileY + 50,
      left: tileX + 20,
      width: tileWidth - 40,
      fontSize: 48,
      fontWeight: "bold" as const,
      color: "#ffffff",
      textAlign: "center" as const
    };
    await addElement(valueElement);

    // Metric label (below the value)
    const labelElement = {
      type: "text" as const,
      children: [formattedMetric],
      top: tileY + 120,
      left: tileX + 20,
      width: tileWidth - 40,
      fontSize: 20,
      fontWeight: "normal" as const,
      color: "#ffffff",
      textAlign: "center" as const
    };
    await addElement(labelElement);
  }
}

/**
 * Helper functions for table creation
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text === '') return '—';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function formatPeriod(period: string): string {
  // Format periods like "2025Q3" to "2025 Q3"
  if (!period) return '—';

  // Match pattern: 4 digits followed by Q and 1 digit (e.g., 2025Q3)
  const match = period.match(/^(\d{4})Q(\d)$/);
  if (match) {
    return `${match[1]} Q${match[2]}`;
  }

  // Return as-is if already formatted or doesn't match pattern
  return period;
}

function createRectangle(x: number, y: number, w: number, h: number, color: string) {
  return {
    type: "shape" as const,
    paths: [{
      d: `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`,
      fill: { color }
    }],
    top: y,
    left: x,
    width: w,
    height: h,
    viewBox: { top: 0, left: 0, width: w, height: h }
  };
}

function createText(text: string, x: number, y: number, w: number, fontSize: number, fontWeight: 'bold' | 'normal', color: string) {
  return {
    type: "text" as const,
    children: [text],
    top: y,
    left: x,
    width: w,
    fontSize,
    fontWeight,
    color,
    textAlign: "start" as const
  };
}

function createRichtext(text: string, x: number, y: number, w: number, fontSize: number, fontWeight: 'bold' | 'normal', color: string, link: string) {
  const range = createRichtextRange();
  range.appendText(text, {
    link: link,
    decoration: "underline",
    color: color,
    fontWeight: fontWeight,
  });

  return {
    type: "richtext" as const,
    range: range,
    top: y,
    left: x,
    width: w,
    fontSize,
    textAlign: "start" as const
  };
}

function createBorderLine(x: number, y: number, w: number, h: number, color: string) {
  return createRectangle(x, y, w, h, color);
}

/**
 * Creates a table slide with spreadsheet-style layout
 */
export async function createTableSlide(
  content: string,
  designWidth: number,
  designHeight: number,
  uploadWithRetry?: (urls: string[], options: any) => Promise<any>
) {
  console.log('createTableSlide called with content:', content);

  // 1. Parse and validate content
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error('Error parsing table content:', error);
    throw new Error('Table element requires valid JSON content');
  }

  const config = parsed.config || parsed;
  const title = config.title || 'Table';
  const rows = config.rows || [];
  const displayRows = rows.slice(0, 6); // Limit to 6 rows (optimized for 1920x1080)

  console.log('Parsed table:', { title, rowCount: rows.length, displayRowCount: displayRows.length });

  if (displayRows.length === 0) {
    throw new Error('No table data available');
  }

  // 2. Create page and title
  await addPage({
    title: title.substring(0, 255),
    background: { color: '#ffffff' }
  });

  await delay(500);

  // Add branding elements first (so they appear behind other content)
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);

  const titleElement = {
    type: "text" as const,
    children: [title],
    top: 70,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 50,
    fontWeight: "bold" as const,
    color: "#191919",
    textAlign: "center" as const
  };
  await addElement(titleElement);
  await delay(300);

  // 3. Calculate table layout (optimized for 1920x1080)
  const tableStartY = 200; // Below title
  const headerHeight = 85;
  const rowHeight = 105;

  // Calculate responsive table width with equal margins
  const horizontalMargin = Math.max(60, designWidth * 0.08);
  const totalWidth = designWidth - (2 * horizontalMargin);
  const tableX = horizontalMargin;

  // Scale column widths proportionally (base ratio: 150:420:120:150)
  // Total base width: 840
  const baseTotal = 840;
  const colWidths = [
    Math.floor((150 / baseTotal) * totalWidth), // Name
    Math.floor((420 / baseTotal) * totalWidth), // Description
    Math.floor((120 / baseTotal) * totalWidth), // Period
    Math.floor((150 / baseTotal) * totalWidth)  // Link
  ];

  // Calculate cumulative column starts
  const colStarts = [0];
  for (let i = 1; i < colWidths.length; i++) {
    colStarts.push(colStarts[i - 1] + colWidths[i - 1]);
  }

  // 4. Build all table elements
  const tableElements: any[] = [];
  const headers = ['Company Name', 'Description', 'Period', 'Link'];
  const headerY = tableStartY;

  // Header row elements
  for (let col = 0; col < 4; col++) {
    tableElements.push(createRectangle(
      tableX + colStarts[col],
      headerY,
      colWidths[col],
      headerHeight,
      '#132442'
    ));
    tableElements.push(createText(
      headers[col],
      tableX + colStarts[col] + 14,
      headerY + 14,
      colWidths[col] - 28,
      24,
      'bold',
      '#FFFFFF'
    ));
  }

  // 5. Data rows elements
  for (let rowIdx = 0; rowIdx < displayRows.length; rowIdx++) {
    const row = displayRows[rowIdx];
    const rowY = tableStartY + headerHeight + (rowIdx * rowHeight);
    const bgColor = rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';

    // Row data
    const cellData = [
      truncateText(row.companyName || '—', 30),
      row.description || '—', // No truncation for description
      formatPeriod(row.period || '—'),
      'View Details' // Instead of full URL
    ];

    for (let col = 0; col < 4; col++) {
      tableElements.push(createRectangle(
        tableX + colStarts[col],
        rowY,
        colWidths[col],
        rowHeight,
        bgColor
      ));

      const textColor = col === 3 ? '#3B82F6' : '#191919';
      const linkUrl = col === 3 ? (row.compareViewerUrl || row.url || row.link || undefined) : undefined;

      // Use richtext for column 3 with link, otherwise regular text
      if (col === 3 && linkUrl) {
        tableElements.push(createRichtext(
          cellData[col],
          tableX + colStarts[col] + 14,
          rowY + 14,
          colWidths[col] - 28,
          18,
          'normal',
          textColor,
          linkUrl
        ));
      } else {
        tableElements.push(createText(
          cellData[col],
          tableX + colStarts[col] + 14,
          rowY + 14,
          colWidths[col] - 28,
          18,
          'normal',
          textColor
        ));
      }
    }
  }

  // 6. Border elements - only divider between header and data
  const totalHeight = headerHeight + (displayRows.length * rowHeight);

  // Divider between header and data
  tableElements.push(createBorderLine(tableX, tableStartY + headerHeight, totalWidth, 3, '#D1D5DB'));

  // Add all table elements in chunks with rate limiting
  console.log(`Adding ${tableElements.length} table elements in chunks`);
  await addElementsInChunks(
    tableElements,
    8,     // 8 elements per chunk
    300,   // 300ms between elements
    3000   // 3 second pause between chunks
  );

  console.log('All table elements added successfully');
}

/**
 * Creates a graph slide with chart image from QuickChart
 */
export async function createGraphSlide(
  content: string,
  designWidth: number,
  designHeight: number,
  uploadWithRetry?: (urls: string[], options: any) => Promise<any>
) {
  console.log('createGraphSlide called with content:', content);

  // 1. Parse graph configuration
  let chartConfig: any;
  try {
    const parsed = JSON.parse(content);
    chartConfig = parsed.config || parsed;
  } catch (error) {
    console.error('Error parsing graph content:', error);
    throw new Error('Graph element requires valid JSON configuration');
  }

  // 2. Check if we need to transform the config
  // If it has mode: "diffs", the Edge Function will fetch real data
  // Otherwise, transform to Chart.js format with mock data
  if (chartConfig.mode === 'diffs') {
    console.log('[DEBUG] Diffs mode detected, Edge Function will fetch real data');
    // Keep chartConfig as-is, Edge Function will handle data fetching
  } else if (!chartConfig.labels || !chartConfig.datasets) {
    console.log('[DEBUG] Converting old format to Chart.js format with mock data');

    // Map old chart types to valid Chart.js types
    const chartTypeMap: Record<string, string> = {
      'grouped': 'bar',
      'stacked': 'bar',
      'line': 'line',
      'pie': 'pie',
      'doughnut': 'doughnut'
    };

    const chartType = chartTypeMap[chartConfig.chartType] || 'bar';

    // Use mock data - default to bar chart
    chartConfig = {
      type: chartType,
      title: chartConfig.title || 'Sample Chart',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: 'Sample Data',
        data: [65, 59, 80, 81],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
        borderColor: ['#2563eb', '#7c3aed', '#db2777', '#d97706'],
        borderWidth: 2
      }],
      width: 1920,
      height: 1080
    };
  }

  const title = chartConfig.title || 'Chart';

  // 3. Create page
  await addPage({
    title: title.substring(0, 255),
    background: { color: '#ffffff' }
  });

  await delay(500);

  // Add branding elements first (so they appear behind other content)
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);

  // 4. Add title
  const titleElement = {
    type: "text" as const,
    children: [title],
    top: 40,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 48,
    fontWeight: "bold" as const,
    color: "#191919",
    textAlign: "center" as const
  };
  await addElement(titleElement);

  // 5. Generate chart image via Supabase Edge Function
  console.log('[DEBUG] Calling generate-chart function with config:', JSON.stringify(chartConfig));

  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-chart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ chartConfig })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Chart generation failed:', errorText);
    throw new Error(`Chart generation failed: ${response.status}`);
  }

  const result = await response.json();
  console.log('[DEBUG] Chart generated:', result);

  if (!result.success || !result.imageUrl) {
    throw new Error('Chart generation returned invalid response');
  }

  // 6. Upload chart image to Canva
  if (!uploadWithRetry) {
    throw new Error('uploadWithRetry function is required for graph slides');
  }

  console.log('[DEBUG] Uploading chart image to Canva:', result.imageUrl);

  const chartUpload = await uploadWithRetry([result.imageUrl], {
    type: "image",
    aiDisclosure: "none"
  });

  // 7. Add chart image to slide
  const chartWidth = Math.min(result.width || 1920, designWidth * 0.8);
  const chartHeight = Math.min(result.height || 1080, designHeight - 200);
  const chartX = (designWidth - chartWidth) / 2;
  const chartY = 120;

  const chartElement = {
    type: "image" as const,
    ref: chartUpload.ref,
    altText: { text: title, decorative: false },
    top: chartY,
    left: chartX,
    width: chartWidth,
    height: chartHeight
  };
  await addElement(chartElement);

  console.log('[DEBUG] Chart image added to slide');
}

/**
 * Creates a placeholder slide for unsupported element types
 */
export async function createPlaceholderSlide(
  elementType: string,
  elementContent: string,
  designWidth: number,
  designHeight: number,
  uploadWithRetry?: (urls: string[], options: any) => Promise<any>
) {
  await addPage({
    title: `${elementType} Element`,
    background: { color: '#ffffff' }
  });

  await delay(500);

  // Add branding elements first (so they appear behind other content)
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);

  const typeElement = {
    type: "text" as const,
    children: [`[${elementType.toUpperCase()}]`],
    top: (designHeight / 2) - 60,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 48,
    fontWeight: "bold" as const,
    color: "#888888",
    textAlign: "center" as const
  };
  await addElement(typeElement);

  const messageElement = {
    type: "text" as const,
    children: ["This element type is not yet supported in Canva"],
    top: (designHeight / 2) + 20,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 20,
    fontWeight: "normal" as const,
    color: "#666666",
    textAlign: "center" as const
  };
  await addElement(messageElement);
}

/**
 * Creates an error slide when element creation fails
 */
export async function createErrorSlide(
  elementType: string,
  errorMessage: string,
  designWidth: number,
  designHeight: number,
  uploadWithRetry?: (urls: string[], options: any) => Promise<any>
) {
  await addPage({
    title: `Error: ${elementType}`,
    background: { color: '#fff5f5' }
  });

  await delay(500);

  // Add branding elements first (so they appear behind other content)
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);

  const errorTitleElement = {
    type: "text" as const,
    children: ["⚠️ Error Creating Slide"],
    top: (designHeight / 2) - 80,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 36,
    fontWeight: "bold" as const,
    color: "#dc2626",
    textAlign: "center" as const
  };
  await addElement(errorTitleElement);

  const typeInfoElement = {
    type: "text" as const,
    children: [`Element type: ${elementType}`],
    top: (designHeight / 2),
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 20,
    fontWeight: "normal" as const,
    color: "#191919",
    textAlign: "center" as const
  };
  await addElement(typeInfoElement);

  const errorMessageElement = {
    type: "text" as const,
    children: [errorMessage.substring(0, 200)],
    top: (designHeight / 2) + 40,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 16,
    fontWeight: "normal" as const,
    color: "#666666",
    textAlign: "center" as const
  };
  await addElement(errorMessageElement);
}
