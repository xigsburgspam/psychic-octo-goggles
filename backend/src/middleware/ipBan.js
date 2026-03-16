/**
 * IP Ban middleware
 * Checks Redis for banned IPs before allowing socket connections
 */
const { getRedisClient } = require('../config/redis');

/**
 * Express middleware: block banned IPs on HTTP routes
 */
async function ipBanMiddleware(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!ip) return next();

  try {
    const redis = getRedisClient();
    const banned = await redis.get(`banned:${ip}`);
    if (banned) {
      return res.status(403).json({
        error: 'Your IP has been banned. Contact support if you believe this is an error.',
        code: 'IP_BANNED',
      });
    }
  } catch (err) {
    // If Redis fails, allow through (fail open)
  }
  next();
}

/**
 * Socket.IO middleware: disconnect banned IPs on connect
 */
async function socketBanMiddleware(socket, next) {
  const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  if (!ip) return next();

  try {
    const redis = getRedisClient();
    const banned = await redis.get(`banned:${ip}`);
    if (banned) {
      return next(new Error('IP_BANNED'));
    }
  } catch (err) {
    // Fail open
  }
  next();
}

module.exports = { ipBanMiddleware, socketBanMiddleware };
