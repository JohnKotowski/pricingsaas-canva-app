/**
 * Page Generator Service
 * Creates new pages from template configurations with token replacement
 * Handles static elements (always same) vs dynamic elements (populated with data)
 */

import { addPage, addElementAtPoint, createRichtextRange } from "@canva/design";
import { upload } from "@canva/asset";
import type { PageConfig, TemplateElement, TokenValues } from "../types";

export class PageGenerator {
  private uploadCache = new Map<string, { ref: any; timestamp: number }>();

  /**
   * Create page from template with token replacement
   * Static elements are recreated exactly; dynamic elements are populated with data
   */
  async createPageFromTemplate(
    config: PageConfig,
    tokenValues: TokenValues
  ): Promise<void> {
    // Create new page with background
    await addPage({
      background: config.background,
    });

    // Wait for page to be ready
    await this.delay(500);

    // Add elements with token replacement
    await this.addElementsWithTokens(
      config.elements,
      tokenValues,
      config.missingTokenBehavior || 'skip'
    );
  }

  /**
   * Add elements in batches with rate limiting
   * Follows existing pattern from reportSlideGenerators.ts
   */
  private async addElementsWithTokens(
    elements: TemplateElement[],
    tokenValues: TokenValues,
    missingBehavior: 'skip' | 'placeholder' | 'error'
  ): Promise<void> {
    const BATCH_SIZE = 8;
    const DELAY_BETWEEN_ELEMENTS = 300;
    const DELAY_BETWEEN_BATCHES = 3000;

    for (let i = 0; i < elements.length; i += BATCH_SIZE) {
      const batch = elements.slice(i, i + BATCH_SIZE);

      for (const element of batch) {
        try {
          await this.addSingleElement(element, tokenValues, missingBehavior);
          await this.delay(DELAY_BETWEEN_ELEMENTS);
        } catch (error) {
          console.error(`Error adding element ${element.id}:`, error);
          // Continue with next element even if one fails
        }
      }

      if (i + BATCH_SIZE < elements.length) {
        await this.delay(DELAY_BETWEEN_BATCHES);
      }
    }
  }

  /**
   * Add single element with token replacement
   * Handles static vs dynamic elements differently
   */
  private async addSingleElement(
    element: TemplateElement,
    tokenValues: TokenValues,
    missingBehavior: 'skip' | 'placeholder' | 'error'
  ): Promise<void> {
    // For static elements, always add (no token replacement)
    if (element.elementMode === 'static') {
      await this.addStaticElement(element);
      return;
    }

    // For dynamic elements, check if we have all required tokens
    if (element.elementMode === 'dynamic') {
      const missingTokens = (element.tokens || []).filter(
        token => !(token in tokenValues) || !tokenValues[token]
      );

      if (missingTokens.length > 0) {
        if (missingBehavior === 'error') {
          throw new Error(`Missing required tokens: ${missingTokens.join(', ')}`);
        } else if (missingBehavior === 'skip') {
          return; // Skip this element
        }
        // If 'placeholder', continue and tokens will stay as {{token}}
      }

      await this.addDynamicElement(element, tokenValues);
    }
  }

  /**
   * Add static element (no token replacement)
   * Recreated exactly as scanned
   */
  private async addStaticElement(element: TemplateElement): Promise<void> {
    switch (element.type) {
      case 'text':
        await this.addTextElementStatic(element);
        break;
      case 'shape':
        await this.addShapeElement(element);
        break;
      case 'image':
        await this.addImageElementFromFill(element);
        break;
      case 'video':
        await this.addVideoElementFromFill(element);
        break;
      case 'rect':
        await this.addRectElement(element);
        break;
      case 'embed':
        await this.addEmbedElement(element);
        break;
    }
  }

