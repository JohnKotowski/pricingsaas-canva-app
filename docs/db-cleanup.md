app_diffs (good for tracking what has been run)
-- needs page_id
-- add constraints (only one quarterly analysis)
-- add enums for comparision
app_assets
-- needs cleanup
app_news 
-- add company_id
-- needs migration


===========

1. Make sure app-diffs are clean; 
2. Create new app_news page with contraints
3. Write script to migrate existing news2 
4. Write script to identify missings news from app_diffs


============

app_events
- page_id
- slug
- v_before 
- v_after 
- event_type 
- decription
- asset_id
- verified 

---

app_news

- pulls all events for slug/versions
- description / hook
- published
- verified
- page_id
- v_before
- v_after





Migratoin?
news2 
-> verified or asset with cropped id 
=> keep hook description
=> 




