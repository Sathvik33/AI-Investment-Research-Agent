import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight, Loader2, ArrowLeft, Send, Target, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, Circle, Zap } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
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

  // Count completed for progress
  const totalNodes = CATEGORIES.reduce((sum, cat) => sum + cat.nodes.length, 0);
  const completedCount = report ? totalNodes : completedNodes.size;
  const progressPercent = Math.round((completedCount / totalNodes) * 100);

  return (
    <div className="flex h-full text-slate-300 overflow-hidden gap-0">
      
      {/* LEFT: Progress Sidebar */}
      <div className="w-72 shrink-0 hidden md:flex flex-col h-full pr-2 pb-4 overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <ArrowLeft size={14} /> <span className="font-semibold tracking-wider text-xs uppercase">New Analysis</span>
        </button>
        
        {/* Progress Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-white tracking-tight">Pipeline Progress</h2>
            <span className="text-xs font-semibold gradient-text">{progressPercent}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full gradient-bg transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-xs mt-2 flex items-center gap-1.5">
            {!report ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" /><span className="text-zinc-300 font-medium">{activeNodeLabel}</span></>
            ) : (
              <><CheckCircle2 size={12} className="text-emerald-400" /><span className="text-emerald-400 font-medium">Analysis Complete</span></>
            )}
          </p>
        </div>

        {error && (
          <div className="text-rose-400 mb-4 text-xs p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            {error}
          </div>
        )}

        <div className="space-y-3">
          {CATEGORIES.map(category => (
            <div key={category.title} className="glass-card overflow-hidden">
              <button 
                onClick={() => toggleCategory(category.title)}
                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <span className="uppercase tracking-wider">{category.title}</span>
                {expandedCategories.has(category.title) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              {expandedCategories.has(category.title) && (
                <div className="px-3 pb-3 space-y-1.5">
                  {category.nodes.map(node => {
                    const isCompleted = completedNodes.has(node.id) || !!report;
                    const isActive = activeNode === node.id && !isCompleted && !report;
                    
                    return (
                      <div key={node.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-300" style={isActive ? { background: 'rgba(255, 255, 255, 0.06)' } : {}}>
                        <div className="flex items-center gap-2.5">
                          {isCompleted ? (
                            <div className="animate-scale-in">
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            </div>
                          ) : isActive ? (
                            <div className="relative">
                              <div className="w-3.5 h-3.5 rounded-full gradient-bg animate-pulse" />
                              <div className="absolute inset-0 w-3.5 h-3.5 rounded-full gradient-bg opacity-40" style={{ animation: 'pulse-ring 1.5s ease-out infinite' }} />
                            </div>
                          ) : (
                            <Circle size={14} className="text-slate-600" />
                          )}
                          <span className={`text-xs font-medium transition-colors ${isActive ? 'text-zinc-300' : isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                            {node.label}
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isCompleted ? 'text-emerald-400/60' : isActive ? 'text-zinc-300/60' : 'text-slate-700'}`}>
                          {isCompleted ? 'done' : isActive ? 'running' : 'pending'}
                        </span>
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
      <div className="flex-1 flex flex-col h-full overflow-hidden px-6">
        {report ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-4">
              {/* Verdict Header */}
              <div className="flex items-center justify-between mb-6 mt-1">
                <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Zap size={20} className="text-zinc-300" />
                  Final Trade Decision
                </h1>
                <div className="flex items-baseline gap-3 glass-card px-5 py-2.5" style={isInvest ? { boxShadow: '0 0 30px rgba(16, 185, 129, 0.1)' } : { boxShadow: '0 0 30px rgba(239, 68, 68, 0.1)' }}>
                  <span className={`text-xl font-extrabold tracking-tight ${isInvest ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {report.verdict}
                  </span>
                  <span className="text-slate-500 font-medium text-xs">
                    {(report.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
              </div>

              {/* Report Content */}
              <div className="glass-card p-8 prose prose-invert prose-dark max-w-none" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
                <ReactMarkdown>{markdownContent || ''}</ReactMarkdown>
              </div>

              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Follow-up Discussion</h3>
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-end">
                        <div className="px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm text-white" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(16,185,129,0.15))', border: '1px solid rgba(6,182,212,0.15)' }}>
                          {chat.q}
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm">
                          {chat.a ? <div className="prose prose-invert prose-sm prose-dark"><ReactMarkdown>{chat.a}</ReactMarkdown></div> : <Loader2 size={14} className="animate-spin text-zinc-300" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="pt-4 pr-2 mt-auto shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <form onSubmit={handleAsk} className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a follow-up question about this company..."
                  className="input-glass w-full py-3.5 pl-5 pr-14 text-sm"
                  disabled={asking}
                />
                <button
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 gradient-bg-hover text-white p-2 rounded-lg transition-all disabled:opacity-30"
                >
                  {asking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Loading State */
          <div className="h-full flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center animate-float" style={{ boxShadow: '0 0 40px rgba(255, 255, 255, 0.2)' }}>
                <Loader2 size={28} className="animate-spin text-white" />
              </div>
            </div>
            <p className="text-base font-semibold text-white mb-1">Running Research Pipeline</p>
            <p className="text-sm text-slate-500">{activeNodeLabel}</p>
          </div>
        )}
      </div>

      {/* RIGHT: Trading Strategy & Graph */}
      {report && (
        <div className="w-[340px] lg:w-[380px] shrink-0 flex flex-col h-full overflow-hidden pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-8">
            <div className="flex flex-col gap-5">

              {/* Stock Chart Card */}
              <div className="glass-card overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
                <div className="p-4 pb-0">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4">
                    <TrendingUp size={14} className="text-zinc-300" /> Market Action
                  </h3>
                </div>
                <div className="h-44 w-full px-2">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip
                          contentStyle={{ 
                            background: 'rgba(10, 14, 26, 0.95)', 
                            border: '1px solid rgba(255,255,255,0.08)', 
                            borderRadius: '10px',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            fontSize: '12px',
                            color: '#f1f5f9'
                          }}
                          itemStyle={{ color: '#22c55e' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} fill="url(#chartGradient)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                      <Loader2 size={16} className="animate-spin mr-2" /> Loading chart...
                    </div>
                  )}
                </div>
                
                {quoteData && (() => {
                  const sym = quoteData.currency === 'INR' ? '₹' : (quoteData.currency === 'EUR' ? '€' : (quoteData.currency === 'GBP' ? '£' : '$'));
                  return (
                    <div className="flex items-center justify-between text-xs p-4 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Current</p>
                        <p className="font-bold text-white text-base">{sym}{quoteData.regularMarketPrice?.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Open</p>
                        <p className="font-semibold text-slate-200">{sym}{quoteData.regularMarketOpen?.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Prev Close</p>
                        <p className="font-semibold text-slate-200">{sym}{quoteData.regularMarketPreviousClose?.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Trading Strategy Card */}
              <div className="glass-card overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Target size={14} className="text-zinc-300" /> Trading Strategy
                  </h3>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Entry Point</p>
                    <p className="text-zinc-300 font-medium text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                      {strategy.entryPoint || 'Review current market conditions'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Exit / Target</p>
                    <p className="text-rose-400 font-medium text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
                      {strategy.exitPoint || 'Set dynamic trailing stop'}
                    </p>
                  </div>

                  <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                      <AlertTriangle size={10} /> Short-term Strategy
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {strategy.shortTermStrategy || 'Hold and monitor key catalysts.'}
                    </p>
                  </div>

                  <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                      <ShieldCheck size={10} /> Long-term Strategy
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {strategy.longTermStrategy || 'Evaluate quarterly performance before adding to position.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
