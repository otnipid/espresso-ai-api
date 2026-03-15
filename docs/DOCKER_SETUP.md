# Unified Docker Environment Setup

This document explains how to use the unified `docker-compose.yml` file for different scenarios using profiles.

## 🐳 Overview

The unified Docker Compose file supports multiple scenarios using **Docker profiles**:
- **`local`**: Local development environment
- **`test`**: CI/CD testing environment

## 🚀 Quick Start

### Local Development
```bash
# Start development environment
npm run test:docker:local

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Testing (CI/CD)
```bash
# Run tests in isolated environment
npm run test:docker

# Note: Uses same 'local' profile but with NODE_ENV=test
```

## 📋 Environment Configuration

### Local Development (.env.local)
```bash
NODE_ENV=development
COMPOSE_PROJECT_NAME=espresso_ml_local
POSTGRES_USER=postgres_user
POSTGRES_PASSWORD=postgres_password
POSTGRES_DB=espresso_ml_dev
POSTGRES_PORT=5432
REDIS_PORT=6379
API_PORT=3001
```

### Testing (.env.test)
```bash
NODE_ENV=test
COMPOSE_PROJECT_NAME=espresso_ml_test
POSTGRES_USER=postgres_user
POSTGRES_PASSWORD=postgres_password
POSTGRES_DB=espresso_ml_test
POSTGRES_PORT=5432
REDIS_PORT=6379
API_PORT=3001
```

## 🔧 Docker Compose Profiles

### Profile: local
**Services**: `postgres`, `redis`, `api`
- **API**: Development mode with hot reload
- **Volumes**: Persistent data and source code mounting
- **Command**: `npm run dev`
- **Environment**: Uses `NODE_ENV` to determine behavior

### Testing Configuration
**Note**: Testing uses the same `local` profile but sets `NODE_ENV=test`
- **API**: Runs tests when `NODE_ENV=test`
- **Volumes**: Coverage and test results
- **Command**: Automated test execution

## 🎯 Service Details

### PostgreSQL Service
```yaml
postgres:
  image: ghcr.io/otnipid/espresso-ml-postgres:latest
  container_name: ${COMPOSE_PROJECT_NAME}_postgres
  environment:
    DB_USERNAME: ${POSTGRES_USER:-postgres_user}
    DB_PASSWORD: ${POSTGRES_PASSWORD:-postgres_password}
    DB_NAME: ${POSTGRES_DB:-espresso_ml_test}
  profiles: [local]
```

### API Service
```yaml
api:
  environment:
    NODE_ENV: ${NODE_ENV:-development}
    DB_HOST: postgres
    DB_NAME: ${POSTGRES_DB:-espresso_ml_dev}
    DB_USERNAME: ${POSTGRES_USER:-postgres_user}
    DB_PASSWORD: ${POSTGRES_PASSWORD:-postgres_password}
  command: npm run dev
  profiles: [local]
```

### Testing Behavior
```yaml
# When NODE_ENV=test, the same api service will:
# 1. Use test database configuration
# 2. Run tests instead of development server
# 3. Generate coverage reports
```

## 🔄 Usage Scenarios

### 1. Local Development
```bash
# Load local environment
cp .env.local .env

# Start development services
docker-compose --profile local up --build

# Or use the convenience script
npm run test:docker:local
```

### 2. Testing
```bash
# Load test environment
cp .env.test .env

# Start test services
docker-compose --profile test up --build

# Or use the convenience script
npm run test:docker
```

### 3. Production Deployment
```bash
# Deploy to production (custom profile)
docker-compose --profile production up -d
```

## 📊 Environment Variables

### Variable Precedence
1. **Environment file** (.env.local, .env.test)
2. **Shell variables** (exported in terminal)
3. **Docker Compose defaults** (specified in docker-compose.yml)

### Service Discovery
- **Database hostname**: `postgres` (service name)
- **Redis hostname**: `redis` (service name)
- **API endpoints**: `localhost:${API_PORT:-3001}`

## �️ Package.json Scripts

### Docker Management
```json
{
  "test:docker": "docker-compose --profile test up --build --abort-on-container-exit",
  "test:docker:local": "docker-compose --profile local up --build",
  "docker:down": "docker-compose --profile local down",
  "docker:logs": "docker-compose --profile local logs -f api",
  "docker:test:logs": "docker-compose --profile test logs -f api-test"
}
```

## 🎯 Advanced Usage

### Custom Environment Variables
```bash
# Override database name
POSTGRES_DB=custom_db docker-compose --profile test up

# Use different ports
API_PORT=8080 docker-compose --profile local up

# Custom project name
COMPOSE_PROJECT_NAME=my_project docker-compose --profile test up
```

### Profile Combinations
```bash
# Start multiple profiles
docker-compose --profile local --profile test up

# Start specific services
docker-compose --profile local up postgres redis
```

### Service Management
```bash
# List running services
docker-compose ps

# Stop specific profile
docker-compose --profile test down

# Rebuild specific service
docker-compose --profile local up --build api

# Remove all containers and volumes
docker-compose --profile local down -v
```

## 🔍 Troubleshooting

### Profile Issues
```bash
# Check active profiles
docker-compose config --services

# Verify environment variables
docker-compose config

# Debug service startup
docker-compose --profile test up --build --no-deps
```

### Service Connectivity
```bash
# Test database connection
docker exec espresso_ml_test_postgres pg_isready -U postgres_user

# Test Redis connection
docker exec espresso_ml_test_redis redis-cli ping

# Access API logs
docker-compose --profile test logs api-test
```

### Environment Conflicts
```bash
# Clear environment
unset $(env | grep -E '^COMPOSE_|^NODE_|^POSTGRES_|^REDIS_' | cut -d= -f1)

# Use specific env file
docker-compose --env-file .env.custom --profile test up
```

## 🚀 Benefits of Unified Approach

1. **Single Source of Truth**: One docker-compose.yml file
2. **Environment Isolation**: Separate profiles for different scenarios
3. **Configuration Flexibility**: Environment-specific variables
4. **Simplified Maintenance**: No duplicate files
5. **Consistent Behavior**: Same services across environments
6. **Easy Deployment**: Profile-based service selection

## � GitHub Actions Integration

The CI workflow automatically:
1. Sets test environment variables
2. Pulls custom PostgreSQL image
3. Uses `--profile test` for testing
4. Uploads coverage artifacts
5. Cleans up automatically

This unified approach provides maximum flexibility with minimum configuration! 🎉
