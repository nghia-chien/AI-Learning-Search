import React, { useState } from 'react';
import { Search, Globe, Video, FileText, ExternalLink, AlertTriangle, Key, RefreshCw, Database, CheckCircle2, Sliders, Split, Info, Brain, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface SearchItem {
  title: string;
  url: string;
  snippet: string;
  translatedTitle?: string;
  translatedSnippet?: string;
  thumbnail?: string;
  publishedAt?: string;
}

interface Citation {
  index: number;
  title: string;
  url: string;
  source: 'web' | 'youtube' | 'pdf';
  country?: string;
}

interface RagAnswer {
  answer: string;
  citations: Citation[];
  comparisonTable?: {
    country1Name: string;
    country1Points: string[];
    country2Name: string;
    country2Points: string[];
    commonGround: string[];
  };
  generatedBy: 'gemini' | 'fallback';
}

interface SearchResponse {
  detectedField?: {
    id: string;
    name: string;
    country1: { code: string; name: string };
    country2: { code: string; name: string };
  };
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
  missingKeys?: string[];
  dbConnected: boolean;
  savedCount?: {
    web: number;
    youtube: number;
    pdf: number;
  };
  error?: string;
}

const DOMAINS = [
  { id: 'auto', name: '🔍 Tự động nhận diện lĩnh vực' },
  { id: 'finance', name: '💼 Kinh tế và tài chính (Mỹ - Trung)' },
  { id: 'tech_ai', name: '🤖 Công nghệ và AI (Mỹ - Trung)' },
  { id: 'military', name: '🎖️ Quân sự (Mỹ - Trung)' },
  { id: 'politics', name: '🌍 Địa chính trị và ngoại giao (Mỹ - Trung)' },
  { id: 'energy', name: '⚡ Năng lượng (Mỹ - Nga)' },
  { id: 'resources', name: '💎 Tài nguyên chiến lược (Trung Quốc - Nga)' },
  { id: 'supply_chain', name: '🚢 Thương mại và chuỗi cung ứng (Trung Quốc - Mỹ)' },
  { id: 'culture', name: '🎬 Văn hóa và truyền thông (Mỹ - Trung)' },
  { id: 'aerospace', name: '🚀 Không gian và công nghệ quốc phòng (Mỹ - Trung)' },
  { id: 'cybersecurity', name: '🛡️ An ninh mạng (Mỹ - Trung)' }
];

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedField, setSelectedField] = useState('auto');
  const [searchMode, setSearchMode] = useState<'single' | 'compare'>('single');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSearchedQuery(query);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    try {
      const res = await fetch(`${apiBaseUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          field: selectedField,
          mode: searchMode
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error (${res.status})`);
      }

      const data: SearchResponse = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || `Không thể kết nối đến backend server (${apiBaseUrl}).`);
    } finally {
      setLoading(false);
    }
  };

  const getFlagEmoji = (code: string) => {
    const lower = code.toLowerCase();
    if (lower === 'us') return '🇺🇸';
    if (lower === 'cn') return '🇨🇳';
    if (lower === 'ru') return '🇷🇺';
    if (lower === 'vn') return '🇻🇳';
    return '🏳️';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI Strategic Search: <span className="text-indigo-400">Lĩnh Vực & Đối Chiếu Quốc Gia</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Hệ thống tự động nhận diện lĩnh vực truy vấn để tối ưu hóa nguồn lực tìm kiếm quốc gia.
            Hỗ trợ chế độ so sánh song song góc nhìn giữa các cường quốc chiến lược.
          </p>
        </header>

        {/* Search & Settings Panel */}
        <div className="max-w-3xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-2 focus-within:border-indigo-500 transition shadow-inner">
              <Search className="w-6 h-6 text-slate-400 ml-3 mr-2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập từ khóa tìm kiếm chiến lược (ví dụ: vũ khí siêu thanh, đất hiếm)..."
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base px-2 py-2"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <span>Tìm kiếm</span>
                )}
              </button>
            </div>
          </form>

          {/* Configuration Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-1 text-xs">
            {/* Domain Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Sliders className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 font-medium">Lĩnh vực:</span>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition cursor-pointer w-full sm:w-auto"
              >
                {DOMAINS.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Compare Mode Toggle */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-slate-400 pl-2">Chế độ:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSearchMode('single')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${searchMode === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Tìm kiếm đơn
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('compare')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${searchMode === 'compare' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Split className="w-3.5 h-3.5" />
                  So sánh 2 Cường quốc
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Error Message */}
        {errorMsg && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Missing Keys or Guidance */}
        {results?.missingKeys && results.missingKeys.length > 0 && (
          <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-sm space-y-3 shadow-lg">
            <div className="flex items-center gap-2 font-semibold text-base text-amber-300">
              <Key className="w-5 h-5 text-amber-400" />
              <span>Hướng dẫn cấu hình API Keys & Database Supabase</span>
            </div>
            <p className="text-slate-300">
              Cần thêm các biến sau vào <code className="bg-slate-900 px-2 py-1 rounded text-amber-300 font-mono">backend/.env</code>:
            </p>
            <ul className="list-disc list-inside space-y-1 font-mono text-xs text-amber-300/90 pl-2">
              {results.missingKeys.map((k, idx) => (
                <li key={idx}>{k}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Database Status Notification Banner */}
        {results && (
          <div className="max-w-4xl mx-auto">
            {results.dbConnected ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Đã kết nối Supabase PostgreSQL (Đã đồng bộ)</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>Lưu Web: {results.savedCount?.web || 0}</span>
                  <span>•</span>
                  <span>Lưu YouTube: {results.savedCount?.youtube || 0}</span>
                  <span>•</span>
                  <span>Lưu PDF: {results.savedCount?.pdf || 0}</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span>Chưa thêm <code className="text-indigo-300 font-mono">DATABASE_URL</code> (Kết quả chưa lưu vào Supabase DB)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto detected field indicator banner */}
        {results?.detectedField && (
          <div className="max-w-4xl mx-auto bg-slate-900/40 border border-indigo-950 p-4 rounded-2xl flex items-center gap-3 text-sm text-slate-300">
            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div>
              <span>Lĩnh vực phát hiện: </span>
              <strong className="text-indigo-300 font-semibold">{results.detectedField.name}</strong>
              <span className="text-slate-400 ml-1">
                ➔ Nguồn khai thác: {getFlagEmoji(results.detectedField.country1.code)} {results.detectedField.country1.name}
                {results.compareMode && ` đối chiếu với ${getFlagEmoji(results.detectedField.country2.code)} ${results.detectedField.country2.name}`}
              </span>
            </div>
          </div>
        )}

        {/* ═══════════════ RAG AI ANSWER BLOCK ═══════════════ */}
        {results?.ragAnswer && results.ragAnswer.citations.length > 0 && (
          <RagAnswerBlock ragAnswer={results.ragAnswer} compareMode={results.compareMode} />
        )}

        {/* Search Results Display */}
        {results && (
          <div className="space-y-4 pt-2">
            <div className="text-sm text-slate-400 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Từ khóa tìm kiếm: <strong className="text-indigo-300">"{searchedQuery}"</strong></span>
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300">
                {results.compareMode ? 'Đang so sánh 2 quốc gia' : 'Tìm kiếm đơn lẻ'}
              </span>
            </div>

            {results.compareMode ? (
              /* So sánh song song 2 bên */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cột Quốc gia 1 */}
                {results.country1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                      <span className="text-2xl">{getFlagEmoji(results.country1.code)}</span>
                      <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                        Góc nhìn {results.country1.name}
                      </h2>
                    </div>

                    <div className="space-y-6">
                      {/* Web Section */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h3 className="flex items-center gap-2 text-blue-400 font-bold border-b border-slate-800/60 pb-2 text-sm">
                          <Globe className="w-4.5 h-4.5" />
                          Tài liệu Web
                        </h3>
                        {results.country1.web.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Không có kết quả.</p>
                        ) : (
                          <div className="space-y-3">
                            {results.country1.web.map((item, idx) => (
                              <SearchCard
                                key={idx}
                                item={item}
                                badge={`#${idx + 1} Web Link`}
                                badgeClass="bg-blue-950 text-blue-300 border-blue-800/40"
                                hoverClass="border-blue-500/30"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* YouTube Section */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h3 className="flex items-center gap-2 text-red-400 font-bold border-b border-slate-800/60 pb-2 text-sm">
                          <Video className="w-4.5 h-4.5" />
                          Truyền thông & Video
                        </h3>
                        {results.country1.youtube.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Không có kết quả video.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {results.country1.youtube.map((item, idx) => (
                              <SearchCard
                                key={idx}
                                item={item}
                                badge={`#${idx + 1} Video`}
                                badgeClass="bg-red-950 text-red-300 border-red-800/40"
                                hoverClass="border-red-500/30"
                                hasThumbnail={true}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* PDF Section */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h3 className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800/60 pb-2 text-sm">
                          <FileText className="w-4.5 h-4.5" />
                          Báo cáo & Tài liệu PDF
                        </h3>
                        {results.country1.pdf.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Không có tài liệu PDF.</p>
                        ) : (
                          <div className="space-y-3">
                            {results.country1.pdf.map((item, idx) => (
                              <SearchCard
                                key={idx}
                                item={item}
                                badge={`#${idx + 1} PDF File`}
                                badgeClass="bg-emerald-950 text-emerald-300 border-emerald-800/40"
                                hoverClass="border-emerald-500/30"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cột Quốc gia 2 */}
                {results.country2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                      <span className="text-2xl">{getFlagEmoji(results.country2.code)}</span>
                      <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                        Góc nhìn {results.country2.name}
                      </h2>
                    </div>

                    <div className="space-y-6">
                      {/* Web Section */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h3 className="flex items-center gap-2 text-blue-400 font-bold border-b border-slate-800/60 pb-2 text-sm">
                          <Globe className="w-4.5 h-4.5" />
                          Tài liệu Web
                        </h3>
                        {results.country2.web.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Không có kết quả.</p>
                        ) : (
                          <div className="space-y-3">
                            {results.country2.web.map((item, idx) => (
                              <SearchCard
                                key={idx}
                                item={item}
                                badge={`#${idx + 1} Web Link`}
                                badgeClass="bg-blue-950 text-blue-300 border-blue-800/40"
                                hoverClass="border-blue-500/30"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* YouTube Section */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h3 className="flex items-center gap-2 text-red-400 font-bold border-b border-slate-800/60 pb-2 text-sm">
                          <Video className="w-4.5 h-4.5" />
                          Truyền thông & Video
                        </h3>
                        {results.country2.youtube.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Không có kết quả video.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {results.country2.youtube.map((item, idx) => (
                              <SearchCard
                                key={idx}
                                item={item}
                                badge={`#${idx + 1} Video`}
                                badgeClass="bg-red-950 text-red-300 border-red-800/40"
                                hoverClass="border-red-500/30"
                                hasThumbnail={true}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* PDF Section */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <h3 className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800/60 pb-2 text-sm">
                          <FileText className="w-4.5 h-4.5" />
                          Báo cáo & Tài liệu PDF
                        </h3>
                        {results.country2.pdf.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Không có tài liệu PDF.</p>
                        ) : (
                          <div className="space-y-3">
                            {results.country2.pdf.map((item, idx) => (
                              <SearchCard
                                key={idx}
                                item={item}
                                badge={`#${idx + 1} PDF File`}
                                badgeClass="bg-emerald-950 text-emerald-300 border-emerald-800/40"
                                hoverClass="border-emerald-500/30"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Original 3-Column Grid for single search */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Tavily Web Search */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5 text-blue-400 font-bold">
                      <Globe className="w-5 h-5" />
                      <h2>Tavily Search (Web)</h2>
                    </div>
                  </div>

                  {results.web.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Chưa có kết quả web.</p>
                  ) : (
                    <div className="space-y-4">
                      {results.web.map((item, idx) => (
                        <SearchCard
                          key={idx}
                          item={item}
                          badge={`#${idx + 1} Web Link`}
                          badgeClass="bg-blue-950 text-blue-300 border-blue-800/40"
                          hoverClass="border-blue-500/50"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 2: YouTube Search */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5 text-red-400 font-bold">
                      <Video className="w-5 h-5" />
                      <h2>YouTube Video</h2>
                    </div>
                  </div>

                  {results.youtube.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Chưa có kết quả video.</p>
                  ) : (
                    <div className="space-y-4">
                      {results.youtube.map((item, idx) => (
                        <SearchCard
                          key={idx}
                          item={item}
                          badge={`#${idx + 1} Video`}
                          badgeClass="bg-red-950 text-red-300 border-red-800/40"
                          hoverClass="border-red-500/50"
                          hasThumbnail={true}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 3: PDF Documents Search */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
                      <FileText className="w-5 h-5" />
                      <h2>Tài Liệu PDF (Tavily)</h2>
                    </div>
                  </div>

                  {results.pdf.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Chưa có kết quả PDF.</p>
                  ) : (
                    <div className="space-y-4">
                      {results.pdf.map((item, idx) => (
                        <SearchCard
                          key={idx}
                          item={item}
                          badge={`#${idx + 1} PDF File`}
                          badgeClass="bg-emerald-950 text-emerald-300 border-emerald-800/40"
                          hoverClass="border-emerald-500/50"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RAG Answer Block Component ──────────────────────────────────────────────

const SOURCE_ICON: Record<string, string> = { web: '🌐', youtube: '▶', pdf: '📄' };
const COUNTRY_FLAG: Record<string, string> = { us: '🇺🇸', cn: '🇨🇳', ru: '🇷🇺', vn: '🇻🇳' };

function RagAnswerBlock({ ragAnswer, compareMode }: { ragAnswer: RagAnswer; compareMode: boolean }) {
  const [showCitations, setShowCitations] = useState(false);

  // Render answer text, converting [N] into clickable superscript links
  const renderAnswer = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const num = parseInt(match[1]);
        const citation = ragAnswer.citations.find(c => c.index === num);
        return citation ? (
          <a
            key={i}
            href={citation.url}
            target="_blank"
            rel="noreferrer"
            title={citation.title}
            className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 rounded hover:bg-indigo-800 hover:text-white transition mx-0.5 align-top mt-0.5"
          >
            {num}
          </a>
        ) : <span key={i}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-indigo-900/40 rounded-2xl overflow-hidden shadow-lg shadow-indigo-950/20">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-indigo-900/30">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <Brain className="w-4.5 h-4.5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-indigo-200 tracking-wide">
            {compareMode ? 'AI Phân tích & Đối chiếu Chiến lược' : 'AI Tổng hợp & Đánh giá'}
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Dựa trên {ragAnswer.citations.length} nguồn tài liệu — {ragAnswer.generatedBy === 'gemini' ? '✨ Gemini AI' : '⚡ Chế độ ngoại tuyến'}
          </p>
        </div>
      </div>

      {/* Main Answer */}
      <div className="px-6 py-5">
        <div className="text-sm text-slate-200 leading-relaxed space-y-3">
          {ragAnswer.answer.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i}>{renderAnswer(para)}</p>
          ))}
        </div>
      </div>

      {/* Comparison Table (compare mode only) */}
      {compareMode && ragAnswer.comparisonTable && (
        <div className="px-6 pb-5">
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-slate-800">
              {/* Country 1 */}
              <div className="bg-blue-950/20 p-4">
                <div className="text-xs font-bold text-blue-300 mb-3 flex items-center gap-1.5">
                  <span className="text-base">{COUNTRY_FLAG[ragAnswer.comparisonTable.country1Name === 'Hoa Kỳ' ? 'us' : ragAnswer.comparisonTable.country1Name === 'Trung Quốc' ? 'cn' : 'ru']}</span>
                  {ragAnswer.comparisonTable.country1Name}
                </div>
                <ul className="space-y-2">
                  {ragAnswer.comparisonTable.country1Points.map((pt, i) => (
                    <li key={i} className="text-[11px] text-slate-300 flex gap-2">
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Common Ground */}
              <div className="bg-slate-900/60 p-4">
                <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Điểm chung
                </div>
                <ul className="space-y-2">
                  {ragAnswer.comparisonTable.commonGround.map((pt, i) => (
                    <li key={i} className="text-[11px] text-slate-400 flex gap-2">
                      <span className="text-slate-500 mt-0.5 flex-shrink-0">↔</span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Country 2 */}
              <div className="bg-rose-950/20 p-4">
                <div className="text-xs font-bold text-rose-300 mb-3 flex items-center gap-1.5">
                  <span className="text-base">{COUNTRY_FLAG[ragAnswer.comparisonTable.country2Name === 'Hoa Kỳ' ? 'us' : ragAnswer.comparisonTable.country2Name === 'Trung Quốc' ? 'cn' : 'ru']}</span>
                  {ragAnswer.comparisonTable.country2Name}
                </div>
                <ul className="space-y-2">
                  {ragAnswer.comparisonTable.country2Points.map((pt, i) => (
                    <li key={i} className="text-[11px] text-slate-300 flex gap-2">
                      <span className="text-rose-500 mt-0.5 flex-shrink-0">•</span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citations Toggle */}
      <div className="border-t border-slate-800/60">
        <button
          onClick={() => setShowCitations(!showCitations)}
          className="w-full flex items-center justify-between px-6 py-3 text-[11px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 transition"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            Xem {ragAnswer.citations.length} nguồn trích dẫn
          </span>
          {showCitations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showCitations && (
          <div className="px-6 pb-4 space-y-1.5">
            {ragAnswer.citations.map((c) => (
              <div key={c.index} className="flex items-start gap-3 py-2 border-t border-slate-800/40 first:border-0">
                <span className="flex-shrink-0 w-5 h-5 rounded bg-slate-800 text-[10px] font-bold text-indigo-300 flex items-center justify-center mt-0.5">
                  {c.index}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-300 hover:text-indigo-300 transition line-clamp-1 font-medium"
                  >
                    {c.title}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-600">{SOURCE_ICON[c.source]} {c.source.toUpperCase()}</span>
                    {c.country && <span className="text-[10px] text-slate-600">· {c.country}</span>}
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-700 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchCardProps {
  item: SearchItem;
  badge: string;
  badgeClass: string;
  hoverClass: string;
  hasThumbnail?: boolean;
}

function SearchCard({ item, badge, badgeClass, hoverClass, hasThumbnail = false }: SearchCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const hasTranslation = !!(item.translatedTitle && item.translatedTitle !== item.title);

  const displayTitle = showOriginal || !hasTranslation ? item.title : item.translatedTitle;
  const displaySnippet = showOriginal || !hasTranslation ? item.snippet : item.translatedSnippet;

  return (
    <div className={`bg-slate-950 p-4 rounded-xl border border-slate-900 transition space-y-2 hover:${hoverClass} relative flex flex-col justify-between h-full`}>
      <div>
        {hasThumbnail && item.thumbnail && (
          <img src={item.thumbnail} alt={item.title} className="w-full h-24 object-cover rounded-lg mb-2" />
        )}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${badgeClass}`}>
            {badge}
          </span>
          {hasTranslation && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-[9px] bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-slate-800 px-2 py-0.5 rounded cursor-pointer transition select-none flex items-center gap-0.5"
            >
              <span>{showOriginal ? 'Xem bản dịch' : 'Xem bản gốc'}</span>
            </button>
          )}
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-slate-200 hover:text-indigo-400 transition flex items-start justify-between gap-2"
        >
          <span className="line-clamp-2" dangerouslySetInnerHTML={{ __html: displayTitle }} />
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
        </a>
        <p
          className="text-[11px] text-slate-400 leading-relaxed line-clamp-4 mt-2"
          dangerouslySetInnerHTML={{ __html: displaySnippet }}
        />
      </div>
      {item.publishedAt && (
        <div className="text-[9px] text-slate-500 mt-2">
          {item.publishedAt}
        </div>
      )}
    </div>
  );
}

export default App;
