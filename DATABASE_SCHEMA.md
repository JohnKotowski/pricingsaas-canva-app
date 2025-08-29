# Database Schema Documentation

**Generated:** 2025-08-29T11:54:24.016Z
**Database:** https://qulnbyjrczvoxemtrili.supabase.co

## Summary

- **Total Tables:** 6
- **Total Columns:** 31
- **Accessible Tables:** profiles, tags, app_collections, app_assets, projects, settings

## Tables

### profiles

**Record Count:** 0

---

### tags

**Record Count:** 13

**Columns:**

| Column | Type | Sample Value |
|--------|------|-------------|
| id | uuid | "4929586b-a9e5-4ffa-a4b4-a170b7c99775" |
| name | text | "AI-Tool" |
| description | text | "The company builds tools or infrastructure specifi" |
| keywords | text | "["LLM orchestration","data pipeline","prompt engin" |
| created_at | timestamp | "2025-04-12T15:53:22.896795+00:00" |

**Sample Data:**

```json
{
  "id": "4929586b-a9e5-4ffa-a4b4-a170b7c99775",
  "name": "AI-Tool",
  "description": "The company builds tools or infrastructure specifically for AI development, deployment, or optimization. These are enablers of AI use cases — including frameworks, data pipelines, model management, or utilities tailored for working with or building on top of AI models.",
  "keywords": "[\"LLM orchestration\",\"data pipeline\",\"prompt engineering\",\"vector databases\",\"AI observability\",\"scraper tools for LLMs\",\"model evaluation\",\"AI devtools\",\"fine-tuning platforms\"]",
  "created_at": "2025-04-12T15:53:22.896795+00:00"
}
```

---

### app_collections

**Record Count:** 1

**Columns:**

