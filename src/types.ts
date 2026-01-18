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

export type TabType = 'reports' | 'collections' | 'settings';
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