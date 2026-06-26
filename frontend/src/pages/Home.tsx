import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startResearch } from '../lib/api';
import { Search, Loader2, Building2, ChevronRight, Globe2, Sparkles, BarChart3, Shield } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Home() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    
    setIsSearching(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/research/search?q=${encodeURIComponent(companyName)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data);
    } catch (err: any) {
      console.error(err);
      // Fallback directly to analysis if search fails
      handleStartResearch(companyName);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartResearch = async (name: string, ticker?: string) => {
    setLoading(true);
    setError('');
    setSearchResults(null);
    
    try {
      const res = await startResearch(name, false, ticker);
      if (res.cached) {
        navigate(`/report/${res.runId}`);
      } else {
        navigate(`/progress/${res.runId}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      {/* Background gradients removed for cleaner aesthetic */}

      <div className="relative z-10 max-w-xl w-full">
        {!searchResults ? (
          <div className="animate-fade-in">
            {/* Hero Text */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-4 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Sparkles size={12} />
                Multi-Agent AI Research Pipeline
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                Investment
                <span className="gradient-text"> Intelligence</span>
              </h2>
              <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
                9 specialized AI agents collaborate in real-time to deliver institutional-grade research verdicts.
              </p>
            </div>

            {/* Search Card */}
            <div className="glass-card-strong p-8" style={{ boxShadow: '0 0 60px rgba(255, 255, 255, 0.02), 0 25px 50px rgba(0, 0, 0, 0.4)' }}>
              {/* Search Icon */}
              <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6 animate-float" style={{ boxShadow: '0 0 30px rgba(255, 255, 255, 0.05)' }}>
                <Search size={24} className="text-white" />
              </div>

              <form onSubmit={handleSearch} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Search any company — Nvidia, Stripe, SpaceX..."
                  className="input-glass w-full px-5 py-4 text-base"
                  disabled={isSearching || loading}
                />
                {error && <p className="text-red-400 text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{error}</p>}
                <button
                  type="submit"
                  disabled={!companyName.trim() || isSearching || loading}
                  className="w-full gradient-bg-hover text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:transform-none disabled:shadow-none"
                >
                  {isSearching || loading ? <Loader2 className="animate-spin" size={20} /> : <>Analyze Company <ChevronRight size={18} /></>}
                </button>
              </form>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {[
                { icon: BarChart3, label: 'Live Financials' },
                { icon: Globe2, label: 'Web Research' },
                { icon: Shield, label: 'Risk Analysis' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-slate-500 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Icon size={12} className="text-slate-400" /> {label}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Search Results */
          <div className="animate-slide-up">
            <button 
              onClick={() => setSearchResults(null)}
              className="text-zinc-300 text-sm font-semibold mb-6 hover:text-white transition-colors flex items-center gap-1.5 group"
            >
              <ChevronRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-1" /> Back to Search
            </button>
            
            <div className="glass-card-strong p-6" style={{ boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)' }}>
              <h3 className="text-xl font-bold text-white mb-1">Select the exact company</h3>
              <p className="text-slate-400 text-sm mb-6">We found multiple matches for "{companyName}". Select the correct ticker for accurate data.</p>
              
              <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                {searchResults.map((company, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStartResearch(company.shortname || company.symbol, company.symbol)}
                    className="w-full glass-card glass-card-hover p-4 flex items-center justify-between group text-left"
                    style={{ animationDelay: `${idx * 60}ms`, animation: `slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 60}ms both` }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <Globe2 size={18} className="text-zinc-300" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-100 group-hover:text-white transition-colors text-sm">
                          {company.shortname || company.symbol}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-zinc-400/80">{company.symbol}</span>
                          <span className="text-slate-600">•</span>
                          <span>{company.exchange}</span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-all group-hover:translate-x-0.5" />
                  </button>
                ))}

                <button
                  onClick={() => handleStartResearch(companyName)}
                  className="w-full p-4 flex items-center justify-between group text-left rounded-2xl transition-all duration-300 hover:bg-white/3 mt-2"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Building2 size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-100 group-hover:text-white transition-colors text-sm">
                        Research "{companyName}" directly
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Private, startup, or unlisted company
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-all group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
