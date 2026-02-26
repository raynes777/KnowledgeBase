# Docker Setup Guide - Clinical Trial Documentation

## 🐳 Complete Dockerized Stack

This project is **100% dockerized**. You only need Docker Desktop installed.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Compose                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Frontend (ctd_frontend)                         │  │
│  │  - React 18 + TypeScript + Vite                  │  │
│  │  - Nginx 1.25 (production server)                │  │
│  │  - Port: 3000 (external) → 80 (internal)         │  │
│  │  - Multi-stage build: node:20 → nginx:alpine     │  │
│  │  - Image size: ~50MB                             │  │
│  └────────────────────┬─────────────────────────────┘  │
│                       │ HTTP requests to /api/*        │
│                       ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Backend (ctd_backend)                           │  │
│  │  - Spring Boot 3.2 + Java 17                     │  │
│  │  - Port: 8080                                    │  │
│  │  - Multi-stage build: maven:3.9 → jre:17-alpine │  │
│  │  - Image size: ~200MB                            │  │
│  └────────────────────┬─────────────────────────────┘  │
│                       │ JDBC connection                 │
│                       ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Database (ctd_postgres)                         │  │
│  │  - PostgreSQL 15 Alpine                          │  │
│  │  - Port: 5432                                    │  │
│  │  - Volume: postgres_data (persistent)            │  │
│  │  - Image size: ~200MB                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Network: ctd-network (bridge)                          │
└─────────────────────────────────────────────────────────┘
```

## Services

### 1. Frontend (ctd_frontend)

**Dockerfile:** `frontend/Dockerfile`

```dockerfile
# Stage 1: Build with Node.js
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Features:**
- Multi-stage build (1GB build → 50MB runtime)
- Nginx configuration with API proxy
- React Router support (try_files fallback)
- Static asset caching
- Health check endpoint

**Nginx Configuration:**
- Proxies `/api/*` to backend service
- Serves React SPA with history routing
- Gzip compression enabled
- Security headers (X-Frame-Options, etc.)

### 2. Backend (ctd_backend)

**Dockerfile:** `backend/Dockerfile`

```dockerfile
# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Run with JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

**Features:**
- Multi-stage build (1.2GB build → 200MB runtime)
- Dependency caching for faster rebuilds
- Actuator health endpoint for monitoring
- Waits for PostgreSQL healthcheck

### 3. Database (ctd_postgres)

**Image:** `postgres:15-alpine`

**Features:**
- Persistent volume `postgres_data`
- Health check with `pg_isready`
- Initialized from Flyway migrations on first start

## Health Checks

All services have health checks configured:

**Frontend:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost/"]
  interval: 30s
  timeout: 3s
  retries: 3
```

**Backend:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:8080/actuator/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Database:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ctd_user -d ctd_db"]
  interval: 10s
  timeout: 5s
  retries: 5
```

## Dependency Chain

```
postgres (healthy)
    ↓
backend (depends_on postgres healthy)
    ↓
frontend (depends_on backend healthy)
```

This ensures:
1. Database is ready before backend starts
2. Backend is ready before frontend starts
3. Frontend can immediately connect to backend API

## Build Process

### First Build (~5-10 minutes)
1. Pull base images (PostgreSQL, Maven, Node, Nginx)
2. Download Maven dependencies (~200MB)
3. Compile Spring Boot application
4. Download npm packages (~300MB)
5. Build React application (Vite)
6. Create final runtime images

### Subsequent Builds (<30 seconds)
- Docker layer caching speeds up rebuilds
- Only changed layers are rebuilt
- Dependencies cached unless package files change

## Commands

### Start All Services
```bash
docker-compose up -d --build
```

### Stop All Services
```bash
docker-compose stop
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Rebuild Specific Service
```bash
docker-compose up -d --build frontend
docker-compose up -d --build backend
```

### Shell Access
```bash
# Frontend container
docker exec -it ctd_frontend sh

# Backend container
docker exec -it ctd_backend sh

# Database container
docker exec -it ctd_postgres psql -U ctd_user -d ctd_db
```

### Clean Everything
```bash
# Remove containers + volumes (deletes database!)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Environment Variables

Configured in `docker-compose.yml`:

**Backend:**
- `SPRING_DATASOURCE_URL`: PostgreSQL connection string
- `SPRING_DATASOURCE_USERNAME`: Database user
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing key (change in production!)

**Database:**
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password

## Networking

All services are on the `ctd-network` bridge network:

- Frontend can reach backend at `http://backend:8080`
- Backend can reach database at `postgres:5432`
- Host can reach:
  - Frontend: `http://localhost:3000`
  - Backend: `http://localhost:8080`
  - Database: `localhost:5432`

## Volumes

**postgres_data:** Persistent storage for PostgreSQL data
- Location: Docker managed volume
- Survives container restarts
- Only deleted with `docker-compose down -v`

## Production Considerations

### Security
- ✅ Multi-stage builds (no build tools in runtime images)
- ⚠️ Change default `JWT_SECRET` in production
- ⚠️ Use secrets management (Docker Swarm/Kubernetes)
- ✅ Nginx security headers configured
- ⚠️ Enable HTTPS with reverse proxy (Traefik/Nginx)

### Performance
- ✅ Static asset caching (1 year)
- ✅ Gzip compression enabled
- ✅ Minimal runtime images (Alpine Linux)
- ⚠️ Consider Redis for session storage
- ⚠️ Add CDN for static assets

### Monitoring
- ✅ Health checks configured
- ✅ Spring Boot Actuator endpoints
- ⚠️ Add Prometheus metrics
- ⚠️ Add centralized logging (ELK stack)

### Scaling
- ✅ Stateless backend (can scale horizontally)
- ✅ Stateless frontend (can scale horizontally)
- ⚠️ Add load balancer for multiple instances
- ⚠️ Use managed PostgreSQL in production

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs <service_name>

# Check health status
docker-compose ps
```

### Build fails
```bash
# Clear cache and rebuild
docker-compose build --no-cache <service_name>
```

### Database connection errors
```bash
# Wait for healthcheck
docker-compose logs postgres

# Should see: "database system is ready to accept connections"
```

### Port conflicts
```bash
# Change ports in docker-compose.yml
ports:
  - "8081:8080"  # Backend on 8081 instead of 8080
```

## Advantages of This Setup

✅ **Zero local dependencies** (only Docker needed)
✅ **Identical environment** for all developers
✅ **Production-like setup** (containerized)
✅ **Fast iterations** (layer caching)
✅ **Easy cleanup** (docker-compose down)
✅ **Portable** (works on any OS)
✅ **Scalable** (ready for orchestration)
✅ **Secure** (isolated networks)
