import { Pool } from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Force Node.js to prefer IPv4 over IPv6 to prevent Supabase ETIMEDOUT on IPv6 addresses
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000, // 5 seconds connection timeout
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected Supabase PostgreSQL Pool error:', err.message);
  });
}

export async function initDb() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS search_results (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        source_type VARCHAR(20) NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        snippet TEXT,
        thumbnail TEXT,
        published_at VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add country column if not exists
    await client.query(`
      ALTER TABLE search_results ADD COLUMN IF NOT EXISTS country VARCHAR(10);
    `);

    client.release();
    console.log('Supabase PostgreSQL table `search_results` verified successfully with country column.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

export async function saveSearchResults(
  query: string, 
  sourceType: 'web' | 'youtube' | 'pdf', 
  items: any[], 
  country?: string
) {
  if (!pool || !items || items.length === 0) return 0;

  try {
    const client = await pool.connect();
    let savedCount = 0;

    for (const item of items) {
      await client.query(
        `INSERT INTO search_results (query, source_type, title, url, snippet, thumbnail, published_at, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          query,
          sourceType,
          item.title || '',
          item.url || '',
          item.snippet || '',
          item.thumbnail || null,
          item.publishedAt || null,
          country || null
        ]
      );
      savedCount++;
    }

    client.release();
    return savedCount;
  } catch (err) {
    console.error(`Error saving ${sourceType} results to Supabase DB:`, err);
    return 0;
  }
}

