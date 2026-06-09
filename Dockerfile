FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS builder
WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json* ./

# Install ALL dependencies (devDependencies needed for build)
# Skip postinstall (prisma generate) — schema not yet available
RUN npm ci --ignore-scripts

# Copy source files
COPY . .

# Generate Prisma client (dummy URL — generate doesn't need real DB)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.next && \
    chown nextjs:nodejs /app/.next

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
