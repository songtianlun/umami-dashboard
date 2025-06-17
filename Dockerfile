# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first
COPY package.json pnpm-lock.yaml ./

# Install dependencies without running postinstall scripts
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Build application with env - set dummy values for build time
ARG VERSION=dev

RUN VERSION=${VERSION} pnpm build && ls -la .next/

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Create startup script that passes environment variables
RUN echo '#!/bin/sh' > /app/start.sh && \
    # set all env to env file
    echo 'echo "Setting environment variables..."' >> /app/start.sh && \
    echo 'env > .env' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'exec pnpm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application with init-db
CMD ["/app/start.sh"]
