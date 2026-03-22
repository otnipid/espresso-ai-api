#!/bin/bash
set -e

# Start Espresso ML PostgreSQL database for integration tests
# Based on documentation from espresso-db/docs/api-integration.md and local-development-setup.md

echo "🚀 Starting Espresso ML PostgreSQL database for integration tests..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if we're on ARM64 (Apple Silicon) and provide helpful info
ARCH=$(uname -m)
echo "🏗️  Detected architecture: $ARCH"
if [ "$ARCH" = "arm64" ]; then
    echo "💡 Using official PostgreSQL image for ARM64 compatibility"
    echo "📦 Schema files will be mounted automatically"
fi

# Clean up any existing containers to avoid conflicts
echo "🧹 Cleaning up existing containers..."
docker-compose --profile test down -v 2>/dev/null || true

# Start the database with test profile
echo "📦 Starting PostgreSQL container..."
if ! docker-compose --profile test up -d postgres; then
    echo "❌ Failed to start PostgreSQL container"
    echo "📋 Docker Compose logs:"
    docker-compose --profile test logs postgres
    exit 1
fi

# Wait for database to be healthy
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-espresso_ml} > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Database failed to start after $max_attempts attempts"
        echo "📋 Container logs:"
        docker-compose logs postgres
        exit 1
    fi
    
    echo "⏳ Attempt $attempt/$max_attempts: Waiting for database..."
    sleep 2
    attempt=$((attempt + 1))
done

# Wait a bit more for database to be fully ready
echo "⏳ Waiting for database to be fully ready..."
sleep 3

# Load schema manually using individual files (like CI/CD does)
echo "🔧 Loading database schema (individual files)..."
for file in 01-extensions.sql 02-users.sql 03-beans.sql 05-machines.sql 06-grinders.sql 04-bean-batches.sql 07-shots.sql 08-shot-preparation.sql 09-shot-extraction.sql 10-shot-environment.sql 11-shot-feedback.sql 12-shot-history.sql 13-shot-drafts.sql 14-indexes.sql; do
    echo "  Loading $file..."
    if docker-compose exec -T postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-espresso_ml} -f /docker-entrypoint-initdb.d/schema/$file > /dev/null 2>&1; then
        echo "    ✅ $file loaded successfully"
    else
        echo "    ⚠️  $file had issues (may be idempotent)"
    fi
done

# Verify schema is loaded
echo "🔍 Verifying database schema..."
schema_check=$(docker-compose exec -T postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-espresso_ml} -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'beans', 'shots')" 2>/dev/null || echo "0")

if [ "$schema_check" -eq 3 ]; then
    echo "✅ Database schema verified successfully!"
    echo "📋 Available tables:"
    docker-compose exec -T postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-espresso_ml} -c "\dt" | head -10
else
    echo "⚠️  Expected schema tables not found. Found: $schema_check/3"
    echo "📋 Available tables:"
    docker-compose exec -T postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-espresso_ml} -c "\dt" 2>/dev/null || echo "Could not list tables"
    echo "💡 This may be normal if some tables have different names or dependencies"
fi

# Show connection info
echo ""
echo "🎉 Database is ready for integration tests!"
echo ""
echo "📋 Connection Information:"
echo "  Host: localhost"
echo "  Port: ${DB_PORT:-5432}"
echo "  Database: ${DB_NAME:-espresso_ml}"
echo "  User: ${DB_USER:-postgres}"
echo "  Password: ${DB_PASSWORD:-postgres}"
echo ""
echo "🔗 Connection URL:"
echo "  postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@localhost:${DB_PORT:-5432}/${DB_NAME:-espresso_ml}"
echo ""
echo "🧪 To run integration tests:"
echo "  npm run test:integration"
echo ""
echo "🛑 To stop database:"
echo "  docker-compose --profile test down"
