/**
 * RAG (Retrieval-Augmented Generation) Service
 * Uses Gemini to synthesize an AI answer grounded in the retrieved search results.
 * Supports both single-country and comparative (2-country) modes.
 */

import { SearchItem } from './searchService';

export interface Citation {
  index: number;
  title: string;
  url: string;
  source: 'web' | 'youtube' | 'pdf';
  country?: string;
}

export interface RagAnswer {
  answer: string;             // Main synthesized answer in Vietnamese, with [1][2] citation markers
  citations: Citation[];      // Ordered list of source citations
  comparisonTable?: {         // Only present in compare mode
    country1Name: string;
    country1Points: string[];
    country2Name: string;
    country2Points: string[];
    commonGround: string[];
  };
  generatedBy: 'gemini' | 'fallback';
}

interface CountryResults {
  code: string;
  name: string;
  web: SearchItem[];
  youtube: SearchItem[];
  pdf: SearchItem[];
}

// Truncate snippet to avoid token overflow
function truncate(text: string, maxLen: number = 400): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

// Build a numbered evidence block for the Gemini prompt
function buildEvidenceBlock(
  items: SearchItem[],
  sourceType: 'web' | 'youtube' | 'pdf',
  startIndex: number,
  countryName: string
): { block: string; citations: Citation[]; nextIndex: number } {
  const citations: Citation[] = [];
  const lines: string[] = [];

  items.forEach((item, i) => {
    const idx = startIndex + i;
    const title = item.translatedTitle || item.title;
    const snippet = item.translatedSnippet || item.snippet;
    citations.push({ index: idx, title: item.title, url: item.url, source: sourceType, country: countryName });
    lines.push(`[${idx}] (${sourceType.toUpperCase()} | ${countryName}) ${title}\n${truncate(snippet)}`);
  });

  return { block: lines.join('\n\n'), citations, nextIndex: startIndex + items.length };
}

// Build all evidence and citations for single or compare mode
function buildContext(
  query: string,
  single?: { web: SearchItem[]; youtube: SearchItem[]; pdf: SearchItem[]; countryName: string },
  c1?: CountryResults,
  c2?: CountryResults
): { prompt: string; citations: Citation[] } {
  const allCitations: Citation[] = [];
  const evidenceBlocks: string[] = [];
  let idx = 1;

  if (single) {
    const wb = buildEvidenceBlock(single.web, 'web', idx, single.countryName);
    idx = wb.nextIndex; allCitations.push(...wb.citations); if (wb.block) evidenceBlocks.push(wb.block);

    const yt = buildEvidenceBlock(single.youtube, 'youtube', idx, single.countryName);
    idx = yt.nextIndex; allCitations.push(...yt.citations); if (yt.block) evidenceBlocks.push(yt.block);

    const pd = buildEvidenceBlock(single.pdf, 'pdf', idx, single.countryName);
    idx = pd.nextIndex; allCitations.push(...pd.citations); if (pd.block) evidenceBlocks.push(pd.block);

    const prompt = `You are a senior strategic intelligence analyst. Based STRICTLY on the provided source documents below, synthesize a comprehensive, in-depth analysis for the query in Vietnamese:

Query: "${query}"

SOURCE DOCUMENTS:
${evidenceBlocks.join('\n\n---\n\n')}

REQUIREMENTS:
- Output language: Write the synthesis ONLY in Vietnamese (3-5 paragraphs).
- Citations: Append citation markers in square brackets like [1], [2] immediately after each claim.
- Grounding: Use ONLY facts explicitly mentioned in the sources. Do not hallucinate or assume.
- If the sources do not provide sufficient information, state that clearly in Vietnamese.
- Conclude with a brief 2-3 sentence strategic summary in Vietnamese.`;

    return { prompt, citations: allCitations };
  }

  // Compare mode
  if (c1 && c2) {
    const sectionHeader1 = `=== SOURCES FROM ${c1.name.toUpperCase()} ===`;
    const sectionHeader2 = `=== SOURCES FROM ${c2.name.toUpperCase()} ===`;

    const wb1 = buildEvidenceBlock(c1.web, 'web', idx, c1.name);
    idx = wb1.nextIndex; allCitations.push(...wb1.citations);
    const yt1 = buildEvidenceBlock(c1.youtube, 'youtube', idx, c1.name);
    idx = yt1.nextIndex; allCitations.push(...yt1.citations);
    const pd1 = buildEvidenceBlock(c1.pdf, 'pdf', idx, c1.name);
    idx = pd1.nextIndex; allCitations.push(...pd1.citations);

    const wb2 = buildEvidenceBlock(c2.web, 'web', idx, c2.name);
    idx = wb2.nextIndex; allCitations.push(...wb2.citations);
    const yt2 = buildEvidenceBlock(c2.youtube, 'youtube', idx, c2.name);
    idx = yt2.nextIndex; allCitations.push(...yt2.citations);
    const pd2 = buildEvidenceBlock(c2.pdf, 'pdf', idx, c2.name);
    idx = pd2.nextIndex; allCitations.push(...pd2.citations);

    const block1 = [wb1.block, yt1.block, pd1.block].filter(Boolean).join('\n\n');
    const block2 = [wb2.block, yt2.block, pd2.block].filter(Boolean).join('\n\n');

    const prompt = `You are a senior geopolitical and international relations analyst. Based STRICTLY on the provided source documents below, analyze and compare the perspectives of ${c1.name} and ${c2.name} on the following query:

Query: "${query}"

${sectionHeader1}
${block1}

${sectionHeader2}
${block2}

ANALYSIS INSTRUCTIONS (Output ONLY raw JSON):
{
  "answer": "3-5 paragraphs synthesized analysis IN VIETNAMESE with citation markers [N] after claims. Include background, comparative analysis, and summary.",
  "country1Points": ["Key perspective of ${c1.name} 1 in Vietnamese", "Point 2", "Point 3"],
  "country2Points": ["Key perspective of ${c2.name} 1 in Vietnamese", "Point 2", "Point 3"],
  "commonGround": ["Shared ground or overlap 1 in Vietnamese", "Shared point 2"]
}

Respond ONLY with valid raw JSON. Do not include markdown code block formatting or explanations.`;

    return { prompt, citations: allCitations };
  }

  return { prompt: '', citations: [] };
}

