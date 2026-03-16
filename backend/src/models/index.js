/**
 * Mongoose models for Addagle
 */
const mongoose = require('mongoose');

// ─── User Model ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  nickname: { type: String, required: true, trim: true, maxlength: 30 },
  email: { type: String, sparse: true, lowercase: true },
  googleId: { type: String, sparse: true },
  avatar: { type: String, default: null },
  interests: [{ type: String, trim: true, lowercase: true }],
  language: { type: String, default: 'en' },
  isAnonymous: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: null },
  banExpires: { type: Date, default: null },
  violationCount: { type: Number, default: 0 },
  totalChats: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
});

userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

// ─── Report Model ─────────────────────────────────────────────────────────────
const reportSchema = new mongoose.Schema({
  reporterId: { type: String, required: true },
  reportedId: { type: String, required: true },
  reportedSocketId: { type: String },
  reportedIp: { type: String },
  reason: {
    type: String,
    enum: ['inappropriate_content', 'harassment', 'spam', 'nudity', 'hate_speech', 'other'],
    required: true,
  },
  description: { type: String, maxlength: 500 },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'actioned', 'dismissed'],
    default: 'pending',
  },
  adminNotes: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

reportSchema.index({ status: 1 });
reportSchema.index({ reportedId: 1 });

// ─── Ban Model ────────────────────────────────────────────────────────────────
const banSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  userId: { type: String, default: null },
  reason: { type: String, required: true },
  bannedBy: { type: String, default: 'system' },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

banSchema.index({ ip: 1 });
banSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Chat Session Model (for analytics) ──────────────────────────────────────
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  participants: [{ type: String }], // socket IDs or user IDs
  mode: { type: String, enum: ['text', 'video'], default: 'text' },
  sharedInterests: [String],
  messageCount: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // in seconds
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  flagged: { type: Boolean, default: false },
});

sessionSchema.index({ startedAt: -1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
const Ban = mongoose.models.Ban || mongoose.model('Ban', banSchema);
const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', sessionSchema);

module.exports = { User, Report, Ban, ChatSession };
