# ===================================
# Multi-Stage Dockerfile for Galaksio Backend
# Includes: Broker (Node/TypeScript), Executor (Node/TypeScript), Quote (Python/FastAPI)
# ===================================

# ===================================
# Stage 1: Base Node.js image for TypeScript services
# ===================================
FROM node:18-alpine AS node-base
WORKDIR /app
RUN apk add --no-cache python3 make g++

# ===================================
# Stage 2: Build Broker Service
# ===================================
FROM node-base AS broker-builder
WORKDIR /app/broker
COPY broker/package*.json ./
RUN npm ci
COPY broker/tsconfig.json ./
COPY broker/src ./src
RUN npm run build

# ===================================
# Stage 3: Build Executor Service
# ===================================
# FROM node-base AS executor-builder
# WORKDIR /app/executor
# COPY executor/package*.json ./
# RUN npm ci --only=production
# COPY executor/tsconfig.json ./
# COPY executor/src ./src
# RUN npm run build

# ===================================
# Stage 4: Base Python image for Quote service
# ===================================
FROM python:3.13-slim AS python-base
WORKDIR /app/quote
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# ===================================
# Stage 5: Build Quote Service
# ===================================
FROM python-base AS quote-builder
COPY quote/pyproject.toml ./
COPY quote/galaksio ./galaksio
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

# ===================================
# Stage 6: Final Multi-Service Runtime
# ===================================
FROM node:18-alpine AS runtime

# Install Python 3.13 on Alpine
RUN apk add --no-cache python3 py3-pip

# Create application directory
WORKDIR /app

# Copy Broker service
COPY --from=broker-builder /app/broker/dist ./broker/dist
COPY --from=broker-builder /app/broker/node_modules ./broker/node_modules
COPY --from=broker-builder /app/broker/package*.json ./broker/

# Copy Executor service
# COPY --from=executor-builder /app/executor/dist ./executor/dist
# COPY --from=executor-builder /app/executor/node_modules ./executor/node_modules
# COPY --from=executor-builder /app/executor/package*.json ./executor/

# Copy Quote service
COPY --from=quote-builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=quote-builder /app/quote ./quote

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

# Expose ports for all services
# 8080 - Broker
# 8082 - Executor
# 8081 - Quote
EXPOSE 8080 8081

# Create startup script to run all services
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/broker && node dist/index.js &' >> /app/start.sh && \
    echo 'cd /app/quote && python3 -m uvicorn main:app --host 0.0.0.0 --port 8081 &' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