| Column | Type | Sample Value |
|--------|------|-------------|
| id | uuid | "8a9d04a3-f604-400b-ae77-97f21e21a827" |
| owner | uuid | "caa1c553-6bfc-4770-9f81-dbf7e7a6b0ab" |
| name | text | "The License + Credits Hybrid" |
| description | text | "Collection of companies that do both credit and li" |
| created_at | timestamp | "2025-08-27T14:19:09.255989+00:00" |
| updated_at | timestamp | "2025-08-27T21:21:45.09115+00:00" |
| canva_url | nullable | null |
| canva_folder_name | text | "AI Add-ons - Pricing Assets" |
| canva_folder_url | url | "https://www.canva.com/folder/FAFxRtk8E4E" |
| canva_folder_id | text | "FAFxRtk8E4E" |
| canva_design_id | text | "DAGxM_Vlous" |
| canva_design_title | text | "Copy of TEMPLATE Swipe File (1080 x 1080 px)" |
| canva_design_thumbnail | url | "https://document-export.canva.com/Vlous/DAGxM_Vlou" |
| canva_design_view_url | url | "https://www.canva.com/api/design/eyJhbGciOiJkaXIiL" |
| canva_design_edit_url | url | "https://www.canva.com/api/design/eyJhbGciOiJkaXIiL" |
| canva_design_details | nullable | null |
| canva_website_pdf_url | url | "https://qulnbyjrczvoxemtrili.supabase.co/storage/v" |
| pdf_last_exported_at | timestamp | "2025-08-27T17:46:44.87+00:00" |
| pdf_export_settings | json | {"format":"pdf","quality":"high","filename":"desig |
| canva_design_status | text | "published" |
| published_at | timestamp | "2025-08-27T21:21:44.771+00:00" |
| last_modified_at | timestamp | "2025-08-27T17:46:44.87+00:00" |
| canva_design_public_url | url | "https://www.canva.com/design/DAGxLOSl3iI/CGvOkYeoD" |
| website_slug | text | "license-credit-swipefile" |

**Sample Data:**

```json
{
  "id": "8a9d04a3-f604-400b-ae77-97f21e21a827",
  "owner": "caa1c553-6bfc-4770-9f81-dbf7e7a6b0ab",
  "name": "The License + Credits Hybrid",
  "description": "Collection of companies that do both credit and license based pricing.",
  "created_at": "2025-08-27T14:19:09.255989+00:00",
  "updated_at": "2025-08-27T21:21:45.09115+00:00",
  "canva_url": null,
  "canva_folder_name": "AI Add-ons - Pricing Assets",
  "canva_folder_url": "https://www.canva.com/folder/FAFxRtk8E4E",
  "canva_folder_id": "FAFxRtk8E4E",
  "canva_design_id": "DAGxM_Vlous",
  "canva_design_title": "Copy of TEMPLATE Swipe File (1080 x 1080 px)",
  "canva_design_thumbnail": "https://document-export.canva.com/Vlous/DAGxM_Vlous/2/thumbnail/0001.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUHWEOTUD6Q%2F20250827%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250827T063421Z&X-Amz-Expires=44261&X-Amz-Signature=9eac31f1eada7e183733400a3636462793f446f24cce24fb594267c70a036724&X-Amz-SignedHeaders=host&response-expires=Wed%2C%2027%20Aug%202025%2018%3A52%3A02%20GMT",
  "canva_design_view_url": "https://www.canva.com/api/design/eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwiZXhwaXJ5IjoxNzU4OTA3MzU5OTgyfQ..k7qGjkA5DNQlxfIw.mMKD9sNxA5fxqBg7u0Eoj_htT6Ahjl39hwnSVQD2fBbmO5isqz_jfwf4SrEe1TzIIRPnSZKXgwvThkGOyrJt9U-YtyROjBCWO9hGeuxydS2azBk.3DFV2M53quaZcofE4YDxbA/view?utm_source=OC-AZjjFheiavGM&utm_medium=referral&utm_term=d93bc871-4af7-4785-bb4a-b81940d35e4d&utm_campaign=public_api_list_design_clicked_hyperlink",
  "canva_design_edit_url": "https://www.canva.com/api/design/eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwiZXhwaXJ5IjoxNzU4OTA3MzU5OTgyfQ..k7qGjkA5DNQlxfIw.mMKD9sNxA5fxqBg7u0Eoj_htT6Ahjl39hwnSVQD2fBbmO5isqz_jfwf4SrEe1TzIIRPnSZKXgwvThkGOyrJt9U-YtyROjBCWO9hGeuxydS2azBk.3DFV2M53quaZcofE4YDxbA/edit?utm_source=OC-AZjjFheiavGM&utm_medium=referral&utm_term=80512bef-0afa-4d84-9bd0-f2353c05f4e5&utm_campaign=public_api_list_design_clicked_hyperlink",
  "canva_design_details": null,
  "canva_website_pdf_url": "https://qulnbyjrczvoxemtrili.supabase.co/storage/v1/object/public/reports/design-DAGxM_Vlous-2025-08-27T17-46-43-189Z.pdf",
  "pdf_last_exported_at": "2025-08-27T17:46:44.87+00:00",
  "pdf_export_settings": {
    "format": "pdf",
    "quality": "high",
    "filename": "design-DAGxM_Vlous-2025-08-27T17-46-43-189Z.pdf",
    "exported_at": "2025-08-27T17:46:44.870Z"
  },
  "canva_design_status": "published",
  "published_at": "2025-08-27T21:21:44.771+00:00",
  "last_modified_at": "2025-08-27T17:46:44.87+00:00",
  "canva_design_public_url": "https://www.canva.com/design/DAGxLOSl3iI/CGvOkYeoD2puy8ERZqc0Ew/view?utm_content=DAGxLOSl3iI&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hd1d53353de",
  "website_slug": "license-credit-swipefile"
}
```

---

### app_assets

**Record Count:** 0

---

### projects

**Record Count:** 0

---

### settings

**Record Count:** 1

**Columns:**

| Column | Type | Sample Value |
|--------|------|-------------|
| key | text | "discourse_last_indexed" |
| value | timestamp | "2025-08-28T18:45:46.227Z" |

**Sample Data:**

```json
{
  "key": "discourse_last_indexed",
  "value": "2025-08-28T18:45:46.227Z"
}
```

---

