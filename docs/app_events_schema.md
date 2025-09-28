# App Events Table Schema

## Table: `app_events`

This table stores event records for pricing page changes, tracking specific events between different versions of application pricing pages.

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `page_id` | uuid | NO | - | Reference to page |
| `slug` | text | NO | - | Company identifier/slug |
| `v_before` | text | NO | - | Version before the event |
| `v_after` | text | NO | - | Version after the event |
| `event_type` | USER-DEFINED | NO | - | Type of event (enum) |
| `description` | text | NO | - | Description of the event |
| `asset_id` | uuid | NO | - | Reference to associated asset |
| `verified` | boolean | NO | false | Whether the event has been verified |
| `created_at` | timestamp with time zone | NO | now() | Creation timestamp |
| `updated_at` | timestamp with time zone | NO | now() | Last update timestamp |
| `before_extracts` | text | YES | - | Text extracts from the before version |
| `after_extract` | text | YES | - | Text extract from the after version |

### Event Type Enum Values

The `event_type` column accepts the following values:

- `price` - Pricing changes
- `plan` - Plan structure changes
- `feature` - Feature additions, removals, or modifications
- `discount` - Discount or promotional changes
- `metric` - Metric or limit changes (storage, users, etc.)
- `other` - Other types of changes not covered above

### Key Features

- **Event Tracking**: Records specific changes between pricing page versions
- **Verification System**: Boolean flag to track event verification status
- **Asset Association**: Links events to specific assets via `asset_id`
- **Version Tracking**: Stores both before and after versions for change tracking
- **Categorization**: Structured event types for consistent classification
- **Extract Storage**: Stores original text extracts from both versions for reference
- **Duplicate Prevention**: Unique constraint on `page_id + v_before + v_after + event_type`
- **Event Aggregation**: Multiple changes of the same type are combined into single records

### Current Status

- **Total Records**: 3 (Contains test data from affise company)
- **Purpose**: Designed for tracking individual pricing events and changes
- **Verification**: Events can be marked as verified for quality control
- **Data Aggregation**: Events are aggregated by type to prevent duplicates

### Usage Patterns

- **Change Detection**: Track specific types of changes between pricing page versions
- **Event Verification**: Mark events as verified after manual review
- **Asset Linking**: Associate events with specific assets for context
- **Historical Analysis**: Analyze patterns of change types over time

### Related Tables

- Links to `pages` table via `page_id`
- Links to `app_assets` table via `asset_id`
- Complements `app_diffs` table with granular event tracking

### Import Process

Events can be imported through multiple methods:

#### Legacy Import (import-app-events.js)
Events are imported from the `_export.json` file using the `import-app-events.js` script:
- **Type Aggregation**: Multiple changes of the same event_type are combined into one record
- **Description Concatenation**: Descriptions are joined with semicolons (`;`)
- **Duplicate Detection**: Prevents insertion of duplicate page_id + version + event_type combinations
- **Asset Validation**: Validates asset_id exists before processing events

#### Fast Upload Process (upload-results-fast.js)
Modern pricing analysis results are uploaded using the fast upload system:
- **Direct Database Operations**: Uses Supabase REST API for optimal performance
- **Structured Data Flow**: Processes JSON comparison files from results/ directory
- **Four-Table Integration**: Creates records in app_diffs, app_assets, news2, and app_events tables
- **Change Detection**: Only creates assets, news, and events entries when changes are detected
- **Batch Processing**: Handles multiple companies and analysis modes efficiently
- **Event Extraction**: Automatically extracts individual pricing events from diff-agent analysis results
- **Enum Validation**: Uses correct app_events enum types (price, plan, feature, metric, discount, other)

### Common Queries

```sql
-- Get all unverified events
SELECT * FROM app_events WHERE verified = false;

-- Count events by type
SELECT event_type, COUNT(*)
FROM app_events
GROUP BY event_type
ORDER BY COUNT(*) DESC;

-- Get events for a specific company
SELECT * FROM app_events
WHERE slug = 'company-name'
ORDER BY created_at DESC;

-- Get aggregated events (multiple descriptions)
SELECT slug, event_type, description
FROM app_events
WHERE description LIKE '%;%'
ORDER BY slug, event_type;

-- Check for potential duplicates
SELECT page_id, v_before, v_after, event_type, COUNT(*)
FROM app_events
GROUP BY page_id, v_before, v_after, event_type
HAVING COUNT(*) > 1;
```