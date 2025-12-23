# Wallet Transfer API

This document describes the Wallet Transfer API endpoints and their usage.

## Base URL
```
http://localhost:3000/api
```

## Transfer Funds

Transfer funds between user wallets with idempotency support.

```
POST /transfers
```

### Request

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "fromUserId": 1,
  "toUserId": 2,
  "amount": 100,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Responses

**Success (200 OK)**
```json
{
  "success": true,
  "message": "Transferred ₹100",
  "transferId": 1
}
```

**Insufficient Funds (400 Bad Request)**
```json
{
  "success": false,
  "error": "Insufficient funds"
}
```

**Duplicate Request (200 OK)**
Returns the original response if the same `idempotencyKey` is used.

## Get Transfer History

Retrieve transfer history for a user.

```
GET /transfers/history/:userId
```

### Parameters

- `limit` (optional, default: 10): Number of records to return
- `offset` (optional, default: 0): Number of records to skip

### Example Request

```
GET /transfers/history/1?limit=10&offset=0
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
      "from_wallet_id": 1,
      "to_wallet_id": 2,
      "amount": "100.00",
      "status": "COMPLETED",
      "created_at": "2023-12-23T10:00:00.000Z",
      "from_user_name": "John Doe",
      "to_user_name": "Jane Smith"
    }
  ]
}
```

## Idempotency

All POST endpoints require an `idempotencyKey` in the request body. This ensures that:

1. Duplicate requests with the same key return the original response
2. No duplicate transactions are created
3. The system remains consistent even with network retries

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details in development"
}
```

## Rate Limiting

API is rate limited to 100 requests per minute per IP address.

## Security

- Always use HTTPS in production
- Implement proper authentication/authorization
- Keep your API keys secure
- Monitor for unusual activity

## Testing

### Test Cases

1. **Normal Transfer**
   ```bash
   curl -X POST http://localhost:3000/api/transfers \
     -H "Content-Type: application/json" \
     -d '{"fromUserId":1,"toUserId":2,"amount":100,"idempotencyKey":"550e8400-e29b-41d4-a716-446655440001"}'
   ```

2. **Insufficient Funds**
   ```bash
   curl -X POST http://localhost:3000/api/transfers \
     -H "Content-Type: application/json" \
     -d '{"fromUserId":1,"toUserId":2,"amount":1000000,"idempotencyKey":"550e8400-e29b-41d4-a716-446655440002"}'
   ```

3. **Duplicate Request**
   ```bash
   # Run multiple times - returns same result
   curl -X POST http://localhost:3000/api/transfers \
     -H "Content-Type: application/json" \
     -d '{"fromUserId":1,"toUserId":2,"amount":100,"idempotencyKey":"550e8400-e29b-41d4-a716-446655440003"}'
   ```

4. **View History**
   ```bash
   curl http://localhost:3000/api/transfers/history/1
   ```
