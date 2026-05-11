# ─────────────────────────────────────────────
# Stage 1: Builder
# Install ALL deps (including dev) so we can
# run any build steps if needed in the future.
# ─────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy manifests first for better layer caching
COPY package*.json ./

# Install all dependencies (dev + prod)
RUN npm ci

# Copy application source
COPY . .


# ─────────────────────────────────────────────
# Stage 2: Production
# Lean, secure image with only what is needed
# to run the API in production.
# ─────────────────────────────────────────────
FROM node:18-alpine AS production

# Create a non-root user & group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

# Copy manifests
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source from builder stage
COPY --from=builder /usr/src/app/src ./src

# Transfer ownership of the workdir to the non-root user
RUN chown -R appuser:appgroup /usr/src/app

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]
