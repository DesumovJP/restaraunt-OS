// Strapi v5 production database configuration - HARDCODED FOR TESTING
module.exports = () => {
  console.log('=== PRODUCTION DATABASE CONFIG LOADING ===');

  const config = {
    connection: {
      client: 'postgres',
      connection: {
        host: 'postgres.railway.internal',
        port: 5432,
        database: 'railway',
        user: 'postgres',
        password: 'cHYEAiTvRrRnOTNBtYMQGiFiybAtwnGk',
        schema: 'public',
        ssl: false,
      },
      pool: {
        min: 2,
        max: 10,
      },
      debug: true,
    },
  };

  console.log('=== CONFIG OBJECT ===');
  console.log(JSON.stringify(config, null, 2));
  console.log('=====================');

  return config;
};
