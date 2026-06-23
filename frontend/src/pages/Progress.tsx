import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

const NODES = [
  { id: 'resolveEntity', label: 'Resolving Entity' },
  { id: 'webResearchAgent', label: 'Web Research' },
  { id: 'financialDataAgent', label: 'Financial Data Analysis' },
  { id: 'newsSentimentAgent', label: 'News & Sentiment' },
  { id: 'competitorAgent', label: 'Competitor Analysis' },
  { id: 'aggregator', label: 'Synthesizing Brief' },
  { id: 'analystAgent', label: 'Scoring Company' },
  { id: 'reflectionAgent', label: 'Reviewing Confidence' },
  { id: 'decisionAgent', label: 'Making Final Decision' },
  { id: 'reportGenerator', label: 'Generating Report' }
];

export default function Progress() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [activeNode, setActiveNode] = useState<string | null>('resolveEntity');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
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
          // Short delay for UX
          setTimeout(() => navigate(`/report/${runId}`), 1000);
          return;
        }

        setCompletedNodes(prev => new Set(prev).add(data.node));
        
        // Find next active node
        const currentIndex = NODES.findIndex(n => n.id === data.node);
        if (currentIndex !== -1 && currentIndex < NODES.length - 1) {
          setActiveNode(NODES[currentIndex + 1].id);
        }
      } catch (e) {
        console.error(e);
      }
    };

    sse.onerror = () => {
      setError('Lost connection to server');
      sse.close();
    };

    return () => sse.close();
  }, [runId, navigate]);

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" />
          Research in Progress
        </h2>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {NODES.map((node) => {
            const isCompleted = completedNodes.has(node.id);
            const isActive = activeNode === node.id && !isCompleted;
            
            return (
              <div 
                key={node.id} 
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  isActive ? 'bg-blue-50 border border-blue-100' : 'bg-transparent border border-transparent'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="text-emerald-500 w-6 h-6" />
                ) : isActive ? (
                  <Loader2 className="animate-spin text-blue-600 w-6 h-6" />
                ) : (
                  <Circle className="text-slate-300 w-6 h-6" />
                )}
                <span className={`text-lg font-medium ${
                  isCompleted ? 'text-slate-500' : isActive ? 'text-blue-800' : 'text-slate-400'
                }`}>
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
