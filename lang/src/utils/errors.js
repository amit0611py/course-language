'use strict';

// Custom error factory — creates Fastify-compatible errors with statusCode.
// Usage: throw new NotFoundError('Topic not found: java.jvm.memory')

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
    this.name       = this.constructor.name;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

module.exports = { AppError, NotFoundError, BadRequestError, InternalError };
