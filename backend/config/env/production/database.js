module.exports = ({ env }) => {
  console.log('[Production DB Config] Loading...');
  console.log('[Production DB Config] DATABASE_CLIENT:', env('DATABASE_CLIENT', 'NOT SET'));
  console.log('[Production DB Config] DATABASE_URL exists:', !!env('DATABASE_URL'));

  return {
    connection: {
      client: 'postgres',
      connection: {
        connectionString: env('DATABASE_URL'),
        ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
      },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
