-- Table for saving search results from Google Web, YouTube, and PDF searches into Supabase PostgreSQL
CREATE TABLE IF NOT EXISTS search_results (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  source_type VARCHAR(20) NOT NULL, -- 'web', 'youtube', 'pdf'
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  snippet TEXT,
  thumbnail TEXT,
  published_at VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
