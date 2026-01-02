# Database Guide

This document explains the database technology, schema structure, and migration workflow for the backend.

## Technology Stack
- **Database:** PostgreSQL
- **ORM/Query:** Drizzle ORM (TypeScript)

## Database Schema Structure
- All schema changes are managed via raw SQL migration files in `src/db/migrations/`.
- Each migration file is named incrementally (e.g., `0001_users.sql`, `0002_threads_core.sql`).
- The schema includes tables for users, threads, replies, notifications, chat messages, and rich text support.

### Example: Users Table (from `0001_users.sql`)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Example: Threads Table (from `0002_threads_core.sql`)
```sql
CREATE TABLE threads (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Viewing the Database
- **With Docker:**
  1. Find the running container: `docker ps`
  2. Connect:
     ```sh
     docker exec -it <container_id> psql -U <user> -d <database>
     ```
- **Locally:**
  - Use any PostgreSQL client (TablePlus, DBeaver, psql CLI) with credentials from `.env`.

## Editing/Adding Database Schema
1. **Create a new migration file:**
   - Name it incrementally (e.g., `0007_add_likes.sql`).
2. **Write SQL for schema changes:**
   - Add, alter, or drop tables/columns as needed.
3. **Run migrations:**
   ```sh
   npm run migrate
   ```
   - This runs `src/db/migrate.ts`, which applies all new migrations in order.
4. **Verify changes:**
   - Check the database using a client or by querying tables.

## Migration Workflow
- Migrations are applied in order by filename.
- Each migration should be idempotent and not depend on manual steps.
- If a migration fails, fix the SQL and re-run.

## Notes & Best Practices
- Keep migration files incremental and descriptive.
- Always back up data before running destructive migrations.
- Review migration SQL for correctness before applying to production.