  /**
   * Add dynamic element with token replacement
   * Text and URLs get tokens replaced with actual values
   */
  private async addDynamicElement(
    element: TemplateElement,
    tokenValues: TokenValues
  ): Promise<void> {
    switch (element.type) {
      case 'text':
        await this.addTextElement(element, tokenValues);
        break;
      case 'image':
        await this.addImageElement(element, tokenValues);
        break;
      case 'video':
        await this.addVideoElement(element, tokenValues);
        break;
      case 'shape':
        await this.addShapeElement(element);
        break;
      case 'rect':
        await this.addRectElement(element);
        break;
      case 'embed':
        await this.addEmbedElement(element);
        break;
    }
  }

  /**
   * Add text element with token replacement (for dynamic elements)
   */
  private async addTextElement(
    element: TemplateElement,
    tokenValues: TokenValues
  ): Promise<void> {
    const plaintext = this.replaceTokens(element.text?.plaintext || '', tokenValues);

    if (element.text?.regions && element.text.regions.length > 0) {
      await this.addMultiRegionTextElement(element, tokenValues, plaintext);
    } else {
      await this.addSimpleTextElement(element, plaintext);
    }
  }

  /**
   * Add text element as-is (for static elements)
   */
  private async addTextElementStatic(element: TemplateElement): Promise<void> {
    if (element.text?.regions && element.text.regions.length > 0) {
      await this.addMultiRegionTextElement(element, {}, element.text.plaintext);
    } else {
      await this.addSimpleTextElement(element, element.text?.plaintext || '');
    }
  }

  /**
   * Add simple text with uniform formatting
   */
  private async addSimpleTextElement(
    element: TemplateElement,
    text: string
  ): Promise<void> {
    // Normalize fontWeight to Canva API format
    let fontWeight: 'normal' | 'bold' | undefined = undefined;
    if (element.fontWeight !== undefined) {
      if (typeof element.fontWeight === 'number') {
        fontWeight = element.fontWeight >= 600 ? 'bold' : 'normal';
      } else {
        fontWeight = element.fontWeight;
      }
    }

    await addElementAtPoint({
      type: 'text',
      children: [text],
      top: element.top,
      left: element.left,
      width: element.width,
      fontSize: element.fontSize,
      fontWeight,
      fontStyle: element.fontStyle,
      color: element.color,
      textAlign: element.textAlign,
      decoration: element.decoration,
      rotation: element.rotation,
      ...(element.transparency !== undefined && { transparency: element.transparency }),
    });
  }

  /**
   * Add multi-region text with mixed formatting
   */
  private async addMultiRegionTextElement(
    element: TemplateElement,
    tokenValues: TokenValues,
    replacedPlaintext: string
  ): Promise<void> {
    const range = createRichtextRange();

    // Build richtext from regions
    for (const region of element.text!.regions!) {
      const regionText = this.replaceTokens(region.text, tokenValues);

      const inlineFormatting: any = {};
      if (region.formatting) {
        if (region.formatting.color) inlineFormatting.color = region.formatting.color;
        if (region.formatting.fontWeight !== undefined) {
          // Normalize fontWeight to Canva API format
          if (typeof region.formatting.fontWeight === 'number') {
            inlineFormatting.fontWeight = region.formatting.fontWeight >= 600 ? 'bold' : 'normal';
          } else {
            inlineFormatting.fontWeight = region.formatting.fontWeight;
          }
        }
        if (region.formatting.fontStyle) inlineFormatting.fontStyle = region.formatting.fontStyle;
        if (region.formatting.decoration) inlineFormatting.decoration = region.formatting.decoration;
        if (region.formatting.strikethrough) inlineFormatting.strikethrough = region.formatting.strikethrough;
        if (region.formatting.link) inlineFormatting.link = region.formatting.link;
      }

      range.appendText(regionText, inlineFormatting);
    }

    // Apply paragraph formatting from first region
    const firstRegion = element.text!.regions![0];
    if (firstRegion.formatting) {
      const paragraphFormatting: any = {};
      if (firstRegion.formatting.fontSize) paragraphFormatting.fontSize = firstRegion.formatting.fontSize;
      if (firstRegion.formatting.textAlign) paragraphFormatting.textAlign = firstRegion.formatting.textAlign;
      if (firstRegion.formatting.fontRef) paragraphFormatting.fontRef = firstRegion.formatting.fontRef;

      if (Object.keys(paragraphFormatting).length > 0) {
        range.formatParagraph(
          { index: 0, length: replacedPlaintext.length },
          paragraphFormatting
        );
      }
    }

    await addElementAtPoint({
      type: 'richtext',
      range,
      top: element.top,
      left: element.left,
      width: element.width,
      rotation: element.rotation,
      ...(element.transparency !== undefined && { transparency: element.transparency }),
    });
  }

