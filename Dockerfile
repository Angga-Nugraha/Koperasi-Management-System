# =====================================================
# Base
# =====================================================
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat

WORKDIR /app

# =====================================================
# Dependencies
# =====================================================
FROM base AS deps

COPY package*.json ./

# Jangan jalankan postinstall (prisma generate)
RUN npm ci --ignore-scripts

# =====================================================
# Builder
# =====================================================
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
ARG NEXT_PUBLIC_MIDTRANS_SNAP_URL
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true
ENV NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=$NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
ENV NEXT_PUBLIC_MIDTRANS_SNAP_URL=$NEXT_PUBLIC_MIDTRANS_SNAP_URL
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

# Dummy DATABASE_URL hanya untuk generate
ENV DATABASE_URL="mysql://root:root@localhost:3306/dummy"
ENV AUTH_SECRET="build-dummy-secret"
ENV AUTH_URL="http://localhost:3000"

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# =====================================================
# Runner
# =====================================================
FROM node:22-alpine AS runner

RUN apk add --no-cache \
    libc6-compat \
    mysql-client

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup -S nodejs && \
    adduser -S nextjs -G nodejs

# Standalone server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Public
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema & migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Prisma config (hapus jika tidak dipakai)
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.js ./prisma.config.js

# node_modules diperlukan untuk Prisma CLI
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# package.json
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["node","server.js"]