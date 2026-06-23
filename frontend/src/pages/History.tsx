import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, Clock, FileText, Trash2 } from 'lucide-react';
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
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors">
          <ArrowLeft size={16} /> New Analysis
        </button>
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Clock size={24} className="text-emerald-500" /> Research History
        </h2>
      </div>

      <div className="bg-[#22252e] rounded-2xl shadow-lg border border-[#2d3748] overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="p-12 flex justify-center flex-1 items-center"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center flex-1">
            <Search size={48} className="text-[#2d3748] mb-4" />
            <p className="text-lg">No past research found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#2d3748] overflow-y-auto">
            {companies.map(company => {
              const lastRun = company.runs?.[0];
              const report = lastRun?.reports?.[0];
              
              if (!report) return null;

              return (
                <li key={company.id} className="hover:bg-[#2a2d38] transition-colors">
                  <button 
                    onClick={() => navigate(`/report/${lastRun.id}`)}
                    className="w-full text-left p-6 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        {company.name}
                        {company.ticker && <span className="text-sm font-medium px-2 py-0.5 bg-[#1a1c23] text-emerald-400 rounded border border-[#2d3748]">{company.ticker}</span>}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                        <FileText size={14} /> 
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-bold ${report.verdict === 'INVEST' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {report.verdict}
                        </p>
                        <p className="text-sm text-slate-400">
                          {(report.confidence * 100).toFixed(0)}% Confidence
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, company.id)}
                        className="ml-4 p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete History"
                      >
                        <Trash2 size={20} />
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
