// Strapi v5 database configuration
console.log('=== LOADING DATABASE CONFIG ===');

module.exports = ({ env }) => {
  console.log('=== DATABASE CONFIG FUNCTION CALLED ===');

  // Use individual connection params instead of connectionString
  // This is more compatible with Strapi v5
  return {
    connection: {
      client: 'postgres',
      connection: {
        host: env('DATABASE_HOST', 'postgres.railway.internal'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'railway'),
        user: env('DATABASE_USER', 'postgres'),
        password: env('DATABASE_PASSWORD', ''),
        ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
      },
      pool: { min: 2, max: 10 },
      acquireConnectionTimeout: 60000,
    },
  };
};
