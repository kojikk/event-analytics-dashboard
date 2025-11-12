-- Create analytics_auth database if not exists
-- (This is handled by the POSTGRES_DB environment variable)

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The tables will be created by SQLAlchemy migrations/models
-- This file can be used for additional database setup

-- Create indexes for better performance (these will be created by SQLAlchemy as well)
-- CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Initial setup complete
SELECT 'Database initialized successfully' as status;