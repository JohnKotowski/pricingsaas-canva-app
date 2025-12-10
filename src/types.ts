export interface Asset {
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
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
}

export type TabType = 'collections' | 'settings';
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