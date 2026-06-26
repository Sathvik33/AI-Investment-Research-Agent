import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { History as HistoryIcon, TrendingUp } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Progress from './pages/Progress';
import Report from './pages/Report';

function App() {
  return (
    <Router>
      <div className="min-h-screen text-slate-300 font-sans" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <header className="relative z-50" style={{
          background: 'rgba(9, 9, 11, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div className="max-w-[1600px] w-full px-6 mx-auto flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(255, 255, 255, 0.05)' }}>
                <TrendingUp size={16} className="text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                <span className="gradient-text">AI</span>{' '}
                <span className="text-slate-300 font-medium">Investment Research</span>
              </h1>
            </Link>
            <Link
              to="/history"
              className="flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-all duration-300 text-sm px-4 py-2 rounded-lg hover:bg-white/5"
            >
              <HistoryIcon size={16} /> History
            </Link>
          </div>
        </header>
        <main className="max-w-[1600px] w-full mx-auto p-4 md:p-6 h-[calc(100vh-64px)]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/progress/:runId" element={<Dashboard />} />
            <Route path="/report/:runId" element={<Dashboard />} />
            <Route path="/v1/progress/:runId" element={<Progress />} />
            <Route path="/v1/report/:runId" element={<Report />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
