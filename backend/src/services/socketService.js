/**
 * Addagle Socket Service
 * 
 * Handles:
 * - Random user matching (with interest-based priority)
 * - WebRTC signaling (offer/answer/ICE)
 * - Real-time text chat
 * - Typing indicators
 * - Skip / disconnect logic
 * - Basic moderation
 */

const { getRedisClient } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const { moderateMessage } = require('./moderationService');
const { matchingService } = require('./matchingService');
const { socketBanMiddleware } = require('../middleware/ipBan');
const { sanitizeText, sanitizeInterests, sanitizeNickname } = require('../utils/sanitize');
const logger = require('../utils/logger');

// Track active connections in memory
const activeUsers = new Map();       // socketId -> userData
const activePairs = new Map();       // socketId -> partnerSocketId
const waitingUsers = new Map();      // socketId -> { interests, mode, joinedAt }

/**
 * Main socket handler setup
 */
function setupSocketHandlers(io) {
  // Attach io to matching service
  matchingService.setIO(io);

  // Apply IP ban middleware to all socket connections
  io.use(socketBanMiddleware);

  io.on('connection', (socket) => {
    const clientIp = socket.handshake.headers['x-forwarded-for'] 
      || socket.handshake.address;

    logger.socket('connect', socket.id, { ip: clientIp });

    // ─── User Registration ─────────────────────────────────────────────────
    socket.on('user:register', (data) => {
      const userData = {
        socketId: socket.id,
        userId: data.userId || null,
        nickname: sanitizeNickname(data.nickname) || `User_${socket.id.slice(0, 4)}`,
        interests: sanitizeInterests(data.interests || []),
        mode: ['text', 'video'].includes(data.mode) ? data.mode : 'text',
        language: String(data.language || 'en').slice(0, 5),
        ip: clientIp,
        joinedAt: Date.now(),
        isBanned: false,
      };

      activeUsers.set(socket.id, userData);
      socket.emit('user:registered', { socketId: socket.id, nickname: userData.nickname });

      // Update stats
      io.emit('stats:update', { onlineCount: activeUsers.size });
    });

    // ─── Start Chat / Find Partner ─────────────────────────────────────────
    socket.on('chat:find', async (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'Please register first' });
        return;
      }

      // Update interests if provided
      if (data?.interests) {
        user.interests = data.interests.map(i => i.toLowerCase().trim());
      }
      if (data?.mode) {
        user.mode = data.mode;
      }

      // Remove from any existing pair
      await disconnectFromPartner(socket, io);

      // Add to waiting queue
      waitingUsers.set(socket.id, {
        ...user,
        lookingFor: data.mode || user.mode,
      });

      socket.emit('chat:searching', { message: 'Looking for a stranger...' });

      // Attempt to match
      await attemptMatch(socket, io);
    });

    // ─── WebRTC Signaling ──────────────────────────────────────────────────

    // Relay WebRTC offer to partner
    socket.on('webrtc:offer', (data) => {
      const partnerId = activePairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('webrtc:offer', {
          offer: data.offer,
          from: socket.id,
        });
      }
    });

    // Relay WebRTC answer to partner
    socket.on('webrtc:answer', (data) => {
      const partnerId = activePairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('webrtc:answer', {
          answer: data.answer,
          from: socket.id,
        });
      }
    });

    // Relay ICE candidates to partner
    socket.on('webrtc:ice-candidate', (data) => {
      const partnerId = activePairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('webrtc:ice-candidate', {
          candidate: data.candidate,
          from: socket.id,
        });
      }
    });

    // ─── Text Chat ─────────────────────────────────────────────────────────
    socket.on('chat:message', async (data) => {
      const user = activeUsers.get(socket.id);
      const partnerId = activePairs.get(socket.id);

      if (!user || !partnerId) {
        socket.emit('error', { message: 'No active chat session' });
        return;
      }

      // Sanitize & moderate message
      const { clean, flagged, reason } = await moderateMessage(data.text);

      if (flagged) {
        socket.emit('chat:warning', {
          message: 'Your message was flagged and not sent.',
          reason,
        });
        // Log violation
        handleViolation(socket.id, user.ip, reason, io);
        return;
      }

      const message = {
        id: uuidv4(),
        text: clean,
        from: socket.id,
        nickname: user.nickname,
        timestamp: Date.now(),
        type: 'message',
      };

      // Send to partner
      io.to(partnerId).emit('chat:message', message);
      // Confirm send to sender
      socket.emit('chat:message:sent', message);
    });

    // ─── Typing Indicators ─────────────────────────────────────────────────
    socket.on('chat:typing', (data) => {
      const partnerId = activePairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('chat:typing', {
          isTyping: data.isTyping,
          from: socket.id,
        });
      }
    });

    // ─── Skip / Next ───────────────────────────────────────────────────────
    socket.on('chat:skip', async () => {
      await disconnectFromPartner(socket, io);
      // Immediately look for new partner
      const user = activeUsers.get(socket.id);
      if (user) {
        waitingUsers.set(socket.id, user);
        socket.emit('chat:searching', { message: 'Looking for a new stranger...' });
        await attemptMatch(socket, io);
      }
    });

    // ─── Stop Chat ─────────────────────────────────────────────────────────
    socket.on('chat:stop', async () => {
      await disconnectFromPartner(socket, io);
      waitingUsers.delete(socket.id);
      socket.emit('chat:stopped');
    });

    // ─── Report User ───────────────────────────────────────────────────────
    socket.on('user:report', async (data) => {
      const reportedId = activePairs.get(socket.id);
      if (!reportedId) return;

      const reporter = activeUsers.get(socket.id);
      const reported = activeUsers.get(reportedId);

      if (reported) {
        await saveReport({
          reporterId: reporter?.userId || socket.id,
          reportedId: reported?.userId || reportedId,
          reportedSocketId: reportedId,
          reportedIp: reported?.ip,
          reason: data.reason || 'inappropriate_content',
          description: data.description || '',
          timestamp: Date.now(),
        });

        socket.emit('report:submitted', { message: 'Report submitted. Thank you.' });
      }
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      await disconnectFromPartner(socket, io);
      waitingUsers.delete(socket.id);
      activeUsers.delete(socket.id);

      // Update stats
      io.emit('stats:update', { onlineCount: activeUsers.size });
    });
  });

  // Periodic match sweeper — runs every 2 seconds
  setInterval(() => {
    sweepWaitingUsers(io);
  }, 2000);

  console.log('✅ Socket handlers initialized');
}