  /**
   * Add shape element (always static, no token replacement)
   */
  private async addShapeElement(element: TemplateElement): Promise<void> {
    if (!element.paths || element.paths.length === 0) {
      console.warn(`Shape element ${element.id} has no paths, skipping`);
      return;
    }

    if (!element.viewBox || !element.height) {
      console.warn(`Shape element ${element.id} missing viewBox or height, skipping`);
      return;
    }

    // Ensure paths have required fill property with valid color
    const paths = element.paths.map(path => {
      // Ensure fill exists and has a valid color
      const fill = path.fill && typeof path.fill === 'object' ? path.fill : {};
      const color = fill.color && /^#[0-9A-Fa-f]{6}$/.test(fill.color)
        ? fill.color
        : '#000000';

      return {
        ...path,
        fill: { ...fill, color },
      };
    });

    await addElementAtPoint({
      type: 'shape',
      paths,
      top: element.top,
      left: element.left,
      width: element.width,
      height: element.height,
      viewBox: element.viewBox,
      rotation: element.rotation,
      ...(element.transparency !== undefined && { transparency: element.transparency }),
    });
  }

  /**
   * Add image element from RectElement fill
   */
  private async addImageElementFromFill(element: TemplateElement): Promise<void> {
    if (!element.fill?.mediaRef) {
      console.warn('[PageGenerator] Image element missing media reference');
      return;
    }

    // For static images, the mediaRef should still be valid
    // For dynamic images, we'd need URL-based upload (existing logic)
    await addElementAtPoint({
      type: 'image',
      ref: element.fill.mediaRef,  // Use stored reference
      top: element.top,
      left: element.left,
      width: element.width,
      height: element.height || element.width,
      rotation: element.rotation,
      ...(element.transparency !== undefined && { transparency: element.transparency }),
      altText: element.altText || { text: '', decorative: true },
    });
  }

  /**
   * Add video element from RectElement fill
   */
  private async addVideoElementFromFill(element: TemplateElement): Promise<void> {
    if (!element.fill?.mediaRef) {
      console.warn('[PageGenerator] Video element missing media reference');
      return;
    }

    await addElementAtPoint({
      type: 'video',
      ref: element.fill.mediaRef,
      top: element.top,
      left: element.left,
      width: element.width,
      height: element.height || element.width * 0.5625,
      rotation: element.rotation,
      ...(element.transparency !== undefined && { transparency: element.transparency }),
      altText: element.altText || { text: '', decorative: true },
    });
  }

  /**
   * Add rect element (non-media rects)
   */
  private async addRectElement(element: TemplateElement): Promise<void> {
    // For now, treat as shape with fill
    // Implementation would create a rectangle with the stored fill
  }

  /**
   * Add embed element
   */
  private async addEmbedElement(element: TemplateElement): Promise<void> {
    // Embed elements are typically static and may need special handling
  }

