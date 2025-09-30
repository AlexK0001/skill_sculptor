// src/lib/ai-cache.ts - AI RESPONSE CACHING
import crypto from 'crypto';

interface CacheEntry {
  data: any;
  timestamp: number;
  hits: number;
}

// In-memory cache (use Redis in production)
const aiCache = new Map<string, CacheEntry>();

// Cache TTL configurations
const CACHE_TTL = {
  'daily-plan': 2 * 60 * 60 * 1000, // 2 hours - daily plans
  'full-plan': 24 * 60 * 60 * 1000, // 24 hours - full plans
  'resources': 7 * 24 * 60 * 60 * 1000, // 7 days - resource lists
} as const;

// Generate cache key from input
function generateCacheKey(type: string, input: any): string {
  const normalized = JSON.stringify(input, Object.keys(input).sort());
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  return `${type}:${hash}`;
}

// Get from cache
export function getFromCache<T>(type: keyof typeof CACHE_TTL, input: any): T | null {
  const key = generateCacheKey(type, input);
  const entry = aiCache.get(key);
  
  if (!entry) return null;
  
  const now = Date.now();
  const ttl = CACHE_TTL[type];
  
  // Check if expired
  if (now - entry.timestamp > ttl) {
    aiCache.delete(key);
    return null;
  }
  
  // Increment hit counter
  entry.hits++;
  
  console.log(`[AI Cache HIT] ${type} - hits: ${entry.hits}`);
  return entry.data as T;
}

// Save to cache
export function saveToCache<T>(type: keyof typeof CACHE_TTL, input: any, data: T): void {
  const key = generateCacheKey(type, input);
  
  aiCache.set(key, {
    data,
    timestamp: Date.now(),
    hits: 0
  });
  
  console.log(`[AI Cache SAVE] ${type}`);
  
  // Cleanup old entries if cache gets too large
  if (aiCache.size > 1000) {
    cleanupCache();
  }
}

// Clear cache for specific type
export function clearCacheForType(type: keyof typeof CACHE_TTL): void {
  let cleared = 0;
  for (const [key] of aiCache.entries()) {
    if (key.startsWith(`${type}:`)) {
      aiCache.delete(key);
      cleared++;
    }
  }
  console.log(`[AI Cache CLEAR] ${type} - cleared ${cleared} entries`);
}

// Cleanup old entries
function cleanupCache(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of aiCache.entries()) {
    const type = key.split(':')[0] as keyof typeof CACHE_TTL;
    const ttl = CACHE_TTL[type] || CACHE_TTL['daily-plan'];
    
    if (now - entry.timestamp > ttl) {
      aiCache.delete(key);
      cleaned++;
    }
  }
  
  console.log(`[AI Cache CLEANUP] Removed ${cleaned} expired entries`);
}

// Get cache stats
export function getCacheStats() {
  let totalHits = 0;
  const stats: Record<string, { count: number; hits: number }> = {};
  
  for (const [key, entry] of aiCache.entries()) {
    const type = key.split(':')[0];
    if (!stats[type]) {
      stats[type] = { count: 0, hits: 0 };
    }
    stats[type].count++;
    stats[type].hits += entry.hits;
    totalHits += entry.hits;
  }
  
  return {
    totalEntries: aiCache.size,
    totalHits,
    byType: stats
  };
}

// Periodic cleanup
setInterval(cleanupCache, 10 * 60 * 1000); // Every 10 minutes