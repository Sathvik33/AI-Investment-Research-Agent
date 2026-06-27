import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, Clock, FileText, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { getSessionId } from '../lib/session';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function History() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/companies`, {
      headers: { 'x-session-id': getSessionId() }
    })
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this research history?')) return;
    try {
      const res = await fetch(`${API_BASE}/companies/${id}`, { 
        method: 'DELETE',
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        setCompanies(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm group">
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> New Analysis
        </button>
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5 tracking-tight">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center" style={{ boxShadow: '0 0 15px rgba(255, 255, 255, 0.05)' }}>
            <Clock size={14} className="text-white" />
          </div>
          Research History
        </h2>
      </div>

      <div className="glass-card-strong overflow-hidden flex-1 flex flex-col" style={{ boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)' }}>
        {loading ? (
          <div className="p-12 flex justify-center flex-1 items-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-zinc-400 w-8 h-8" />
              <p className="text-sm text-slate-500">Loading history...</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-float" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Search size={28} className="text-slate-600" />
            </div>
            <p className="text-base font-medium text-slate-400 mb-1">No research history yet</p>
            <p className="text-sm text-slate-600">Start your first analysis from the home page.</p>
          </div>
        ) : (
          <ul className="divide-y overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {companies.map((company, idx) => {
              const lastRun = company.runs?.[0];
              const report = lastRun?.reports?.[0];
              
              if (!report) {
                const isRunning = lastRun?.status === 'running';
                return (
                  <li key={company.id} className="transition-all duration-300" style={{ animation: `slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 50}ms both` }}>
                    <div className="p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Loader2 size={18} className={`text-slate-500 ${isRunning ? 'animate-spin' : ''}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-400">{company.name}</h3>
                        <p className="text-xs text-slate-600 mt-0.5">{isRunning ? 'Analysis in progress...' : 'Analysis failed or incomplete'}</p>
                      </div>
                    </div>
                  </li>
                );
              }

              const isInvest = report.verdict === 'INVEST';

              return (
                <li key={company.id} className="transition-all duration-300 hover:bg-white/2" style={{ animation: `slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 50}ms both` }}>
                  <button 
                    onClick={() => navigate(`/report/${lastRun.id}`)}
                    className="w-full text-left p-5 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={isInvest ? { background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.12)' } : { background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
                        {isInvest ? <TrendingUp size={18} className="text-emerald-400" /> : <TrendingDown size={18} className="text-rose-400" />}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-zinc-300 transition-colors flex items-center gap-2">
                          {company.name}
                          {company.ticker && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md text-zinc-300" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                              {company.ticker}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <FileText size={11} /> 
                          {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isInvest ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {report.verdict}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(report.confidence * 100).toFixed(0)}% Conf
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, company.id)}
                        className="p-2 text-slate-600 hover:text-rose-400 rounded-lg transition-all hover:bg-rose-400/5"
                        title="Delete History"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
