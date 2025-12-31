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
});
