'use strict';

const path = require('path');
const fp   = require('fastify-plugin');

// ── Static file serving ───────────────────────────────────────────────────────
// Serves the /public directory at the root URL prefix.
//
//   GET /icons/java.svg   → public/icons/java.svg
//   GET /icons/python.svg → public/icons/python.svg
//
// Language icons are referenced by the frontend as:
//   iconUrl = `/icons/${language.slug}.svg`
//
// The plugin is wrapped in fastify-plugin (fp) so it does NOT create a new
// Fastify scope — the decorated `app.sendFile()` helper is available globally.

const staticPlugin = async (app) => {
  app.register(require('@fastify/static'), {
    root:   path.join(__dirname, '..', '..', 'public'),
    prefix: '/',
    // Only serve known extensions for security (no directory traversal)
    serve:  true,
    // Return 404 (not an error) when a file is missing — lets other routes match
    wildcard: false,
  });
};

module.exports = fp(staticPlugin, {
  name:    'static',
  fastify: '4.x',
});
