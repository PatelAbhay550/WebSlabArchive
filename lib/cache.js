/**
 * Simple in-memory cache with TTL to reduce Turso reads.
 * On Vercel serverless each cold start gets a fresh cache,
 * but within a warm instance repeated requests are served from memory.
 */

const store = new Map();

const DEFAULT_TTL = 60_000; // 1 minute

/**
 * Get a cached value. Returns undefined if missing or expired.
 */
export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Set a cached value with optional TTL in ms.
 */
export function cacheSet(key, value, ttl = DEFAULT_TTL) {
  store.set(key, { value, expires: Date.now() + ttl });
}

/**
 * Delete a specific cache key (use after mutations).
 */
export function cacheDel(key) {
  store.delete(key);
}

/**
 * Delete all keys matching a prefix (e.g. "archives:" or "archive:").
 */
export function cacheInvalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}
