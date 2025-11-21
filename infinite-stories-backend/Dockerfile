# Multi-stage Dockerfile for Next.js production deployment with dokploy
# Assumes .next and node_modules are pre-built locally
# To build: npm run build && npm prune --production, then docker build
FROM node:22.21.1-bookworm AS builder

WORKDIR /app

# Install dependencies only
COPY package*.json ./
RUN npm ci

# Copy pre-built Next.js output
COPY .next ./.next
COPY public ./public
COPY prisma ./prisma

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

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]
