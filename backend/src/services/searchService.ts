import dotenv from 'dotenv';
import { saveSearchResults, pool } from '../config/db';

dotenv.config();

export interface SearchItem {
  title: string;
  url: string;
  snippet: string;
  thumbnail?: string;
  publishedAt?: string;
}

export interface SearchResponse {
  web: SearchItem[];
  youtube: SearchItem[];
  pdf: SearchItem[];
  missingKeys: string[];
  dbConnected: boolean;
  savedCount: {
    web: number;
    youtube: number;
    pdf: number;
  };
}

export async function executeSearch(query: string): Promise<SearchResponse> {
  const tavilyApiKey = process.env.TAVILY_API_KEY || '';
  const youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  const databaseUrl = process.env.DATABASE_URL || '';

  const missingKeys: string[] = [];
  if (!tavilyApiKey) missingKeys.push('TAVILY_API_KEY');
  if (!youtubeApiKey) missingKeys.push('YOUTUBE_API_KEY');
  if (!databaseUrl) missingKeys.push('DATABASE_URL (Supabase Connection String)');

  const response: SearchResponse = {
    web: [],
    youtube: [],
    pdf: [],
    missingKeys: Array.from(new Set(missingKeys)),
    dbConnected: !!pool,
    savedCount: { web: 0, youtube: 0, pdf: 0 }
  };

  if (!query || !query.trim()) {
    return response;
  }

  // 1. Tavily Web Search (Top 3)
  if (tavilyApiKey) {
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: query,
          search_depth: 'basic',
          max_results: 3,
          include_answer: false
        })
      });

      if (tavilyRes.ok) {
        const tavilyData: any = await tavilyRes.json();
        if (tavilyData.results && Array.isArray(tavilyData.results)) {
          response.web = tavilyData.results.slice(0, 3).map((item: any) => ({
            title: item.title || '',
            url: item.url || '',
            snippet: item.content || item.snippet || 'Không có mô tả.'
          }));
        }
      } else {
        const errJson: any = await tavilyRes.json().catch(() => null);
        console.error('Tavily Web Search API error:', errJson);
        if (errJson?.detail) {
          response.missingKeys.push(`Tavily Web Search Error: ${JSON.stringify(errJson.detail)}`);
        }
      }
    } catch (err) {
      console.error('Fetch error Tavily Web Search:', err);
    }
  }

  // 2. Tavily PDF Document Search (filetype:pdf) (Top 3)
  if (tavilyApiKey) {
    try {
      const tavilyPdfRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: `${query} filetype:pdf`,
          search_depth: 'basic',
          max_results: 3,
          include_answer: false
        })
      });

      if (tavilyPdfRes.ok) {
        const tavilyPdfData: any = await tavilyPdfRes.json();
        if (tavilyPdfData.results && Array.isArray(tavilyPdfData.results)) {
          response.pdf = tavilyPdfData.results.slice(0, 3).map((item: any) => ({
            title: item.title || '',
            url: item.url || '',
            snippet: item.content || item.snippet || 'Tài liệu PDF.'
          }));
        }
      } else {
        const errJson: any = await tavilyPdfRes.json().catch(() => null);
        console.error('Tavily PDF Search API error:', errJson);
      }
    } catch (err) {
      console.error('Fetch error Tavily PDF Search:', err);
    }
  }

  // 3. YouTube Data API v3 Search (Top 3)
  if (youtubeApiKey) {
    try {
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${youtubeApiKey}`;
      const ytRes = await fetch(ytUrl);
      if (ytRes.ok) {
        const ytData: any = await ytRes.json();
        if (ytData.items && Array.isArray(ytData.items)) {
          response.youtube = ytData.items.slice(0, 3).map((item: any) => ({
            title: item.snippet?.title || '',
            url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
            snippet: item.snippet?.description || 'Không có mô tả video.',
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
            publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt).toLocaleDateString('vi-VN') : undefined
          }));
        }
      } else {
        const errJson: any = await ytRes.json().catch(() => null);
        console.error('YouTube API error:', errJson);
      }
    } catch (err) {
      console.error('Fetch error YouTube Search:', err);
    }
  }

  // 4. Save fetched results into Supabase PostgreSQL
  if (pool) {
    try {
      if (response.web.length > 0) {
        response.savedCount.web = await saveSearchResults(query, 'web', response.web);
      }
      if (response.youtube.length > 0) {
        response.savedCount.youtube = await saveSearchResults(query, 'youtube', response.youtube);
      }
      if (response.pdf.length > 0) {
        response.savedCount.pdf = await saveSearchResults(query, 'pdf', response.pdf);
      }
    } catch (dbErr) {
      console.error('Supabase DB saving error:', dbErr);
    }
  }

  return response;
}
