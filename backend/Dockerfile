# Strapi v5 Production Dockerfile - Single Stage
FROM node:20-alpine

# Install build dependencies
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev python3 make g++

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build Strapi
RUN npm run build

# Set production environment
ENV NODE_ENV=production
ENV PATH=/app/node_modules/.bin:$PATH

# Create directories
RUN mkdir -p /app/public/uploads /app/.tmp

EXPOSE 1337

CMD ["npm", "start"]
