# Galaksio Backend - Docker Setup

This directory contains Docker configuration files for the Galaksio backend services.

## Architecture

The Galaksio backend consists of three microservices:

1. **Broker** (Node.js/TypeScript) - Port 8080
   - Main API gateway and job orchestration
   - Handles client requests and coordinates between services

2. **Quote** (Python/FastAPI) - Port 8081
   - Multi-cloud pricing quotes
   - Supports compute, storage, and cache pricing

3. **Executor** (Node.js/TypeScript) - Port 8082
   - Job execution service
   - Handles xcache and payment operations

## Docker Files

### Main Files
- `Dockerfile` - Multi-stage build for all services in one container
- `docker-compose.yaml` - Orchestration configuration

### Individual Service Dockerfiles (Optional)
- `Dockerfile.broker` - Broker service only
- `Dockerfile.executor` - Executor service only
- `Dockerfile.quote` - Quote service only

## Quick Start

### Option 1: All-in-One Container (Recommended for Development)

Run all three services in a single container:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The services will be available at:
- Broker: http://localhost:8080
- Quote: http://localhost:8081
- Executor: http://localhost:8082

### Option 2: Separate Containers (Recommended for Production)

To run services separately, edit `docker-compose.yaml`:
1. Comment out the `galaksio-backend` service
2. Uncomment the individual `broker`, `quote`, and `executor` services
3. Run: `docker-compose up --build`

## Building Individual Services

### Build Broker Only
```bash
docker build -f Dockerfile.broker -t galaksio-broker .
docker run -p 8080:8080 galaksio-broker
```

### Build Executor Only
```bash
docker build -f Dockerfile.executor -t galaksio-executor .
docker run -p 8082:8082 galaksio-executor
```

### Build Quote Only
```bash
docker build -f Dockerfile.quote -t galaksio-quote .
docker run -p 8081:8081 galaksio-quote
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Node.js Environment
NODE_ENV=production

# Service URLs (for microservices architecture)
QUOTE_SERVICE_URL=http://quote:8081
EXECUTOR_SERVICE_URL=http://executor:8082

# Database (if needed)
DATABASE_URL=

# API Keys and Secrets
# Add your API keys here
```

## Development

### Live Reload with Docker

For development with live reload, you can mount volumes:

```yaml
services:
  galaksio-backend:
    volumes:
      - ./broker/src:/app/broker/src
      - ./executor/src:/app/executor/src
      - ./quote:/app/quote
```

Then run with development command overrides.

### Debugging

View logs for specific service:
```bash
docker-compose logs -f galaksio-backend
```

Enter container shell:
```bash
docker exec -it galaksio-backend /bin/sh
```

## Health Checks

The all-in-one container includes a health check for the broker service:
- Endpoint: `http://localhost:8080/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

## Troubleshooting

### Port Conflicts
If ports are already in use, modify the port mappings in `docker-compose.yaml`:
```yaml
ports:
  - "8090:8080"  # Maps host port 8090 to container port 8080
```

### Build Errors
Clear Docker cache and rebuild:
```bash
docker-compose down
docker system prune -a
docker-compose up --build
```

### Memory Issues
Increase Docker memory limits in Docker Desktop settings (recommended: 4GB+)

## Production Deployment

For production deployment:

1. Use separate service containers for better scalability
2. Add a reverse proxy (nginx) for SSL and routing
3. Set up proper logging and monitoring
4. Use Docker secrets for sensitive data
5. Configure restart policies
6. Set resource limits:

```yaml
services:
  broker:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Architecture Diagram

```
                    ┌─────────────────┐
                    │   Client Apps   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Broker :8080   │
                    │   (Gateway)     │
                    └────┬───────┬────┘
                         │       │
              ┌──────────┘       └──────────┐
              │                              │
    ┌─────────▼─────────┐        ┌─────────▼─────────┐
    │  Quote :8081      │        │ Executor :8082    │
    │  (Python/FastAPI) │        │ (Node/TypeScript) │
    └───────────────────┘        └───────────────────┘
```

## Testing

Test services are running:
```bash
# Broker health check
curl http://localhost:8080/health

# Quote service
curl http://localhost:8081/health

# Executor (check specific endpoint based on implementation)
curl http://localhost:8082/
```

## Stopping and Cleanup

```bash
# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Remove all containers and images
docker-compose down --rmi all
```
