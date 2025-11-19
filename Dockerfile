# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm ci

# Build client
# Force rebuild by adding build arg BEFORE copying files
ARG CACHEBUST=1
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci
COPY client/ ./
# Clean any Vite cache before building
RUN rm -rf node_modules/.vite .vite
RUN npm run build

# Build server
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci
COPY server/ ./
RUN npm run build

# Runtime stage
FROM node:20-slim AS runtime

WORKDIR /app

# Install curl and postgresql-client for health checks and database connectivity
RUN apt-get update && apt-get install -y curl postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy server build and dependencies
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package*.json ./

# Copy migration SQL files (needed for runMigrations.js)
COPY --from=builder /app/server/src/migrations ./dist/migrations

# Copy client build
COPY --from=builder /app/client/dist ./client

# Create uploads directory
RUN mkdir -p uploads/photos

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]

# Force rebuild marker
LABEL rebuild="2025-11-19-v4"