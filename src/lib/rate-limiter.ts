interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class MemoryRateLimiter {
  private cache = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.resetTime) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  async isAllowed(
    identifier: string,
    limit: number,
    windowMs: number = 60 * 1000 // 1 minute default
  ): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
    const now = Date.now();
    const entry = this.cache.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.cache.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    if (entry.count >= limit) {
      return { allowed: false, resetTime: entry.resetTime };
    }

    entry.count++;
    return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

export const rateLimiter = new MemoryRateLimiter();

// Rate limiting middleware for AI endpoints
export async function checkAIRateLimit(userId: string, endpoint: string) {
  const identifier = `ai:${endpoint}:${userId}`;
  const limit = endpoint === 'full-plan' ? 3 : 10; // Different limits per endpoint
  const windowMs = 60 * 60 * 1000; // 1 hour window

  const result = await rateLimiter.isAllowed(identifier, limit, windowMs);
  
  if (!result.allowed) {
    throw new APIError(
      ErrorCode.RATE_LIMIT,
      `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime! - Date.now()) / 60000)} minutes`,
      429,
      { resetTime: result.resetTime }
    );
  }

  return result;
}