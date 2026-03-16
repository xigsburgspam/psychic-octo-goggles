# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src
COPY .env.example .env.example

EXPOSE 3001

CMD ["node", "src/server.js"]
