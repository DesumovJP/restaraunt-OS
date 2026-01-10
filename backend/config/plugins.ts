export default ({ env }) => ({
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: env('NODE_ENV') !== 'production',
      depthLimit: 10,
      amountLimit: 100,
      apolloServer: {
        tracing: env('NODE_ENV') !== 'production',
        introspection: true,
      },
    },
  },
  // Users & Permissions plugin - extend JWT expiration
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d', // Token valid for 7 days (default is 30 days but sometimes shorter)
      },
    },
  },
});
