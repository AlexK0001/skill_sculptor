// Service Worker для offline функціонала
export class OfflineStorage {
  private dbName = 'skillsculptor-offline';
  private version = 1;

  async saveForOffline(key: string, data: any) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save offline data:', error);
    }
  }

  async getOfflineData(key: string, maxAge = 24 * 60 * 60 * 1000) {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (!stored) return null;

      const { data, timestamp } = JSON.parse(stored);
      
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(`offline_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to get offline data:', error);
      return null;
    }
  }
}

export const offlineStorage = new OfflineStorage();