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

# Runtime stage with embedded PostgreSQL
FROM node:20-slim AS runtime

WORKDIR /app

# Install curl and full PostgreSQL for embedded database
RUN apt-get update && apt-get install -y \
    curl \
    postgresql \
    postgresql-contrib \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create PostgreSQL directories and set permissions
RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql \
    && chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql \
    && chmod 700 /var/lib/postgresql/data

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

# Expose ports
EXPOSE 5000 5432

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]

# Force rebuild marker
LABEL rebuild="2025-11-19-v4"