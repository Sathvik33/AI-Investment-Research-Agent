export function getSessionId(): string {
  const SESSION_KEY = 'inside-iim-session-id';
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}
