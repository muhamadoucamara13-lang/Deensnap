
export const getFromCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { value, expiry } = JSON.parse(cached);
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return value as T;
  } catch (e) {
    console.error("Cache read error:", e);
    return null;
  }
};

export const saveToCache = <T>(key: string, value: T, ttlSeconds: number = 86400 * 7): void => { // Default 7 days
  try {
    const expiry = Date.now() + (ttlSeconds * 1000);
    localStorage.setItem(key, JSON.stringify({ value, expiry }));
  } catch (e) {
    console.error("Cache write error:", e);
  }
};

export const generateCacheKey = (prefix: string, data: string): string => {
  // Simple hash function for long strings
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `${prefix}_${hash}`;
};
