# URL Lens

A modern web application for analyzing URL scrapability. Detect bot protections, JavaScript requirements, and get actionable scraping recommendations.

## Features

- **Scrapability Score**: Get a 0-100 score indicating how easy a URL is to scrape
- **Bot Protection Detection**: Identify Cloudflare, reCAPTCHA, DataDome, Akamai, and more
- **JavaScript Detection**: Know if a page requires JavaScript rendering
- **Redirect Tracking**: See the full redirect chain
- **Analysis History**: Track all your analyses with re-run capability
- **Rate Limiting**: Built-in protection against API abuse

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Material-UI (MUI) v7
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase account (free at [supabase.com](https://supabase.com))

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run:

```sql
CREATE TABLE url_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  final_url TEXT NOT NULL,
  status INTEGER NOT NULL,
  redirects JSONB DEFAULT '[]'::jsonb,
  js_hints BOOLEAN DEFAULT false,
  bot_protections JSONB DEFAULT '[]'::jsonb,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  recommendation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_url_analysis_user_id ON url_analysis(user_id);
CREATE INDEX idx_url_analysis_created_at ON url_analysis(created_at DESC);

ALTER TABLE url_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis"
  ON url_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis"
  ON url_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis"
  ON url_analysis FOR DELETE
  USING (auth.uid() = user_id);
```

3. Get your API credentials from Settings > API

### 3. Configure Environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── analyze/       # POST /api/analyze
│   │   │   └── history/       # GET/DELETE /api/history
│   │   ├── dashboard/         # Dashboard page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── AuthForm.tsx
│   │   ├── Header.tsx
│   │   ├── HistoryTable.tsx
│   │   ├── ResultDisplay.tsx
│   │   ├── ThemeRegistry.tsx
│   │   └── URLInput.tsx
│   ├── lib/                   # Business logic
│   │   ├── supabase/          # Supabase clients
│   │   ├── rateLimit.ts       # Rate limiting
│   │   ├── scoringEngine.ts   # Scrapability scoring
│   │   └── urlAnalyzer.ts     # URL analysis
│   ├── types/                 # TypeScript types
│   └── middleware.ts          # Auth middleware
├── __tests__/                 # Test files
├── .env.example              # Example environment
└── package.json
```

## API Endpoints

### POST /api/analyze

Analyze a URL for scrapability.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://example.com",
    "final_url": "https://example.com",
    "status": 200,
    "redirects": [],
    "js_hints": false,
    "bot_protections": [],
    "score": 92,
    "recommendation": "Excellent scrapability!...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/history

Get user's analysis history.

**Query Parameters:**
- `limit` (optional): Number of records (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

### DELETE /api/history/[id]

Delete a specific analysis record.

## Rate Limiting

- 10 requests per minute per user
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Scoring Algorithm

The scrapability score (0-100) is calculated based on:

| Factor | Penalty |
|--------|---------|
| HTTP status codes | 0-60 points |
| Redirects | Up to 15 points |
| JavaScript requirement | 15 points |
| Bot protections | Up to 50 points |

### Score Ranges

- **85-100**: Excellent - Easy to scrape
- **70-84**: Good - Standard tools work
- **50-69**: Moderate - May need headless browser
- **30-49**: Difficult - Requires stealth techniques
- **0-29**: Very Difficult - Heavy anti-bot measures

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build the production bundle:

```bash
npm run build
npm run start
```

## License

MIT