  /**
   * Add image element with URL token replacement (for dynamic elements)
   */
  private async addImageElement(
    element: TemplateElement,
    tokenValues: TokenValues
  ): Promise<void> {
    let imageRef = element.ref;

    // If element has URL token, replace and upload
    if (element.url && element.tokens?.length) {
      const imageUrl = this.replaceTokens(element.url, tokenValues);

      // Check cache
      if (this.uploadCache.has(imageUrl)) {
        imageRef = this.uploadCache.get(imageUrl)!.ref;
      } else {
        // Upload new image
        const result = await upload({
          type: "image",
          url: imageUrl,
          thumbnailUrl: imageUrl,
          mimeType: this.getImageMimeType(imageUrl),
          aiDisclosure: "none",
        });
        imageRef = result.ref;
        this.uploadCache.set(imageUrl, { ref: imageRef, timestamp: Date.now() });
      }
    }

    if (!imageRef) {
      throw new Error(`No image reference for dynamic element ${element.id}`);
    }

    await addElementAtPoint({
      type: 'image',
      ref: imageRef,
      top: element.top,
      left: element.left,
      width: element.width,
      height: element.height || element.width, // Default to square if height not specified
      rotation: element.rotation,
      ...(element.transparency !== undefined && { transparency: element.transparency }),
      altText: element.altText || { text: '', decorative: true },
    });
  }

  /**
   * Add video element with token replacement (for dynamic elements)
   */
  private async addVideoElement(
    element: TemplateElement,
    tokenValues: TokenValues
  ): Promise<void> {
    let videoRef = element.ref;

    if (element.url && element.tokens?.length) {
      const videoUrl = this.replaceTokens(element.url, tokenValues);

      if (this.uploadCache.has(videoUrl)) {
        videoRef = this.uploadCache.get(videoUrl)!.ref;
      } else {
        const result = await upload({
          type: "video",
          url: videoUrl,
          thumbnailImageUrl: videoUrl, // For videos, use thumbnailImageUrl instead of thumbnailUrl
          mimeType: this.getVideoMimeType(videoUrl),
          aiDisclosure: "none",
        });
        videoRef = result.ref;
        this.uploadCache.set(videoUrl, { ref: videoRef, timestamp: Date.now() });
      }
    }

    if (!videoRef) {
      throw new Error(`No video reference for dynamic element ${element.id}`);
    }

    await addElementAtPoint({
      type: 'video',
      ref: videoRef,
      top: element.top,
      left: element.left,
      width: element.width,
      height: element.height || element.width * 0.5625, // Default to 16:9 aspect ratio if height not specified
      rotation: element.rotation,
      ...(element.transparency !== undefined && { transparency: element.transparency }),
      altText: element.altText || { text: '', decorative: true },
    });
  }

  /**
   * Replace {{tokens}} in string with values
   * Preserves {{token}} if value not found (for placeholder mode)
   */
  private replaceTokens(text: string, tokenValues: TokenValues): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, tokenName) => {
      return tokenValues[tokenName]?.toString() || match;
    });
  }

  /**
   * Utility delay function
   * Prevents rate limiting issues with Canva API
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear upload cache (call periodically to prevent memory growth)
   */
  clearCache(): void {
    this.uploadCache.clear();
  }

  /**
   * Get cache size (for debugging)
   */
  getCacheSize(): number {
    return this.uploadCache.size;
  }

  /**
   * Infer image MIME type from URL extension
   * @param url - The URL of the image
   * @returns Image MIME type (only Canva-supported types)
   */
  private getImageMimeType(url: string): 'image/jpeg' | 'image/png' | 'image/webp' {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    const imageMimeTypes: Record<string, 'image/jpeg' | 'image/png' | 'image/webp'> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
    };
    return imageMimeTypes[extension] || 'image/jpeg'; // Default to JPEG
  }

  /**
   * Get video MIME type (currently only MP4 is supported)
   * @param url - The URL of the video
   * @returns Video MIME type
   */
  private getVideoMimeType(url: string): 'video/mp4' {
    return 'video/mp4'; // Canva primarily supports MP4
  }
}
