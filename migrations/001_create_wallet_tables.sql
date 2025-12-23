-- Drop existing tables if they exist
DROP TABLE IF EXISTS ledger_transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;

-- Create wallets table with currency support
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, currency)
);

-- Create ledger_transactions table
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id SERIAL PRIMARY KEY,
    idempotency_key UUID UNIQUE NOT NULL,
    from_wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
    to_wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_idempotency ON ledger_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_wallets ON ledger_transactions(from_wallet_id, to_wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_created_at ON ledger_transactions(created_at);
