import dotenv from 'dotenv';
import { saveSearchResults, pool } from '../config/db';
import { classifyDomain, DOMAINS, DomainInfo } from './domainClassifier';
import { translateText } from './translatorService';
import { generateRagAnswer, RagAnswer } from './ragService';

dotenv.config();

export interface SearchItem {
  title: string;
  url: string;
  snippet: string;
  translatedTitle?: string;
  translatedSnippet?: string;
  thumbnail?: string;
  publishedAt?: string;
}

export interface SearchResponse {
  detectedField?: DomainInfo;
  compareMode: boolean;
  ragAnswer?: RagAnswer;
  country1?: {
    code: string;
    name: string;
    web: SearchItem[];
    youtube: SearchItem[];
    pdf: SearchItem[];
  };
  country2?: {
    code: string;
    name: string;
    web: SearchItem[];
    youtube: SearchItem[];
    pdf: SearchItem[];
  };
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

function getLanguageForCountry(country: string): string {
  const code = country.toLowerCase();
  if (code === 'us') return 'en';
  if (code === 'cn') return 'zh-Hans';
  if (code === 'ru') return 'ru';
  return 'vi';
}

function getTranslationLanguage(country: string): string {
  const code = country.toLowerCase();
  if (code === 'us') return 'en';
  if (code === 'cn') return 'zh-CN'; // Google Translate uses zh-CN
  if (code === 'ru') return 'ru';
  return 'vi';
}

function getFullCountryName(code: string): string {
  const lower = code.toLowerCase();
  if (lower === 'us') return 'United States';
  if (lower === 'cn') return 'China';
  if (lower === 'ru') return 'Russia';
  if (lower === 'vn') return 'Vietnam';
  return 'United States'; // Fallback
}

async function translateItem(item: SearchItem, sourceLang: string): Promise<SearchItem> {
  if (sourceLang === 'vi') {
    return {
      ...item,
      translatedTitle: item.title,
      translatedSnippet: item.snippet
    };
  }

  try {
    const [translatedTitle, translatedSnippet] = await Promise.all([
      translateText(item.title, 'vi', sourceLang),
      translateText(item.snippet, 'vi', sourceLang)
    ]);
    return {
      ...item,
      translatedTitle,
      translatedSnippet
    };
  } catch (err) {
    console.error('[Translator] Error translating search item back to VI:', err);
    return {
      ...item,
      translatedTitle: item.title,
      translatedSnippet: item.snippet
    };
  }
}

async function optimizeQueryWithGemini(query: string, targetCountry: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  if (!geminiApiKey) return query;

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`;
    const targetLang = targetCountry === 'us' ? 'tiếng Anh' : targetCountry === 'cn' ? 'tiếng Trung giản thể' : targetCountry === 'ru' ? 'tiếng Nga' : 'tiếng Việt';

    const prompt = `Bạn là trợ lý tối ưu hóa truy vấn tìm kiếm chuyên nghiệp.
Nhiệm vụ:
1. Đọc câu truy vấn (có thể viết bằng tiếng Việt không dấu hoặc có dấu): "${query}"
2. Tự khôi phục dấu tiếng Việt chính xác nếu viết không dấu.
3. Chuyển đổi và trích xuất thành 3-5 từ khóa tìm kiếm cốt lõi nhất (search keywords) bằng ${targetLang} thích hợp cho các công cụ như Google/Tavily. Không bao gồm các từ thừa như "hãy tìm", "làm thế nào", "là gì".

Ví dụ:
- "vu khi sieu thanh" (mục tiêu: tiếng Anh) -> "hypersonic weapons technology development"
- "chung khoan va lam phat" (mục tiêu: tiếng Trung) -> "股市 通货膨胀 关联"
- "DeepSeek định hướng tương lai" (mục tiêu: tiếng Trung) -> "DeepSeek 发展战略 未来规划"

Chỉ trả về chuỗi từ khóa tìm kiếm đã tối ưu hóa, không có giải thích, không có dấu ngoặc kép.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 60 }
      })
    });

    if (response.ok) {
      const resData: any = await response.json();
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        let optimized = text.trim().replace(/^[`"'\s()]+|[`"'\s()]+$/g, '').trim();
        // Remove any markdown block syntax if present
        optimized = optimized.replace(/^```[a-z]*\s*/i, '').replace(/```$/, '').trim();
        if (optimized && optimized.length >= 3) {
          console.log(`[Optimizer] Gemini optimized query: "${query}" -> "${optimized}" (${targetLang})`);
          return optimized;
        }
      }
    }
  } catch (err) {
    console.error('[Optimizer] Gemini query optimization failed:', err);
  }
  return query;
}

