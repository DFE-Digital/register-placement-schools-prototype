# Deployment

This document describes how to deploy the Register of placement schools prototype locally and to Heroku.

## Prerequisites

- Node.js version 22.x
- npm (comes with Node.js)
- Git
- A Heroku account (for Heroku deployments)
- Heroku CLI (for Heroku deployments)

## Local deployment

### Initial setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd register-placement-schools-prototype
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will automatically run `npm run db:build` which migrates and seeds the database.

3. **Configure environment variables**

   Create a `.env` file in the root directory with the following variables:
   ```
   ORDNANCE_SURVEY_API_KEY=your_api_key
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   SESSION_SECRET=a_random_secret_string
   USE_SIGN_IN_FORM=false
   ```

   **Note**: For local development and testing, you may not need the API keys immediately. The prototype will still function with limited features.
   Avoid committing real keys to Git.

4. **Run the application**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

### Development commands

- `npm run dev` - Start development server with hot-reloading
- `npm run serve` - Serve the prototype (production-like mode)
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:build` - Run migrations and seeders together
- `npm run db:build:dev` - Rebuild the local SQLite database from scratch

### Database management

The prototype uses SQLite for local development. The database file is created automatically when you run `npm install` or `npm run db:build`.

**Resetting the database:**
```bash
rm -f app/database/development.sqlite3
npm run db:build
```

### Session management

For local development, the application uses in-memory session storage, which is sufficient for a single developer working locally. Sessions will be cleared when you restart the server.

**Note:** For Heroku deployments or multi-user environments, you'll need to configure an external session store (Redis or database). See the [Heroku deployment](#session-storage-on-heroku) section for details.

### Environment variables explained

| Variable | Required | Description |
| --- | --- | --- |
| `ORDNANCE_SURVEY_API_KEY` | Optional | API key for address lookup via Ordnance Survey Places/Names APIs |
| `GOOGLE_MAPS_API_KEY` | Optional | API key for Google Maps integration |
| `SESSION_SECRET` | Recommended | Random string for session encryption. Generate with `openssl rand -base64 32` |
| `USE_SIGN_IN_FORM` | Optional | Set to `true` for username/password login, `false` for persona selection (default: `false`) |

## Heroku deployment

### Initial Heroku setup

1. **Install Heroku CLI**

   Follow instructions at https://devcenter.heroku.com/articles/heroku-cli

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create a new Heroku app**
   ```bash
   heroku create your-app-name
   ```

### Configure Heroku app

1. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set ORDNANCE_SURVEY_API_KEY=your_api_key
   heroku config:set GOOGLE_MAPS_API_KEY=your_google_maps_key
   heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
   heroku config:set USE_SIGN_IN_FORM=false
   ```

2. **Set Node.js version**

   The `package.json` already specifies Node.js 22.x in the `engines` field, which Heroku will use automatically.

### Deploy to Heroku

1. **Deploy via Git**
   ```bash
   git push heroku main
   ```

2. **Run database migrations**
   ```bash
   heroku run npm run db:migrate
   heroku run npm run db:seed
   ```

3. **Open your application**
   ```bash
   heroku open
   ```

### Heroku deployment configuration

The repository includes a `Procfile` which tells Heroku how to start the application:
```
web: npm start
```

### Updating your Heroku app

```bash
# Commit your changes
git add .
git commit -m "Your commit message"

# Push to Heroku
git push heroku main

# Run migrations if schema changed
heroku run npm run db:migrate
```

### Database on Heroku

By default, this prototype uses SQLite, which has limitations on Heroku:
- SQLite files are ephemeral on Heroku (lost on dyno restart)
- Not recommended for production use

**Recommended for production-like Heroku deployment:**

Use PostgreSQL instead:

1. **Add PostgreSQL add-on**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

2. **Update database configuration**

   Modify `app/database/config.json` to use PostgreSQL in production:
   ```json
   {
     "production": {
       "use_env_variable": "DATABASE_URL",
       "dialect": "postgres",
       "dialectOptions": {
         "ssl": {
           "require": true,
           "rejectUnauthorized": false
         }
       }
     }
   }
   ```

