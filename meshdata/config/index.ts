import * as Redis from 'redis';
import { Types } from '@hotmeshio/hotmesh';

import { dbs } from '../manifest';

/**
 * Get the Redis configuration for the target database.
 * Override with process.env.DEMO_DB
 */
export const getRedisConfig = (target = process.env.DEMO_DB || 'redis'): Types.ConnectionConfig => {
  return {
    class: Redis,
    options: {
      url: `redis://${dbs[target].config.REDIS_USERNAME}:${dbs[target].config.REDIS_PASSWORD}@${dbs[target].config.REDIS_HOST}:${dbs[target].config.REDIS_PORT}`
    }
  };
};
