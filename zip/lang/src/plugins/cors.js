'use strict';

const fp   = require('fastify-plugin');
const cors = require('@fastify/cors');

const corsPlugin = async (fastify) => {
  await fastify.register(cors, {
    // In production, replace with exact frontend origin(s)
    origin:      process.env.CORS_ORIGIN ?? true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
    credentials: false,
    maxAge:      86400, // preflight cache: 1 day
  });
};

module.exports = fp(corsPlugin, { name: 'cors' });
