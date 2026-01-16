-- SQL Script to add a sample graph element to a report
-- Run this in the Supabase SQL Editor or using: psql connection_string < add-sample-graph.sql

-- Add a sample graph element to the "2026 Q1 Trends Report"
DO $$
DECLARE
  report_id uuid := '724b15a8-9898-4780-9e59-ebd10235f017';
  graph_element jsonb;
BEGIN
  -- Build the graph element with a bar chart showing pricing model distribution
  graph_element := jsonb_build_object(
    'id', gen_random_uuid()::text,
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
  );

  -- Add it to the report's elements array
  UPDATE app_saved_reports
  SET
    elements = elements || jsonb_build_array(graph_element),
    updated_at = now()
  WHERE id = report_id;

  RAISE NOTICE 'Added graph element to report %', report_id;
END $$;

-- Verify it was added
SELECT id, name, jsonb_array_length(elements) as element_count
FROM app_saved_reports
WHERE id = '724b15a8-9898-4780-9e59-ebd10235f017';