/**
 * Validate and sanitize citation markers [N] in text against total available citations count.
 * Removes any hallucinated citations like [99] if index > maxCitationCount.
 */
function sanitizeCitationIndexes(text: string, maxCitationCount: number): string {
  if (!text || maxCitationCount <= 0) return text;
  return text.replace(/\[(\d+)\]/g, (match, p1) => {
    const num = parseInt(p1, 10);
    if (isNaN(num) || num < 1 || num > maxCitationCount) {
      return ''; // Strip hallucinated citation
    }
    return match;
  });
}

export async function generateRagAnswer(
  query: string,
  mode: 'single' | 'compare',
  singleData?: { web: SearchItem[]; youtube: SearchItem[]; pdf: SearchItem[]; countryName: string },
  c1Data?: CountryResults,
  c2Data?: CountryResults
): Promise<RagAnswer> {
  const geminiKey = process.env.GEMINI_API_KEY || '';

  if (!geminiKey) {
    console.warn('[RAG] No Gemini key — returning fallback answer.');
    return buildFallbackAnswer(mode, c1Data, c2Data, singleData);
  }

  const { prompt, citations } = buildContext(query, singleData, c1Data, c2Data);

  if (!prompt || citations.length === 0) {
    return buildFallbackAnswer(mode, c1Data, c2Data, singleData);
  }

  const fetchWithRetry = async (attempt: number = 1): Promise<Response> => {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          ...(mode === 'compare' ? { responseMimeType: 'application/json' } : {})
        }
      })
    });

    if ((res.status === 429 || res.status === 503) && attempt <= 2) {
      console.warn(`[RAG] Gemini API rate limited (${res.status}). Retrying in 1.5s (attempt ${attempt}/2)...`);
      await new Promise(r => setTimeout(r, 1500));
      return fetchWithRetry(attempt + 1);
    }
    return res;
  };

  try {
    console.log(`[RAG] Calling Gemini for "${query}" (${mode} mode, ${citations.length} sources)`);
    const res = await fetchWithRetry();

    if (!res.ok) {
      const err = await res.text();
      console.error('[RAG] Gemini error:', err.slice(0, 300));
      return buildFallbackAnswer(mode, c1Data, c2Data, singleData);
    }

    const data: any = await res.json();
    const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      return buildFallbackAnswer(mode, c1Data, c2Data, singleData);
    }

    if (mode === 'single') {
      console.log('[RAG] Single-mode answer generated successfully.');
      const sanitizedAnswer = sanitizeCitationIndexes(rawText.trim(), citations.length);
      return {
        answer: sanitizedAnswer,
        citations,
        generatedBy: 'gemini'
      };
    }

    // Compare mode — sanitize and parse JSON response
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }
    
    try {
      const parsed = JSON.parse(cleanJson);
      console.log('[RAG] Compare-mode answer generated successfully.');
      const sanitizedAnswer = sanitizeCitationIndexes(parsed.answer || '', citations.length);
      return {
        answer: sanitizedAnswer,
        citations,
        comparisonTable: {
          country1Name: c1Data!.name,
          country1Points: parsed.country1Points || [],
          country2Name: c2Data!.name,
          country2Points: parsed.country2Points || [],
          commonGround: parsed.commonGround || []
        },
        generatedBy: 'gemini'
      };
    } catch (parseError) {
      console.warn('[RAG] JSON parse failed, attempting partial recovery...');
      // Extract "answer" string using regex if JSON string was cut off at the end
      const answerMatch = cleanJson.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"?/s);
      const rawAnswerText = answerMatch ? answerMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : cleanJson;
      const sanitizedAnswer = sanitizeCitationIndexes(rawAnswerText, citations.length);

      return {
        answer: sanitizedAnswer,
        citations,
        comparisonTable: {
          country1Name: c1Data!.name,
          country1Points: [],
          country2Name: c2Data!.name,
          country2Points: [],
          commonGround: []
        },
        generatedBy: 'gemini'
      };
    }
  } catch (err) {
    console.error('[RAG] Error generating answer:', err);
    return buildFallbackAnswer(mode, c1Data, c2Data, singleData);
  }
}

function buildFallbackAnswer(
  mode: 'single' | 'compare',
  c1?: CountryResults,
  c2?: CountryResults,
  single?: { countryName: string }
): RagAnswer {
  const answer = mode === 'compare'
    ? `Hệ thống đã tổng hợp thông tin từ ${c1?.name || 'Quốc gia 1'} và ${c2?.name || 'Quốc gia 2'}. Vui lòng xem chi tiết tại các tài liệu nguồn bên dưới.`
    : `Hệ thống đã tìm thấy các tài liệu liên quan. Vui lòng xem chi tiết tại các nguồn bên dưới.`;

  return {
    answer,
    citations: [],
    generatedBy: 'fallback',
    ...(mode === 'compare' && c1 && c2 ? {
      comparisonTable: {
        country1Name: c1.name, country1Points: [],
        country2Name: c2.name, country2Points: [],
        commonGround: []
      }
    } : {})
  };
}
