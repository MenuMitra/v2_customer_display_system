-- PIN authentication columns (PostgreSQL / MySQL compatible)
ALTER TABLE users
ADD COLUMN pin_hash VARCHAR(255) NULL,
ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0,
ADD COLUMN locked_until TIMESTAMP NULL;

CREATE INDEX idx_users_mobile ON users (mobile);
