# Habits Tracker Server

Backend API server for the Daily Habits tracking application.

## Prerequisites

- Node.js
- MongoDB running locally
- NixOS users: Use `flake.nix` for declarative configuration

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `POST /api/auth/*` - Authentication routes
- `GET /api/metrics/*` - Metrics and data routes

## Features

- **Security**: Helmet, CORS, rate limiting
- **Database**: MongoDB with Mongoose
- **Authentication**: Secure user management
- **Monitoring**: Request logging and health checks
- **Testing**: Jest test suite

## Testing

```bash
npm test           # Run tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
```

## Tech Stack

- Express.js
- MongoDB/Mongoose
- bcrypt (password hashing)
- Helmet (security)
- Morgan (logging)
