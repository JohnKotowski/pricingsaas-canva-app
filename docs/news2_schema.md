# News2 Table Schema

## Table: `news2`

This table stores news items and change notifications for pricing page analysis, tracking various types of changes between versions.

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `page_id` | uuid | NO | - | Reference to page |
| `slug` | text | NO | - | URL slug identifier |
| `version` | text | NO | - | Version identifier |
| `before_image_url` | text | YES | - | Before image URL |
| `after_image_url` | text | YES | - | After image URL |
| `hook` | text | YES | - | Hook/title text |
| `description` | text | YES | - | Detailed description |
| `created_at` | timestamp with time zone | YES | now() | Creation timestamp |
| `published` | boolean | NO | false | Publication status |
| `quarter` | text | YES | - | Quarter identifier (e.g., "2025Q3") |
| `before_version` | text | YES | - | Previous version identifier |
| `price_change` | boolean | YES | - | Indicates price changes | 
| `plan_change` | boolean | YES | - | Indicates plan changes |
| `metric_change` | boolean | YES | - | Indicates metric changes |
| `discount_change` | boolean | YES | - | Indicates discount changes |
| `features_change` | boolean | YES | - | Indicates feature changes |
| `asset_id` | uuid | YES | - | Reference to associated asset | 
| `verified` | boolean | YES | false | Verification status |

| `before_image_url_annotated` | text | YES | - | Annotated before image URL | -- DO NO USE
| `after_image_url_annotated` | text | YES | - | Annotated after image URL | -- DO NO USE
| `annotations` | jsonb | YES | - | Annotation data |  --DO NOT USE
| `zoom_level` | text | YES | - | Zoom level for images |  --DO NOT USE
| `gif_url` | text | YES | - | Animated GIF URL | --DO NOT USE



### Key Features

- **Change Tracking**: Boolean flags for different types of changes (price, plan, metric, discount, features)
- **Image Management**: Support for before/after images, GIFs, and annotated versions
- **Quarterly Analysis**: Quarter-based organization for temporal analysis
- **Version Comparison**: Links between different versions for comparison
- **Publishing Workflow**: Published and verified flags for content management
- **Annotations**: JSONB storage for flexible annotation data
- **Asset Integration**: Optional reference to app_assets table

### Change Type Flags

The table includes boolean flags to categorize different types of changes:

- `price_change`: Price modifications
- `plan_change`: Plan structure changes
- `metric_change`: Billing metric changes
- `discount_change`: Discount/promotion changes
- `features_change`: Feature additions/removals

### Publishing States

- `published`: Controls public visibility
- `verified`: Indicates manual verification of changes

### Image Types

- **before_image_url**: Original state screenshot
- **after_image_url**: Updated state screenshot
- **gif_url**: Animated comparison
- **before_image_url_annotated**: Marked up before image
- **after_image_url_annotated**: Marked up after image