/**
 * Attempt to match a socket with a waiting user
 */
async function attemptMatch(socket, io) {
  const user = waitingUsers.get(socket.id);
  if (!user) return;

  // Find best match from waiting users
  const match = matchingService.findMatch(socket.id, waitingUsers);

  if (!match) {
    // No match found yet — stay in queue
    return;
  }

  const partnerSocket = io.sockets.sockets.get(match.socketId);
  if (!partnerSocket) {
    waitingUsers.delete(match.socketId);
    return;
  }

  // Pair them
  activePairs.set(socket.id, match.socketId);
  activePairs.set(match.socketId, socket.id);
  waitingUsers.delete(socket.id);
  waitingUsers.delete(match.socketId);

  const sharedInterests = user.interests.filter(i =>
    match.interests.includes(i)
  );

  // Notify both users
  const pairData = {
    pairId: uuidv4(),
    mode: user.mode,
    sharedInterests,
    timestamp: Date.now(),
  };

  socket.emit('chat:connected', {
    ...pairData,
    isInitiator: true,   // This user creates the WebRTC offer
    partnerNickname: match.nickname,
  });

  partnerSocket.emit('chat:connected', {
    ...pairData,
    isInitiator: false,
    partnerNickname: user.nickname,
  });
}

/**
 * Disconnect a user from their current partner
 */
async function disconnectFromPartner(socket, io) {
  const partnerId = activePairs.get(socket.id);

  if (partnerId) {
    // Notify partner
    io.to(partnerId).emit('chat:partner_disconnected', {
      message: 'Your partner has disconnected.',
    });

    // Clean up pairs
    activePairs.delete(partnerId);
    activePairs.delete(socket.id);
  }
}

/**
 * Periodic sweep of waiting users to attempt matches
 */
function sweepWaitingUsers(io) {
  if (waitingUsers.size < 2) return;

  const userIds = [...waitingUsers.keys()];

  for (const userId of userIds) {
    if (!waitingUsers.has(userId)) continue;

    const socket = io.sockets.sockets.get(userId);
    if (!socket) {
      waitingUsers.delete(userId);
      continue;
    }

    attemptMatch(socket, io);
  }
}

/**
 * Handle content violations
 */
async function handleViolation(socketId, ip, reason, io) {
  const redis = getRedisClient();
  const key = `violations:${ip}`;

  try {
    const count = parseInt(await redis.get(key) || '0') + 1;
    await redis.set(key, String(count), { EX: 3600 }); // 1 hour window

    if (count >= 3) {
      // Auto-ban the IP
      await redis.set(`banned:${ip}`, '1', { EX: 86400 }); // 24h ban
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('user:banned', {
          message: 'You have been banned for repeated violations.',
          duration: '24 hours',
        });
        socket.disconnect();
      }
    }
  } catch (err) {
    console.error('Violation tracking error:', err);
  }
}

/**
 * Save report to DB (graceful if DB unavailable)
 */
async function saveReport(data) {
  try {
    const Report = require('../models/Report');
    await Report.create(data);
  } catch (err) {
    console.warn('Could not save report to DB:', err.message);
    // Log to console as fallback
    console.log('[REPORT]', JSON.stringify(data));
  }
}

module.exports = { setupSocketHandlers, activeUsers, activePairs, waitingUsers };
