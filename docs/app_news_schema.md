# App News Table Schema

## Table: `app_news`

This table stores news and change notifications related to SaaS pricing page updates, tracking significant events and announcements that occur between different versions.

### Columns

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `page_id` | uuid | NO | - | Foreign key reference to the page |
| `slug` | text | NO | - | Company identifier/slug |
| `v_before` | text | NO | - | Version identifier before the change |
| `v_after` | text | NO | - | Version identifier after the change |
| `asset_id` | text | NO | - | Asset identifier related to the news item |
| `hook` | text | YES | - | Webhook or trigger identifier |
| `description` | text | YES | - | Description of the news or change |
| `created_at` | timestamp with time zone | NO | now() | Record creation timestamp |
| `updated_at` | timestamp with time zone | NO | now() | Last update timestamp |

### Key Features

- **Change Tracking**: Links version changes with specific news events
- **Asset Management**: Associates news items with specific assets
- **Webhook Integration**: Optional hook field for external integrations
- **Version History**: Tracks before/after states for each news item
- **Company Association**: Links news to specific company slugs
- **Timestamping**: Automatic creation and update timestamps

### Usage Patterns

- **Version Change Notifications**: Track when significant changes occur between versions
- **Asset Updates**: Monitor changes to specific assets or resources
- **External Integration**: Use hooks for triggering external systems
- **Historical Timeline**: Create chronological view of company changes
- **Change Attribution**: Link specific changes to news events or announcements

### Data Integrity Notes

- **Version Format**: Versions should follow consistent format (e.g., YYYYMMDD)
- **Asset References**: Asset IDs should correspond to actual assets in the system
- **Hook Validation**: Hook field can be used for webhook URLs or trigger identifiers
- **Page Relationships**: page_id should reference valid pages in related tables

### Relationships

- **Pages**: `page_id` likely references a pages table
- **Assets**: `asset_id` references assets or media files
- **Companies**: `slug` links to company/app identifiers

### Common Queries

```sql
-- Get all news for a specific company
SELECT * FROM app_news
WHERE slug = 'company-slug'
ORDER BY created_at DESC;

-- Find version changes with descriptions
SELECT slug, v_before, v_after, description, created_at
FROM app_news
WHERE description IS NOT NULL
ORDER BY created_at DESC;

-- Get news items with hooks (external integrations)
SELECT * FROM app_news
WHERE hook IS NOT NULL;

-- Track version progression for a company
SELECT slug, v_before, v_after, created_at
FROM app_news
WHERE slug = 'company-slug'
ORDER BY created_at ASC;
```

### Example Use Cases

- **Release Notifications**: Track when companies announce pricing changes
- **Asset Updates**: Monitor when companies update their pricing page assets
- **Integration Triggers**: Use hooks to notify external systems of changes
- **Audit Trail**: Maintain a record of all significant events and changes
- **Timeline Generation**: Create chronological views of company evolution