import { getSessionId } from './session';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function startResearch(companyName: string, force?: boolean, ticker?: string): Promise<{ runId: string, cached?: boolean }> {
  const res = await fetch(`${API_BASE}/research`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-session-id': getSessionId()
    },
    body: JSON.stringify({ companyName, force, ticker })
  });
  if (!res.ok) throw new Error('Failed to start research');
  return res.json();
}

export async function getReport(runId: string) {
  const res = await fetch(`${API_BASE}/research/${runId}`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

export async function getCompanyReports(companyId: string) {
  const res = await fetch(`${API_BASE}/companies/${companyId}/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function askFollowup(runId: string, question: string): Promise<string> {
  const res = await fetch(`${API_BASE}/research/${runId}/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!res.ok) throw new Error('Failed to ask followup');
  const data = await res.json();
  return data.answer;
}
