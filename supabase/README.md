# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Canva app.

## Setup

1. Install the Supabase CLI:
   ```bash
   npm install -g @supabase/cli
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

## Deployment

Deploy the canva-get-images function:
```bash
supabase functions deploy canva-get-images
```

## Database Setup

Create the images table in your Supabase database:

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  content_type TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Environment Variables

The Edge Function requires these environment variables in your Supabase project:
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access (automatically available)
- `SUPABASE_URL` - Your Supabase project URL (automatically available)

## Function Endpoint

Once deployed, the function will be available at:
`https://your-project-ref.supabase.co/functions/v1/canva-get-images`