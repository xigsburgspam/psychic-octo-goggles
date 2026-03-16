# Addagle 🌐

> **A modern anonymous random chat platform** — Talk to strangers. Make connections.

Addagle is an Omegle-inspired random chat web application with improved safety, modern UI, and smart features. Connect instantly with strangers worldwide via text or video chat.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Interest Matching** | Match with people who share your interests. Fallback to random if no match found. |
| 📹 **Video Chat** | WebRTC peer-to-peer video with camera & microphone controls |
| 💬 **Text Chat** | Real-time messaging with emoji support, typing indicators, timestamps |
| 🛡️ **AI Moderation** | Automatic content filtering with profanity detection and pattern matching |
| 🚩 **Report System** | Report bad actors. Auto-ban on repeated violations. |
| 💡 **Icebreakers** | AI-generated conversation starters based on shared interests |
| ⬇️ **Chat Export** | Download full chat history as `.txt` |
| 🌙 **Dark/Light Mode** | System-aware theme switching |
| 📱 **Responsive** | Mobile-first design that works on all screen sizes |
| 🔒 **Anonymous** | No sign-up required. Zero personal data stored by default. |

---

## 🏗️ Architecture

```
addagle/
├── frontend/               # Next.js React app
│   ├── src/
│   │   ├── pages/          # Next.js pages
│   │   │   ├── index.js    # Landing page
│   │   │   ├── chat.js     # Main chat experience
│   │   │   ├── profile.js  # User preferences
│   │   │   ├── safety.js   # Community guidelines
│   │   │   └── admin.js    # Admin dashboard
│   │   ├── components/
│   │   │   ├── chat/       # ChatPanel, SearchingOverlay, ChatControls
│   │   │   ├── video/      # VideoPanel (WebRTC)
│   │   │   └── ui/         # ReportModal, shared UI
│   │   ├── lib/
│   │   │   ├── socket.js   # Socket.IO client singleton
│   │   │   ├── webrtc.js   # WebRTC peer connection manager
│   │   │   └── store.js    # Zustand global state
│   │   └── styles/
│   │       └── globals.css # Design tokens, glassmorphism
│   └── Dockerfile
│
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── server.js       # Entry point (Express + Socket.IO)
│   │   ├── config/
│   │   │   ├── database.js # MongoDB connection
│   │   │   └── redis.js    # Redis connection (with memory fallback)
│   │   ├── services/
│   │   │   ├── socketService.js    # Core socket handlers
│   │   │   ├── matchingService.js  # Interest-based matching algorithm
│   │   │   └── moderationService.js # Content moderation
│   │   ├── routes/
│   │   │   ├── auth.js     # Anonymous sessions, JWT
│   │   │   ├── chat.js     # Icebreakers, stats
│   │   │   ├── report.js   # User reports
│   │   │   ├── admin.js    # Admin dashboard API
│   │   │   └── user.js     # User preferences
│   │   ├── models/
│   │   │   └── index.js    # Mongoose schemas (User, Report, Ban, Session)
│   │   └── middleware/
│   │       ├── auth.js     # JWT middleware
│   │       └── rateLimiter.js
│   └── Dockerfile
│
└── docker-compose.yml      # Full stack orchestration
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- (Optional) MongoDB 7+
- (Optional) Redis 7+

> **Note:** Both MongoDB and Redis have graceful fallbacks — the app will run without them, using in-memory storage. This is great for development.

---

### 1. Clone & Install

```bash
git clone https://github.com/yourname/addagle.git
cd addagle

# Install backend deps
cd backend && npm install && cd ..

# Install frontend deps
cd frontend && npm install && cd ..
```

---

### 2. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

Key variables:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/addagle
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_key_here
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
# Already configured for localhost by default
```

---

### 3. Start Development Servers

**Option A — Run separately:**

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

**Option B — Docker (recommended):**

```bash
docker-compose up --build
```

Visit:
- **App:** http://localhost:3000
- **API:** http://localhost:3001
- **Health:** http://localhost:3001/health

---

## 🔌 WebRTC Signaling Flow

