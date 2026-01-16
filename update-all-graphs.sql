-- SQL Script to update all graph elements to use working Chart.js format
-- Run this in the Supabase SQL Editor

DO $$
DECLARE
  report_id uuid := '724b15a8-9898-4780-9e59-ebd10235f017';
  updated_elements jsonb;
BEGIN
  -- Get current elements and transform all graph types to working format
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'type' = 'graph' THEN
        jsonb_build_object(
          'id', elem->>'id',
          'type', 'graph',
          'content', json_build_object(
            'config', json_build_object(
              'type', 'bar',
              'title', 'Pricing Model Distribution',
              'labels', json_build_array('Freemium', 'Free Trial', 'Enterprise', 'No Public Pricing'),
              'datasets', json_build_array(
                json_build_object(
                  'label', 'Number of Companies',
                  'data', json_build_array(156, 243, 89, 67),
                  'backgroundColor', json_build_array('#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'),
                  'borderColor', json_build_array('#2563eb', '#7c3aed', '#db2777', '#d97706'),
                  'borderWidth', 2
                )
              ),
              'width', 800,
              'height', 500
            )
          )::text
        )
      ELSE
        elem
    END
  ) INTO updated_elements
  FROM app_saved_reports r
  CROSS JOIN LATERAL jsonb_array_elements(r.elements) AS elem
  WHERE r.id = report_id;

  -- Update the report with transformed elements
  UPDATE app_saved_reports
  SET
    elements = updated_elements,
    updated_at = now()
  WHERE id = report_id;

  RAISE NOTICE 'Updated all graph elements in report %', report_id;
END $$;

-- Verify the update
SELECT
  id,
  name,
  jsonb_array_length(elements) as total_elements,
  (SELECT COUNT(*)
   FROM jsonb_array_elements(elements) elem
   WHERE elem->>'type' = 'graph') as graph_count
FROM app_saved_reports
WHERE id = '724b15a8-9898-4780-9e59-ebd10235f017';
