import { Request, Response, NextFunction } from 'express';

interface RateLimitData {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RateLimitData>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 8;

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers['x-session-id'] as string;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  const key = sessionId || ip;
  const now = Date.now();

  let limitData = requestCounts.get(key);

  if (!limitData || now > limitData.resetTime) {
    // Start a new window
    limitData = { count: 1, resetTime: now + WINDOW_MS };
  } else {
    limitData.count++;
  }

  requestCounts.set(key, limitData);

  if (limitData.count > MAX_REQUESTS) {
    res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: `You have reached the maximum limit of ${MAX_REQUESTS} requests per minute. Please try again later.`
    });
    return;
  }

  next();
};

// Periodically clean up expired entries to prevent memory leak on long-running servers
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
