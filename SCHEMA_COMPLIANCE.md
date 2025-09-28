# Schema Compliance Updates

## Changes Made

The codebase has been updated to comply with the app_assets schema documentation:

### Removed Deprecated Fields

The following fields marked as "DO NOT USE" have been removed from the codebase:

1. **`crop_aspect_ratio`** - Removed from Asset interface and all usage
   - Now using default 1:1 aspect ratio instead
   - Can be enhanced to calculate aspect ratio from image dimensions in the future

2. **`primary_image` and `secondary_image`** - Removed from edge function
   - Now using `primary_cropped_url` and `primary_original_url` instead

3. **`primary_markup_url` and `secondary_markup_url`** - Removed from edge function
   - These were not being used in the frontend anyway

4. **`canva_asset_id`** - Not being used in codebase

### Updated Edge Function

The Supabase edge function (`supabase/functions/canva-get-images/index.ts`) has been updated to:

- Use only approved schema fields
- Search on `slug`, `header`, and `subheader` instead of deprecated `name` and `description` fields
- Remove references to deprecated image URL fields

### Files Updated

1. `src/types.ts` - Removed `crop_aspect_ratio` from Asset interface
2. `src/app.tsx` - Updated to use default aspect ratio instead of deprecated field
3. `supabase/functions/canva-get-images/index.ts` - Updated to use only approved schema fields

## Deployment Required

**Important**: The Supabase edge function needs to be redeployed for these changes to take effect:

```bash
supabase functions deploy canva-get-images
```

## Future Improvements

1. **Dynamic Aspect Ratio**: Instead of using a default 1:1 aspect ratio, the app could calculate aspect ratios from actual image dimensions by loading the image and reading its naturalWidth/naturalHeight properties.

2. **Better Field Mapping**: Ensure all database queries are using the correct approved fields from the schema.

3. **Field Validation**: Add validation to ensure only approved schema fields are being used in queries and responses.