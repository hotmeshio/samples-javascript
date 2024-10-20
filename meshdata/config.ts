import * as Redis from 'redis';

import { databases } from '../web/utils/meshdata';

/**
 * verify user-provided target database. if invalid, use the first available
 */
const findFirstAvailableDb = (target: string) => {
  if (target && databases[target]?.config.REDIS_HOST) {
    return target;
  }
  return Object.keys(databases).find((key) => databases[key].config.REDIS_HOST);
}

/**
 * Get the Redis configuration for the target database.
 * Override with process.env.DEMO_DB
 */
export const getRedisConfig = (target = process.env.DEMO_DB || 'redis') => {
  target = findFirstAvailableDb(target);
  const dbConfig = databases[target].config;
  const protocol = dbConfig.REDIS_USE_TLS ? 'rediss' : 'redis';
  const url = `${protocol}://${dbConfig.REDIS_USERNAME ?? ''}:${dbConfig.REDIS_PASSWORD}@${dbConfig.REDIS_HOST}:${dbConfig.REDIS_PORT}`;
  return {
    class: Redis,
    options: {
      url: url
    }
  };
};