const PAYWALL_PATTERNS = [
  'subscribe to read',
  'sign in to access',
  'cookie policy',
  'javascript is required',
  'enable javascript',
  '404 not found',
  'access denied',
  'page not found'
];

/**
 * Filter out paywall garbage, duplicate domains (max 2 per domain), and empty snippets.
 */
function sanitizeAndDeduplicateResults(items: SearchItem[]): SearchItem[] {
  const domainCounts = new Map<string, number>();
  const seenUrls = new Set<string>();
  const filtered: SearchItem[] = [];

  for (const item of items) {
    if (!item.url || seenUrls.has(item.url)) continue;

    // Snippet quality check
    const snippetLower = (item.snippet || '').toLowerCase();
    if (snippetLower.length < 20) continue;

    // Paywall check
    const isPaywalled = PAYWALL_PATTERNS.some(p => snippetLower.includes(p));
    if (isPaywalled) continue;

    // Domain limit (max 2 per domain)
    try {
      const domain = new URL(item.url).hostname.replace(/^www\./, '');
      const currentCount = domainCounts.get(domain) || 0;
      if (currentCount >= 2) continue;
      domainCounts.set(domain, currentCount + 1);
    } catch {
      // Ignore URL parse errors
    }

    seenUrls.add(item.url);
    filtered.push(item);
  }

  return filtered;
}

/**
 * Calculate relevance score for each item based on title/snippet keyword matching and domain authority.
 * Sorts items in descending order of relevance score.
 */
