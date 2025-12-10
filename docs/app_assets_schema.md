# App Assets Table Schema

## Table: `app_assets`

This table stores asset information for pricing page analysis applications, supporting both single and comparison modes.

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `collection_id` | uuid | NO | - | Reference to collection |
| `type` | USER-DEFINED | NO | - | Asset type (enum) |
| `page_id` | uuid | NO | - | Reference to page |
| `slug` | text | NO | - | URL slug identifier |
| `version` | text | NO | - | Version identifier |
| `created_at` | timestamp with time zone | NO | now() | Creation timestamp |
| `updated_at` | timestamp with time zone | NO | now() | Last update timestamp | 
| `header` | text | YES | - | Asset header text |
| `subheader` | text | YES | - | Asset subheader text |
| `comparison_mode` | USER-DEFINED | NO | 'single'::comparison_mode | Comparison mode (single/comparison) |
| `secondary_version` | text | YES | - | Secondary version for comparisons |
| `secondary_page_id` | uuid | YES | - | Secondary page reference |
| `primary_original_url` | text | YES | - | Primary original image URL |
| `primary_cropped_url` | text | YES | - | Primary cropped image URL |
| `primary_viewport_state` | jsonb | YES | - | Primary viewport state |
| `secondary_viewport_state` | jsonb | YES | - | Secondary viewport state |
| `secondary_original_url` | text | YES | - | Secondary original image URL |
| `secondary_cropped_url` | text | YES | - | Secondary cropped image URL |
| `is_favorited` | boolean | YES | false | Whether the asset is marked as a favorite |

| `canva_asset_id` | character varying(255) | YES | - | Canva asset identifier | -- DO NO USE
| `primary_image` | text | YES | - | Primary image URL | -- DO NO USE
| `secondary_image` | text | YES | - | Secondary image URL | -- DO NO USE
| `crop_aspect_ratio` | character varying(10) | YES | - | Aspect ratio for cropping | -- DO NO USE
| `crop_coordinates` | jsonb | YES | - | Crop coordinates data | -- DO NO USE
| `primary_annotations` | jsonb | YES | - | Primary image annotations | -- DO NO USE
| `secondary_annotations` | jsonb | YES | - | Secondary image annotations | -- DO NO USE
| `primary_markup_url` | text | YES | - | Primary markup image URL | -- DO NO USE
| `secondary_markup_url` | text | YES | - | Secondary markup image URL |  -- DO NO USE
| `primary_crop_coordinates` | jsonb | YES | Default coordinates object | Primary image crop coordinates | -- DO NO USE
| `primary_markup_coordinates` | jsonb | YES | Default coordinates object | Primary image markup coordinates | -- DO NO USE
| `secondary_crop_coordinates` | jsonb | YES | Default coordinates object | Secondary image crop coordinates | -- DO NO USE
| `secondary_markup_coordinates` | jsonb | YES | Default coordinates object | Secondary image markup coordinates |-- DO NO USE
| `title` | text | YES | ''::text | Asset title |-- DO NO USE
| `description` | text | YES | ''::text | Asset description |-- DO NO USE
 

### Default Coordinate Object Structure
```json
{
  "x": 0,
  "y": 0,
  "scale": 1,
  "viewportWidth": 800,
  "viewportHeight": 600
}
```