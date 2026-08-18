import dotenv from 'dotenv';

dotenv.config();

export interface DomainInfo {
  id: string;
  name: string;
  country1: { code: string; name: string };
  country2: { code: string; name: string };
}

const COUNTRY_LOOKUP: Record<string, { code: string; name: string }> = {
  us: { code: 'us', name: 'Hoa Kỳ' },
  cn: { code: 'cn', name: 'Trung Quốc' },
  ru: { code: 'ru', name: 'Nga' },
  vn: { code: 'vn', name: 'Việt Nam' }
};

export const DOMAINS: Record<string, DomainInfo> = {
  finance: {
    id: 'finance',
    name: 'Kinh tế và tài chính',
    country1: { code: 'us', name: 'Hoa Kỳ' },
    country2: { code: 'cn', name: 'Trung Quốc' }
  },
  tech_ai: {
    id: 'tech_ai',
    name: 'Công nghệ và AI',
    country1: { code: 'us', name: 'Hoa Kỳ' },
    country2: { code: 'cn', name: 'Trung Quốc' }
  },
  military: {
    id: 'military',
    name: 'Quân sự',
    country1: { code: 'us', name: 'Hoa Kỳ' },
    country2: { code: 'cn', name: 'Trung Quốc' }
  },
  politics: {
    id: 'politics',
    name: 'Địa chính trị và ngoại giao',
    country1: { code: 'us', name: 'Hoa Kỳ' },
    country2: { code: 'cn', name: 'Trung Quốc' }
  },
  energy: {
    id: 'energy',
    name: 'Năng lượng',
    country1: { code: 'us', name: 'Hoa Kỳ' },
    country2: { code: 'ru', name: 'Nga' }
  },
  resources: {
    id: 'resources',
    name: 'Tài nguyên chiến lược',
    country1: { code: 'cn', name: 'Trung Quốc' },
    country2: { code: 'ru', name: 'Nga' }
  },
  supply_chain: {
    id: 'supply_chain',
    name: 'Thương mại và chuỗi cung ứng',
    country1: { code: 'cn', name: 'Trung Quốc' },
    country2: { code: 'us', name: 'Hoa Kỳ' }
  },
  culture: {
    id: 'culture',
    name: 'Văn hóa và truyền thông',
    country1: { code: 'us', name: 'Hoa Kỳ' },
    country2: { code: 'cn', name: 'Trung Quốc' }
  },
  aerospace: {
    id: 'aerospace',
    name: 'Không gian và công nghệ quốc phòng',
    country1: { code: 'us', name: 'Hoa Kỳ' },
    country2: { code: 'cn', name: 'Trung Quốc' }
  },
  cybersecurity: {
    id: 'cybersecurity',
    name: 'An ninh mạng',
    country1: { code: 'us', name: 'Hoa Kỳ' },
    country2: { code: 'cn', name: 'Trung Quốc' }
  }
};

// ─── TIER 2: Rule-based domain keywords (fast, offline) ───────────────────────
const KEYWORD_MAPPINGS: { domainId: string; keywords: string[] }[] = [
  {
    domainId: 'military',
    keywords: ['quân sự', 'quốc phòng', 'vũ khí', 'tên lửa', 'chiến tranh', 'quân đội', 'army', 'military', 'weapon', 'war', 'tấn công', 'siêu thanh', 'hypersonic', 'drone', 'tàu chiến', 'máy bay chiến đấu', 'nato', 'hải quân', 'không quân', 'ukraine', 'xung đột']
  },
  {
    domainId: 'politics',
    keywords: ['địa chính trị', 'ngoại giao', 'chính trị', 'liên hợp quốc', 'geopolitics', 'diplomacy', 'chính sách đối ngoại', 'bầu cử', 'thượng đỉnh', 'quan hệ quốc tế', 'đại sứ', 'sanctions', 'lệnh trừng phạt']
  },
  {
    domainId: 'finance',
    keywords: ['kinh tế', 'tài chính', 'tiền tệ', 'cổ phiếu', 'chứng khoán', 'lạm phát', 'gdp', 'ngân hàng', 'đầu tư', 'lãi suất', 'economic', 'finance', 'stock', 'market', 'inflation', 'bond', 'trái phiếu', 'nợ công', 'thị trường']
  },
  {
    domainId: 'tech_ai',
    keywords: ['công nghệ', 'trí tuệ nhân tạo', 'machine learning', 'lập trình', 'developer', 'software', 'blockchain', 'robot', 'algorithm', 'neural', 'deep learning', 'deepseek', 'chatgpt', 'openai', 'gemini', 'llm', 'chip', 'semiconductor', 'bán dẫn', 'siêu máy tính', 'ai']
  },
  {
    domainId: 'energy',
    keywords: ['năng lượng', 'dầu khí', 'điện hạt nhân', 'năng lượng tái tạo', 'gas', 'oil', 'solar', 'wind', 'power', 'energy', 'nuclear', 'xăng dầu', 'opec', 'lng', 'hydrogen', 'khí đốt']
  },
  {
    domainId: 'resources',
    keywords: ['tài nguyên', 'khoáng sản', 'đất hiếm', 'lithium', 'cobalt', 'rare earth', 'mining', 'quặng', 'khai thác mỏ', 'uranium', 'đồng', 'nickel', 'strategic minerals']
  },
  {
    domainId: 'supply_chain',
    keywords: ['thương mại', 'chuỗi cung ứng', 'xuất nhập khẩu', 'logistics', 'trade', 'supply chain', 'tariff', 'thuế quan', 'vận tải biển', 'cảng biển', 'container', 'wto', 'hiệp định thương mại']
  },
  {
    domainId: 'culture',
    keywords: ['văn hóa', 'truyền thông', 'nghệ thuật', 'phim ảnh', 'âm nhạc', 'mạng xã hội', 'social media', 'culture', 'media', 'báo chí', 'phát thanh', 'tiktok', 'youtube', 'streaming']
  },
  {
    domainId: 'aerospace',
    keywords: ['vũ trụ', 'không gian', 'vệ tinh', 'tên lửa đẩy', 'nasa', 'space', 'satellite', 'aerospace', 'quỹ đạo', 'trạm vũ trụ', 'spacex', 'trường chinh', 'rocket', 'phóng vệ tinh']
  },
  {
    domainId: 'cybersecurity',
    keywords: ['an ninh mạng', 'bảo mật', 'hacker', 'malware', 'phishing', 'cybersecurity', 'encryption', 'mã hóa', 'firewall', 'tấn công mạng', 'ransomware', 'zero-day', 'apt']
  }
];

