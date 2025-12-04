# AWS Elastic Beanstalk Deployment Checklist

## ✅ Changes Made

### 1. Removed Procfile
- ✅ **DELETED** `Procfile` - Elastic Beanstalk will automatically run `node index.js`

### 2. Updated Entry Point Configuration
- ✅ Added `"main": "index.js"` to `package.json`
- ✅ Verified `"start": "node index.js"` script exists

### 3. Fixed Port + Host Setup
- ✅ Updated `index.js` to listen on `0.0.0.0` instead of default:
  ```javascript
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
  });
  ```

### 4. Updated Database Configuration
- ✅ Modified `server/db/connection.js` to use exact environment variable format:
  ```javascript
  client: process.env.DB_CLIENT,
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
  }
  ```

### 5. Production Readiness
- ✅ No hardcoded localhost URLs in application code
- ✅ Session secret uses `process.env.SESSION_SECRET`
- ✅ Environment variables properly configured
- ✅ Dev-only code only runs when `NODE_ENV !== 'production'`

### 6. Certbot Setup
- ✅ Created `.platform/hooks/postdeploy/01_install_certbot.sh`
- ✅ Script handles Amazon Linux 2023 (dnf) and Amazon Linux 2 (yum)
- ✅ Script won't crash deployment if certbot is temporarily unavailable
- ✅ Script is executable

## 📦 Files to Include in ZIP

### Root Level Files
```
index.js                    ✅ Main entry point
package.json                ✅ Dependencies and scripts
package-lock.json           ✅ Lock file (optional but recommended)
README.md                   ✅ Documentation
```

### Server Code
```
server/
  db/
    connection.js           ✅ Database connection
  middleware/
    auth.js                 ✅ Authentication middleware
  routes/
    index.js                ✅ Main router
    authRoutes.js           ✅ Auth endpoints
    participantsRoutes.js    ✅ Participant endpoints
    eventsRoutes.js          ✅ Event endpoints
    templatesRoutes.js      ✅ Template endpoints
    registrationsRoutes.js   ✅ Registration endpoints
    milestonesRoutes.js     ✅ Milestone endpoints
    donationsRoutes.js       ✅ Donation endpoints
    surveysRoutes.js         ✅ Survey endpoints
```

### Views (EJS Templates)
```
views/
  index.ejs                 ✅ Home page
  about.ejs                 ✅ About page
  events.ejs                ✅ Events page
  contact.ejs               ✅ Contact page
  donate.ejs                ✅ Donate page
  not-found.ejs             ✅ 404 page
  partials/
    navbar.ejs              ✅ Navigation partial
    footer.ejs              ✅ Footer partial
  portal/
    auth.ejs                ✅ Portal login/signup
    dashboard.ejs            ✅ Portal dashboard
    profile.ejs              ✅ User profile
    events.ejs               ✅ User events
    milestones.ejs           ✅ User milestones
    survey.ejs               ✅ Event survey
    donate.ejs               ✅ Portal donate
  admin/
    login.ejs                ✅ Admin login
    dashboard.ejs             ✅ Admin dashboard
    participants.ejs         ✅ Participants list
    participant-detail.ejs    ✅ Participant details
    event-templates.ejs       ✅ Event templates
    events.ejs                ✅ Events management
    registrations.ejs         ✅ Event registrations
    milestones.ejs           ✅ Milestones management
    donations.ejs             ✅ Donations management
```

### Static Assets
```
public/
  css/
    style.css               ✅ Custom CSS
  js/
    main.js                 ✅ Client-side JS
  images/                   ✅ All image assets
    ella-rises-logo.png
    group-photo.jpeg
    workshop-large.jpg
    ... (all other images)
  favicon.ico               ✅ Favicon
  robots.txt                ✅ Robots file
  placeholder.svg            ✅ Placeholder
```

### Platform Configuration
```
.platform/
  hooks/
    postdeploy/
      01_install_certbot.sh ✅ Certbot installation script
```

## ❌ Files to EXCLUDE from ZIP

