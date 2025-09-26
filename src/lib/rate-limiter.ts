// src/lib/rate-limiter.ts - AI RATE LIMITING
import { APP_CONFIG } from './constants';

interface RateLimitRecord {
  count: number;
  resetTime: number;
  lastRequest: number;
}

// In-memory store (use Redis in production)
const aiRateLimitStore = new Map<string, RateLimitRecord>();

export async function checkAIRateLimit(
  userId: string, 
  endpoint: string = 'ai-general'
): Promise<void> {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const windowMs = APP_CONFIG.RATE_LIMIT_WINDOW; // 15 minutes
  const maxRequests = APP_CONFIG.AI_RATE_LIMIT_MAX; // 10 requests
  
  let record = aiRateLimitStore.get(key);
  
  // Reset if window expired
  if (!record || now > record.resetTime) {
    record = { 
      count: 0, 
      resetTime: now + windowMs,
      lastRequest: now 
    };
  }
  
  // Check if too many requests
  if (record.count >= maxRequests) {
    const resetIn = Math.ceil((record.resetTime - now) / 1000);
    throw new Error(`Too many AI requests. Please try again in ${resetIn} seconds.`);
  }
  
  // Update record
  record.count++;
  record.lastRequest = now;
  aiRateLimitStore.set(key, record);
}

// Clean up expired records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of aiRateLimitStore.entries()) {
    if (now > record.resetTime + 60000) { // 1 minute buffer
      aiRateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

export function getRateLimitStatus(userId: string, endpoint: string = 'ai-general') {
  const key = `${userId}:${endpoint}`;
  const record = aiRateLimitStore.get(key);
  const now = Date.now();
  
  if (!record || now > record.resetTime) {
    return {
      remaining: APP_CONFIG.AI_RATE_LIMIT_MAX,
      resetTime: now + APP_CONFIG.RATE_LIMIT_WINDOW,
      count: 0
    };
  }
  
  return {
    remaining: Math.max(0, APP_CONFIG.AI_RATE_LIMIT_MAX - record.count),
    resetTime: record.resetTime,
    count: record.count
  };
}

// Make it async to match usage in route
export async function getRateLimitStatusAsync(userId: string, endpoint: string = 'ai-general') {
  return getRateLimitStatus(userId, endpoint);
}