import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight, Loader2, ArrowLeft, Send, Target, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getSessionId } from '../lib/session';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const CATEGORIES = [
  {
    title: 'Analyst Agents',
    nodes: [
      { id: 'webResearchAgent', label: 'Web Research' },
      { id: 'newsSentimentAgent', label: 'News & Sentiment' },
      { id: 'competitorAgent', label: 'Competitor Analysis' },
      { id: 'financialDataAgent', label: 'Financial Data Analysis' }
    ]
  },
  {
    title: 'Research Agents',
    nodes: [
      { id: 'resolveEntity', label: 'Resolving Entity' },
      { id: 'aggregator', label: 'Synthesizing Brief' }
    ]
  },
  {
    title: 'Risk Management Agents',
    nodes: [
      { id: 'analystAgent', label: 'Scoring Company' },
      { id: 'reflectionAgent', label: 'Reviewing Confidence' }
    ]
  },
  {
    title: 'Final Verdict',
    nodes: [
      { id: 'decisionAgent', label: 'Making Final Decision' },
      { id: 'reportGenerator', label: 'Generating Report' }
    ]
  }
];

export default function Dashboard() {
  const { runId } = useParams();
  const navigate = useNavigate();
  
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [activeNode, setActiveNode] = useState<string | null>('resolveEntity');
  const [reportData, setReportData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.title)));
  
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{q: string, a: string}[]>([]);
  const [asking, setAsking] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!runId) return;

    const sse = new EventSource(`${API_BASE}/research/${runId}/stream`);

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.status === 'failed') {
          setError(data.error || 'Pipeline failed');
          sse.close();
          return;
        }

        if (data.node === 'END') {
          sse.close();
          fetchReport();
          fetchChart();
          return;
        }

        setCompletedNodes(prev => new Set(prev).add(data.node));
        
        if (!completedNodes.has(data.node)) {
           setActiveNode(data.node);
        }

      } catch (e) {
        console.error(e);
      }
    };

    sse.onerror = () => {
      fetchReport();
      fetchChart();
      sse.close();
    };

    return () => sse.close();
  }, [runId]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`${API_BASE}/research/${runId}`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.error('Failed to fetch report', e);
    }
  };

  const fetchChart = async () => {
    try {
      const res = await fetch(`${API_BASE}/research/${runId}/chart`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setChartData(data.chart || data);
        setQuoteData(data.quote || null);
      }
    } catch (e) {
      console.error('Failed to fetch chart', e);
    }
  };

  useEffect(() => {
    if (runId) {
      fetchReport();
      fetchChart();
    }
  }, [runId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    
    const q = question;
    setQuestion('');
    setAsking(true);
    setChatHistory(prev => [...prev, { q, a: '' }]);

    try {
      const res = await fetch(`${API_BASE}/research/${runId}/followup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].a = data.answer || "Sorry, I couldn't process that.";
        return newHistory;
      });
    } catch (err) {
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].a = "Network error. Please try again.";
        return newHistory;
      });
    } finally {
      setAsking(false);
    }
  };

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) newSet.delete(title);
      else newSet.add(title);
      return newSet;
    });
  };

  const report = reportData?.report;
  const isInvest = report?.verdict === 'INVEST';
  const strategy = report?.tradingStrategy || {};

  const markdownContent = report ? `
${report.reasoning}

## Key Opportunities

${report.keyOpportunities.map((o: string) => `- **Bull Case**: ${o}`).join('\n')}

## Key Risks

${report.keyRisks.map((r: string) => `- **Bear Case**: ${r}`).join('\n')}

## Evaluation Rubric

- **Financial Health**: ${report.scores.financialHealth}/10
- **Growth Potential**: ${report.scores.growthPotential}/10
- **Moat**: ${report.scores.moat}/10
- **Market Sentiment**: ${report.scores.marketSentiment}/10
- **Risk Level**: ${report.scores.riskLevel}/10
` : null;

  // Find the friendly name of the active node
  let activeNodeLabel = "Initializing...";
  if (activeNode) {
    for (const cat of CATEGORIES) {
      const found = cat.nodes.find(n => n.id === activeNode);
      if (found) {
        activeNodeLabel = found.label + "...";
        break;
      }
    }
  }

  return (
    <div className="flex h-full bg-[#1a1c23] text-slate-300 font-sans overflow-hidden gap-6">
      
      {/* LEFT: Progress Sidebar */}
      <div className="w-96 shrink-0 flex flex-col h-full bg-[#1a1c23] pr-2 pb-4 overflow-y-auto hidden md:flex">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-6 pb-4 border-b border-[#2d3748]">
          <ArrowLeft size={16} /> <span className="font-semibold tracking-wider text-sm uppercase">Dashboard</span>
        </button>
        
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Progress</h2>
          <p className="text-emerald-400 text-sm mt-1 flex items-center gap-2 font-medium">
            {!report ? <><Loader2 size={14} className="animate-spin" /> {activeNodeLabel}</> : 'Analysis Complete'}
          </p>
        </div>

        {error && (
          <div className="text-rose-500 mb-4 text-sm bg-rose-500/10 p-3 rounded">
            Error: {error}
          </div>
        )}

        <div className="space-y-4">
          {CATEGORIES.map(category => (
            <div key={category.title} className="border border-[#2d3748] rounded-xl overflow-hidden bg-[#22252e]">
              <button 
                onClick={() => toggleCategory(category.title)}
                className="w-full flex items-center justify-between p-3 text-sm font-semibold text-emerald-500 hover:bg-[#2d3748] transition-colors"
              >
                {category.title}
                {expandedCategories.has(category.title) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {expandedCategories.has(category.title) && (
                <div className="p-3 space-y-3 bg-[#1e2128]">
                  {category.nodes.map(node => {
                    const isCompleted = completedNodes.has(node.id) || !!report;
                    const isActive = activeNode === node.id && !isCompleted && !report;
                    
                    return (
                      <div key={node.id} className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                            {node.label}
                          </span>
                          <span className={`text-xs ${isCompleted ? 'text-emerald-500' : isActive ? 'text-emerald-400/70 animate-pulse' : 'text-slate-600'}`}>
                            {isCompleted ? 'completed' : isActive ? 'running...' : 'pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MIDDLE: Main Content - Report & Chat */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-l border-[#2d3748] pl-6">
        {report ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-4 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-emerald-400">Final Trade Decision</h1>
                <div className="flex items-baseline gap-4 border border-[#2d3748] bg-[#22252e] px-4 py-2 rounded-xl">
                  <span className={`text-2xl font-bold ${isInvest ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {report.verdict}
                  </span>
                  <span className="text-slate-400 font-medium text-sm">
                    ({(report.confidence * 100).toFixed(0)}% Conf)
                  </span>
                </div>
              </div>

              <div className="border border-[#2d3748] bg-[#22252e] rounded-xl p-8 prose prose-invert prose-dark prose-lg max-w-none">
                <ReactMarkdown>{markdownContent || ''}</ReactMarkdown>
              </div>

              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="mt-8 space-y-6">
                  <h3 className="text-lg font-semibold text-slate-100 border-b border-[#2d3748] pb-2">Follow-up Discussion</h3>
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-end">
                        <div className="bg-emerald-600/20 text-emerald-100 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                          {chat.q}
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-[#2d3748] text-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%]">
                          {chat.a ? <div className="prose prose-invert prose-sm"><ReactMarkdown>{chat.a}</ReactMarkdown></div> : <Loader2 size={16} className="animate-spin text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="pt-4 border-t border-[#2d3748] pr-4 mt-auto shrink-0">
              <form onSubmit={handleAsk} className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a follow-up question about this company..."
                  className="w-full bg-[#22252e] border border-[#2d3748] rounded-xl py-4 pl-5 pr-14 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  disabled={asking}
                />
                <button
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white p-2 rounded-lg transition-colors"
                >
                  {asking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Loader2 size={48} className="animate-spin text-[#2d3748] mb-4" />
            <p className="text-lg">Running Research Pipeline...</p>
          </div>
        )}
      </div>

      {/* RIGHT: Trading Strategy & Graph */}
      {report && (
        <div className="w-[350px] lg:w-[400px] shrink-0 flex flex-col gap-6 h-full overflow-y-auto pr-2 pl-4 border-l border-[#2d3748]">
          
          <div className="border border-[#2d3748] bg-[#22252e] rounded-xl p-5 shadow-lg">
            <h3 className="text-slate-100 font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> Market Action
            </h3>
            <div className="h-48 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1c23', border: '1px solid #2d3748', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                  Loading chart...
                </div>
              )}
            </div>
            
            {quoteData && (
              <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-[#2d3748]">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Current</p>
                  <p className="font-bold text-slate-100 text-lg">${quoteData.regularMarketPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Open</p>
                  <p className="font-bold text-slate-100">${quoteData.regularMarketOpen?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Prev Close</p>
                  <p className="font-bold text-slate-100">${quoteData.regularMarketPreviousClose?.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border border-[#2d3748] bg-[#22252e] rounded-xl overflow-hidden shadow-lg">
            <div className="bg-[#1e2128] p-4 border-b border-[#2d3748]">
              <h3 className="text-slate-100 font-bold flex items-center gap-2">
                <Target size={18} className="text-emerald-500" /> Trading Strategy
              </h3>
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Entry Point</p>
                <p className="text-emerald-400 font-medium bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                  {strategy.entryPoint || 'Review current market conditions'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Exit / Target</p>
                <p className="text-rose-400 font-medium bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
                  {strategy.exitPoint || 'Set dynamic trailing stop'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#2d3748]">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} /> Short-term Strategy
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {strategy.shortTermStrategy || 'Hold and monitor key catalysts.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#2d3748]">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                  <ShieldCheck size={14} /> Long-term Strategy
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {strategy.longTermStrategy || 'Evaluate quarterly performance before adding to position.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
