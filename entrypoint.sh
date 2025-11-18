#!/bin/bash

# Secrets file location (in the uploads volume)
SECRETS_FILE="/app/uploads/.secrets"

# Function to generate a secure random string
generate_secret() {
    openssl rand -hex 32
}

# Check if secrets file exists
if [ -f "$SECRETS_FILE" ]; then
    echo "Loading existing secrets from $SECRETS_FILE"
    source "$SECRETS_FILE"
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

echo "Starting Micboard application..."
exec "$@"