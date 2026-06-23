import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startResearch } from '../lib/api';
import { Search, Loader2, Building2, ChevronRight, Globe2 } from 'lucide-react';

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
    setSearchResults(null); // Close search results
    
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
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-xl w-full bg-[#22252e] p-8 rounded-2xl shadow-lg border border-[#2d3748] text-center transition-all duration-300">
        
        {!searchResults ? (
          <>
            <div className="w-16 h-16 bg-[#1a1c23] border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Search size={32} />
            </div>
            <h2 className="text-3xl font-bold text-slate-100 mb-4">Start Investment Research</h2>
            <p className="text-slate-400 mb-8">
              Enter a company name below. Our multi-agent AI pipeline will perform deep fundamental, news, and competitor analysis to provide an INVEST or PASS verdict.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Nvidia, Stripe, SpaceX..."
                className="w-full px-5 py-4 text-lg bg-[#1a1c23] border border-[#2d3748] text-slate-100 placeholder-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                disabled={isSearching || loading}
              />
              {error && <p className="text-rose-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={!companyName.trim() || isSearching || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-emerald-500/50 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSearching || loading ? <Loader2 className="animate-spin" /> : 'Search Company'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setSearchResults(null)}
              className="text-emerald-500 text-sm font-semibold mb-6 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              ← Back to Search
            </button>
            
            <h3 className="text-xl font-bold text-slate-100 mb-2">Select the exact company</h3>
            <p className="text-slate-400 text-sm mb-6">We found multiple matches for "{companyName}". Please select the correct ticker to ensure accurate financial data.</p>
            
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {searchResults.map((company, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStartResearch(company.shortname || company.symbol, company.symbol)}
                  className="w-full bg-[#1a1c23] border border-[#2d3748] hover:border-emerald-500/50 hover:bg-[#1e2128] rounded-xl p-4 flex items-center justify-between group transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#2d3748]/50 rounded-lg flex items-center justify-center text-emerald-400">
                      <Globe2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {company.shortname || company.symbol}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        <span className="font-semibold text-slate-300">{company.symbol}</span>
                        <span>•</span>
                        <span>{company.exchange}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-500 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}

              <button
                onClick={() => handleStartResearch(companyName)}
                className="w-full bg-[#1a1c23] border border-dashed border-[#2d3748] hover:border-emerald-500/50 hover:bg-[#1e2128] rounded-xl p-4 flex items-center justify-between group transition-all text-left mt-2"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      Research "{companyName}" directly
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Select this if the company is private, a startup, or unlisted.
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-500 group-hover:text-emerald-500 transition-colors" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
