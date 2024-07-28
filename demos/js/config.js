const Redis = require('redis');
const { dbs } = require('./manifest');

/**
 * Get the Redis configuration for the target database.
 * Override with process.env.DEMO_DB
 */
const getRedisConfig = (target = process.env.DEMO_DB || 'redis') => {
  return {
    class: Redis,
    options: {
      url: `redis://${dbs[target].config.REDIS_USERNAME}:${dbs[target].config.REDIS_PASSWORD}@${dbs[target].config.REDIS_HOST}:${dbs[target].config.REDIS_PORT}`
    }
  };
};

module.exports = {
  getRedisConfig
};
