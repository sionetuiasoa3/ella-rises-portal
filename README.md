# Ella Rises Portal

A Node.js + Express + EJS web application for managing the Ella Rises program, empowering young women through STEAM education, mentorship, and cultural programs.

## Tech Stack

- **Node.js 24** (compatible with AWS Elastic Beanstalk AL2023)
- **Express.js** - Web framework
- **EJS** - Server-side templating
- **PostgreSQL** - Database (via AWS RDS)
- **Knex.js** - SQL query builder
- **bcrypt** - Password hashing
- **express-session** - Session management

## Prerequisites

- Node.js 24 or higher
- PostgreSQL database (local or AWS RDS)
- npm or yarn

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy the example environment file and update it with your values:

```bash
cp .env.example .env
```

Then edit `.env` with your actual database credentials and configuration:

```env
# Database Configuration
DB_CLIENT=postgresql
DB_HOST=localhost
DB_NAME=ella_rises
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=5432
DB_SSL=false

# Application Configuration
NODE_ENV=development
PORT=8081
SESSION_SECRET=your-secret-key-change-in-production
APP_BASE_URL=http://localhost:8081
```

### 3. Database Setup

Ensure your PostgreSQL database is running and create the database:

```bash
createdb ella_rises  # or use your PostgreSQL client
```

**Option A: Using SQL Schema File (Recommended for quick setup)**

Run the SQL schema file directly:

```bash
psql -U your_db_user -d ella_rises -f database/schema.sql
```

This will create all tables, indexes, and constraints in one go.

**Option B: Using Knex Migrations**

Alternatively, you can use Knex migrations:

```bash
npx knex migrate:latest
```

The application expects the following tables:

- `Participants` - User accounts and participant information
- `EventsTemplates` - Event type templates
- `Events` - Individual event instances
- `Registrations` - Participant event registrations
- `Surveys` - Post-event survey responses
- `Donations` - Individual donation records
- `DonationsSummary` - Aggregated donation totals per participant
- `Milestones` - Participant achievement milestones
- `MilestonesTypes` - Available milestone types
- `PasswordTokens` - Password creation/reset tokens

See `database/schema.sql` for the complete database schema with all column definitions, constraints, and indexes.

### 4. Run the Application

```bash
npm start
```

The server will start on `http://localhost:8081` (or the port specified in your `.env` file).

For development with auto-reload:

```bash
npm run dev
```

## AWS Elastic Beanstalk Deployment

### Environment Variables

Configure the following environment variables in your Elastic Beanstalk environment:

- `DB_CLIENT` - Set to `postgresql`
- `DB_HOST` - Your RDS instance endpoint
- `DB_NAME` - Your database name
- `DB_USERNAME` - Your RDS master username
- `DB_PASSWORD` - Your RDS master password
- `DB_PORT` - Usually `5432`
- `DB_SSL` - Set to `true` for RDS
- `NODE_ENV` - Set to `production`
- `SESSION_SECRET` - A secure random string
- `PORT` - Elastic Beanstalk will set this automatically, but defaults to 8081

### Deployment Steps

1. **Zip the project** (excluding `node_modules`, `.env`, and other unnecessary files):

```bash
zip -r ella-rises-portal.zip . -x "node_modules/*" ".env" ".git/*" "*.log"
```

2. **Upload to Elastic Beanstalk**:
   - Go to your EB environment
   - Click "Upload and Deploy"
   - Select the zip file
   - Deploy

3. **Platform Configuration**:
   - Platform: Node.js 24 running on 64bit Amazon Linux 2023
   - The `Procfile` tells EB to run `npm start`

### Required Files for Deployment

Ensure these files are included in your deployment:

- `package.json`
- `index.js`
- `Procfile`
- `server/` directory (all route handlers, middleware, DB connection)
- `views/` directory (all EJS templates)
- `public/` directory (CSS, JS, images)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Participant login
- `POST /api/auth/signup` - Participant registration
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Participants
- `GET /api/participants` - List all (admin only)
- `GET /api/participants/:id` - Get by ID
- `PUT /api/participants/:id` - Update
- `DELETE /api/participants/:id` - Delete (admin only)
- `GET /api/participants/:id/registrations` - Get registrations
- `GET /api/participants/:id/milestones` - Get milestones
- `GET /api/participants/:id/donations` - Get donations

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (admin only)
- `PUT /api/events/:id` - Update event (admin only)
- `DELETE /api/events/:id` - Delete event (admin only)
- `GET /api/events/:id/registrations` - Get event registrations (admin only)

### Event Templates
- `GET /api/event-templates` - List all templates
- `POST /api/event-templates` - Create template (admin only)
- `PUT /api/event-templates/:id` - Update template (admin only)
- `DELETE /api/event-templates/:id` - Delete template (admin only)

### Registrations
- `POST /api/registrations` - Register for event
- `PUT /api/registrations/:id` - Update registration
- `DELETE /api/registrations/:id` - Delete registration

### Milestones
- `GET /api/milestone-types` - List milestone types
- `POST /api/milestone-types` - Create type (admin only)
- `PUT /api/milestone-types/:id` - Update type (admin only)
- `DELETE /api/milestone-types/:id` - Delete type (admin only)
- `POST /api/milestones` - Add participant milestone

### Donations
- `GET /api/donations` - List all (admin only)
- `GET /api/donations/summary` - Get summary (admin only)
- `POST /api/donations` - Create donation (admin only)

### Surveys
- `POST /api/surveys` - Submit survey
- `GET /api/surveys/event/:eventId/participant/:participantId` - Get survey

## Role-Based Access Control

The application supports three roles:

- **admin** - Full CRUD access to all resources
- **user** (parent) - Can manage their account and register participants for events
- **participant** - Can view/edit their own profile, see their events/milestones, complete surveys

## Health Check

The application includes a health check endpoint for Elastic Beanstalk:

- `GET /health` - Returns `{ status: 'ok' }`

## Special Routes

- `GET /teapot` - Returns HTTP 418 (I'm a teapot) - class requirement

## Session Management

Sessions are stored in memory by default. For production, consider using:
- Redis (via `connect-redis`)
- PostgreSQL (via `connect-pg-simple`)

## Troubleshooting

### Database Connection Issues

- Verify all database environment variables are set correctly
- Check that your database is accessible from your application server
- For RDS, ensure security groups allow connections from your EB environment
- Verify SSL settings match your database configuration

### Port Issues

- Elastic Beanstalk sets the `PORT` environment variable automatically
- The application defaults to port 8081 if `PORT` is not set
- Check EB environment configuration if the app doesn't start

## License

Copyright © 2025 Ella Rises. All rights reserved.
