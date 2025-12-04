import knexLib from 'knex';
import dotenv from 'dotenv';

// Ensure .env is loaded in non-production before we read process.env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const requiredVars = ['DB_CLIENT', 'DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
const missing = requiredVars.filter((name) => !process.env[name]);
const isProduction = process.env.NODE_ENV === 'production';

// In production: fail fast if DB is not properly configured
if (isProduction && missing.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missing.join(', ')}`
  );
}

// Helper: create a mock db that is still callable like db('Table')
function createMockDb() {
  const fn = () => ({
    select: () => Promise.reject(new Error('Database not configured')),
    where: () => Promise.reject(new Error('Database not configured')),
    insert: () => Promise.reject(new Error('Database not configured')),
    update: () => Promise.reject(new Error('Database not configured')),
    del: () => Promise.reject(new Error('Database not configured')),
    join: () => Promise.reject(new Error('Database not configured')),
  });

  fn.raw = () => Promise.reject(new Error('Database not configured'));
  return fn;
}

let dbInstance;

if (missing.length === 0) {
  // All required vars present – create real knex instance
  dbInstance = knexLib({
    client: process.env.DB_CLIENT,
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
    }
  });

  // Test connection at startup
  dbInstance.raw('select 1')
    .then(() => console.log('✅ DB connection successful'))
    .catch((err) => {
      console.error('❌ DB connection failed', err);
      if (isProduction) {
        process.exit(1);
      } else {
        console.warn('⚠️  Continuing without database connection (development mode)');
        dbInstance = createMockDb();
      }
    });
} else {
  // Missing vars in dev – use mock db so dev-only routes can still work
  console.warn('⚠️  Database environment variables not set - using mock database (development mode)');
  dbInstance = createMockDb();
}

export const db = dbInstance;

