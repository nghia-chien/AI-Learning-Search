import React, { useState } from 'react';
import { Search, Globe, Video, FileText, ExternalLink, AlertTriangle, Key, RefreshCw, Database, CheckCircle2 } from 'lucide-react';

interface SearchItem {
  title: string;
  url: string;
  snippet: string;
  thumbnail?: string;
  publishedAt?: string;
}

interface SearchResponse {
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

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
        body: JSON.stringify({ query }),
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Search API Demo: <span className="text-indigo-400">Tavily Web, YouTube & PDF</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Hệ thống gọi API trực tiếp từ Tavily Search API & YouTube Data API v3. 
            Tự động lưu trữ tất cả kết quả 3 cột vào <strong>Supabase PostgreSQL Database</strong>.
          </p>
        </header>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
          <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-xl focus-within:border-indigo-500 transition">
            <Search className="w-6 h-6 text-slate-400 ml-3 mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm (ví dụ: React reconciliation, Machine Learning, Python tutorial)..."
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
                  <span>Đang tìm & Lưu...</span>
                </>
              ) : (
                <span>Tìm & Lưu vào Supabase</span>
              )}
            </button>
          </div>
        </form>

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
              Hệ thống tuyệt đối <strong>không sử dụng Mock Data</strong>. Cần thêm các biến sau vào <code className="bg-slate-900 px-2 py-1 rounded text-amber-300 font-mono">backend/.env</code>:
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
                  <span className="font-semibold">Đã kết nối Supabase PostgreSQL Database (Bảng search_results)</span>
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
                  <span>Chưa thêm <code className="text-indigo-300 font-mono">DATABASE_URL</code> trong .env (Kết quả chưa lưu vào Supabase DB)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results 3-Column Grid */}
        {results && (
          <div className="space-y-4 pt-2">
            <div className="text-sm text-slate-400 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Kết quả tìm kiếm cho từ khóa: <strong className="text-indigo-300">"{searchedQuery}"</strong></span>
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300">Tối đa 3 liên kết / Cột</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Tavily Web Search */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5 text-blue-400 font-bold">
                    <Globe className="w-5 h-5" />
                    <h2>Tavily Search (Web)</h2>
                  </div>
                  {results.dbConnected && results.web.length > 0 && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Saved DB
                    </span>
                  )}
                </div>

                {results.web.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Chưa có kết quả web.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {results.web.map((item, idx) => (
                      <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 hover:border-blue-500/50 transition">
                        <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800/40">
                          #{idx + 1} Web Link
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-100 hover:text-blue-400 transition flex items-start justify-between gap-2"
                        >
                          <span className="line-clamp-2">{item.title}</span>
                          <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        </a>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                          {item.snippet}
                        </p>
                      </div>
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
                  {results.dbConnected && results.youtube.length > 0 && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Saved DB
                    </span>
                  )}
                </div>

                {results.youtube.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Chưa có kết quả video.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {results.youtube.map((item, idx) => (
                      <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 hover:border-red-500/50 transition">
                        {item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-28 object-cover rounded-lg mb-2"
                          />
                        )}
                        <span className="text-[10px] font-mono bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800/40">
                          #{idx + 1} YouTube Video {item.publishedAt && `• ${item.publishedAt}`}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-100 hover:text-red-400 transition flex items-start justify-between gap-2"
                        >
                          <span className="line-clamp-2">{item.title}</span>
                          <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        </a>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                          {item.snippet}
                        </p>
                      </div>
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
                  {results.dbConnected && results.pdf.length > 0 && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Saved DB
                    </span>
                  )}
                </div>

                {results.pdf.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Chưa có kết quả PDF.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {results.pdf.map((item, idx) => (
                      <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 hover:border-emerald-500/50 transition">
                        <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40">
                          #{idx + 1} PDF File
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-100 hover:text-emerald-400 transition flex items-start justify-between gap-2"
                        >
                          <span className="line-clamp-2">{item.title}</span>
                          <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        </a>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                          {item.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
