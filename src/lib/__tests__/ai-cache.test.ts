// src/lib/__tests__/ai-cache.test.ts
import {
  getFromCache,
  saveToCache,
  getCacheStats,
  clearCache,
} from '../ai-cache';

describe('AI Cache System', () => {
  beforeEach(() => {
    // Очищаємо cache перед кожним тестом
    clearCache();
  });

  test('should save and retrieve data from cache', () => {
    const testData = { learningPlan: ['Task 1', 'Task 2'] };
    const input = { mood: 'happy', dailyPlans: 'study' };

    // Зберігаємо в cache
    saveToCache('daily-plan', input, testData);

    // Отримуємо з cache
    const cached = getFromCache('daily-plan', input);

    expect(cached).toEqual(testData);
  });

  test('should return null for non-existent cache entry', () => {
    const input = { mood: 'happy', dailyPlans: 'study' };
    const cached = getFromCache('daily-plan', input);

    expect(cached).toBeNull();
  });

  test('should normalize input keys for cache', () => {
    const testData = { learningPlan: ['Task 1'] };

    // Зберігаємо з одним порядком ключів
    saveToCache('daily-plan', { mood: 'happy', dailyPlans: 'study' }, testData);

    // Отримуємо з іншим порядком ключів - повинно працювати
    const cached = getFromCache('daily-plan', { dailyPlans: 'study', mood: 'happy' });

    expect(cached).toEqual(testData);
  });

  test('should be case-insensitive for string values', () => {
    const testData = { learningPlan: ['Task 1'] };

    saveToCache('daily-plan', { mood: 'Happy', dailyPlans: 'STUDY' }, testData);

    // Різний регістр - повинно працювати
    const cached = getFromCache('daily-plan', { mood: 'happy', dailyPlans: 'study' });

    expect(cached).toEqual(testData);
  });

  test('should track cache statistics', () => {
    const testData = { learningPlan: ['Task 1'] };
    const input = { mood: 'happy', dailyPlans: 'study' };

    saveToCache('daily-plan', input, testData);

    const stats = getCacheStats();

    expect(stats.totalEntries).toBe(1);
    expect(stats.byType['daily-plan']).toBeDefined();
    expect(stats.byType['daily-plan'].entries).toBe(1);
  });

  test('should increment hit counter on cache access', () => {
    const testData = { learningPlan: ['Task 1'] };
    const input = { mood: 'happy', dailyPlans: 'study' };

    saveToCache('daily-plan', input, testData);

    // Отримуємо з cache 3 рази
    getFromCache('daily-plan', input);
    getFromCache('daily-plan', input);
    getFromCache('daily-plan', input);

    const stats = getCacheStats();

    expect(stats.byType['daily-plan'].hits).toBe(3);
  });

  test('should handle multiple cache types', () => {
    saveToCache('daily-plan', { mood: 'happy' }, { plan: 'A' });
    saveToCache('full-plan', { goal: 'learning' }, { plan: 'B' });

    const stats = getCacheStats();

    expect(stats.totalEntries).toBe(2);
    expect(stats.byType['daily-plan']).toBeDefined();
    expect(stats.byType['full-plan']).toBeDefined();
  });

  test('should clear all cache', () => {
    saveToCache('daily-plan', { mood: 'happy' }, { plan: 'A' });
    saveToCache('full-plan', { goal: 'learning' }, { plan: 'B' });

    clearCache();

    const stats = getCacheStats();
    expect(stats.totalEntries).toBe(0);
  });
});