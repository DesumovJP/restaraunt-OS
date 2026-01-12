# Strapi v5 Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code
COPY . .

# Build Strapi (compiles TypeScript to dist/)
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 strapi

# Copy built application from builder
COPY --from=builder --chown=strapi:nodejs /app/dist ./dist
COPY --from=builder --chown=strapi:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=strapi:nodejs /app/package.json ./package.json
COPY --from=builder --chown=strapi:nodejs /app/public ./public
COPY --from=builder --chown=strapi:nodejs /app/config ./config
COPY --from=builder --chown=strapi:nodejs /app/favicon.png ./favicon.png

# Create required directories with proper permissions
RUN mkdir -p /app/public/uploads && chown -R strapi:nodejs /app/public/uploads
RUN mkdir -p /app/database/migrations && chown -R strapi:nodejs /app/database
RUN mkdir -p /app/.tmp && chown -R strapi:nodejs /app/.tmp

USER strapi

EXPOSE 1337

CMD ["npm", "start"]
