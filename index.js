import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import dotenv from 'dotenv';
import routes from './server/routes/index.js';
import { db } from './server/db/connection.js';

// Load .env only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy - required when behind nginx/load balancer for correct protocol detection
app.set('trust proxy', 1);

// View engine & static assets
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing - increased limits for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sessions (MemoryStore is OK for now; add comment that it's not prod-grade)
// TODO: In production, use a proper session store like Redis or PostgreSQL
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS required)
      httpOnly: true,
      sameSite: 'lax', // Helps with CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.isAdmin = req.session.user?.role === 'admin';
  next();
});

// Mount routers
app.use('/', routes);

// Health check for EB
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// HTTP 418 route (class requirement)
app.get('/teapot', (req, res) => {
  res.status(418).send("I'm a teapot");
});

// Error handler (must be last)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Port for EB - listen on 0.0.0.0 to accept connections from EB load balancer
const port = process.env.PORT || 8081;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});