3. **Install PostgreSQL package**
   ```bash
   npm install pg pg-hstore
   git add package.json package-lock.json
   git commit -m "Add PostgreSQL support"
   git push heroku main
   ```

4. **Run migrations on Heroku**
   ```bash
   heroku run npm run db:build
   ```

### Session storage on Heroku

By default, this application stores sessions in-memory, which has limitations:

- Sessions are lost when dynos restart (at least once per day)
- Sessions don't work correctly with multiple dynos
- Users will be logged out unexpectedly

**For production or shared demo environments, use an external session store:**

#### Option 1: Redis (recommended)

1. **Add Heroku Redis**
   ```bash
   heroku addons:create heroku-redis:mini
   ```

2. **Install Redis session store**
   ```bash
   npm install connect-redis redis
   ```

3. **Update session configuration** in `app/routes.js`:
   ```javascript
   const session = require('express-session')
   const RedisStore = require('connect-redis').default
   const { createClient } = require('redis')

   // Create Redis client
   const redisClient = createClient({
     url: process.env.REDIS_URL
   })
   redisClient.connect().catch(console.error)

   router.use(
     session({
       store: new RedisStore({ client: redisClient }),
       secret: process.env.SESSION_SECRET || 'default-insecure-secret-change-in-production',
       resave: false,
       saveUninitialized: false,
       cookie: {
         maxAge: 1000 * 60 * 60 * 4, // 4 hours
         secure: process.env.NODE_ENV === 'production',
         httpOnly: true
       }
     })
   )
   ```

#### Option 2: Database sessions

Alternatively, use `connect-session-sequelize` to store sessions in your PostgreSQL database (simpler but slower than Redis).

### Viewing logs

Monitor your Heroku application:
```bash
heroku logs --tail
```

### Heroku troubleshooting

**Application error on startup:**
- Check logs: `heroku logs --tail`
- Verify environment variables: `heroku config`
- Ensure Node.js version matches: `heroku run node --version`

**Database issues:**
- Verify migrations ran: `heroku run npm run db:migrate`
- Check database connection: `heroku pg:info` (if using PostgreSQL)

**Session issues:**
- Ensure `SESSION_SECRET` is set: `heroku config:get SESSION_SECRET`
- Users getting logged out unexpectedly: In-memory sessions (default) don't persist across dyno restarts or when using multiple dynos
- For production or apps with multiple dynos, use an external session store:
  - Redis via Heroku Redis add-on: `heroku addons:create heroku-redis:mini`
  - Configure session store in `app/routes.js` to use Redis or database-backed sessions

## Continuous deployment

### GitHub actions (optional)

You can set up automatic deployments from GitHub:

1. Go to your Heroku app dashboard
2. Navigate to the "Deploy" tab
3. Connect your GitHub repository
4. Enable automatic deploys from your main branch

### Manual deployment checklist

Before deploying:
- [ ] All tests pass locally
- [ ] Environment variables are configured
- [ ] Database migrations are up to date
- [ ] Dependencies are installed and up to date
- [ ] `.env` file is not committed (in `.gitignore`)
- [ ] Sensitive data is not in code

## Security considerations

### Production deployments

- Use strong, random `SESSION_SECRET`
- Enable HTTPS (automatic on Heroku)
- Keep dependencies updated
- Use environment variables for all secrets
- Consider rate limiting for public-facing instances
- Review authentication settings before public deployment

### Prototype disclaimer

This is a prototype application intended for demonstration and testing purposes. For production use, additional security hardening is recommended:

- Implement proper authentication and authorization
- Add CSRF protection
- Implement rate limiting
- Add input validation and sanitization
- Use a production-ready database
- Implement proper error handling and logging
- Add monitoring and alerting

## Support

For issues with:

- **GOV.UK Prototype Kit**: See https://prototype-kit.service.gov.uk/docs/
- **Heroku**: See https://devcenter.heroku.com/
- **This prototype**: Consult the project README and documentation