function rankAndScoreResults(items: SearchItem[], rawQuery: string, searchPayloadQuery: string): SearchItem[] {
  if (!items || items.length === 0) return [];
  const queryTokens = Array.from(new Set([
    ...rawQuery.toLowerCase().split(/\s+/),
    ...searchPayloadQuery.toLowerCase().split(/\s+/)
  ])).filter(t => t.length > 2);

  const scored = items.map(item => {
    let score = 0;
    const titleLower = (item.title || '').toLowerCase();
    const snippetLower = (item.snippet || '').toLowerCase();
    const transTitleLower = (item.translatedTitle || '').toLowerCase();
    const transSnippetLower = (item.translatedSnippet || '').toLowerCase();

    queryTokens.forEach(token => {
      if (titleLower.includes(token) || transTitleLower.includes(token)) score += 10;
      if (snippetLower.includes(token) || transSnippetLower.includes(token)) score += 3;
    });

    if (snippetLower.length > 100) score += 5;
    if (snippetLower.length > 250) score += 5;

    const urlLower = (item.url || '').toLowerCase();
    if (urlLower.includes('reuters.com') || urlLower.includes('bloomberg.com') || urlLower.includes('xinhuanet.com') || urlLower.includes('tass.com') || urlLower.includes('apnews.com') || urlLower.includes('bbc.com') || urlLower.includes('defense.gov') || urlLower.includes('scmp.com')) {
      score += 15;
    }

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}

const ACCENT_DICTIONARY: Record<string, string> = {
  'vu khi sieu thanh': 'vũ khí siêu thanh',
  'vu khi': 'vũ khí',
  'sieu thanh': 'siêu thanh',
  'chien tranh nga ukraine hien tai': 'chiến tranh nga ukraine hiện tại',
  'chien tranh nga ukraine': 'chiến tranh nga ukraine',
  'chien tranh': 'chiến tranh',
  'hien tai': 'hiện tại',
  'chung khoan va lam phat': 'chứng khoán và lạm phát',
  'chung khoan': 'chứng khoán',
  'lam phat': 'lạm phát',
  'ban dan': 'bán dẫn',
  'cuoc chien': 'cuộc chiến',
  'dinh huong tuong lai': 'định hướng tương lai',
  'trung quoc': 'trung quốc',
  'hoa ky': 'hoa kỳ',
  'an ninh mang': 'an ninh mạng',
  'kinh te': 'kinh tế',
  'tai chinh': 'tài chính',
  'quan su': 'quân sự',
  'quoc phong': 'quốc phòng',
  'dia chinh tri': 'địa chính trị',
  'ngoai giao': 'ngoại giao',
  'nang luong': 'năng lượng',
  'tai nguyen': 'tài nguyên',
  'chuoi cung ung': 'chuỗi cung ứng',
  'van hoa': 'văn hóa',
  'khong gian': 'không gian'
};

const DIRECT_ENGLISH_MAPPING: Record<string, string> = {
  'vu khi sieu thanh': 'hypersonic weapons technology',
  'vũ khí siêu thanh': 'hypersonic weapons technology',
  'chien tranh nga ukraine hien tai': 'russia ukraine war current status',
  'chiến tranh nga ukraine hiện tại': 'russia ukraine war current status',
  'cuoc chien chip ban dan': 'semiconductor chip war',
  'cuộc chiến chip bán dẫn': 'semiconductor chip war',
  'chung khoan va lam phat': 'stock market and inflation',
  'chứng khoán và lạm phát': 'stock market and inflation'
};

function restoreVietnameseAccents(query: string): string {
  let normalized = query.toLowerCase().trim();
  if (ACCENT_DICTIONARY[normalized]) return ACCENT_DICTIONARY[normalized];
  Object.keys(ACCENT_DICTIONARY).forEach(unaccented => {
    if (unaccented.length >= 4 && normalized.includes(unaccented)) {
      normalized = normalized.replace(new RegExp(unaccented, 'gi'), ACCENT_DICTIONARY[unaccented]);
    }
  });
  return normalized;
}

async function searchForCountry(
  query: string,
  countryCode: string,
  tavilyApiKey: string,
  youtubeApiKey: string,
  missingKeys: string[],
  maxResults: number = 10
): Promise<{ web: SearchItem[]; youtube: SearchItem[]; pdf: SearchItem[] }> {
  const result = { web: [] as SearchItem[], youtube: [] as SearchItem[], pdf: [] as SearchItem[] };

  const targetLang = getTranslationLanguage(countryCode);
  let searchPayloadQuery = query;

  // 1. Try direct term mapping or Gemini query optimizer with restored accents
  if (targetLang !== 'vi') {
    const normKey = query.toLowerCase().trim();
    if (targetLang === 'en' && DIRECT_ENGLISH_MAPPING[normKey]) {
      searchPayloadQuery = DIRECT_ENGLISH_MAPPING[normKey];
      console.log(`[Direct Mapping] Matched English query for ${countryCode.toUpperCase()}: "${query}" -> "${searchPayloadQuery}"`);
    } else {
      const accentedQuery = restoreVietnameseAccents(query);
      const optimized = await optimizeQueryWithGemini(accentedQuery, countryCode.toLowerCase());
      if (optimized && optimized.trim() !== '' && optimized.toLowerCase() !== query.toLowerCase() && !optimized.includes('Vu when cool')) {
        searchPayloadQuery = optimized;
      } else {
        // 2. Guaranteed Google Translate fallback with restored accents
        try {
          const translated = await translateText(accentedQuery, targetLang, 'vi');
          if (translated && translated.trim() && translated.toLowerCase() !== query.toLowerCase() && !translated.includes('Vu when cool')) {
            searchPayloadQuery = translated;
            console.log(`[Translator Fallback] Query translated to ${targetLang}: "${accentedQuery}" -> "${searchPayloadQuery}"`);
          }
        } catch (err) {
          console.error(`[Translator Fallback] Failed for ${countryCode}:`, err);
        }
      }
    }
  }

  console.log(`[SearchEngine] Payload query for ${countryCode.toUpperCase()} (${targetLang}): "${searchPayloadQuery}"`);


  const fullCountryName = getFullCountryName(countryCode);

  // 1. Tavily Web Search
  if (tavilyApiKey) {
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: searchPayloadQuery,
          search_depth: 'basic',
          max_results: maxResults,
          include_answer: false,
          country: fullCountryName
        })
      });

      if (tavilyRes.ok) {
        const tavilyData: any = await tavilyRes.json();
        if (tavilyData.results && Array.isArray(tavilyData.results)) {
          result.web = tavilyData.results.slice(0, maxResults).map((item: any) => ({
            title: item.title || '',
            url: item.url || '',
            snippet: item.content || item.snippet || 'Không có mô tả.'
          }));
        }
      } else {
        const errJson: any = await tavilyRes.json().catch(() => null);
        console.error(`Tavily Web Search API error for ${countryCode} (${fullCountryName}):`, errJson);
        if (errJson?.detail) {
          missingKeys.push(`Tavily Web Search Error (${countryCode}): ${JSON.stringify(errJson.detail)}`);
        }
      }
    } catch (err) {
      console.error(`Fetch error Tavily Web Search for ${countryCode}:`, err);
    }
  }

  // 2. Tavily PDF Search
  if (tavilyApiKey) {
    try {
      const tavilyPdfRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: `${searchPayloadQuery} filetype:pdf`,
          search_depth: 'basic',
          max_results: maxResults,
          include_answer: false,
          country: fullCountryName
        })
      });

      if (tavilyPdfRes.ok) {
        const tavilyPdfData: any = await tavilyPdfRes.json();
        if (tavilyPdfData.results && Array.isArray(tavilyPdfData.results)) {
          result.pdf = tavilyPdfData.results.slice(0, maxResults).map((item: any) => ({
            title: item.title || '',
            url: item.url || '',
            snippet: item.content || item.snippet || 'Tài liệu PDF.'
          }));
        }
      } else {
        const errJson: any = await tavilyPdfRes.json().catch(() => null);
        console.error(`Tavily PDF Search API error for ${countryCode}:`, errJson);
      }
    } catch (err) {
      console.error(`Fetch error Tavily PDF Search for ${countryCode}:`, err);
    }
  }

  // 3. YouTube Search
  if (youtubeApiKey) {
    try {
      const relevanceLang = getLanguageForCountry(countryCode);
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(searchPayloadQuery)}&key=${youtubeApiKey}&regionCode=${countryCode.toUpperCase()}&relevanceLanguage=${relevanceLang}`;
      const ytRes = await fetch(ytUrl);
      if (ytRes.ok) {
        const ytData: any = await ytRes.json();
        if (ytData.items && Array.isArray(ytData.items)) {
          result.youtube = ytData.items.slice(0, maxResults).map((item: any) => ({
            title: item.snippet?.title || '',
            url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
            snippet: item.snippet?.description || 'Không có mô tả video.',
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
            publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt).toLocaleDateString('vi-VN') : undefined
          }));
        }
      } else {
        const errJson: any = await ytRes.json().catch(() => null);
        console.error(`YouTube API error for ${countryCode}:`, errJson);
      }
    } catch (err) {
      console.error(`Fetch error YouTube Search for ${countryCode}:`, err);
    }
  }

  // Translate all fetched results back into Vietnamese
  if (targetLang !== 'vi') {
    try {
      const [translatedWeb, translatedYt, translatedPdf] = await Promise.all([
        Promise.all(result.web.map(item => translateItem(item, targetLang))),
        Promise.all(result.youtube.map(item => translateItem(item, targetLang))),
        Promise.all(result.pdf.map(item => translateItem(item, targetLang)))
      ]);
      result.web = rankAndScoreResults(sanitizeAndDeduplicateResults(translatedWeb), query, searchPayloadQuery);
      result.youtube = rankAndScoreResults(sanitizeAndDeduplicateResults(translatedYt), query, searchPayloadQuery);
      result.pdf = rankAndScoreResults(sanitizeAndDeduplicateResults(translatedPdf), query, searchPayloadQuery);
    } catch (transErr) {
      console.error('[Translator] Failed to translate results back to VI:', transErr);
      result.web = rankAndScoreResults(sanitizeAndDeduplicateResults(result.web), query, searchPayloadQuery);
      result.youtube = rankAndScoreResults(sanitizeAndDeduplicateResults(result.youtube), query, searchPayloadQuery);
      result.pdf = rankAndScoreResults(sanitizeAndDeduplicateResults(result.pdf), query, searchPayloadQuery);
    }
  } else {
    result.web = rankAndScoreResults(sanitizeAndDeduplicateResults(result.web), query, searchPayloadQuery);
    result.youtube = rankAndScoreResults(sanitizeAndDeduplicateResults(result.youtube), query, searchPayloadQuery);
    result.pdf = rankAndScoreResults(sanitizeAndDeduplicateResults(result.pdf), query, searchPayloadQuery);
  }

  return result;
}


export async function executeSearch(
  query: string,
  field: string = 'auto',
  mode: 'single' | 'compare' = 'single'
): Promise<SearchResponse> {
  const tavilyApiKey = process.env.TAVILY_API_KEY || '';
  const youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
  const databaseUrl = process.env.DATABASE_URL || '';

  const missingKeys: string[] = [];
  if (!tavilyApiKey) missingKeys.push('TAVILY_API_KEY');
  if (!youtubeApiKey) missingKeys.push('YOUTUBE_API_KEY');
  if (!databaseUrl) missingKeys.push('DATABASE_URL (Supabase Connection String)');

  const response: SearchResponse = {
    compareMode: mode === 'compare',
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

  // Determine strategic domain
  let domain: DomainInfo;
  if (field === 'auto') {
    domain = await classifyDomain(query);
  } else {
    domain = DOMAINS[field] || DOMAINS.tech_ai;
  }
  response.detectedField = domain;

  if (mode === 'compare') {
    // 5 results per country (total 10) for side-by-side comparison
    const maxResults = 5;
    console.log(`[Search] Compare mode: "${domain.country1.name}" vs "${domain.country2.name}" for field "${domain.name}"`);
    const [c1Results, c2Results] = await Promise.all([
      searchForCountry(query, domain.country1.code, tavilyApiKey, youtubeApiKey, response.missingKeys, maxResults),
      searchForCountry(query, domain.country2.code, tavilyApiKey, youtubeApiKey, response.missingKeys, maxResults)
    ]);

    response.country1 = {
      code: domain.country1.code,
      name: domain.country1.name,
      ...c1Results
    };
    response.country2 = {
      code: domain.country2.code,
      name: domain.country2.name,
      ...c2Results
    };

    // Generate RAG answer in parallel with Supabase save
    const [ragAnswer] = await Promise.all([
      generateRagAnswer(
        query, 'compare',
        undefined,
        { code: domain.country1.code, name: domain.country1.name, ...c1Results },
        { code: domain.country2.code, name: domain.country2.name, ...c2Results }
      ),
      // Save comparison results into Supabase
      (async () => {
        if (!pool) return;
        try {
          let totalSavedWeb = 0, totalSavedYt = 0, totalSavedPdf = 0;
          if (c1Results.web.length > 0)     totalSavedWeb += await saveSearchResults(query, 'web', c1Results.web, domain.country1.code);
          if (c2Results.web.length > 0)     totalSavedWeb += await saveSearchResults(query, 'web', c2Results.web, domain.country2.code);
          if (c1Results.youtube.length > 0) totalSavedYt  += await saveSearchResults(query, 'youtube', c1Results.youtube, domain.country1.code);
          if (c2Results.youtube.length > 0) totalSavedYt  += await saveSearchResults(query, 'youtube', c2Results.youtube, domain.country2.code);
          if (c1Results.pdf.length > 0)     totalSavedPdf += await saveSearchResults(query, 'pdf', c1Results.pdf, domain.country1.code);
          if (c2Results.pdf.length > 0)     totalSavedPdf += await saveSearchResults(query, 'pdf', c2Results.pdf, domain.country2.code);
          response.savedCount = { web: totalSavedWeb, youtube: totalSavedYt, pdf: totalSavedPdf };
        } catch (dbErr) {
          console.error('Supabase DB saving error (compare mode):', dbErr);
        }
      })()
    ]);
    response.ragAnswer = ragAnswer;
  } else {
    // Single Search — 10 results for the primary country
    console.log(`[Search] Single mode: "${domain.country1.name}" for field "${domain.name}"`);
    const c1Results = await searchForCountry(query, domain.country1.code, tavilyApiKey, youtubeApiKey, response.missingKeys, 10);

    response.web = c1Results.web;
    response.youtube = c1Results.youtube;
    response.pdf = c1Results.pdf;

    // Generate RAG answer in parallel with Supabase save
    const [ragAnswer] = await Promise.all([
      generateRagAnswer(
        query, 'single',
        { web: c1Results.web, youtube: c1Results.youtube, pdf: c1Results.pdf, countryName: domain.country1.name }
      ),
      (async () => {
        if (!pool) return;
        try {
          if (response.web.length > 0)     response.savedCount.web     = await saveSearchResults(query, 'web', response.web, domain.country1.code);
          if (response.youtube.length > 0) response.savedCount.youtube = await saveSearchResults(query, 'youtube', response.youtube, domain.country1.code);
          if (response.pdf.length > 0)     response.savedCount.pdf     = await saveSearchResults(query, 'pdf', response.pdf, domain.country1.code);
        } catch (dbErr) {
          console.error('Supabase DB saving error (single mode):', dbErr);
        }
      })()
    ]);
    response.ragAnswer = ragAnswer;
  }

  return response;
}
