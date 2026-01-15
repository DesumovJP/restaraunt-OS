export default = ({ env }) => ({
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
        expiresIn: '7d',
      },
    },
  },
  // Upload provider configuration for DigitalOcean Spaces
  // Only enabled when DO_SPACE_ACCESS_KEY is set
  ...(env('DO_SPACE_ACCESS_KEY') && {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          s3Options: {
            credentials: {
              accessKeyId: env('DO_SPACE_ACCESS_KEY'),
              secretAccessKey: env('DO_SPACE_SECRET_KEY'),
            },
            endpoint: `https://${env('DO_SPACE_ENDPOINT')}`,
            region: env('DO_SPACE_REGION', 'nyc3'),
            params: {
              Bucket: env('DO_SPACE_BUCKET'),
            },
            forcePathStyle: false,
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  }),
});
