/**
 * Simple structured logger
 * In production, replace with Winston or Pino
 */

const isDev = process.env.NODE_ENV !== 'production';

const colors = {
  info: '\x1b[36m',   // cyan
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
  success: '\x1b[32m', // green
  reset: '\x1b[0m',
};

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (msg, meta) => {
    if (isDev) console.log(`${colors.info}[INFO]${colors.reset} ${timestamp()} ${msg}`, meta || '');
    else console.log(JSON.stringify({ level: 'info', ts: timestamp(), msg, ...meta }));
  },
  warn: (msg, meta) => {
    if (isDev) console.warn(`${colors.warn}[WARN]${colors.reset} ${timestamp()} ${msg}`, meta || '');
    else console.warn(JSON.stringify({ level: 'warn', ts: timestamp(), msg, ...meta }));
  },
  error: (msg, meta) => {
    if (isDev) console.error(`${colors.error}[ERROR]${colors.reset} ${timestamp()} ${msg}`, meta || '');
    else console.error(JSON.stringify({ level: 'error', ts: timestamp(), msg, ...meta }));
  },
  success: (msg, meta) => {
    if (isDev) console.log(`${colors.success}[OK]${colors.reset} ${timestamp()} ${msg}`, meta || '');
    else console.log(JSON.stringify({ level: 'success', ts: timestamp(), msg, ...meta }));
  },
  socket: (event, socketId, data) => {
    if (isDev) console.log(`${colors.info}[SOCKET]${colors.reset} ${event} | ${socketId} |`, data || '');
  },
};

module.exports = logger;
