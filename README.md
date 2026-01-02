# Threadify Chat Application

Threadify is a real-time chat and discussion platform built with a modern tech stack, supporting threads, direct messaging, notifications, and rich text editing.

--- 



## Tech Stack

### Backend
- **Node.js** (TypeScript)
- **Express.js** (API server)
- **PostgreSQL** (database)
- **Drizzle ORM** (database access)
- **Socket.IO** (real-time communication)
- **Docker & Docker Compose** (containerization)
- **Cloudinary** (media uploads)
- **Clerk** (authentication)

### Frontend
- **Next.js** (React framework)
- **TypeScript**
- **Tailwind CSS** (styling)
- **Rich Text Editor** (custom component)

---

## Features

- User authentication (sign up, sign in)
- Create, view, and reply to threads
- Direct user-to-user chat (real-time)
- Notifications for replies, messages, and mentions
- Image/file upload support
- Responsive, modern UI with dark mode
- Real-time updates via WebSockets

---

## Project Structure

- `backend/` – API server, database, real-time logic
- `frontend/` – Next.js app, UI components, hooks
- `doc/` – Documentation for backend setup, API, database, and Docker

---

## Workflow Overview

1. **Frontend** sends API requests (REST) and connects to WebSocket for real-time events.
2. **Backend** handles requests via Express routes, processes business logic, and interacts with PostgreSQL.
3. **Socket.IO** enables real-time chat and notifications.
4. **Database** stores users, threads, messages, notifications, etc.
5. **Docker** can be used to run the entire stack locally with one command.

---

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Docker & Docker Compose (optional, for containerized setup)

### Backend
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in required values
4. `npm run migrate` (run DB migrations)
5. `npm run dev` (start server)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (start Next.js app)

### With Docker
1. From project root: `docker-compose up --build`

---

## Documentation

See the `doc/` folder for detailed guides on backend setup, API endpoints, database management, and Docker usage.

---

## License

MIT