```
User A (isInitiator=true)          Server              User B (isInitiator=false)
        |                             |                         |
        |--- chat:find -------------->|                         |
        |                             |<-- chat:find -----------|
        |                             |                         |
        |<-- chat:connected ----------|--- chat:connected ----->|
        |    (isInitiator: true)      |    (isInitiator: false) |
        |                             |                         |
        |  createOffer()              |                         |
        |--- webrtc:offer ----------->|--- relay -------------->|
        |                             |                         |
        |                             |  handleOffer() ->       |
        |                             |  createAnswer()         |
        |<-- relay -------------------|<-- webrtc:answer -------|
        |                             |                         |
        |<--- webrtc:ice-candidate ---|<------------------------|
        |------------------------>----|------------------------>|
        |                             |  (ICE exchange)         |
        |                             |                         |
        |====== Direct P2P Video Connection Established ========|
```

---

## 🎯 Matching Algorithm

The matching algorithm scores each waiting user against potential partners:

```javascript
score = (shared interests × 10)
      + (same chat mode ? 5 : 0)
      + (wait time in seconds, max 30)
      + (same language ? 3 : 0)
```

- Users are matched with the **highest-scoring** available partner
- A background sweeper runs **every 2 seconds** to match waiting users
- If no match is found, users remain in the queue until one is available

---

## 🛡️ Safety & Moderation

### Automatic Moderation Pipeline
1. **Profanity filter** — `bad-words` library cleans mild profanity
2. **Pattern detection** — Blocks extreme hate speech, phone numbers, emails
3. **Violation tracking** — IP-based counter with 1-hour window
4. **Auto-ban** — 3 violations in 1 hour = 24-hour IP ban
5. **Optional AI** — OpenAI Moderation API (set `OPENAI_API_KEY`)

### Manual Moderation
- Users can report via the 🚩 button
- Admins review reports at `/admin`
- Admins can manually ban IPs with configurable duration

---

## 🔐 Security

- **Rate limiting:** 100 req/15min per IP on all API routes
- **Helmet.js:** Secure HTTP headers
- **Input sanitization:** `express-validator` on all POST routes
- **JWT auth:** Stateless sessions, no cookies
- **CORS:** Locked to configured `FRONTEND_URL`
- **WebRTC:** Encrypted by default (DTLS-SRTP)
- **Message truncation:** Max 2000 chars per message

---

## 📦 Deployment

### Vercel (Frontend) + Railway/Render (Backend)

**Frontend on Vercel:**
```bash
cd frontend
vercel deploy
# Set env vars in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend.railway.app
# NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
```

**Backend on Railway:**
```bash
# Push to GitHub, connect Railway
# Set env vars in Railway dashboard
# Railway auto-detects Node.js from package.json
```

### Full Docker Deploy

```bash
# Production
JWT_SECRET=your_production_secret docker-compose up -d --build

# Scale backend (if using load balancer + Redis for shared state)
docker-compose up -d --scale backend=3
```

### Important: TURN Server for Production

WebRTC direct connections work for most users, but corporate firewalls block P2P. For production, add a TURN server:

```javascript
// In frontend/src/lib/webrtc.js, add to ICE_SERVERS:
{
  urls: 'turn:your.turn.server:3478',
  username: 'user',
  credential: 'password',
}
```

Free TURN options: [Metered.ca](https://www.metered.ca/tools/openrelay/) or self-host with [coturn](https://github.com/coturn/coturn).

---

## 🧪 Generate Admin Token

```bash
node -e "
const jwt = require('jsonwebtoken');
console.log(jwt.sign(
  { userId: 'admin', isAdmin: true },
  process.env.JWT_SECRET || 'changeme',
  { expiresIn: '30d' }
));
"
```

Paste the token at `/admin` to access the dashboard.

---

## 📝 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| State | Zustand (persisted preferences) |
| Real-time | Socket.IO 4 |
| Video | WebRTC (native browser API) |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Cache/Queue | Redis (in-memory fallback) |
| Auth | JWT (jsonwebtoken) |
| Moderation | bad-words + optional OpenAI |
| Fonts | Syne (display) + DM Sans (body) |

---

## 📄 License

MIT — free to use, modify, and deploy.

---

> Built with ❤️ — Stay safe, be kind, make connections.
