# Galaksio Backend

Multi-service backend system for Galaksio multi-cloud orchestration with x402 payment integration. The backend consists of three microservices: Quote Service, Broker Service, and Executor Service.

## Table of Contents
- [System Requirements](#system-requirements)
- [Architecture Overview](#architecture-overview)
- [Installation](#installation)
- [Running the Services](#running-the-services)
- [Docker Deployment](#docker-deployment)
- [Service Details](#service-details)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Required Software

#### For Quote Service (Python)
- **Python**: 3.13 or higher
- **pip** or **uv**: Python package manager
- **uvicorn**: ASGI server (installed via dependencies)

#### For Broker & Executor Services (Node.js/TypeScript)
- **Node.js**: 18.0.0 or higher (LTS recommended)
- **npm**: 8.0.0 or higher (comes with Node.js)
- **TypeScript**: Installed via dependencies

### Optional (Recommended)
- **Docker**: 20.10+ and Docker Compose 2.0+ (for containerized deployment)
- **Git**: For version control and development

### Operating Systems
- **Linux**: Ubuntu 20.04+, Debian 11+, Fedora 36+, CentOS Stream 9+
- **macOS**: 11+ (Big Sur and later)
- **Windows**: 10/11 with WSL2 (for Docker) or native Node.js/Python

### Hardware Requirements
- **RAM**: Minimum 2GB, Recommended 4GB+
- **CPU**: 2+ cores recommended for concurrent service execution
- **Disk Space**: 500MB+ for services and dependencies

## Architecture Overview

The Galaksio backend consists of three interconnected microservices:

```
┌─────────────────────────────────────────────────────────────┐
│                      Galaksio Backend                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐    │
│  │   Quote    │      │   Broker   │      │  Executor  │    │
│  │  Service   │◄─────┤  Service   │─────►│  Service   │    │
│  │            │      │            │      │            │    │
│  │ Python     │      │ TypeScript │      │ TypeScript │    │
│  │ FastAPI    │      │ Express    │      │ Express    │    │
│  │ Port: 8081 │      │ Port: 8080 │      │ Port: 8082 │    │
│  └────────────┘      └────────────┘      └────────────┘    │
│                                                               │
│  x402 Payment Protocol Integration                          │
└─────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

1. **Quote Service** (Python/FastAPI)
   - Provides pricing quotes for operations
   - Handles x402 payment protocol quote phase
   - Port: 8081

2. **Broker Service** (TypeScript/Express)
   - Central orchestration service
   - Routes requests to appropriate services
   - Manages x402 payment flow
   - Exposes API endpoints for clients
   - Port: 8080

3. **Executor Service** (TypeScript/Express)
   - Executes code and operations
   - Manages cloud resources
   - Handles file storage and caching
   - Port: 8082

## Installation

### Method 1: Local Development Setup

#### Step 1: Install Quote Service (Python)

```bash
# Navigate to quote service directory
cd backend/quote

# Option A: Using pip
pip install -e .

# Option B: Using uv (faster)
uv pip install -e .
```

#### Step 2: Install Broker Service (Node.js)

```bash
# Navigate to broker service directory
cd backend/broker

# Install dependencies
npm install

# Build TypeScript files
npm run build
```

#### Step 3: Install Executor Service (Node.js)

```bash
# Navigate to executor service directory
cd backend/executor

# Install dependencies
npm install

# Build TypeScript files
npm run build
```

### Method 2: Docker Setup (Recommended for Production)

```bash
# Navigate to backend directory
cd backend

# Build and start all services using Docker Compose
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

## Running the Services

### Local Development (Recommended for Development)

You'll need **three separate terminal windows/tabs** to run all services:

#### Terminal 1: Quote Service

```bash
cd backend/quote
uvicorn main:app --reload --port 8081
```

**Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8081 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
```

#### Terminal 2: Broker Service

```bash
cd backend/broker
npm start dev
```

**Output:**
```
[INFO] Starting ts-node-dev...
Broker service running on port 8080
```

#### Terminal 3: Executor Service

```bash
cd backend/executor
npm start dev
```

**Output:**
```
[INFO] Starting tsx...
Executor service running on port 8082
```

### Production Mode (Local)

#### Quote Service

```bash
cd backend/quote
uvicorn main:app --host 0.0.0.0 --port 8081 --workers 4
```

#### Broker Service

```bash
cd backend/broker
npm run build
npm start
```

#### Executor Service

```bash
cd backend/executor
npm run build
npm start
```

### Docker Deployment

#### Start All Services

```bash
# From backend directory
docker-compose up -d
```

#### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f galaksio-backend
```

#### Stop Services

```bash
docker-compose down
```

#### Restart Services

```bash
docker-compose restart
```

### Verify Services are Running

```bash
# Check Quote Service
curl http://localhost:8081/health
# Expected: {"status": "ok"}

# Check Broker Service
curl http://localhost:8080/health
# Expected: {"status": "ok"}

# Check Executor Service
curl http://localhost:8082/health
# Expected: {"status": "ok"}
```

## Service Details

### Quote Service (Python/FastAPI)

**Location:** `backend/quote/`

**Dependencies:**
- `fastapi` - Modern web framework
- `uvicorn` - ASGI server
- `requests` - HTTP client
- `web3` - Ethereum library

**Key Files:**
- `main.py` - Main application entry point
- `pyproject.toml` - Python project configuration

**Available Scripts:**
```bash
# Development mode with auto-reload
uvicorn main:app --reload --port 8081

# Production mode with multiple workers
uvicorn main:app --host 0.0.0.0 --port 8081 --workers 4

# Check Python version
python --version  # Should be 3.13+
```

### Broker Service (TypeScript/Express)

**Location:** `backend/broker/`

**Dependencies:**
- `express` - Web framework
- `x402-express` - x402 payment middleware
- `axios` - HTTP client
- `typescript` - TypeScript compiler

**Key Files:**
- `src/index.ts` - Main application entry point
- `package.json` - Node.js project configuration
- `tsconfig.json` - TypeScript configuration

**Available Scripts:**
```bash
# Development mode with auto-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Production mode
npm start

# Type checking
tsc --noEmit

# Run tests
npm run test:e2b
```

### Executor Service (TypeScript/Express)

**Location:** `backend/executor/`

**Dependencies:**
- `express` - Web framework
- `axios` - HTTP client
- `dotenv` - Environment variable management

**Key Files:**
- `src/index.ts` - Main application entry point
- `package.json` - Node.js project configuration
- `tsconfig.json` - TypeScript configuration

**Available Scripts:**
```bash
# Development mode with auto-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Production mode
npm start

# Type checking
npm run type-check

# Run tests
npm test
```

## Configuration

### Environment Variables

Create environment files for each deployment mode:

#### Development: `.env.development`

```bash
# Quote Service
PYTHON_ENV=development

# Broker Service
NODE_ENV=development
QUOTE_SERVICE_URL=http://localhost:8081
EXECUTOR_SERVICE_URL=http://localhost:8082
BROKER_PORT=8080

# Executor Service
EXECUTOR_PORT=8082

# x402 Configuration
X402_ENABLED=true
X402_WALLET_ADDRESS=0x...
```

#### Production: `.env.production`

```bash
# Quote Service
PYTHON_ENV=production

# Broker Service
NODE_ENV=production
QUOTE_SERVICE_URL=http://quote:8081
EXECUTOR_SERVICE_URL=http://executor:8082
BROKER_PORT=8080

# Executor Service
EXECUTOR_PORT=8082

# x402 Configuration
X402_ENABLED=true
X402_WALLET_ADDRESS=0x...
X402_NETWORK=mainnet
```

### Configuration Files

**Quote Service** (`backend/quote/pyproject.toml`):
- Python version requirements
- Package dependencies
- Build system configuration

**Broker Service** (`backend/broker/package.json`):
- Node.js version requirements
- npm scripts
- TypeScript dependencies

**Executor Service** (`backend/executor/package.json`):
- Node.js version requirements
- npm scripts
- Runtime dependencies

### Port Configuration

| Service   | Default Port | Environment Variable |
|-----------|--------------|----------------------|
| Quote     | 8081         | QUOTE_PORT           |
| Broker    | 8080         | BROKER_PORT          |
| Executor  | 8082         | EXECUTOR_PORT        |

## API Documentation

### Broker Service Endpoints

**Base URL:** `http://localhost:8080`

#### Health Check
```bash
GET /health
```

#### Execute Code
```bash
POST /execute
Content-Type: application/json

{
  "code": "print('Hello, World!')",
  "language": "python"
}
```

#### Store File
```bash
POST /store
Content-Type: multipart/form-data

file: <binary>
permanent: true
```

#### Create Cache
```bash
POST /cache
Content-Type: application/json

{
  "region": "us-east-1",
  "ttl": 3600
}
```

### Quote Service Endpoints

**Base URL:** `http://localhost:8081`

#### Get Quote
```bash
GET /quote?operation=execute&size=1024
```

### Executor Service Endpoints

**Base URL:** `http://localhost:8082`

#### Execute Code
```bash
POST /run
Content-Type: application/json

{
  "code": "print('Hello')",
  "language": "python"
}
```

For complete API documentation, visit:
- Broker: `http://localhost:8080/docs` (Swagger UI)
- Quote: `http://localhost:8081/docs` (FastAPI auto-docs)

## Development

### Project Structure

```
backend/
├── quote/                  # Quote Service (Python)
│   ├── main.py            # FastAPI application
│   ├── pyproject.toml     # Python configuration
│   └── uv.lock            # Dependency lock file
│
├── broker/                 # Broker Service (TypeScript)
│   ├── src/
│   │   └── index.ts       # Express application
│   ├── package.json       # Node.js configuration
│   ├── tsconfig.json      # TypeScript configuration
│   └── node_modules/      # Dependencies
│
├── executor/               # Executor Service (TypeScript)
│   ├── src/
│   │   └── index.ts       # Express application
│   ├── package.json       # Node.js configuration
│   ├── tsconfig.json      # TypeScript configuration
│   └── node_modules/      # Dependencies
│
├── docker-compose.yaml     # Docker orchestration
├── Dockerfile              # Multi-service Docker image
├── Dockerfile.broker       # Broker-specific Dockerfile
├── Dockerfile.executor     # Executor-specific Dockerfile
├── Dockerfile.quote        # Quote-specific Dockerfile
└── notes.txt              # Development notes
```

### Development Workflow

#### 1. Make Changes to Code

Edit files in respective service directories:
- Quote: `backend/quote/main.py`
- Broker: `backend/broker/src/index.ts`
- Executor: `backend/executor/src/index.ts`

#### 2. Test Changes Locally

The development servers auto-reload on file changes:
- Quote: `uvicorn` with `--reload` flag
- Broker: `ts-node-dev` with `--respawn` flag
- Executor: `tsx` with watch mode

#### 3. Run Type Checks (TypeScript services)

```bash
# Broker
cd backend/broker
npm run build

# Executor
cd backend/executor
npm run type-check
```

#### 4. Test with CLI

```bash
cd cli
galaksio login -k YOUR_KEY
galaksio run test-script.py
```

### Adding New Dependencies

#### Quote Service (Python)

```bash
cd backend/quote

# Add to pyproject.toml
# Then reinstall
pip install -e .
```

#### Broker/Executor Service (Node.js)

```bash
cd backend/broker  # or backend/executor

# Install package
npm install package-name

# Install dev dependency
npm install --save-dev package-name
```

## Troubleshooting

### Port Already in Use

**Problem:** Service fails to start with "EADDRINUSE" or "Address already in use" error.

**Solutions:**

#### Linux/macOS:
```bash
# Find process using port 8080 (example)
lsof -i :8080

# Kill the process
kill -9 <PID>
```

#### Windows:
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process
taskkill /PID <PID> /F
```

### Service Connection Errors

**Problem:** Services can't communicate with each other.

**Solutions:**
1. Verify all services are running:
   ```bash
   curl http://localhost:8080/health
   curl http://localhost:8081/health
   curl http://localhost:8082/health
   ```

2. Check environment variables in `.env.*` files

3. Verify service URLs are correct:
   - Local: `http://localhost:PORT`
   - Docker: Use service names (e.g., `http://quote:8081`)

### Python Version Mismatch

**Problem:** Quote service requires Python 3.13+ but system has older version.

**Solutions:**
```bash
# Check Python version
python --version

# Install Python 3.13 (Ubuntu/Debian)
sudo apt update
sudo apt install python3.13

# Use pyenv for version management
pyenv install 3.13.0
pyenv local 3.13.0
```

### Node.js Version Mismatch

**Problem:** Services require Node.js 18+ but system has older version.

**Solutions:**
```bash
# Check Node.js version
node --version

# Install using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or install latest LTS
nvm install --lts
```

### TypeScript Build Errors

**Problem:** TypeScript compilation fails with type errors.

**Solutions:**
```bash
# Clean build artifacts
rm -rf dist/
rm -rf node_modules/

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### Docker Issues

**Problem:** Docker containers fail to start or build.

**Solutions:**
```bash
# Clean Docker state
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

### Module Not Found Errors

**Problem:** Import/require statements fail.

**Solutions:**

#### Python:
```bash
cd backend/quote
pip install -e . --force-reinstall
```

#### Node.js:
```bash
cd backend/broker  # or executor
rm -rf node_modules package-lock.json
npm install
```

### Permission Denied Errors

**Problem:** Cannot install packages or run services due to permission errors.

**Solutions:**

#### Linux/macOS:
```bash
# Use Python virtual environment
python -m venv venv
source venv/bin/activate
pip install -e .

# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

#### Windows:
- Run terminal as Administrator
- Or use `--user` flag for pip

## Testing

### Manual Testing

```bash
# Test Quote Service
curl -X GET "http://localhost:8081/quote?operation=execute&size=1024"

# Test Broker Service
curl -X POST "http://localhost:8080/execute" \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello\")", "language": "python"}'

# Test Executor Service
curl -X POST "http://localhost:8082/run" \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(\"Hello\")", "language": "javascript"}'
```

### Integration Testing

Use the Galaksio CLI to test the full stack:

```bash
cd cli
galaksio login -k YOUR_PRIVATE_KEY
galaksio run test-script.py
galaksio store test-file.txt --permanent
galaksio cache --region us-east-1
```

## Production Deployment

### Using Docker Compose (Recommended)

```bash
# Build production images
docker-compose -f docker-compose.yaml build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Scale services (if needed)
docker-compose up -d --scale galaksio-backend=3
```

### Using Individual Docker Containers

```bash
# Build separate service images
docker build -f Dockerfile.quote -t galaksio-quote .
docker build -f Dockerfile.broker -t galaksio-broker .
docker build -f Dockerfile.executor -t galaksio-executor .

# Run containers
docker run -d -p 8081:8081 galaksio-quote
docker run -d -p 8080:8080 galaksio-broker
docker run -d -p 8082:8082 galaksio-executor
```

### Environment Setup for Production

1. Create `.env.production` with production values
2. Use environment-specific configuration
3. Enable HTTPS/TLS for external access
4. Set up monitoring and logging
5. Configure firewall rules

## Monitoring

### Health Checks

All services expose `/health` endpoints:

```bash
# Automated health check script
#!/bin/bash
services=("8080" "8081" "8082")
for port in "${services[@]}"; do
  if curl -f http://localhost:$port/health; then
    echo "Service on port $port is healthy"
  else
    echo "Service on port $port is down!"
  fi
done
```

### Logs

#### Local Development:
- Quote: Check terminal output
- Broker: Check terminal output
- Executor: Check terminal output

#### Docker:
```bash
docker-compose logs -f
docker-compose logs -f galaksio-backend
```

## Support

For issues, questions, or contributions:
- GitHub Issues: [Repository Issues Page]
- Documentation: [Project Documentation]
- CLI Documentation: See [CLI README](../cli/README.md)

## License

Apache-2.0
