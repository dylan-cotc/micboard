#!/bin/sh

# Secrets file location (in the uploads volume)
SECRETS_FILE="/app/uploads/.secrets"

# Function to generate a secure random string
generate_secret() {
    openssl rand -hex 32
}

# Function to run database migrations
run_migrations() {
    echo "Running database migrations..."
    if node dist/scripts/runMigrations.js; then
        echo "✓ Database migrations completed successfully"
        return 0
    else
        echo "⚠️  Database migrations failed"
        return 1
    fi
}

# Check if secrets file exists
if [ -f "$SECRETS_FILE" ]; then
    echo "Loading existing secrets from $SECRETS_FILE"
    . "$SECRETS_FILE"
else
    echo "Generating new secrets..."

    # Generate JWT_SECRET if not provided
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(generate_secret)
        echo "Generated JWT_SECRET"
    fi

    # Set NODE_ENV if not provided
    if [ -z "$NODE_ENV" ]; then
        NODE_ENV="production"
    fi

    # Construct DATABASE_URL if not provided
    if [ -z "$DATABASE_URL" ]; then
        DATABASE_URL="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/micboard"
    fi

    # Save secrets to file
    cat > "$SECRETS_FILE" << EOF
# Auto-generated secrets - DO NOT EDIT MANUALLY
JWT_SECRET=$JWT_SECRET
NODE_ENV=$NODE_ENV
DATABASE_URL=$DATABASE_URL
EOF

    echo "Secrets saved to $SECRETS_FILE"
    chmod 600 "$SECRETS_FILE"
fi

# Export variables (in case they weren't set)
export JWT_SECRET
export NODE_ENV
export DATABASE_URL

# Wait for database to be ready
echo "Waiting for database to be ready..."
echo "Environment variables:"
echo "  POSTGRES_USER: '$POSTGRES_USER'"
echo "  POSTGRES_PASSWORD: '[SET]'"
echo "  DATABASE_URL: '$DATABASE_URL'"
echo "Testing connection to postgres:5432 with user $POSTGRES_USER"
timeout=60
while [ $timeout -gt 0 ]; do
    echo "Attempting database connection... ($timeout seconds remaining)"
    # First check if PostgreSQL is accepting connections
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U "$POSTGRES_USER" -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✓ PostgreSQL is accepting connections"
        # Then check if our specific database exists and is accessible
        if PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U "$POSTGRES_USER" -d micboard -c "SELECT 1;" >/dev/null 2>&1; then
            echo "✓ Database 'micboard' is accessible"
            echo "Database is ready!"
            break
        else
            echo "⚠️  PostgreSQL ready, but 'micboard' database not accessible yet..."
            # Try to create the database if it doesn't exist
            echo "Attempting to create 'micboard' database..."
            PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE micboard;" 2>/dev/null && echo "✓ Created micboard database" || echo "Database might already exist or creation failed"
        fi
    else
        echo "⚠️  PostgreSQL not ready yet... ($timeout seconds remaining)"
    fi
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "⚠️  Database connection timeout - starting app anyway"
else
    # Run database migrations
    run_migrations

    # Admin user is now created by migration 012_create_users_table.sql
    # No need to create it here anymore
    echo "Admin user creation handled by database migrations"
fi

echo "Starting Micboard application..."
exec "$@"