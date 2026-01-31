# Wallet Fintech Backend 🚀

**Production-grade wallet backend for fintech payments** (Node.js + PostgreSQL + Dockers + ACID transactions)

[![Node.js](https://img.shields.io/badge/Node.js-v22-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://postgresql.org)
[![Express](https://img.shields.io/badge/Express-4.x-orange)](https://expressjs.com)
[![Docker](https://img.shields.io/badge/Docker-ready-blueviolet)](https://docker.com)

## Features ✅
- **ACID Transactions** with PostgreSQL row-level locks (`SELECT ... FOR UPDATE`)
- **Idempotency Keys** - Duplicate payments safe
- **Concurrency Safe** - Race-condition proof transfers
- **Ledger Architecture** - Immutable transaction history
- **Payment Gateway Ready** - Webhook + retry patterns

## Tech Stack
Node.js | Express.js | PostgreSQL | Docker | REST APIs


## 🚀 Quick Start
git clone https://github.com/Mrpradhanji/wallet-fintech-backend.git
cd wallet-fintech-backend
npm install
docker run --name postgres-finances -e POSTGRES_PASSWORD=docker -e POSTGRES_USER=docker -p 5432:5432 -d postgres
docker exec -it postgres-finances psql -U docker -c "CREATE DATABASE finances;"
npm run config:init # Ctrl+C after 10s
npm run start:dev

**Server: http://localhost:3000**

## 💰 Key APIs
curl -X POST http://localhost:3000/api/transfers -H "Content-Type: application/json" -d '{"fromUserId":1,"toUserId":2,"amount":100}'


## 🔒 Production Features
**1. Concurrency Safety:** `SELECT ... FOR UPDATE` locks wallets  
**2. Idempotency:** Duplicate requests return existing transaction  
**3. ACID:** `BEGIN → Lock → Transfer → COMMIT/ROLLBACK`

## 🧪 Tests
| Test | Result |
|------|--------|
| Normal Transfer | ✅ Success |
| Insufficient Funds | ❌ 400 Error |
| Duplicate Request | ✅ Existing |
| Concurrent | 🔒 Safe |

## Live Demo
**[Railway.app Deployed URL]**

**Built for Fintech Backend Roles** - Payments/Wallets/Ledger Systems

