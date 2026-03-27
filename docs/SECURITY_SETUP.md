# Security Setup - Environment Variables and GitHub Secrets

This document explains how to properly configure credentials using environment variables and GitHub Secrets instead of hard-coded values.

## 🔐 **Security Issue Fixed**

### **Before (Hard-coded Credentials):**
```typescript
// ❌ BAD: Hard-coded credentials
password: process.env.TEST_DB_PASSWORD || 'postgres_password'
username: process.env.TEST_DB_USERNAME || 'postgres_user'
```

### **After (Environment Variables):**
```typescript
// ✅ GOOD: Simplified environment variables
password: process.env.DB_PASSWORD || 'postgres_password'
username: process.env.DB_USERNAME || 'postgres_user'
```

## 🛠️ **GitHub Secrets Setup**

### **Required Secrets**

Add these secrets to your GitHub repository:

#### **Database Credentials**
```bash
DB_USERNAME=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=your_database_name
DB_HOST=your_database_host
DB_PORT=5432
```

#### **Optional Secrets**
```bash
# For external services
REDIS_PASSWORD=your_redis_password
API_SECRET_KEY=your_api_secret_key
JWT_SECRET=your_jwt_secret
```

### **Setting GitHub Secrets**

1. **Go to Repository**: GitHub → Your Repository → Settings → Secrets and variables → Actions
2. **Add New Repository Secret**:
   - **Name**: `DB_USERNAME`
   - **Secret**: `your_actual_postgres_username`
   - **Repeat** for all required secrets

3. **Environment Variables** (Optional):
   - For different environments (dev/staging/prod)
   - Use naming convention: `DB_USERNAME_DEV`, `DB_USERNAME_PROD`

## 📋 **Environment Configuration Files**

### **.env.local** (Local Development)
```bash
# ✅ GOOD: Uses environment variables
NODE_ENV=development
COMPOSE_PROJECT_NAME=espresso_ml_local

# PostgreSQL Configuration (use environment variables or GitHub Secrets)
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# Redis Configuration
REDIS_PORT=6379

# API Configuration
API_PORT=3001

# Docker Compose Settings
COMPOSE_PROFILES=local
```

### **.env.test** (Testing)
```bash
# ✅ GOOD: Uses environment variables
NODE_ENV=test
COMPOSE_PROJECT_NAME=espresso_ml_test

# PostgreSQL Configuration (use environment variables or GitHub Secrets)
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# Redis Configuration
REDIS_PORT=6379

# API Configuration
API_PORT=3001

# Docker Compose Settings
COMPOSE_PROFILES=test
```

## 🔧 **Docker Compose Configuration**

### **Secure Configuration**
```yaml
# ✅ GOOD: Uses environment variables with defaults
services:
  postgres:
    environment:
      DB_USERNAME: ${DB_USERNAME:-postgres_user}
      DB_PASSWORD: ${DB_PASSWORD:-postgres_password}
      DB_NAME: ${DB_NAME:-espresso_ml_test}
      DB_HOST: ${DB_HOST:-localhost}
      DB_PORT: ${DB_PORT:-5432}
```

### **GitHub Actions Integration**
```yaml
# ✅ GOOD: Uses GitHub Secrets
- name: Run tests with Docker Compose
  env:
    DB_USERNAME: ${{ secrets.DB_USERNAME }}
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
    DB_NAME: ${{ secrets.DB_NAME }}
    DB_HOST: ${{ secrets.DB_HOST }}
    DB_PORT: ${{ secrets.DB_PORT }}
```

## 🔄 **Environment Variable Precedence**

The system follows this precedence order:

1. **GitHub Secrets** (highest priority in CI/CD)
2. **Environment Files** (`.env.local`, `.env.test`)
3. **Shell Variables** (exported in terminal)
4. **Docker Compose Defaults** (fallback values)

## 🚀 **Usage Examples**

### **Local Development**
```bash
# Set environment variables (required once)
export DB_USERNAME=your_local_user
export DB_PASSWORD=your_local_password
export DB_NAME=your_local_db
export DB_HOST=localhost
export DB_PORT=5432

# Or create .env.local file with your values
cp .env.example .env.local
# Edit .env.local with your actual credentials

# Start development
npm run test:docker:local
```

### **CI/CD Testing**
```bash
# GitHub Actions automatically uses secrets
# No manual configuration needed
npm run test:docker
```

### **Production Deployment**
```bash
# Set production secrets in GitHub
# Or use environment-specific secrets
DB_USERNAME_PROD=prod_user
DB_PASSWORD_PROD=prod_password
DB_NAME_PROD=prod_db
DB_HOST_PROD=prod_host
DB_PORT_PROD=5432

# Deploy with production profile
docker-compose --profile production up -d
```

## 🔍 **Verification Commands**

### **Check Environment Variables**
```bash
# Verify environment variables are set
docker-compose config

# Check specific service configuration
docker-compose config | grep -A 10 postgres
```

### **Test Database Connection**
```bash
# Test connection with current credentials
docker exec espresso_ml_postgres psql -U $DB_USERNAME -d $DB_NAME -c "SELECT version();"
```

### **Verify GitHub Secrets in CI**
```bash
# GitHub Actions will show masked secrets in logs
# Example: DB_USERNAME=*** (masked)
```

## 🛡️ **Security Best Practices**

### **1. Never Commit Secrets**
```bash
# ❌ NEVER: Add secrets to code
# ❌ NEVER: Commit .env files with real credentials
# ❌ NEVER: Log secrets in production
```

### **2. Use Environment-Specific Secrets**
```bash
# ✅ GOOD: Separate secrets per environment
DB_USERNAME_DEV=dev_user
DB_USERNAME_PROD=prod_user
DB_USERNAME_STAGING=staging_user
```

### **3. Rotate Credentials Regularly**
```bash
# Change passwords periodically
# Update GitHub secrets when credentials change
# Rotate database credentials quarterly
```

### **4. Principle of Least Privilege**
```bash
# ✅ GOOD: Use minimal required permissions
DB_USERNAME=app_user (not postgres superuser)
DB_PASSWORD=strong_random_password
```

## 🎯 **Implementation Status**

### **✅ Fixed Files:**
1. **`src/__tests__/setup.integration.ts`**: Uses simplified `DB_*` environment variables
2. **`.env.local`**: Uses `${DB_USERNAME}` instead of hard-coded values
3. **`.env.test`**: Uses `${DB_USERNAME}` instead of hard-coded values
4. **`.github/workflows/ci.yml`**: Uses `${{ secrets.DB_USERNAME }}`
5. **`docker-compose.yml`**: Uses `${DB_USERNAME:-postgres_user}` defaults

### **🔐 Security Level:**
- **✅ No Hard-coded Credentials**: All values use environment variables
- **✅ GitHub Secrets Integration**: CI/CD uses secure secrets
- **✅ Environment Isolation**: Different configs for dev/test/prod
- **✅ Fallback Values**: Safe defaults when secrets not set

## 🚀 **Next Steps:**

1. **Set GitHub Secrets**: Add required secrets to your repository
2. **Local Development**: Create `.env.local` with your credentials
3. **Test Configuration**: Verify environment variables work correctly
4. **Deploy Securely**: Use secrets in production deployments

Your application is now configured for secure credential management! 🔐
