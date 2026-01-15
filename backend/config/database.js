module.exports = ({ env }) => {
  const databaseUrl = env('DATABASE_URL');

  console.log('=== DATABASE CONFIG DEBUG ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL exists:', !!databaseUrl);
  console.log('=============================');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required but not set!');
  }

  return {
    connection: {
      client: 'postgres',
      connection: {
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
      },
      pool: { min: 2, max: 10 },
      acquireConnectionTimeout: 60000,
    },
  };
};
