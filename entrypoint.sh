#!/bin/sh

# Secrets file location (in the uploads volume)
SECRETS_FILE="/app/uploads/.secrets"

# Function to generate a secure random string
generate_secret() {
    openssl rand -hex 32
}

# Function to start PostgreSQL
start_postgres() {
    echo "Starting PostgreSQL..."

    # Ensure PostgreSQL directories have correct ownership
    echo "Setting PostgreSQL directory permissions..."
    chown -R postgres:postgres /var/lib/postgresql/data /var/run/postgresql
    chmod 700 /var/lib/postgresql/data

    # Remove stale PID file if it exists
    if [ -f /var/lib/postgresql/data/postmaster.pid ]; then
        echo "Removing stale PID file..."
        rm -f /var/lib/postgresql/data/postmaster.pid
    fi

    # Check if database exists and has locale issues
    if [ -d "/var/lib/postgresql/data/base" ]; then
        echo "Existing database found. Checking locale compatibility..."
        
        # Check PG_VERSION to see if database exists
        if [ -f "/var/lib/postgresql/data/PG_VERSION" ]; then
            # Try to detect locale issues by checking if we can connect
            if sudo -u postgres /usr/lib/postgresql/15/bin/pg_ctl -D /var/lib/postgresql/data status >/dev/null 2>&1; then
                echo "PostgreSQL is already running"
            else
                # Check for locale issues in the control file
                if grep -q "en_US.utf8" /var/lib/postgresql/data/postgresql.conf 2>/dev/null || \
                   grep -q "en_US.utf8" /var/lib/postgresql/data/PG_VERSION 2>/dev/null; then
                    echo "⚠️  Database has incompatible locale (en_US.utf8)"
                    echo "⚠️  The database cluster must be reinitialized with C locale"
                    echo "⚠️  Backing up and reinitializing database..."
                    
                    # Backup the old data directory
                    if [ -d "/var/lib/postgresql/data.backup" ]; then
                        rm -rf /var/lib/postgresql/data.backup
                    fi
                    mv /var/lib/postgresql/data /var/lib/postgresql/data.backup
                    echo "✓ Old database backed up to /var/lib/postgresql/data.backup"
                    
                    # Create new data directory
                    mkdir -p /var/lib/postgresql/data
                    chown -R postgres:postgres /var/lib/postgresql/data
                    chmod 700 /var/lib/postgresql/data
                fi
            fi
        fi
    fi

    # Initialize database if not already done or if we just moved the old one
    if [ ! -d "/var/lib/postgresql/data/base" ]; then
        echo "Initializing PostgreSQL database with C locale..."
        # Use C locale to avoid locale issues
        sudo -u postgres /usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data --locale=C --encoding=UTF8
        
        # Configure PostgreSQL to listen on all interfaces
        echo "Configuring PostgreSQL..."
        echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf
        echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf
        echo "host all all ::0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf
        echo "✓ PostgreSQL initialized successfully"
    fi

    # Start PostgreSQL
    PG_CTL="/usr/lib/postgresql/15/bin/pg_ctl"
    PG_ISREADY="/usr/lib/postgresql/15/bin/pg_isready"
    PSQL="/usr/lib/postgresql/15/bin/psql"
    CREATEDB="/usr/lib/postgresql/15/bin/createdb"

    echo "Starting PostgreSQL with $PG_CTL..."
    sudo -u postgres "$PG_CTL" -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start
    
    # Check if start failed and display log
    if [ $? -ne 0 ]; then
        echo "❌ PostgreSQL failed to start. Log contents:"
        if [ -f /var/lib/postgresql/logfile ]; then
            cat /var/lib/postgresql/logfile
        else
            echo "Log file not found at /var/lib/postgresql/logfile"
        fi
        echo "Checking data directory contents:"
        ls -la /var/lib/postgresql/data/
        return 1
    fi

    # Wait for PostgreSQL to start
    echo "Waiting for PostgreSQL to start..."
    for i in {1..30}; do
        if sudo -u postgres "$PG_ISREADY" -h localhost -p 5432 >/dev/null 2>&1; then
            echo "✓ PostgreSQL is ready"
            break
        fi
        echo "Waiting for PostgreSQL... ($i/30)"
        sleep 2
    done

    # Create database if it doesn't exist
    if ! sudo -u postgres "$PSQL" -h localhost -p 5432 -lqt | cut -d \| -f 1 | grep -qw micboard; then
        echo "Creating micboard database..."
        sudo -u postgres "$CREATEDB" -h localhost -p 5432 micboard
        echo "✓ Created micboard database"
    fi
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

    # Always reconstruct DATABASE_URL for embedded PostgreSQL
    # (in case it was set to postgres service from previous deployment)
    echo "Checking for embedded PostgreSQL..."
    if [ -x "/usr/lib/postgresql/15/bin/pg_ctl" ]; then
        echo "✓ Found pg_ctl binary - using embedded PostgreSQL"
        OLD_DATABASE_URL="$DATABASE_URL"
        DATABASE_URL="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@localhost:5432/micboard"
        echo "Updated DATABASE_URL for embedded PostgreSQL"
        echo "  Old: $OLD_DATABASE_URL"
        echo "  New: $DATABASE_URL"
    else
        echo "✗ pg_ctl binary not found at /usr/lib/postgresql/15/bin/pg_ctl"
        echo "  Checking if pg_ctl is in PATH..."
        if command -v pg_ctl >/dev/null 2>&1; then
            echo "✓ Found pg_ctl in PATH - using embedded PostgreSQL"
            OLD_DATABASE_URL="$DATABASE_URL"
            DATABASE_URL="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@localhost:5432/micboard"
            echo "Updated DATABASE_URL for embedded PostgreSQL"
            echo "  Old: $OLD_DATABASE_URL"
            echo "  New: $DATABASE_URL"
        else
            echo "✗ pg_ctl not found anywhere - not using embedded PostgreSQL"
        fi
    fi
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
        DATABASE_URL="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@localhost:5432/micboard"
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

# Check if we need to start embedded PostgreSQL
if [ -x "/usr/lib/postgresql/15/bin/pg_ctl" ]; then
    echo "Embedded PostgreSQL detected - starting database service..."
    start_postgres
fi

# Wait for database to be ready
echo "Waiting for database to be ready..."
echo "Environment variables:"
echo "  POSTGRES_USER: '$POSTGRES_USER'"
echo "  POSTGRES_PASSWORD: '[SET]'"
echo "  DATABASE_URL: '$DATABASE_URL'"
echo "Testing connection to localhost:5432 with user $POSTGRES_USER"
timeout=60
while [ $timeout -gt 0 ]; do
    echo "Attempting database connection... ($timeout seconds remaining)"
    # First check if PostgreSQL is accepting connections
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✓ PostgreSQL is accepting connections"
        # Then check if our specific database exists and is accessible
        if PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d micboard -c "SELECT 1;" >/dev/null 2>&1; then
            echo "✓ Database 'micboard' is accessible"
            echo "Database is ready!"
            break
        else
            echo "⚠️  PostgreSQL ready, but 'micboard' database not accessible yet..."
            # Try to create the database if it doesn't exist
            echo "Attempting to create 'micboard' database..."
            PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE micboard;" 2>/dev/null && echo "✓ Created micboard database" || echo "Database might already exist or creation failed"
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