// Strapi v5 production database configuration
console.log('=== LOADING PRODUCTION DATABASE CONFIG ===');

module.exports = ({ env }) => {
  console.log('=== PRODUCTION DB CONFIG FUNCTION CALLED ===');

  return {
    connection: {
      client: 'postgres',
      connection: {
        host: env('DATABASE_HOST', 'postgres.railway.internal'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'railway'),
        user: env('DATABASE_USER', 'postgres'),
        password: env('DATABASE_PASSWORD', ''),
        ssl: { rejectUnauthorized: false },
      },
      pool: { min: 2, max: 10 },
    },
  };
};
