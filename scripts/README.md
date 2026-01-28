# Database Scripts

This folder contains SQL scripts for setting up and migrating the URL Lens database in Supabase.

## Initial Setup

For new installations, run the main setup script:

```sql
-- Run: setup-database.sql
```

This creates all tables, indexes, and RLS policies needed for the application.

## Migrations

Run these scripts in order if you're upgrading an existing installation:

### 1. Guest Analysis Support
**File:** `migration-guest-analysis.sql`
**Added:** Guest analysis feature

### 2. SEO Analysis Column
**File:** `migration-seo-analysis.sql`
**Added:** `seo_analysis` JSONB column for storing SEO/AEO/GEO/LLMO analysis data

**Quick command:**
```sql
ALTER TABLE url_analyses ADD COLUMN IF NOT EXISTS seo_analysis JSONB;
```

## Database Schema

### `url_analyses` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References auth.users (nullable for guests) |
| `url` | TEXT | Original URL analyzed |
| `final_url` | TEXT | Final URL after redirects |
| `status_code` | INTEGER | HTTP status code |
| `redirect_count` | INTEGER | Number of redirects |
| `redirects` | JSONB | Array of redirect details |
| `response_time_ms` | INTEGER | Response time in milliseconds |
| `content_type` | TEXT | Content-Type header value |
| `js_required` | BOOLEAN | Whether JavaScript is required |
| `bot_protections` | JSONB | Detected bot protections |
| `headers` | JSONB | HTTP response headers |
| `robots_txt` | JSONB | robots.txt analysis |
| `rate_limit_info` | JSONB | Rate limiting detection |
| `utm_analysis` | JSONB | UTM parameter tracking |
| `visual_analysis` | JSONB | Screenshot/visual analysis |
| `seo_analysis` | JSONB | SEO/AEO/GEO/LLMO scores |
| `share_id` | TEXT | Unique share identifier |
| `score` | INTEGER | Scrapability score (0-100) |
| `recommendation` | TEXT | Scraping recommendation |
| `is_guest` | BOOLEAN | Guest analysis flag |
| `analyzed_at` | TIMESTAMPTZ | When analysis was performed |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

## Environment Variables

Make sure these are set in Vercel/your deployment:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### "column does not exist" error
Run the appropriate migration script for the missing column.

### RLS policy errors
Make sure the user is authenticated and the `user_id` matches.

### Share link not working
Verify the `share_id` column exists and has a unique index.
