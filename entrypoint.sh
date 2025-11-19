#!/bin/sh

# Secrets file location (in the uploads volume)
SECRETS_FILE="/app/uploads/.secrets"

# Function to generate a secure random string
generate_secret() {
    openssl rand -hex 32
}

# Function to check if admin user exists
admin_exists() {
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U "$POSTGRES_USER" -d micboard -t -c "SELECT COUNT(*) FROM users WHERE username = 'admin';" 2>/dev/null | tr -d ' ' || echo "0"
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

# Function to create default admin user
create_admin() {
    echo "Creating default admin user..."

    # Generate password hash for 'admin' (bcrypt hash for 'admin')
    # This is a pre-computed hash for the password 'admin'
    ADMIN_PASSWORD_HASH='$2b$10$kQDgAXkwxZWciL3QfVbNSe3BV3IA55swGmRNdDNtKTeGLCBfmWhTi'

    # Insert admin user using psql
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U "$POSTGRES_USER" -d micboard -c "
        INSERT INTO users (username, password_hash)
        VALUES ('admin', '$ADMIN_PASSWORD_HASH')
        ON CONFLICT (username) DO NOTHING;
    " 2>/dev/null; then
        echo "✓ Default admin user created (username: admin, password: admin)"
        echo "⚠️  IMPORTANT: Change the default password after first login!"
    else
        echo "⚠️  Could not create admin user automatically"
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

    # Check if admin user exists, create if not
    admin_count=$(admin_exists)
    if [ "$admin_count" = "0" ]; then
        create_admin
    else
        echo "Admin user already exists"
    fi
fi

echo "Starting Micboard application..."
exec "$@"