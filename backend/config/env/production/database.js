// Strapi v5 production database configuration
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'postgres.railway.internal'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'railway'),
      user: env('DATABASE_USERNAME', env('DATABASE_USER', 'postgres')),
      password: env('DATABASE_PASSWORD', ''),
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 2, max: 10 },
  },
});
