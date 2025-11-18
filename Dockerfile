# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm ci

# Build client
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci
COPY client/ ./
RUN npm run build

# Build server
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci
COPY server/ ./
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy server build and dependencies
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package*.json ./

# Copy client build
COPY --from=builder /app/client/dist ./client

# Create uploads directory
RUN mkdir -p uploads/photos

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]