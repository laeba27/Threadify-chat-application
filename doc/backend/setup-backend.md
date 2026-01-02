# Backend Setup Guide

This document explains how to set up and run the backend for the real-time chat application, including a detailed workflow overview.

## Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Docker & Docker Compose (for containerized setup)
- PostgreSQL (if not using Docker)

## Steps to Start the Backend Server
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd real-time chat/backend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in the required values (database URL, API keys, etc).
   - Example variables:
     - `DATABASE_URL=postgres://user:password@localhost:5432/dbname`
     - `CLERK_SECRET_KEY=...`
     - `CLOUDINARY_URL=...`
4. **Run database migrations:**
   ```sh
   npm run migrate
   ```
   - This will apply all SQL files in `src/db/migrations/` to your database.
5. **Start the backend server (development):**
   ```sh
   npm run dev
   ```
   - The server will start on the port specified in your `.env` (default: 5000).
   - You should see logs indicating the server and database connection are active.
6. **(Optional) Run with Docker:**
   ```sh
   docker-compose up --build
   ```
   - This will start both the backend and a PostgreSQL database in containers.

## Project Structure Overview

- `src/app.ts` – Main Express app setup (middleware, routes)
- `src/server.ts` – Entry point, starts the HTTP server
- `src/routes/` – API route definitions
- `src/modules/` – Business logic (users, threads, chat, notifications)
- `src/db/` – Database connection, migrations
- `src/realtime/io.ts` – Socket.IO real-time server

## Backend Workflow

1. **Request Handling:**
   - HTTP requests hit the Express server (`app.ts`).
   - Middleware handles logging, error handling, authentication, etc.
2. **Routing:**
   - Requests are routed to the appropriate handler in `src/routes/` (e.g., `user.routes.ts`, `chat.routes.ts`).
3. **Business Logic:**
   - Each route calls a service in `src/modules/` (e.g., `user.service.ts`, `chat.service.ts`).
   - Services handle validation, business rules, and call repositories for DB access.
4. **Database Access:**
   - Repositories in `src/modules/*/*.repository.ts` use Drizzle ORM or raw SQL to interact with PostgreSQL.
5. **Real-Time Events:**
   - For chat and notifications, events are emitted via Socket.IO (`src/realtime/io.ts`).
6. **Response:**
   - The result is returned to the client as JSON (or error if something fails).

## Useful Commands

- `npm run dev` – Start server in development mode (with hot reload)
- `npm run build` – Build TypeScript to JavaScript
- `npm run start` – Start server in production mode
- `npm run migrate` – Run database migrations

## Troubleshooting

- Check `.env` for correct database and API keys
- Ensure PostgreSQL is running (locally or via Docker)
- Check logs for errors (console output)

---

- The backend will be available at `http://localhost:5000` (or as configured).
- For API documentation, see `api-overview.md`.
