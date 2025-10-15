/**
 * Caching service using node-cache
 */
import NodeCache from 'node-cache';
import { config } from '../config';
import { logger } from '../utils/logger';

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cacheTTL,
      checkperiod: config.cacheTTL * 0.2,
      useClones: false,
    });

    this.cache.on('set', (key, _value) => {
      logger.debug('Cache set', { key });
    });

    this.cache.on('expired', (key, _value) => {
      logger.debug('Cache expired', { key });
    });
  }

  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      logger.debug('Cache hit', { key });
    } else {
      logger.debug('Cache miss', { key });
    }
    return value;
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || config.cacheTTL);
  }

  delete(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  getStats() {
    return this.cache.getStats();
  }
}

export const cacheService = new CacheService();

