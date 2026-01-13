# Strapi v5 Production Dockerfile
FROM node:20-alpine AS build

RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev python3 make g++

WORKDIR /opt/
COPY package.json package-lock.json ./
# Install all dependencies (including devDependencies for build)
RUN npm ci
ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .
# Build without NODE_ENV=production to avoid database config issues
RUN NODE_ENV=production npm run build

# Production image
FROM node:20-alpine

RUN apk add --no-cache vips-dev

WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules

WORKDIR /opt/app
COPY --from=build /opt/app ./

ENV PATH=/opt/node_modules/.bin:$PATH
ENV NODE_ENV=production

RUN chown -R node:node /opt/app
USER node

EXPOSE 1337

CMD ["npm", "start"]
