export interface Asset {
  id: string;
  name: string;
  slug?: string;
  thumbnail: string;
  url: string;
  collection_name?: string;
  company_logo_url?: string;
  company_slug?: string;
  company_name?: string;
  company_category?: string;
  header?: string;
  subheader?: string;
  version?: string;
  secondary_version?: string;
  // Removed crop_aspect_ratio - marked as DO NOT USE in schema
  primary_cropped_url?: string;
  primary_original_url?: string;
  secondary_cropped_url?: string;
  secondary_original_url?: string;
  type?: string;
  asset_type?: string;
  comparison_mode?: string;
  secondary_company_logo_url?: string;
  secondary_company_slug?: string;
  is_favorited?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
}

export type TabType = 'reports' | 'collections' | 'settings' | 'templates';
export type SizePreset = '1:1' | '16:9' | '816x1056' | 'custom';

export interface UploadCache {
  ref: any;
  timestamp: number;
  url: string;
}

export interface UploadProgress {
  status: 'uploading' | 'verifying' | 'completed' | 'failed';
  progress: number;
  message: string;
}

export interface ReportElement {
  id: string;
  type: 'title' | 'text' | 'section_header' | 'graph' | 'list' | 'tiles' | 'tags' | 'example' | 'example_table';
  content: string;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  elements: ReportElement[];
  created_at: string;
  updated_at: string;
  element_count?: number;
}

// Template Page Types
export interface TemplatePage {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  preview_image_url?: string;
  page_config: PageConfig;
  created_at: string;
  updated_at: string;
}

export interface PageConfig {
  dimensions: { width: number; height: number };
  background?: { color?: string; imageRef?: string };
  elements: TemplateElement[];
  tokenDefinitions: Record<string, TokenDefinition>;
  missingTokenBehavior?: 'skip' | 'placeholder' | 'error'; // How to handle missing tokens
}

export interface TextRegion {
  text: string;
  formatting?: Partial<{
    color?: string;
    fontWeight?: 'normal' | 'bold' | number;
    fontStyle?: 'normal' | 'italic';
    decoration?: 'none' | 'underline';
    strikethrough?: 'none' | 'strikethrough';
    link?: string;
    fontRef?: string;
    fontSize?: number;
    textAlign?: 'start' | 'center' | 'end' | 'justify';
  }>;
}

export interface TemplateElement {
  id: string; // Unique element identifier
  type: 'text' | 'shape' | 'image' | 'video' | 'richtext' | 'embed' | 'rect';
  elementMode: 'static' | 'dynamic'; // Static (always same) vs Dynamic (populated with data)
  top: number;
  left: number;
  width: number;
  height?: number;
  rotation?: number;
  transparency?: number;

  // Text properties - modified to support regions
  text?: {
    plaintext: string;
    regions?: TextRegion[]; // Only present if mixed formatting
  };

  // Text formatting (when regions undefined) - extended
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | number;
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textAlign?: 'start' | 'center' | 'end' | 'justify';
  decoration?: 'none' | 'underline';
  strikethrough?: 'none' | 'strikethrough';
  fontRef?: string;
  link?: string;

  // Shape properties
  paths?: Array<{ d: string; fill?: any; stroke?: any }>;
  viewBox?: { top: number; left: number; width: number; height: number };

  // Media properties
  url?: string; // Can contain tokens like "{{image_url}}"
  ref?: any; // Uploaded asset reference (opaque type from Canva SDK)
  altText?: { text: string; decorative: boolean };

  // Fill properties for RectElement with images
  fill?: {
    type: 'image' | 'video';
    mediaRef?: any; // Stores the image/video reference
  };

  // Token tracking (only for dynamic elements)
  tokens?: string[];
}

export interface TokenDefinition {
  type: 'string' | 'number' | 'image_url' | 'video_url';
  label: string;
  default?: any;
  required?: boolean;
  description?: string;
}

export interface TokenValues {
  [tokenName: string]: any;
}