// ─── TIER 3: Explicit country detection from query text ───────────────────────
const COUNTRY_KEYWORDS: { code: string; patterns: string[] }[] = [
  {
    code: 'ru',
    patterns: ['nga', 'russia', 'russian', 'moscow', 'kremlin', 'putin', 'gazprom', 'rosatom', 'rosneft', 'lukoil', 'novatek', 'kaspersky', 'ruble', 'đồng rúp', 'sputnik', 'kalashnikov', 'sukhoi', 'mig ', 'wagner', 's-400', 'ukraine']
  },
  {
    code: 'us',
    patterns: ['mỹ', 'hoa kỳ', 'usa', 'united states', 'america', 'american', 'washington', 'white house', 'openai', 'chatgpt', 'tesla', 'nvidia', 'google', 'apple', 'microsoft', 'meta', 'amazon', 'spacex', 'lockheed', 'boeing', 'raytheon', 'fed ', 'dollar', 'đô la', 'wall street', 'pentagon', 'nasa']
  },
  {
    code: 'cn',
    patterns: ['trung quốc', 'tq', 'china', 'chinese', 'beijing', 'bắc kinh', 'thượng hải', 'deepseek', 'huawei', 'tiktok', 'bytedance', 'tencent', 'alibaba', 'xiaomi', 'zte', 'wechat', 'baidu', 'comac', 'sinopec', 'cnooc', 'yuan', 'nhân dân tệ', 'rmb', 'pla ', 'bri ', 'belt and road', 'made in china']
  }
];

/**
 * Check if text contains a keyword safely.
 * For short keywords (<=3 chars like 'ai', 'un', 'tq'), enforce word boundary to avoid false substring matches inside words like 'hiện tại'.
 */
function containsKeyword(queryText: string, keyword: string): boolean {
  const normQuery = queryText.toLowerCase();
  const normKw = keyword.toLowerCase();

  if (normKw.length <= 3) {
    // Word boundary check (supports Latin & unicode boundary)
    const regex = new RegExp(`(?:^|\\s|\\b)${normKw}(?:$|\\s|\\b)`, 'i');
    return regex.test(normQuery);
  }

  return normQuery.includes(normKw);
}

/**
 * TIER 3: Detect if the query explicitly mentions an entity linked to a country.
 * Returns a country code ('us', 'cn', 'ru') or null.
 */
function detectExplicitCountry(query: string): string | null {
  for (const entry of COUNTRY_KEYWORDS) {
    for (const pattern of entry.patterns) {
      if (containsKeyword(query, pattern)) {
        console.log(`[Classifier] Tier 3 - Explicit country detected: "${pattern}" -> ${entry.code}`);
        return entry.code;
      }
    }
  }
  return null;
}

/**
 * Swap or dynamically inject country1 and country2 if suggestedCountry is detected.
 */
