/** @type {import('next').NextConfig} */
const nextConfig = {
  // typedRoutes is now stable in Next.js 15
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
