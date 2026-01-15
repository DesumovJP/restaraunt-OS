// Strapi v5 database configuration
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', env('DATABASE_USER', 'postgres')),
      password: env('DATABASE_PASSWORD', ''),
      ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
    },
    pool: { min: 2, max: 10 },
    acquireConnectionTimeout: 60000,
  },
});