function adjustCountryPriority(domain: DomainInfo, suggestedCountry: string | null): DomainInfo {
  if (!suggestedCountry) return domain;

  const suggestion = suggestedCountry.toLowerCase();
  const detectedMeta = COUNTRY_LOOKUP[suggestion];
  if (!detectedMeta) return domain;

  // Case 1: Already Rank 1
  if (domain.country1.code === suggestion) {
    console.log(`[Classifier] Country "${suggestion}" is already Rank 1. No swap needed.`);
    return domain;
  }

  // Case 2: Matches Rank 2 — swap Rank 1 and Rank 2
  if (domain.country2.code === suggestion) {
    console.log(`[Classifier] Promoting "${suggestion}" from Rank 2 to Rank 1 based on query context.`);
    return {
      ...domain,
      country1: domain.country2,
      country2: domain.country1
    };
  }

  // Case 3: Detected country is not in default domain (e.g., 'ru' for military query)
  // Dynamically set Rank 1 to detected country, and Rank 2 to Hoa Kỳ (or Trung Quốc)
  console.log(`[Classifier] Dynamically assigning Rank 1 to detected country "${detectedMeta.name}" (${suggestion}).`);
  const secondaryCode = suggestion === 'us' ? 'cn' : 'us';
  const secondaryMeta = COUNTRY_LOOKUP[secondaryCode];

  return {
    ...domain,
    country1: detectedMeta,
    country2: secondaryMeta
  };
}

/**
 * Main classification function with 4-tier fallback:
 * Tier 1: Gemini API (classifies domain + detects country entity in ONE call)
 * Tier 2: Rule-based keyword matching (offline, fast, word-boundary safe)
 * Tier 3: Explicit country detection from query text
 * Tier 4: Default fallback (tech_ai)
 */
export async function classifyDomain(query: string): Promise<DomainInfo> {
  const normalizedQuery = query.toLowerCase().trim();

  // ── TIER 1: Gemini API — domain classification + country entity detection ──
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  if (geminiApiKey) {
    try {
      console.log(`[Classifier] Tier 1 - Calling Gemini API: "${query}"`);
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Phân tích câu truy vấn sau đây và trả về JSON với 2 trường:
1. "domain": Một trong các lĩnh vực sau (chọn phù hợp nhất):
   finance, tech_ai, military, politics, energy, resources, supply_chain, culture, aerospace, cybersecurity
2. "suggestedCountry": Nếu truy vấn đề cập đến thực thể hoặc quốc gia cụ thể, hãy trả về mã quốc gia: "us", "cn", hoặc "ru". Nếu không có, trả về "none".

Ví dụ:
- "chiến tranh nga ukraine hiện tại" -> {"domain": "military", "suggestedCountry": "ru"}
- "DeepSeek định hướng tương lai AI" -> {"domain": "tech_ai", "suggestedCountry": "cn"}
- "ChatGPT thay thế lập trình viên" -> {"domain": "tech_ai", "suggestedCountry": "us"}
- "Gazprom cắt khí đốt châu Âu" -> {"domain": "energy", "suggestedCountry": "ru"}

Chỉ trả về JSON thuần, không có markdown.

Câu truy vấn: "${query}"`
                }
              ]
            }
          ],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const resData: any = await response.json();
        const jsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText.trim());
          const domainId: string = parsed.domain;
          const suggestedCountry: string = parsed.suggestedCountry || 'none';

          if (domainId && DOMAINS[domainId]) {
            console.log(`[Classifier] Tier 1 - Gemini -> Domain: ${domainId}, SuggestedCountry: ${suggestedCountry}`);
            const baseDomain = DOMAINS[domainId];
            return adjustCountryPriority(
              baseDomain,
              suggestedCountry === 'none' ? null : suggestedCountry
            );
          }
        }
      } else {
        const errText = await response.text();
        console.warn('[Classifier] Tier 1 - Gemini API failed:', errText.slice(0, 200));
      }
    } catch (err) {
      console.warn('[Classifier] Tier 1 - Gemini API error, falling back:', (err as Error).message);
    }
  }

  // ── TIER 2: Rule-based domain classification (offline, fast, safe word boundary) ──
  for (const mapping of KEYWORD_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (containsKeyword(normalizedQuery, keyword)) {
        console.log(`[Classifier] Tier 2 - Keyword match: "${keyword}" -> Domain: ${mapping.domainId}`);
        const baseDomain = DOMAINS[mapping.domainId];
        const explicitCountry = detectExplicitCountry(normalizedQuery);
        return adjustCountryPriority(baseDomain, explicitCountry);
      }
    }
  }

  // ── TIER 3: Explicit country detection only (no domain matched) ───────────
  const explicitCountry = detectExplicitCountry(normalizedQuery);
  if (explicitCountry) {
    console.log(`[Classifier] Tier 3 - No domain match. Using default military/tech domain with country: ${explicitCountry}`);
    return adjustCountryPriority(DOMAINS.military, explicitCountry);
  }

  // ── TIER 4 (Final Default): military with standard country order ───────────
  console.log('[Classifier] Tier 4 - Default fallback: military, Mỹ > Trung Quốc');
  return DOMAINS.military;
}
