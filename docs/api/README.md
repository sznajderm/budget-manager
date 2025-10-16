# Budget Manager API Documentation

This directory contains documentation for the Budget Manager REST API endpoints.

## Available Endpoints

### Accounts
- [Create Account](./create-account.md) - `POST /api/rest/v1/accounts` - Create a new financial account

### Categories
- [Create Category](./create-category.md) - `POST /api/rest/v1/categories` - Create a new transaction category

### Transactions
- [Create Transaction](./create-transaction.md) - `POST /api/rest/v1/transactions` - Create a new financial transaction

### Authentication
- [Authentication Guide](./authentication-guide.md) - How to obtain JWT tokens for API testing

## API Base URL

- **Development**: `http://localhost:4321/api/rest/v1`
- **Production**: TBD

## General Information

### Content Type
All API endpoints expect and return JSON data with `Content-Type: application/json`.

### Authentication
All API endpoints require authentication via Supabase Auth JWT tokens.

**Required Header:**
```
Authorization: Bearer <jwt_token>
```

**Getting a Token:**
Authenticate with Supabase Auth and use the `access_token` from the session.

### Error Format
All error responses follow this format:
```json
{
  "error": "Error message description"
}
```

### Status Codes
- `200` - OK (successful GET requests)
- `201` - Created (successful POST requests)
- `400` - Bad Request (invalid input format)
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error (server issues)

## Development Notes

- The API is currently configured for development with simplified authentication
- All endpoints automatically handle CORS for localhost development
- Database operations include comprehensive error logging