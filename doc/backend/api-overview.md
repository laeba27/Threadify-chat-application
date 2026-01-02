# API Overview

This document provides a detailed overview of the backend API, including endpoint structure, request/response schemas, and workflow.

## Structure
- All API routes are defined in `backend/src/routes/`.
- Each module (users, threads, chat, notifications, upload) has its own route file and service/repository.
- Real-time events are handled via Socket.IO in `src/realtime/io.ts`.

## Main Endpoints & Schemas

### User API (`/api/user`)
- **POST /api/user/register** – Register a new user
	- Request: `{ "email": string, "password": string, "name": string }`
	- Response: `{ "id": string, "email": string, "name": string }`
- **POST /api/user/login** – Login
	- Request: `{ "email": string, "password": string }`
	- Response: `{ "token": string, "user": { ... } }`
- **GET /api/user/profile** – Get current user profile (auth required)
	- Response: `{ "id": string, "email": string, "name": string, ... }`

### Threads API (`/api/threads`)
- **GET /api/threads** – List threads
	- Response: `[ { "id": string, "title": string, "authorId": string, ... }, ... ]`
- **POST /api/threads** – Create thread
	- Request: `{ "title": string, "content": string }`
	- Response: `{ "id": string, "title": string, ... }`
- **GET /api/threads/:id** – Get thread details
	- Response: `{ "id": string, "title": string, "content": string, "replies": [ ... ] }`
- **POST /api/threads/:id/reply** – Add reply to thread
	- Request: `{ "content": string }`
	- Response: `{ "id": string, "content": string, ... }`

### Chat API (`/api/chat`)
- **GET /api/chat/:userId** – Get chat history with a user
	- Response: `[ { "id": string, "from": string, "to": string, "message": string, ... }, ... ]`
- **POST /api/chat/:userId** – Send message
	- Request: `{ "message": string }`
	- Response: `{ "id": string, "message": string, ... }`
- **WebSocket Events:**
	- `message:new` – Real-time message delivery
	- `message:read` – Mark message as read

### Notifications API (`/api/notifications`)
- **GET /api/notifications** – List notifications
	- Response: `[ { "id": string, "type": string, "message": string, ... }, ... ]`
- **POST /api/notifications/read** – Mark notifications as read
	- Request: `{ "ids": string[] }`
	- Response: `{ "success": boolean }`

### Upload API (`/api/upload`)
- **POST /api/upload** – Upload image/file
	- Request: `multipart/form-data` with file
	- Response: `{ "url": string, "public_id": string }`

## API Workflow

1. **Request**: Client sends HTTP request to an endpoint (e.g., create thread, send message).
2. **Routing**: Express routes in `src/routes/` match the endpoint and call the appropriate controller.
3. **Middleware**: Middleware (e.g., authentication, error handling) runs before/after the controller.
4. **Service Layer**: Controller calls a service in `src/modules/` for business logic (validation, processing).
5. **Repository Layer**: Service calls repository to interact with the database (CRUD operations).
6. **Real-Time Events**: For chat/notifications, service emits events via Socket.IO to connected clients.
7. **Response**: Controller sends JSON response (or error) back to the client.

## Example: Creating a Thread (Detailed)
1. **Client**: Sends POST `/api/threads` with `{ "title": "Hello", "content": "First post!" }`.
2. **Route**: `threads.routes.ts` matches the endpoint, calls controller.
3. **Service**: `threads.service.ts` validates input, applies business rules.
4. **Repository**: `threads.repository.ts` inserts new thread into database.
5. **Socket.IO**: Optionally emits a `thread:new` event to notify users in real-time.
6. **Response**: Returns new thread data as JSON.

## Error Handling
- All errors are handled by middleware in `src/middleware/errorHandler.ts`.
- Errors are returned as `{ "error": string, "message": string }`.

---

See each module's route/service file for detailed logic and more endpoint options.
