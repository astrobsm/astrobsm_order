# Digital Ocean App Platform - Recommended Configuration Updates

## 1. Environment Variables ✅ 
Your current environment variables are correct:
```
DATABASE_URL = ${your-database-name.DATABASE_URL}
DB_HOST = your-database-host.db.ondigitalocean.com
DB_PORT = 25060
DB_USER = your-database-username
DB_PASSWORD = YOUR_SECURE_DATABASE_PASSWORD
DB_NAME = defaultdb
DB_SSL = true
PORT = 8080  # ⚠️ CHANGE THIS FROM 3000 to 8080
NODE_ENV = production
ADMIN_PRICE_PASSWORD = YOUR_ADMIN_PASSWORD_HERE
SESSION_SECRET = YOUR_SUPER_SECRET_SESSION_KEY_CHANGE_THIS
```

## 2. Required Updates in Digital Ocean Dashboard:

### Build Command (Change from "None" to):
```bash
npm install && npm run init
```

### Run Command (Keep as):
```bash
npm start
```

### Environment Variables - Update PORT:
```
PORT = 8080
```
(Change from 3000 to 8080 to match DO's expected port)

### Health Checks:
- **Readiness Check Path**: `/health`
- **Liveness Check Path**: `/health`
- **Port**: 8080

## 3. Alternative Build Command (if database initialization fails):
If the build fails due to database connection during build phase, use:
```bash
npm install
```

Then manually run database initialization after first deployment:
```bash
npm run init
```

## 4. Troubleshooting Commands:
If you need to manually initialize the database after deployment:
1. Open DO Console for your app
2. Run: `npm run init`
3. Restart the service

## 5. Monitoring:
- Check logs in DO dashboard for any connection issues
- Verify database connectivity
- Monitor application performance

## 6. Security Notes:
- ✅ Environment variables are properly configured
- ✅ SSL is enabled for database
- ✅ Admin password is set
- ✅ Session secret is configured
