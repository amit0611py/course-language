'use strict';

const fp = require('fastify-plugin');
const { Pool } = require('pg');
const config = require('../config');

// Registers a shared pg.Pool on fastify.db
// All repositories receive db via fastify.db in route handlers.

const postgresPlugin = async (fastify) => {
  const pool = new Pool({
    connectionString: config.database.connectionString,
    ...config.database.pool,
  });

  // Verify connection on startup
  const client = await pool.connect();
  fastify.log.info('PostgreSQL connected');
  client.release();

  // Decorate fastify instance so all routes/services access fastify.db
  fastify.decorate('db', pool);

  // Clean shutdown
  fastify.addHook('onClose', async () => {
    await pool.end();
    fastify.log.info('PostgreSQL pool closed');
  });
};

// fastify-plugin: unwraps encapsulation so fastify.db is visible app-wide
module.exports = fp(postgresPlugin, {
  name: 'postgres',
  fastify: '4.x',
});
