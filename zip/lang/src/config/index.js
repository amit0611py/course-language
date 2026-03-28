'use strict';

require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.PORT ?? '3001', 10),
    host: process.env.HOST ?? '0.0.0.0',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    logLevel: process.env.LOG_LEVEL ?? 'info',
  },
  database: {
    connectionString:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/content_engine',
    pool: {
      min: 2,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6380',
  },
  cache: {
    ttl: {
      topic:    parseInt(process.env.CACHE_TTL_TOPIC    ?? '1800',  10),
      nav:      parseInt(process.env.CACHE_TTL_NAV      ?? '3600',  10),
      language: parseInt(process.env.CACHE_TTL_LANGUAGE ?? '86400', 10),
      project:  parseInt(process.env.CACHE_TTL_PROJECT  ?? '1800',  10),
    },
  },
  rateLimit: {
    max: 200,
    timeWindow: '1 minute',
  },
};

module.exports = config;
