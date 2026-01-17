/**
 * Template Scanner Service
 * Scans the current page in a Canva design and converts it to a template configuration
 * Uses current_page context (stable API) - user must navigate to desired page first
 */

import { openDesign } from "@canva/design";
import type {
  PageConfig,
  TemplateElement,
  TokenDefinition,
} from "../types";

export class TemplateScanner {
  /**
   * Scan current page and convert to template config
   * Auto-classifies elements as static or dynamic based on token presence
   * Note: User must navigate to the desired page before calling this method
   */
  async scanCurrentPageAsTemplate(): Promise<PageConfig> {
    return new Promise((resolve, reject) => {
      try {
        openDesign({ type: "current_page" }, async (session) => {
          try {
            const config: PageConfig = {
              dimensions: { width: 1920, height: 1080 }, // Default dimensions (actual dimensions inherited from design)
              elements: [],
              tokenDefinitions: {},
              missingTokenBehavior: 'skip', // Default behavior
            };

            // Note: Page dimensions and background cannot be read from current_page context
            // Dimensions are inherited from the design itself
            // Background can be set when creating pages via addPage()

            // Capture elements from current page
            // Check if page has elements property (type narrowing)
            if ('elements' in session.page) {
              let elementCounter = 0;

              session.page.elements.forEach((element) => {
                const templateElement = this.convertElementToTemplate(element, elementCounter++);
                if (templateElement) {
                  config.elements.push(templateElement);

                  // Extract tokens from element (only for dynamic elements)
                  if (templateElement.elementMode === 'dynamic') {
                    this.extractTokensFromElement(templateElement, config.tokenDefinitions);
                  }
                }
              });
            } else {
              throw new Error('Current page does not support element access. Page type: ' + session.page?.type);
            }

            // No sync needed for read-only operation
            resolve(config);
          } catch (error) {
            console.error('[TemplateScanner] Error during scan:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('[TemplateScanner] Error opening design:', error);
        reject(error);
      }
    });
  }

  /**
   * Convert Design API element to template element format
   * Auto-classifies as static or dynamic based on presence of {{tokens}}
   * Ensures all properties are JSON-serializable (no circular references)
   */
  private convertElementToTemplate(element: any, index: number): TemplateElement | null {
    const elementId = `elem_${String(index).padStart(3, '0')}`;

    const base = {
      id: elementId,
      top: element.top,
      left: element.left,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      elementMode: 'static' as 'static' | 'dynamic', // Default to static, updated if tokens found
    };

    let templateElement: TemplateElement | null = null;

    switch (element.type) {
      case 'text': {
        const plaintext = element.text?.readPlaintext() || '';
        let regions: any[] = [];

        try {
          regions = element.text?.readTextRegions() || [];
        } catch (error) {
          console.error('[TemplateScanner] Failed to read text regions:', error);
          regions = [{ text: plaintext }];
        }

        const { isUniform, commonFormatting } = this.areRegionsUniform(regions);

        if (isUniform) {
          // Uniform formatting
          const formatting = this.extractFormattingProps(commonFormatting);
          templateElement = {
            ...base,
            type: 'text',
            transparency: element.transparency,
            text: { plaintext },
            ...formatting,
          };
        } else {
          // Mixed formatting
          const serializedRegions = regions.map(region => ({
            text: region.text,
            formatting: this.extractFormattingProps(region.formatting),
          }));

          templateElement = {
            ...base,
            type: 'text',
            transparency: element.transparency,
            text: {
              plaintext,
              regions: serializedRegions
            },
          };
        }

        if (templateElement && this.containsTokens(plaintext)) {
          templateElement.elementMode = 'dynamic';
        }
        break;
      }

      case 'shape': {
        // Convert ReadableList to array
        let paths: any[] = [];
        let viewBox: any = undefined;

        try {
          if (element.paths) {
            paths = element.paths.toArray();

            // Serialize each path
            paths = paths.map((path) => ({
              d: path.d,
              fill: this.extractSerializableProps(path.fill, 2),
              stroke: path.stroke ? this.extractSerializableProps(path.stroke, 2) : undefined,
            }));
          }

          if (element.viewBox) {
            viewBox = {
              top: element.viewBox.top,
              left: element.viewBox.left,
              width: element.viewBox.width,
              height: element.viewBox.height,
            };
          }
        } catch (error) {
          console.error('[TemplateScanner] Failed to process shape:', error);
        }

        if (paths.length === 0) {
          return null;
        }

        templateElement = {
          ...base,
          type: 'shape',
          transparency: element.transparency,
          paths,
          viewBox,
        };
        break;
      }

      case 'rect': {
        // Check if rect contains an image or video fill
        if (element.fill && (element.fill.type === 'image' || element.fill.type === 'video')) {
          const mediaType = element.fill.type;

          // Extract media reference
          const mediaRef = element.fill.mediaContainer?.ref;

          const altText = element.altText ? {
            text: element.altText.text || '',
            decorative: element.altText.decorative || false
          } : undefined;

          templateElement = {
            ...base,
            type: mediaType,  // Store as 'image' or 'video'
            transparency: element.transparency,
            fill: {
              type: mediaType,
              mediaRef: mediaRef ? String(mediaRef) : undefined,  // Serialize ref
            },
            altText,
          };
        } else {
          // Regular rect without media - treat as shape
          templateElement = {
            ...base,
            type: 'rect',
            transparency: element.transparency,
            fill: element.fill ? this.extractSerializableProps(element.fill, 2) : undefined,
          };
        }
        break;
      }

      case 'embed': {
        // Embed elements are typically static (YouTube videos, etc.)
        templateElement = {
          ...base,
          type: 'embed',
          transparency: element.transparency,
        };
        break;
      }

      default:
        return null;
    }

    return templateElement;
  }

  /**
   * Check if all regions have identical formatting
   */
  private areRegionsUniform(regions: any[]): {
    isUniform: boolean;
    commonFormatting?: any
  } {
    if (regions.length <= 1) {
      return {
        isUniform: true,
        commonFormatting: regions[0]?.formatting
      };
    }

    const firstFormatting = JSON.stringify(regions[0].formatting || {});
    const allSame = regions.every(region =>
      JSON.stringify(region.formatting || {}) === firstFormatting
    );

    return {
      isUniform: allSame,
      commonFormatting: allSame ? regions[0].formatting : undefined
    };
  }

  /**
   * Extract serializable formatting properties
   */
  private extractFormattingProps(formatting: any): any {
    if (!formatting) return {};

    const result: any = {};
    if (formatting.color !== undefined) result.color = formatting.color;
    if (formatting.fontWeight !== undefined) result.fontWeight = formatting.fontWeight;
    if (formatting.fontStyle !== undefined) result.fontStyle = formatting.fontStyle;
    if (formatting.fontSize !== undefined) result.fontSize = formatting.fontSize;
    if (formatting.textAlign !== undefined) result.textAlign = formatting.textAlign;
    if (formatting.decoration !== undefined) result.decoration = formatting.decoration;
    if (formatting.strikethrough !== undefined) result.strikethrough = formatting.strikethrough;
    if (formatting.link !== undefined) result.link = formatting.link;
    if (formatting.fontRef !== undefined) result.fontRef = String(formatting.fontRef);

    return result;
  }

  /**
   * Safely extract serializable properties from an object, avoiding circular references
   */
  private extractSerializableProps(obj: any, maxDepth = 3, currentDepth = 0): any {
    if (currentDepth >= maxDepth || obj === null || obj === undefined) {
      return obj;
    }

    // Handle primitives
    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.extractSerializableProps(item, maxDepth, currentDepth + 1));
    }

    // Handle plain objects - extract only enumerable properties
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          const value = obj[key];
          // Skip functions, symbols, and non-enumerable properties
          if (typeof value === 'function' || typeof value === 'symbol') {
            continue;
          }
          result[key] = this.extractSerializableProps(value, maxDepth, currentDepth + 1);
        } catch (e) {
          // Skip properties that throw errors when accessed
        }
      }
    }
    return result;
  }

  /**
   * Check if text contains {{token}} placeholders
   */
  private containsTokens(text: string): boolean {
    return /\{\{\w+\}\}/.test(text);
  }

  /**
   * Extract {{tokens}} from element and add to token definitions
   * Automatically infers token type and creates user-friendly labels
   */
  private extractTokensFromElement(
    element: TemplateElement,
    definitions: Record<string, TokenDefinition>
  ): void {
    const tokenRegex = /\{\{(\w+)\}\}/g;
    const tokens: string[] = [];

    // Check text content
    if (element.text?.plaintext) {
      let match;
      while ((match = tokenRegex.exec(element.text.plaintext)) !== null) {
        const tokenName = match[1];
        tokens.push(tokenName);

        if (!definitions[tokenName]) {
          definitions[tokenName] = {
            type: 'string',
            label: this.formatTokenLabel(tokenName),
            default: '',
          };
        }
      }
    }

    // Check image URL (stored as token placeholder)
    if (element.url) {
      let match;
      while ((match = tokenRegex.exec(element.url)) !== null) {
        const tokenName = match[1];
        tokens.push(tokenName);

        if (!definitions[tokenName]) {
          definitions[tokenName] = {
            type: 'image_url',
            label: this.formatTokenLabel(tokenName),
            default: '',
          };
        }
      }
    }

    element.tokens = tokens.length > 0 ? tokens : undefined;
  }

  /**
   * Convert snake_case or camelCase to Title Case
   * Examples: company_name -> Company Name, productImage -> Product Image
   */
  private formatTokenLabel(tokenName: string): string {
    // Handle snake_case
    if (tokenName.includes('_')) {
      return tokenName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Handle camelCase
    return tokenName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
