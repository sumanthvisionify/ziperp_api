-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public._migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant access to the migrations table
GRANT ALL ON public._migrations TO postgres;
GRANT ALL ON public._migrations TO service_role;
GRANT ALL ON SEQUENCE public._migrations_id_seq TO postgres;
GRANT ALL ON SEQUENCE public._migrations_id_seq TO service_role; 