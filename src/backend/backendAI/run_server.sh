#!/bin/bash
# Run Django development server with Supabase configuration

cd "$(dirname "$0")"

# Export Supabase credentials
export SUPABASE_DB_NAME=postgres
export SUPABASE_DB_USER=postgres.rbwqlqiedfqnqxnfzkcr
export SUPABASE_DB_PASSWORD=aiphotofunstudio
export SUPABASE_DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
export SUPABASE_DB_PORT=6543
export SUPABASE_DB_SSLMODE=require

echo "🚀 Starting Django server with Supabase PostgreSQL..."
echo "📊 Database: $SUPABASE_DB_HOST:$SUPABASE_DB_PORT/$SUPABASE_DB_NAME"
echo ""

python manage.py runserver 0.0.0.0:9999
