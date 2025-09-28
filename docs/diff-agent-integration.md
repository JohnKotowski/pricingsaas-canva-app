# Diff-Agent Integration with Run-Diff Command

This document explains how the `diff-agent` has been integrated into the `run-diff` command workflow to provide structured, automated pricing analysis.

## Overview

The integration replaces manual markdown parsing and comparison with an intelligent agent that:
- Automatically locates and reads pricing page markdown files
- Performs comprehensive analysis of plans, pricing, features, and strategic changes
- Returns structured JSON output that integrates seamlessly with the database storage workflow

## Integration Points

### 1. Command Usage
The run-diff command now uses the diff-agent in **Phase 3: Analysis Process**:

```bash
# Both modes now leverage diff-agent
claude "run-diff slack"              # Latest mode: verified vs current quarter
claude "run-diff slack 2025Q3"       # Quarter mode: 2025Q3 vs 2025Q2
```

### 2. Agent Invocation
The command uses Claude's Task tool to launch the diff-agent:

```javascript
// Claude executes internally:
Task({
  subagent_type: "diff-agent",
  prompt: `Compare pricing changes for ${company_slug} between version ${v1_version} and version ${v2_version}.
           The files are located at /Users/johnkotowski/.../data/${company_slug}/${v1_version}-full-markdown.md
           and ${v2_version}-full-markdown.md. Return structured JSON analysis.`
})
```

### 3. JSON Output Structure
The diff-agent returns comprehensive structured data:

```json
{
  "comparison_metadata": {
    "company_slug": "slack",
    "v1_version": "20250401",
    "v2_version": "20250706",
    "analysis_date": "2025-09-15T...",
    "files_compared": {...}
  },
  "summary": {
    "changed": true,
    "main_change": "Business+ plan increased 20%...",
    "key_changes": ["...", "...", "..."],
    "impact_level": "high",
    "change_categories": ["price_change", "plan_change"]
  },
  "detailed_changes": {
    "price_changes": [...],
    "plan_changes": [...],
    "feature_changes": [...],
    "metric_changes": [...],
    "discount_changes": [...]
  },
  "strategic_analysis": {
    "market_direction": "upmarket",
    "pricing_aggressiveness": "more_aggressive",
    "customer_impact": [...],
    "competitive_positioning": "...",
    "business_implications": [...]
  },
  "validation": {
    "extraction_confidence": "high",
    "ambiguous_sections": [...],
    "notes": "..."
  }
}
```

## Workflow Benefits

### Before Integration
- Manual parsing of markdown files
- Inconsistent change detection
- Time-consuming validation steps
- Limited strategic analysis
- Error-prone JSON generation

### After Integration
- ✅ **Automated Analysis**: Agent handles all parsing and comparison
- ✅ **Structured Output**: Consistent JSON format for all companies
- ✅ **Strategic Insights**: Built-in business impact analysis
- ✅ **Confidence Scoring**: Validation metadata for quality assurance
- ✅ **Database Ready**: Direct integration with Supabase storage

## Database Storage Integration

The diff-agent output maps directly to database fields:

```sql
-- app_diffs table
INSERT INTO app_diffs (
  slug,
  changed,                    -- from summary.changed
  v1_version,                 -- from comparison_metadata.v1_version
  v2_version,                 -- from comparison_metadata.v2_version
  summary,                    -- entire diff-agent JSON response
  changes,                    -- transformed detailed_changes
  analysis_confidence,        -- from validation.extraction_confidence
  strategic_analysis          -- from strategic_analysis section
) VALUES (...);
```

## Example Usage

Run the example script to see the integration in action:

```bash
node scripts/diff-agent-example.js slack 20250401 20250706
```

This demonstrates:
- How Claude would invoke the diff-agent
- Expected JSON structure
- Database storage mapping
- Benefits over manual processing

## Key Improvements

### 1. **Accuracy**
- Agent specializes in pricing analysis
- Comprehensive extraction of all pricing elements
- Built-in validation and confidence scoring

### 2. **Consistency**
- Standardized JSON output format
- Consistent categorization of changes
- Reproducible analysis across all companies

### 3. **Efficiency**
- Single agent call replaces multiple manual steps
- No need for custom parsing logic per company
- Reduced validation requirements

### 4. **Strategic Value**
- Business impact analysis included
- Market positioning insights
- Competitive intelligence

## Next Steps

1. **Test with Real Data**: Run the integrated workflow on actual company data
2. **Validate Output**: Ensure diff-agent JSON structure matches database expectations
3. **Performance Monitoring**: Track analysis confidence scores and accuracy
4. **Continuous Improvement**: Refine agent prompts based on real-world usage

The integration represents a significant advancement in automated pricing analysis, providing both technical efficiency and strategic business insights.