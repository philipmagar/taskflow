/**
 * Simple In-Memory Cache with TTL (Time-To-Live)
 * Stores data temporarily to reduce repeated database queries.
 * Auto-expires old data based on configurable TTL.
 */

class Cache {
  constructor(defaultTTL = 60) {
    // defaultTTL in seconds
    this.store = new Map();
    this.defaultTTL = defaultTTL * 1000; // Convert to milliseconds
  }

  /**
   * Get a value from cache
   * @param {String} key - Cache key
   * @returns {*} Cached value or null if expired/missing
   */
  get(key) {
    const entry = this.store.get(key);

    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in cache
   * @param {String} key - Cache key
   * @param {*} value - Value to store
   * @param {Number|null} ttl - Time-to-live in seconds (overrides default)
   */
  set(key, value, ttl = null) {
    const expiresAt = Date.now() + (ttl ? ttl * 1000 : this.defaultTTL);

    this.store.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Delete a specific key from cache
   * @param {String} key - Cache key to delete
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Delete all cache entries matching a pattern prefix
   * Useful for invalidating all task caches for a user
   * @param {String} prefix - Key prefix to match
   */
  deleteByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get current cache size
   * @returns {Number}
   */
  size() {
    return this.store.size;
  }

  /**
   * Remove all expired entries (manual cleanup)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// Export a singleton instance with 60-second default TTL
module.exports = new Cache();
