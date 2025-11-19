import pino from 'pino';

/**
 * Logger instance for the application
 *
 * In development, uses pino-pretty in browser mode (no worker threads)
 * In production, outputs JSON for structured logging
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  browser: {
    asObject: false,
  },
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        // Development: simple stdout logging without worker threads
        formatters: {
          level: (label) => {
            return { level: label.toUpperCase() };
          },
        },
      }),
});

