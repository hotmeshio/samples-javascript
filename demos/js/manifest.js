/**
 * The js demo apps can't refer to the db list in manifest.ts,
 * so this provides config in a format usable for the
 * javascript test environment. In this case, always
 * load all database variants, so they're available for the demo.
 */
const USE_DRAGONFLY = true;
const USE_REDIS = true;
const USE_VALKEY = true;

const dbs = {
  redis: {
    name: 'Redis',
    label: 'redis/redis-stack7.2.0',
    search: true,
    config: {
      REDIS_DATABASE: 0,
      REDIS_HOST: USE_REDIS && 'redis' || undefined,
      REDIS_PORT: 6379,
      REDIS_USERNAME: '',
      REDIS_PASSWORD: 'key_admin',
      REDIS_USE_TLS: false,
    }
  },
  valkey: {
    name: 'ValKey',
    label: 'ValKey',
    search: false,
    config: {
      REDIS_DATABASE: 0,
      REDIS_HOST: USE_VALKEY && 'valkey' || undefined,
      REDIS_PORT: 6379,
      REDIS_USERNAME: '',
      REDIS_PASSWORD: 'key_admin',
      REDIS_USE_TLS: false,
    }
  },
  dragonfly: {
    name: 'Dragonfly',
    label: 'DragonflyDB',
    search: true,
    config: {
      REDIS_DATABASE: 0,
      REDIS_HOST: USE_DRAGONFLY && 'dragonflydb' || undefined,
      REDIS_PORT: 6379,
      REDIS_USERNAME: '',
      REDIS_PASSWORD: 'key_admin',
      REDIS_USE_TLS: false,
    }
  }
};

module.exports = {
  dbs
};
