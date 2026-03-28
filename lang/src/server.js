'use strict';

const buildApp = require('./app');
const config   = require('./config');

const start = async () => {
  const app = buildApp();

  try {
    await app.listen({ port: config.server.port, host: config.server.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
