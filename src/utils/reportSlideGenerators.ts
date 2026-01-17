import { addPage, addElementAtPoint, addElementAtCursor } from "@canva/design";
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
  const footerY = designHeight - branding.footerHeight;

  // 1. Add footer bar rectangle
  const footerBar = {
    type: "shape" as const,
    paths: [
      {
        d: `M 0 0 L ${designWidth} 0 L ${designWidth} ${branding.footerHeight} L 0 ${branding.footerHeight} Z`,
        fill: {
          color: "#132442"
        }
      }
    ],
    top: footerY,
    left: 0,
    width: designWidth,
    height: branding.footerHeight,
    viewBox: {
      top: 0,
      left: 0,
      width: designWidth,
      height: branding.footerHeight
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

      const logoX = designWidth - branding.logoWidth - branding.logoMarginRight;
      const logoY = footerY + (branding.footerHeight / 2) - (branding.logoHeight / 2);

      const logoElement = {
        type: "image" as const,
        ref: logoUpload.ref,
        altText: { text: "PricingSaaS", decorative: true },
        top: logoY,
        left: logoX,
        width: branding.logoWidth,
        height: branding.logoHeight
      };
      await addElement(logoElement);

      // 3. Add "Curated by" text
      const curatedByElement = {
        type: "text" as const,
        children: ["Curated by"],
        top: footerY + (branding.footerHeight / 2) - 10,
        left: logoX - branding.curatedByWidth - 15,
        width: branding.curatedByWidth,
        fontSize: branding.curatedByFontSize,
        fontWeight: "normal" as const,
        color: "#E4E4E4",
        textAlign: "end" as const
      };
      await addElement(curatedByElement);

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

  // Add branding elements
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);
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

  // Add branding elements
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);
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

  // Add branding elements
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);
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

  // Calculate layout - adjust for footer
  const imageWidth = (designWidth - 60) / 2;
  const maxContentHeight = designHeight - 100; // Leave room for footer
  const imageHeight = Math.min(400, maxContentHeight - 200);
  const topMargin = 100;

  try {
    // Upload images
    const beforeUrl = config.beforeImageUrl || config.before_image_url;
    const afterUrl = config.afterImageUrl || config.after_image_url;

    if (!beforeUrl || !afterUrl) {
      throw new Error('Missing before/after image URLs');
    }

    const beforeUpload = await uploadWithRetry([beforeUrl], {
      type: "image",
      aiDisclosure: "none"
    });

    const afterUpload = await uploadWithRetry([afterUrl], {
      type: "image",
      aiDisclosure: "none"
    });

    // Before label
    const beforeLabelElement = {
      type: "text" as const,
      children: ["Before"],
      top: topMargin - 40,
      left: 20,
      width: imageWidth,
      fontSize: 24,
      fontWeight: "bold" as const,
      color: "#191919",
      textAlign: "center" as const
    };
    await addElement(beforeLabelElement);

    // Before image
    const beforeImageElement = {
      type: "image" as const,
      ref: beforeUpload.ref,
      altText: { text: "Before", decorative: false },
      top: topMargin,
      left: 20,
      width: imageWidth,
      height: imageHeight
    };
    await addElement(beforeImageElement);

    // After label
    const afterLabelElement = {
      type: "text" as const,
      children: ["After"],
      top: topMargin - 40,
      left: 30 + imageWidth,
      width: imageWidth,
      fontSize: 24,
      fontWeight: "bold" as const,
      color: "#191919",
      textAlign: "center" as const
    };
    await addElement(afterLabelElement);

    // After image
    const afterImageElement = {
      type: "image" as const,
      ref: afterUpload.ref,
      altText: { text: "After", decorative: false },
      top: topMargin,
      left: 30 + imageWidth,
      width: imageWidth,
      height: imageHeight
    };
    await addElement(afterImageElement);

    // Caption
    if (caption) {
      const captionElement = {
        type: "text" as const,
        children: [caption],
        top: topMargin + imageHeight + 20,
        left: 20,
        width: designWidth - 40,
        fontSize: 18,
        fontWeight: "normal" as const,
        color: "#666666",
        textAlign: "center" as const
      };
      await addElement(captionElement);
    }

  } catch (error) {
    console.error('Error creating example slide:', error);
    throw error;
  }

  // Add branding elements
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);
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

  // Add branding elements
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);
}

/**
 * Helper functions for table creation
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text === '') return '—';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
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
  const displayRows = rows.slice(0, 5); // Limit to 5 rows

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

  const titleElement = {
    type: "text" as const,
    children: [title],
    top: 40,
    left: designWidth * 0.1,
    width: designWidth * 0.8,
    fontSize: 28,
    fontWeight: "bold" as const,
    color: "#191919",
    textAlign: "center" as const
  };
  await addElement(titleElement);
  await delay(300);

  // 3. Calculate table layout
  const tableStartY = 120; // Below title
  const headerHeight = 50;
  const rowHeight = 60;

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
      tableX + colStarts[col] + 8,
      headerY + 8,
      colWidths[col] - 16,
      14,
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
      truncateText(row.companyName || '—', 20),
      truncateText(row.description || '—', 100),
      row.period || '—',
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
      tableElements.push(createText(
        cellData[col],
        tableX + colStarts[col] + 8,
        rowY + 8,
        colWidths[col] - 16,
        11,
        'normal',
        textColor
      ));
    }
  }

  // 6. Border elements - simplified to just outer border + key dividers
  const totalHeight = headerHeight + (displayRows.length * rowHeight);

  // Outer border (4 lines - top, bottom, left, right)
  tableElements.push(createBorderLine(tableX, tableStartY, totalWidth, 2, '#D1D5DB')); // Top
  tableElements.push(createBorderLine(tableX, tableStartY + totalHeight, totalWidth, 2, '#D1D5DB')); // Bottom
  tableElements.push(createBorderLine(tableX, tableStartY, 2, totalHeight, '#D1D5DB')); // Left
  tableElements.push(createBorderLine(tableX + totalWidth - 2, tableStartY, 2, totalHeight, '#D1D5DB')); // Right

  // Divider between header and data
  tableElements.push(createBorderLine(tableX, tableStartY + headerHeight, totalWidth, 2, '#D1D5DB'));

  // Add all table elements in chunks with rate limiting
  console.log(`Adding ${tableElements.length} table elements in chunks`);
  await addElementsInChunks(
    tableElements,
    8,     // 8 elements per chunk
    300,   // 300ms between elements
    3000   // 3 second pause between chunks
  );

  console.log('All table elements added, waiting 5 seconds before adding branding...');
  await delay(5000);

  // 7. Add branding footer
  console.log('Adding branding footer');
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);
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

  // 8. Add branding elements
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);
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

  // Add branding elements
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);
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

  // Add branding elements
  await addBrandingElements(designWidth, designHeight, uploadWithRetry);
}
