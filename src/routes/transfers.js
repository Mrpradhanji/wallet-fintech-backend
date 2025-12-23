const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Helper function to get or create wallet for user
async function getOrCreateWallet(userId, currency = 'INR') {
    const wallet = await db.query(
        'SELECT * FROM wallets WHERE user_id = $1 AND currency = $2',
        [userId, currency]
    );

    if (wallet.rows.length === 0) {
        const newWallet = await db.query(
            'INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, $3) RETURNING *',
            [userId, currency, 0]
        );
        return newWallet.rows[0];
    }

    return wallet.rows[0];
}

// Create transfer between wallets
router.post('/', async (req, res) => {
    const { fromUserId, toUserId, amount, idempotencyKey } = req.body;

    // Input validation
    if (!fromUserId || !toUserId || !amount || !idempotencyKey) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: fromUserId, toUserId, amount, idempotencyKey'
        });
    }

    if (fromUserId === toUserId) {
        return res.status(400).json({
            success: false,
            error: 'Cannot transfer to the same user'
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Amount must be greater than 0'
        });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Check for duplicate request using idempotency key
        const existingTransfer = await client.query(
            'SELECT * FROM ledger_transactions WHERE idempotency_key = $1',
            [idempotencyKey]
        );

        if (existingTransfer.rows.length > 0) {
            const transfer = existingTransfer.rows[0];
            await client.query('ROLLBACK');
            return res.json({
                success: true,
                message: `Transfer of ₹${amount} already processed`,
                transferId: transfer.id
            });
        }

        // Get or create wallets with ROW LOCK
        const fromWallet = await client.query(
            'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
            [fromUserId]
        );

        if (fromWallet.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Sender wallet not found'
            });
        }

        // Check if sender has sufficient balance
        if (fromWallet.rows[0].balance < amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Insufficient funds'
            });
        }

        const toWallet = await client.query(
            'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
            [toUserId]
        );

        if (toWallet.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Recipient wallet not found'
            });
        }

        // Update balances
        await client.query(
            'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
            [amount, fromWallet.rows[0].id]
        );

        await client.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
            [amount, toWallet.rows[0].id]
        );

        // Record the transaction in the ledger
        const transfer = await client.query(
            `INSERT INTO ledger_transactions 
             (idempotency_key, from_wallet_id, to_wallet_id, amount, status)
             VALUES ($1, $2, $3, $4, 'COMPLETED')
             RETURNING *`,
            [idempotencyKey, fromWallet.rows[0].id, toWallet.rows[0].id, amount]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Transferred ₹${amount}`,
            transferId: transfer.rows[0].id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transfer error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during transfer',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

// Get transfer history for a user
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        const result = await db.query(
            `SELECT lt.*, 
                    u1.name as from_user_name, 
                    u2.name as to_user_name
             FROM ledger_transactions lt
             JOIN wallets w1 ON lt.from_wallet_id = w1.id
             JOIN wallets w2 ON lt.to_wallet_id = w2.id
             JOIN users u1 ON w1.user_id = u1.id
             JOIN users u2 ON w2.user_id = u2.id
             WHERE w1.user_id = $1 OR w2.user_id = $1
             ORDER BY lt.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching transfer history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transfer history'
        });
    }
});

module.exports = router;
