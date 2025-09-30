// src/lib/ai-cache.ts - AI RESPONSE CACHING SYSTEM
/**
 * Simple in-memory cache for AI responses to reduce API costs
 * Cache expires after 24 hours by default
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  hits: number;
};

type CacheStats = {
  totalEntries: number;
  totalHits: number;
  byType: Record<string, { entries: number; hits: number }>;
};

class AICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate cache key from input object
   */
  private generateKey(type: string, input: Record<string, any>): string {
    const normalized = JSON.stringify(
      Object.entries(input)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce((acc, [key, value]) => {
          acc[key] = typeof value === 'string' ? value.toLowerCase().trim() : value;
          return acc;
        }, {} as Record<string, any>)
    );
    return `${type}:${normalized}`;
  }

  /**
   * Get cached response if available and not expired
   */
  get<T>(type: string, input: Record<string, any>): T | null {
    const key = this.generateKey(type, input);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit counter
    entry.hits++;
    console.log(`[AI Cache HIT] Type: ${type}, Hits: ${entry.hits}`);
    
    return entry.data as T;
  }

  /**
   * Save response to cache
   */
  set<T>(type: string, input: Record<string, any>, data: T): void {
    const key = this.generateKey(type, input);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });

    console.log(`[AI Cache SET] Type: ${type}, Total entries: ${this.cache.size}`);
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`[AI Cache] Cleared ${cleared} expired entries`);
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const stats: CacheStats = {
      totalEntries: this.cache.size,
      totalHits: 0,
      byType: {},
    };

    for (const [key, entry] of this.cache.entries()) {
      const type = key.split(':')[0];
      
      stats.totalHits += entry.hits;
      
      if (!stats.byType[type]) {
        stats.byType[type] = { entries: 0, hits: 0 };
      }
      
      stats.byType[type].entries++;
      stats.byType[type].hits += entry.hits;
    }

    return stats;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('[AI Cache] Cleared all entries');
  }
}

// Singleton instance
const cacheInstance = new AICache();

// Auto-cleanup every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    cacheInstance.clearExpired();
  }, 60 * 60 * 1000);
}

// Export helper functions
export function getFromCache<T>(type: string, input: Record<string, any>): T | null {
  return cacheInstance.get<T>(type, input);
}

export function saveToCache<T>(type: string, input: Record<string, any>, data: T): void {
  cacheInstance.set(type, input, data);
}

export function getCacheStats(): CacheStats {
  return cacheInstance.getStats();
}

export function clearCache(): void {
  cacheInstance.clear();
}

export function clearExpiredCache(): number {
  return cacheInstance.clearExpired();
}