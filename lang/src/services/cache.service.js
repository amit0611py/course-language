'use strict';

// Thin wrapper around ioredis.
// All cache reads/writes go through here so TTLs and serialization are consistent.

const get = async (redis, key) => {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Corrupted cache entry — treat as miss
    await redis.del(key);
    return null;
  }
};

const set = async (redis, key, value, ttlSeconds) => {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.set(key, serialized, 'EX', ttlSeconds);
  } else {
    await redis.set(key, serialized);
  }
};

const del = async (redis, key) => {
  await redis.del(key);
};

// SCAN-based pattern delete — avoids KEYS which blocks Redis.
// Safe for production; use only for publish/invalidation events (low frequency).
const delPattern = async (redis, pattern) => {
  let cursor = '0';
  let deleted = 0;
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor, 'MATCH', pattern, 'COUNT', '100'
    );
    cursor = nextCursor;
    if (keys.length) {
      await redis.del(...keys);
      deleted += keys.length;
    }
  } while (cursor !== '0');
  return deleted;
};

// Convenience: read from cache, fall through to loader fn on miss, write result back
const getOrSet = async (redis, key, ttlSeconds, loaderFn) => {
  const cached = await get(redis, key);
  if (cached !== null) return cached;

  const value = await loaderFn();
  if (value !== null && value !== undefined) {
    await set(redis, key, value, ttlSeconds);
  }
  return value;
};

module.exports = { get, set, del, delPattern, getOrSet };
