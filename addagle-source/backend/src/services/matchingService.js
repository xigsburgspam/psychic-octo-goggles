/**
 * Addagle Matching Service
 * 
 * Algorithm:
 * 1. Priority: users with shared interests
 * 2. Same mode (text/video)
 * 3. Fallback: oldest waiting user (FIFO)
 * 
 * Scoring:
 * - +10 per shared interest
 * - +5 for same mode
 * - +1 per second waiting (encourages matching long-waiters)
 */

let _io = null;

const matchingService = {
  setIO(io) {
    _io = io;
  },

  /**
   * Find the best match for a given socket from the waiting pool
   * @param {string} mySocketId 
   * @param {Map} waitingUsers 
   * @returns {object|null} matched user data or null
   */
  findMatch(mySocketId, waitingUsers) {
    const me = waitingUsers.get(mySocketId);
    if (!me) return null;

    let bestMatch = null;
    let bestScore = -Infinity;

    for (const [socketId, user] of waitingUsers.entries()) {
      // Skip self
      if (socketId === mySocketId) continue;

      // Calculate compatibility score
      const score = this.calculateScore(me, user);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { socketId, ...user };
      }
    }

    return bestMatch;
  },

  /**
   * Calculate compatibility score between two users
   */
  calculateScore(userA, userB) {
    let score = 0;

    // Shared interests boost
    const sharedInterests = (userA.interests || []).filter(
      i => (userB.interests || []).includes(i)
    );
    score += sharedInterests.length * 10;

    // Same mode preference
    if (userA.mode === userB.mode) {
      score += 5;
    }

    // Waiting time bonus (max 30 points for waiting 30s)
    const waitingSeconds = Math.min(
      (Date.now() - (userB.joinedAt || Date.now())) / 1000,
      30
    );
    score += waitingSeconds;

    // Language match bonus
    if (userA.language && userA.language === userB.language) {
      score += 3;
    }

    return score;
  },

  /**
   * Get queue statistics
   */
  getStats(waitingUsers) {
    const textWaiters = [];
    const videoWaiters = [];

    for (const [, user] of waitingUsers.entries()) {
      if (user.mode === 'video') videoWaiters.push(user);
      else textWaiters.push(user);
    }

    return {
      totalWaiting: waitingUsers.size,
      textWaiting: textWaiters.length,
      videoWaiting: videoWaiters.length,
    };
  },
};

module.exports = { matchingService };
