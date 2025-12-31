-- PostgreSQL Initialization Script for Restaurant OS
-- This script runs when the PostgreSQL container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- Note: Strapi will create its tables automatically
-- These indexes will be applied after Strapi creates the tables

-- Performance tuning for restaurant workloads
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '768MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Log slow queries (> 1 second)
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Connection limits
ALTER SYSTEM SET max_connections = 100;

-- Checkpoint settings
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- Grant permissions to strapi user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO strapi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO strapi;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO strapi;

-- Output initialization complete
DO $$
BEGIN
  RAISE NOTICE 'Restaurant OS database initialized successfully!';
END $$;
