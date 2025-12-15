# Multi-stage Dockerfile for Next.js production deployment with dokploy
# Build stage - use full Node image with build tools for native module support
FROM node:22.21.1-bookworm AS builder

WORKDIR /app

# Install build dependencies for native modules (lightningcss, etc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install all dependencies with fresh binaries for Linux (not from macOS lock file)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client (requires DATABASE_URL for schema parsing)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" npx prisma generate

# Build Next.js application with required environment variables
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" \
    BETTER_AUTH_SECRET="dummy-secret-for-build" \
    BETTER_AUTH_URL="http://localhost:3500" \
    OPENAI_API_KEY="dummy-key" \
    R2_BUCKET_NAME="dummy-bucket" \
    npm run build

# Prune dev dependencies
RUN npm prune --production

# Production stage
FROM node:22.21.1-bookworm

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs nextjs

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma client and schema for runtime migrations
COPY --from=builder /app/prisma ./prisma

# Set ownership to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to nextjs user
USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3500

# Expose port
EXPOSE 3500

# Health check - just verify server is listening, not DB connection
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3500', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]
