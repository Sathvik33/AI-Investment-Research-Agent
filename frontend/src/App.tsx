import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { History as HistoryIcon } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import History from './pages/History';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#1a1c23] text-slate-300 font-sans">
        <header className="bg-[#22252e] border-b border-[#2d3748] py-4 px-6 shadow-sm">
          <div className="max-w-[1600px] w-full px-4 mx-auto flex items-center justify-between">
            <Link to="/">
              <h1 className="text-xl font-bold tracking-tight text-slate-100 hover:text-emerald-400 transition-colors">
                <span className="text-emerald-500">AI</span> Investment Research
              </h1>
            </Link>
            <Link to="/history" className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 font-medium transition-colors">
              <HistoryIcon size={18} /> History
            </Link>
          </div>
        </header>
        <main className="max-w-[1600px] w-full mx-auto p-4 md:p-6 h-[calc(100vh-73px)]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/progress/:runId" element={<Dashboard />} />
            <Route path="/report/:runId" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
