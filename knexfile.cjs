// Knex configuration for running migrations (CLI)
// Usage:
//   npx knex migrate:latest --knexfile knexfile.cjs --env development

require('dotenv').config();

const sharedConfig = {
  client: process.env.DB_CLIENT || 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  migrations: {
    directory: './server/db/migrations',
    tableName: 'knex_migrations',
  },
};

module.exports = {
  development: sharedConfig,
  production: sharedConfig,
};



