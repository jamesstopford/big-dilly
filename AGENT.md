# Big-Dilly Agent Instructions

## Build & Test Procedures

### Initial Setup
```bash
npm install
npm run db:init
```

### Development
```bash
npm run dev          # Run both server and client with hot reload
npm run dev:server   # Run server only (nodemon)
npm run dev:client   # Run Vite build watch
```

### Build
```bash
npm run build        # Build Svelte frontend to public/
```

### Start Production
```bash
npm start            # Start server (serves built frontend)
```

### Testing
```bash
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## Project Structure
- `src/server/` - Express backend
- `src/client/` - Svelte frontend
- `src/db/` - Database utilities and schema
- `public/` - Built frontend assets
- `data/` - SQLite database (created on first run)

## Key Files
- `src/server/index.js` - Server entry point
- `src/client/main.js` - Client entry point
- `src/db/database.js` - Database utilities
- `src/db/schema.js` - Table definitions

## API Endpoints
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Log in
- `POST /api/auth/logout` - Log out
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `PUT /api/user/theme` - Update theme preference

## Notes
- Uses ES modules (`"type": "module"` in package.json)
- Session cookies are httpOnly and secure in production
- Passwords hashed with bcrypt (cost 12)
- SQLite database with WAL mode enabled
