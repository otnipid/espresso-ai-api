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

# Start the database with test profile
echo "📦 Starting PostgreSQL container..."
docker-compose --profile test up -d postgres

# Wait for database to be healthy
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U postgres -d espresso_ml > /dev/null 2>&1; then
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

# Verify schema is loaded
echo "🔍 Verifying database schema..."
schema_check=$(docker-compose exec -T postgres psql -U postgres -d espresso_ml -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'beans', 'shots')")

if [ "$schema_check" -eq 3 ]; then
    echo "✅ Database schema verified successfully!"
    echo "📋 Available tables:"
    docker-compose exec -T postgres psql -U postgres -d espresso_ml -c "\dt" | head -10
else
    echo "⚠️  Expected schema tables not found. Found: $schema_check/3"
    echo "📋 Available tables:"
    docker-compose exec -T postgres psql -U postgres -d espresso_ml -c "\dt" || true
fi

# Show connection info
echo ""
echo "🎉 Database is ready for integration tests!"
echo ""
echo "📋 Connection Information:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: espresso_ml"
echo "  User: postgres"
echo "  Password: postgres"
echo ""
echo "🔗 Connection URL:"
echo "  postgresql://postgres:postgres@localhost:5432/espresso_ml"
echo ""
echo "🧪 To run integration tests:"
echo "  npm run test:integration"
echo ""
echo "🛑 To stop database:"
echo "  docker-compose --profile test down"
