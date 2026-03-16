/**
 * Redis connection configuration
 * Used for: session matching queue, ban list, rate limiting
 */
const { createClient } = require('redis');

let client = null;

// In-memory fallback when Redis is not available
const memoryStore = new Map();

const memoryClient = {
  isReady: false,
  get: async (key) => memoryStore.get(key) || null,
  set: async (key, value, opts) => {
    memoryStore.set(key, value);
    if (opts?.EX) {
      setTimeout(() => memoryStore.delete(key), opts.EX * 1000);
    }
    return 'OK';
  },
  del: async (key) => { memoryStore.delete(key); return 1; },
  sAdd: async (key, val) => {
    const set = memoryStore.get(key) || new Set();
    set.add(val);
    memoryStore.set(key, set);
    return 1;
  },
  sRem: async (key, val) => {
    const set = memoryStore.get(key);
    if (set) set.delete(val);
    return 1;
  },
  sMembers: async (key) => {
    const set = memoryStore.get(key);
    return set ? [...set] : [];
  },
  lPush: async (key, val) => {
    const list = memoryStore.get(key) || [];
    list.unshift(val);
    memoryStore.set(key, list);
    return list.length;
  },
  rPop: async (key) => {
    const list = memoryStore.get(key) || [];
    if (list.length === 0) return null;
    const val = list.pop();
    memoryStore.set(key, list);
    return val;
  },
  lLen: async (key) => {
    return (memoryStore.get(key) || []).length;
  },
  exists: async (key) => memoryStore.has(key) ? 1 : 0,
  expire: async () => 1,
  keys: async (pattern) => [...memoryStore.keys()].filter(k => {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(k);
  }),
};

async function connectRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    client = createClient({ url });

    client.on('error', (err) => {
      console.warn('Redis error (using memory fallback):', err.message);
    });

    await Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);

    console.log('✅ Redis connected');
    return client;
  } catch (error) {
    console.warn('⚠️  Redis unavailable — using in-memory store');
    client = memoryClient;
    return client;
  }
}

function getRedisClient() {
  return client || memoryClient;
}

module.exports = connectRedis;
module.exports.getRedisClient = getRedisClient;
