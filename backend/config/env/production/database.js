module.exports = ({ env }) => {
  const databaseUrl = env('DATABASE_URL');
  console.log('=== DATABASE CONFIG DEBUG ===');
  console.log('DATABASE_URL exists:', !!databaseUrl);
  console.log('DATABASE_URL value:', databaseUrl ? databaseUrl.substring(0, 30) + '...' : 'UNDEFINED');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('=============================');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set! Please configure it in Railway.');
  }

  return {
    connection: {
      client: 'postgres',
      connection: {
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
      },
      pool: { min: 2, max: 10 },
    },
  };
};