```
node_modules/               ❌ Will be installed by EB
src/                        ❌ Old React source (not needed)
.env                        ❌ Local environment file (use EB env vars)
.git/                       ❌ Git directory
*.log                       ❌ Log files
.DS_Store                   ❌ macOS system file
bun.lockb                   ❌ Bun lock file (not used)
components.json             ❌ React component config (not needed)
eslint.config.js            ❌ Dev tooling
index.html                  ❌ Old React entry point
postcss.config.js           ❌ PostCSS config (not needed)
tailwind.config.ts          ❌ Tailwind config (using CDN)
tsconfig.*.json             ❌ TypeScript configs (not needed)
vite.config.ts              ❌ Vite config (not needed)
```

## 🔧 Environment Variables in AWS EB

Ensure these are set in your Elastic Beanstalk environment:

```
DB_CLIENT=postgresql
DB_HOST=awseb-e-rvhntwkw5h-stack-awsebrdsdatabase-7meaara7cmvl.cbamowuoa3dt.us-east-2.rds.amazonaws.com
DB_NAME=ebdb
DB_PASSWORD=iL0v3Sm45h123!
DB_PORT=5432
DB_SSL=true
DB_USERNAME=smashbros
NODE_ENV=production
PORT=8081
SESSION_SECRET=TmReWtR+HuR2kuo79K51ff+2vj7TVj6iZ5Ao7MyPdtM=
```

## ✅ Deployment Validation

### Pre-Deployment Checks
- [x] No Procfile present
- [x] `package.json` has `"main": "index.js"`
- [x] `package.json` has `"start": "node index.js"`
- [x] `index.js` listens on `0.0.0.0`
- [x] Database connection uses environment variables correctly
- [x] No hardcoded localhost URLs
- [x] Certbot script is executable and won't crash deployment

### Post-Deployment Verification
1. Check health endpoint: `https://your-domain/health` should return `{"status":"ok"}`
2. Check teapot endpoint: `https://your-domain/teapot` should return HTTP 418
3. Verify database connection in logs
4. Test admin login functionality
5. Verify certbot installation (if needed)

## 📝 ZIP Creation Command

From the project root, create ZIP excluding unnecessary files:

```bash
zip -r ella-rises-portal.zip . \
  -x "node_modules/*" \
  -x "src/*" \
  -x ".env" \
  -x ".git/*" \
  -x "*.log" \
  -x ".DS_Store" \
  -x "bun.lockb" \
  -x "components.json" \
  -x "eslint.config.js" \
  -x "index.html" \
  -x "postcss.config.js" \
  -x "tailwind.config.ts" \
  -x "tsconfig.*" \
  -x "vite.config.ts"
```

Or use this more comprehensive exclusion:

```bash
zip -r ella-rises-portal.zip . \
  -x "node_modules/*" \
  -x "src/*" \
  -x ".env*" \
  -x ".git/*" \
  -x "*.log" \
  -x ".DS_Store" \
  -x "bun.lockb" \
  -x "components.json" \
  -x "eslint.config.js" \
  -x "index.html" \
  -x "postcss.config.js" \
  -x "tailwind.config.ts" \
  -x "tsconfig*.json" \
  -x "vite.config.ts" \
  -x ".cursor/*" \
  -x "*.md" \
  -x "DEPLOYMENT_CHECKLIST.md"
```

## 🚀 Deployment Steps

1. Create the ZIP file using the command above
2. Go to AWS Elastic Beanstalk console
3. Select your environment
4. Click "Upload and Deploy"
5. Choose the ZIP file
6. Click "Deploy"
7. Monitor the deployment logs
8. Verify the application is running

## ⚠️ Important Notes

- **npm install** will run automatically on the EB instance
- The application will start using `npm start` which runs `node index.js`
- No Procfile is needed - EB handles this automatically
- All environment variables must be set in EB configuration
- Database connection will be tested at startup
- Certbot installation happens post-deployment and won't block deployment if it fails

