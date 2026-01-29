# Paste Bin

A simple, secure, and efficient paste bin application for sharing text snippets.

## Features
- Create pastes with optional expiration (TTL) and view limits.
- Secure, randomly generated URLs.
- Clean and responsive user interface.
- Automatic expiration handling.

## Running Locally

### Prerequisites
- Node.js (v18+)
- npm

### 1. Backend (Server)
Navigate to the `server` directory and install dependencies:

```bash
cd server
npm install
```

Set up environment variables:
Copy `.env.example` to `.env` (if provided) or ensure a valid `.env` exists with necessary database configuration.

Start the server:
```bash
npm run dev
# or for production mode
npm start
```
The server runs on port 5000 by default.

### 2. Frontend (Client)
Navigate to the `client` directory and install dependencies:

```bash
cd client
npm install
```

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173` (by default).

## Persistence Layer
This project uses **Prisma ORM** with a relational database (configured via `DATABASE_URL` in environment variables) to store pastes and their metadata.
