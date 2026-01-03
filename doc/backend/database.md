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


## Viewing and Editing the Database with pgAdmin 4

### Connecting to the Database
1. **Open pgAdmin 4** on your machine.
2. **Add a new server:**
    - Right-click on "Servers" > Create > Server.
    - **General Tab:** Enter a name (e.g., `ThreadifyDB`).
    - **Connection Tab:**
       - Host: If using Docker, use `localhost` (or the Docker network IP if running outside Docker).
       - Port: Usually `5432` (default for PostgreSQL).
       - Username: As set in your `.env` or `docker-compose.yml` (e.g., `postgres`).
       - Password: As set in your `.env` or `docker-compose.yml`.
       - Database: As set in your `.env` (e.g., `threadify`).
    - Click Save.

### Viewing the Schema
- Expand your server > Databases > [your database] > Schemas > public > Tables to see all tables.
- Right-click a table > View/Edit Data > All Rows to browse data.
- Right-click a table > Properties to see columns and constraints.

### Creating/Editing Schema in pgAdmin 4
- **To create a new table:**
   1. Right-click on Tables > Create > Table.
   2. Fill in table name and columns (name, type, constraints).
   3. Click Save.
- **To edit an existing table:**
   1. Right-click the table > Properties.
   2. Add/remove columns, change types, etc.
   3. Click Save.
- **To run custom SQL:**
   1. Open the Query Tool (right-click database > Query Tool).
   2. Write and execute SQL (e.g., `ALTER TABLE ...`, `CREATE TABLE ...`).

### Notes
- Changes made in pgAdmin 4 are applied directly to the database.
- For production or team environments, prefer using migration files to keep schema changes versioned.

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
