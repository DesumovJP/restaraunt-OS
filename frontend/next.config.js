/** @type {import('next').NextConfig} */
const nextConfig = {
  // typedRoutes is now stable in Next.js 15
  typedRoutes: true,
  images: {
    remotePatterns: [
      // Strapi local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      // Strapi production on Railway
      {
        protocol: 'https',
        hostname: '*.railway.app',
        pathname: '/uploads/**',
      },
      // DigitalOcean Spaces CDN
      {
        protocol: 'https',
        hostname: '*.digitaloceanspaces.com',
      },
      {
        protocol: 'https',
        hostname: '*.cdn.digitaloceanspaces.com',
      },
      // Fallback for any other sources (can be restricted in production)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
  },
};

module.exports = nextConfig;
