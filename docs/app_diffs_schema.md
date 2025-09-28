# App Diffs Table Schema

## Table: `app_diffs`

This table stores comprehensive comparison results between different versions of SaaS pricing pages, tracking all analysis runs regardless of whether changes were detected.

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `slug` | text | NO | - | Company identifier/slug |
| `changed` | boolean | NO | - | Whether substantive changes were detected |
| `v1_version` | text | NO | - | Earlier version identifier (YYYYMMDD format) |
| `v2_version` | text | NO | - | Later version identifier (YYYYMMDD format) |
| `comparison_type` | text | YES | - | Type of comparison (e.g., "quarter_vs_quarter") |
| `v1_quarter` | text | YES | - | Quarter of v1_version (e.g., "2025Q2") |
| `v2_quarter` | text | YES | - | Quarter of v2_version (e.g., "2025Q3") |
| `v1_screenshot_url` | text | YES | - | Screenshot URL for earlier version |
| `v1_cloudinary_url` | text | YES | - | Cloudinary URL for earlier version |
| `v2_screenshot_url` | text | YES | - | Screenshot URL for later version |
| `v2_cloudinary_url` | text | YES | - | Cloudinary URL for later version |
| `summary` | jsonb | YES | - | Summary of changes and analysis |
| `changes` | jsonb | YES | - | Detailed array of specific changes |
| `v1_content` | text | YES | - | Full markdown content of earlier version |
| `v2_content` | text | YES | - | Full markdown content of later version |
| `created_at` | timestamp with time zone | YES | now() | Record creation timestamp |
| `updated_at` | timestamp with time zone | YES | now() | Last update timestamp |

### Key Features

- **Comprehensive Audit Trail**: Records EVERY comparison run, regardless of whether changes are detected
- **Version Tracking**: Stores both version identifiers and their corresponding quarters
- **Dual URL Storage**: Maintains both original screenshot URLs and Cloudinary URLs
- **Structured Analysis**: JSON fields for summary and detailed changes array
- **Content Archival**: Optional storage of full markdown content for both versions
- **Change Detection**: Boolean flag for quick filtering of substantive changes

### JSON Field Structures

#### Summary Field
```json
{
  "status": "✅ PRICING CHANGES DETECTED" | "❌ NO CHANGES DETECTED",
  "main_change": "Brief description of primary change",
  "key_changes": ["Array of key changes"],
  "change_impact": "Impact description"
}
```

#### Changes Field
```json
[
  {
    "type": "pricing|plan|feature|discount|metric",
    "description": "Description of the change",
    "v1_extract": "Relevant text from earlier version",
    "v2_extract": "Relevant text from later version"
  }
]
```


### Usage Patterns

- **Historical Analysis**: Track pricing evolution over time using version comparisons
- **Market Intelligence**: Identify trends across multiple companies and quarters
- **Change Detection**: Boolean `changed` field for quick filtering of companies with updates
- **Content Analysis**: Full markdown content storage for detailed comparison analysis

### Data Integrity Notes

- **Version Format**: Versions follow YYYYMMDD format (e.g., "20250706")
- **Quarter Format**: Quarters follow YYYYQX format (e.g., "2025Q3")
- **Duplicate Prevention**: Some duplicate entries exist and should be cleaned up
- **Screenshot URLs**: Both original and Cloudinary URLs maintained for redundancy

### Common Queries

```sql
-- Get all companies with changes in Q2→Q3 comparison
SELECT slug, changed FROM app_diffs
WHERE comparison_type = 'quarter_vs_quarter'
  AND v1_quarter = '2025Q2' AND v2_quarter = '2025Q3';

-- Find duplicates needing cleanup
SELECT slug, v1_version, v2_version, COUNT(*)
FROM app_diffs
GROUP BY slug, v1_version, v2_version
HAVING COUNT(*) > 1;
```