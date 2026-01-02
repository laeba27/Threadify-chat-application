# Docker in the Backend

## Why Docker?
- Ensures consistent environment across all machines (dev, test, prod)
- Simplifies setup: no need to install dependencies locally
- Easy to scale and deploy
- Isolates services (backend, database, etc.)

## How Docker is Used Here
- `docker-compose.yml` defines services:
  - **backend:** Node.js app
  - **db:** PostgreSQL database
- Each service runs in its own container
- Volumes and networks are configured for data persistence and communication

## Running with Docker
- Start all services:
  ```sh
docker-compose up --build
```
- Stop services:
  ```sh
docker-compose down
```

## Future Use
- Add more services (e.g., Redis, worker queues)
- Use Docker for production deployments
- CI/CD integration for automated builds and tests

## References
- See `docker-compose.yml` for configuration
- See `setup-backend.md` for setup steps
