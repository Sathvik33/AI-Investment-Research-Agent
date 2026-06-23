import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport, askFollowup } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, ArrowLeft, ExternalLink, MessageSquare, Send } from 'lucide-react';

export default function Report() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Followup state
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chat, setChat] = useState<{role: 'user'|'assistant', content: string}[]>([]);

  useEffect(() => {
    if (!runId) return;
    getReport(runId)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [runId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;
  if (error) return <div className="text-red-500 text-center py-20">Error: {error}</div>;
  if (!data || !data.report) return <div className="text-center py-20">Report not found or not completed.</div>;

  const { report, findings } = data;
  const isInvest = report.verdict === 'INVEST';

  const chartData = [
    { name: 'Financial Health', score: report.scores.financialHealth },
    { name: 'Growth Potential', score: report.scores.growthPotential },
    { name: 'Moat', score: report.scores.moat },
    { name: 'Market Sentiment', score: report.scores.marketSentiment },
    { name: 'Risk Level', score: report.scores.riskLevel }
  ];

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    const userQ = question;
    setChat(prev => [...prev, { role: 'user', content: userQ }]);
    setQuestion('');
    setAsking(true);
    
    try {
      const answer = await askFollowup(runId!, userQ);
      setChat(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err: any) {
      setChat(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6">
        <ArrowLeft size={16} /> New Analysis
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        {/* Header */}
        <div className={`p-8 border-b ${isInvest ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Final Verdict</h2>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-1.5 rounded-full text-lg font-bold tracking-wide ${
                  isInvest ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {report.verdict}
                </span>
                <span className="text-slate-600 font-medium">
                  Confidence: {(report.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="prose prose-slate max-w-none mb-10">
            <h3 className="text-xl font-bold mb-4">Reasoning</h3>
            <p className="text-lg leading-relaxed text-slate-700">{report.reasoning}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Key Opportunities</h3>
              <ul className="space-y-2">
                {report.keyOpportunities.map((opp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="text-emerald-500 mt-1">✦</span> {opp}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Key Risks</h3>
              <ul className="space-y-2">
                {report.keyRisks.map((risk: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="text-rose-500 mt-1">✦</span> {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Evaluation Rubric</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Citations */}
          {findings && findings.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Sources</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-h-48 overflow-y-auto">
                <ul className="space-y-3">
                  {findings.flatMap((f: any) => f.citations).map((c: any, i: number) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="font-semibold text-slate-800">{c.source}:</span>
                      <span>{c.description}</span>
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                          Link <ExternalLink size={12} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Followup Chat */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <MessageSquare className="text-blue-600" />
          <h3 className="font-bold text-slate-900">Follow-up Questions</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {chat.length === 0 && (
              <p className="text-slate-400 italic">Ask any questions about the report or raw data.</p>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {asking && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-2xl bg-slate-100 text-slate-500 rounded-bl-none flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={asking}
            />
            <button
              type="submit"
              disabled={!question.trim() || asking}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-3 rounded-xl transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
