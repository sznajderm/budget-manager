# List Transactions API Documentation

## Overview

The List Transactions API endpoint allows you to retrieve a paginated list of financial transactions for the authenticated user. This REST API endpoint returns transactions with embedded account and category information, ordered by creation date (most recent first), and includes pagination metadata for efficient data loading.

## Endpoint Details

- **HTTP Method**: `GET`
- **URL**: `/api/rest/v1/transactions`
- **Content-Type**: `application/json`
- **Authentication**: Required (JWT Bearer token)

## Authentication

This endpoint requires authentication via Supabase Auth. You need to include a valid JWT token in the request headers.

### Required Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <jwt_token>` | JWT token from Supabase Auth |

### Getting Authentication Token

To get an authentication token, you need to sign in a user through Supabase Auth:

```javascript
// Sign in user and get session
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

if (data.session) {
  const token = data.session.access_token;
  // Use this token in API requests
}
```

## Request Format

### Query Parameters

All query parameters are optional and have default values:

| Parameter | Type | Required | Default | Description | Validation |
|-----------|------|----------|---------|-------------|------------|
| `limit` | integer | No | 20 | Number of transactions to return | Must be between 1 and 50 |
| `offset` | integer | No | 0 | Number of transactions to skip for pagination | Must be 0 or greater |

### URL Examples

```bash
# Get first 20 transactions (default)
GET /api/rest/v1/transactions

# Get first 10 transactions
GET /api/rest/v1/transactions?limit=10

# Get next 20 transactions (pagination)
GET /api/rest/v1/transactions?limit=20&offset=20

# Get 5 transactions starting from the 15th
GET /api/rest/v1/transactions?limit=5&offset=15

# Maximum allowed limit
GET /api/rest/v1/transactions?limit=50
```

## Response Format

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "amount_cents": 1250,
      "transaction_type": "expense",
      "description": "Coffee shop",
      "transaction_date": "2024-01-15T10:30:00.000Z",
      "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "category_id": "a8b9c0d1-e2f3-4567-8901-234567890abc",
      "created_at": "2024-01-15T10:30:15.123Z",
      "updated_at": "2024-01-15T10:30:15.123Z",
      "accounts": {
        "name": "Checking Account"
      },
      "categories": {
        "name": "Food & Dining"
      }
    },
    {
      "id": "987f6543-e21a-43b2-b789-987654321098",
      "amount_cents": 250000,
      "transaction_type": "income",
      "description": "Salary deposit",
      "transaction_date": "2024-01-01T09:00:00.000Z",
      "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "category_id": null,
      "created_at": "2024-01-01T09:00:12.456Z",
      "updated_at": "2024-01-01T09:00:12.456Z",
      "accounts": {
        "name": "Checking Account"
      },
      "categories": null
    }
  ],
  "meta": {
    "total_count": 156,
    "limit": 20,
    "offset": 0
  }
}
```

### Response Structure

#### Data Array Fields

Each transaction in the `data` array contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (UUID) for the transaction |
| `amount_cents` | integer | Transaction amount in cents |
| `transaction_type` | string | Type of transaction (`"expense"` or `"income"`) |
| `description` | string | Description of the transaction |
| `transaction_date` | string | ISO 8601 timestamp of when the transaction occurred |
| `account_id` | string | UUID of the associated account |
| `category_id` | string \| null | UUID of the associated category (null if uncategorized) |
| `created_at` | string | ISO 8601 timestamp when the transaction was created |
| `updated_at` | string | ISO 8601 timestamp when the transaction was last updated |
| `accounts` | object | Embedded account information |
| `accounts.name` | string | Name of the associated account |
| `categories` | object \| null | Embedded category information (null if uncategorized) |
| `categories.name` | string | Name of the associated category |

#### Pagination Metadata

The `meta` object contains pagination information:

| Field | Type | Description |
|-------|------|-------------|
| `total_count` | integer | Total number of transactions available for the user |
| `limit` | integer | Number of transactions requested (same as query parameter) |
| `offset` | integer | Number of transactions skipped (same as query parameter) |

## Example Usage

### Example 1: Get First Page of Transactions

**Request:**
```bash
curl -X GET "http://localhost:4321/api/rest/v1/transactions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "amount_cents": 1250,
      "transaction_type": "expense",
      "description": "Coffee shop",
      "transaction_date": "2024-01-15T10:30:00.000Z",
      "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "category_id": "a8b9c0d1-e2f3-4567-8901-234567890abc",
      "created_at": "2024-01-15T10:30:15.123Z",
      "updated_at": "2024-01-15T10:30:15.123Z",
      "accounts": {
        "name": "Checking Account"
      },
      "categories": {
        "name": "Food & Dining"
      }
    }
  ],
  "meta": {
    "total_count": 156,
    "limit": 20,
    "offset": 0
  }
}
```

### Example 2: Get Specific Page with Custom Limit

**Request:**
```bash
curl -X GET "http://localhost:4321/api/rest/v1/transactions?limit=5&offset=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```json
{
  "data": [
    {
      "id": "456a7890-b123-4567-c890-123456789012",
      "amount_cents": 2799,
      "transaction_type": "expense",
      "description": "Grocery shopping",
      "transaction_date": "2024-01-14T14:22:00.000Z",
      "account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "category_id": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
      "created_at": "2024-01-14T14:22:30.789Z",
      "updated_at": "2024-01-14T14:22:30.789Z",
      "accounts": {
        "name": "Checking Account"
      },
      "categories": {
        "name": "Groceries"
      }
    }
  ],
  "meta": {
    "total_count": 156,
    "limit": 5,
    "offset": 10
  }
}
```

### Example 3: Empty Result Set

**Request:**
```bash
curl -X GET "http://localhost:4321/api/rest/v1/transactions?offset=500" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```json
{
  "data": [],
  "meta": {
    "total_count": 156,
    "limit": 20,
    "offset": 500
  }
}
```

## Error Responses

### 401 Unauthorized

**Causes:**
- Missing Authorization header
- Invalid JWT token
- Expired JWT token

**Example Response:**
```json
{
  "error": "Missing Authorization header"
}
```

### 400 Bad Request

**Causes:**
- Invalid query parameters (limit > 50, limit < 1, offset < 0)
- Non-numeric parameter values
- Malformed query parameters

**Example Responses:**
```json
{
  "error": "Invalid query parameters: limit: Number must be less than or equal to 50"
}
```

```json
{
  "error": "Invalid query parameters: offset: Number must be greater than or equal to 0"
}
```

```json
{
  "error": "Invalid query parameters: limit: Expected number, received string"
}
```

### 500 Internal Server Error

**Causes:**
- Database connection issues
- Unexpected server errors
- Supabase service unavailable

**Example Response:**
```json
{
  "error": "An unexpected error occurred"
}
```

## JavaScript/TypeScript Examples

### Using Fetch API

```javascript
async function getTransactions(authToken, options = {}) {
  const { limit = 20, offset = 0 } = options;
  
  try {
    const url = new URL('/api/rest/v1/transactions', window.location.origin);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('offset', offset.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch transactions');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// Usage with Supabase Auth
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  // Get first page
  getTransactions(session.access_token)
    .then(result => {
      console.log('Transactions:', result.data);
      console.log('Total count:', result.meta.total_count);
    })
    .catch(error => console.error('Failed:', error));
  
  // Get specific page
  getTransactions(session.access_token, { limit: 10, offset: 20 })
    .then(result => console.log('Page 3 (10 per page):', result))
    .catch(error => console.error('Failed:', error));
}
```

### Using Axios

```javascript
import axios from 'axios';

async function getTransactions(authToken, options = {}) {
  const { limit = 20, offset = 0 } = options;
  
  try {
    const response = await axios.get('/api/rest/v1/transactions', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        limit,
        offset
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch transactions');
    } else {
      throw new Error('Network error');
    }
  }
}
```

### Pagination Helper

```javascript
class TransactionPaginator {
  constructor(authToken, pageSize = 20) {
    this.authToken = authToken;
    this.pageSize = pageSize;
    this.currentPage = 0;
    this.totalCount = 0;
    this.totalPages = 0;
  }
  
  async getPage(pageNumber = 0) {
    const offset = pageNumber * this.pageSize;
    
    try {
      const result = await getTransactions(this.authToken, {
        limit: this.pageSize,
        offset: offset
      });
      
      this.currentPage = pageNumber;
      this.totalCount = result.meta.total_count;
      this.totalPages = Math.ceil(this.totalCount / this.pageSize);
      
      return result;
    } catch (error) {
      throw error;
    }
  }
  
  async getNextPage() {
    if (this.hasNextPage()) {
      return await this.getPage(this.currentPage + 1);
    }
    throw new Error('No more pages available');
  }
  
  async getPreviousPage() {
    if (this.hasPreviousPage()) {
      return await this.getPage(this.currentPage - 1);
    }
    throw new Error('Already at first page');
  }
  
  hasNextPage() {
    return this.currentPage < this.totalPages - 1;
  }
  
  hasPreviousPage() {
    return this.currentPage > 0;
  }
  
  getPageInfo() {
    return {
      currentPage: this.currentPage + 1, // 1-based for display
      totalPages: this.totalPages,
      totalCount: this.totalCount,
      pageSize: this.pageSize,
      hasNext: this.hasNextPage(),
      hasPrevious: this.hasPreviousPage()
    };
  }
}

// Usage
const paginator = new TransactionPaginator(session.access_token, 10);

// Get first page
paginator.getPage(0)
  .then(result => {
    console.log('First page:', result.data);
    console.log('Page info:', paginator.getPageInfo());
  });

// Navigate pages
paginator.getNextPage()
  .then(result => console.log('Next page:', result.data));
```

### TypeScript Interfaces

```typescript
interface TransactionDTO {
  id: string;
  amount_cents: number;
  transaction_type: 'expense' | 'income';
  description: string;
  transaction_date: string;
  account_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  accounts: {
    name: string;
  };
  categories: {
    name: string;
  } | null;
}

interface PaginationMeta {
  total_count: number;
  limit: number;
  offset: number;
}

interface TransactionListResponse {
  data: TransactionDTO[];
  meta: PaginationMeta;
}

interface TransactionListOptions {
  limit?: number;
  offset?: number;
}

interface ErrorResponse {
  error: string;
}

// Usage
async function getTypedTransactions(
  token: string,
  options: TransactionListOptions = {}
): Promise<TransactionListResponse> {
  const { limit = 20, offset = 0 } = options;
  
  const url = new URL('/api/rest/v1/transactions', window.location.origin);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error);
  }

  return response.json();
}
```

## Pagination Strategies

### Basic Offset-Based Pagination

The endpoint uses offset-based pagination, which is simple but has limitations for large datasets:

```javascript
// Calculate pages
function calculatePagination(totalCount, pageSize, currentOffset) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const currentPage = Math.floor(currentOffset / pageSize) + 1;
  
  return {
    totalPages,
    currentPage,
    hasNextPage: currentOffset + pageSize < totalCount,
    hasPreviousPage: currentOffset > 0,
    nextOffset: currentOffset + pageSize,
    previousOffset: Math.max(0, currentOffset - pageSize)
  };
}

// Usage
const result = await getTransactions(token, { limit: 20, offset: 40 });
const pagination = calculatePagination(
  result.meta.total_count, 
  result.meta.limit, 
  result.meta.offset
);

console.log(`Page ${pagination.currentPage} of ${pagination.totalPages}`);
```

### Infinite Scroll Implementation

```javascript
class InfiniteTransactionLoader {
  constructor(authToken, pageSize = 20) {
    this.authToken = authToken;
    this.pageSize = pageSize;
    this.allTransactions = [];
    this.offset = 0;
    this.hasMore = true;
    this.loading = false;
  }
  
  async loadMore() {
    if (this.loading || !this.hasMore) {
      return [];
    }
    
    this.loading = true;
    
    try {
      const result = await getTransactions(this.authToken, {
        limit: this.pageSize,
        offset: this.offset
      });
      
      this.allTransactions.push(...result.data);
      this.offset += this.pageSize;
      this.hasMore = this.offset < result.meta.total_count;
      
      return result.data;
    } catch (error) {
      throw error;
    } finally {
      this.loading = false;
    }
  }
  
  reset() {
    this.allTransactions = [];
    this.offset = 0;
    this.hasMore = true;
    this.loading = false;
  }
  
  getAllTransactions() {
    return this.allTransactions;
  }
}

// Usage with scroll detection
const loader = new InfiniteTransactionLoader(session.access_token);

// Load initial data
loader.loadMore().then(transactions => {
  displayTransactions(transactions);
});

// Scroll event handler
window.addEventListener('scroll', async () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
    if (loader.hasMore && !loader.loading) {
      const newTransactions = await loader.loadMore();
      appendTransactions(newTransactions);
    }
  }
});
```

## Data Transformation Helpers

### Amount Display Helpers

```javascript
// Convert cents to currency string
function formatCurrency(cents, currency = 'USD', locale = 'en-US') {
  const amount = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Examples:
formatCurrency(1250);     // "$12.50"
formatCurrency(250000);   // "$2,500.00"
formatCurrency(-1250);    // "-$12.50"

// Format transaction type for display
function formatTransactionType(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Examples:
formatTransactionType('expense'); // "Expense"
formatTransactionType('income');  // "Income"
```

### Date Formatting Helpers

```javascript
// Format transaction dates
function formatTransactionDate(dateString, options = {}) {
  const date = new Date(dateString);
  const {
    includeTime = false,
    locale = 'en-US',
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } = options;
  
  if (includeTime) {
    return date.toLocaleString(locale, { timeZone });
  } else {
    return date.toLocaleDateString(locale, { timeZone });
  }
}

// Examples:
formatTransactionDate('2024-01-15T10:30:00.000Z'); 
// "1/15/2024"

formatTransactionDate('2024-01-15T10:30:00.000Z', { includeTime: true }); 
// "1/15/2024, 10:30:00 AM"

// Relative time helper
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}
```

### Transaction Grouping Helpers

```javascript
// Group transactions by date
function groupTransactionsByDate(transactions) {
  const groups = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.transaction_date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
  });
  
  return groups;
}

// Group transactions by category
function groupTransactionsByCategory(transactions) {
  const groups = {};
  
  transactions.forEach(transaction => {
    const categoryName = transaction.categories?.name || 'Uncategorized';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(transaction);
  });
  
  return groups;
}

// Calculate totals by type
function calculateTotals(transactions) {
  return transactions.reduce((totals, transaction) => {
    if (transaction.transaction_type === 'income') {
      totals.income += transaction.amount_cents;
    } else {
      totals.expenses += transaction.amount_cents;
    }
    totals.net += transaction.transaction_type === 'income' 
      ? transaction.amount_cents 
      : -transaction.amount_cents;
    return totals;
  }, { income: 0, expenses: 0, net: 0 });
}
```

## Performance Considerations

### Optimal Page Sizes
- **Small screens/mobile**: 10-15 transactions per page
- **Desktop applications**: 20-50 transactions per page
- **Data analysis**: Up to 50 transactions per page (maximum allowed)

### Caching Strategies

```javascript
// Simple in-memory cache
class TransactionCache {
  constructor(ttlMs = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttlMs;
  }
  
  generateKey(limit, offset) {
    return `${limit}-${offset}`;
  }
  
  get(limit, offset) {
    const key = this.generateKey(limit, offset);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    this.cache.delete(key);
    return null;
  }
  
  set(limit, offset, data) {
    const key = this.generateKey(limit, offset);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

// Usage with caching
const cache = new TransactionCache();

async function getCachedTransactions(token, options = {}) {
  const { limit = 20, offset = 0 } = options;
  
  // Check cache first
  const cached = cache.get(limit, offset);
  if (cached) {
    return cached;
  }
  
  // Fetch from API
  const result = await getTransactions(token, { limit, offset });
  
  // Cache the result
  cache.set(limit, offset, result);
  
  return result;
}
```

## Testing the Endpoint

### Valid Test Cases

```bash
# Set your JWT token first
export JWT_TOKEN="your_jwt_token_here"

# 1. Basic retrieval (default pagination)
curl -X GET "http://localhost:4321/api/rest/v1/transactions" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 2. Custom page size
curl -X GET "http://localhost:4321/api/rest/v1/transactions?limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 3. Pagination - second page
curl -X GET "http://localhost:4321/api/rest/v1/transactions?limit=20&offset=20" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 4. Small page size
curl -X GET "http://localhost:4321/api/rest/v1/transactions?limit=5" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 5. Maximum page size
curl -X GET "http://localhost:4321/api/rest/v1/transactions?limit=50" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 6. Skip to specific offset
curl -X GET "http://localhost:4321/api/rest/v1/transactions?offset=100" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 7. Both parameters
curl -X GET "http://localhost:4321/api/rest/v1/transactions?limit=15&offset=30" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Error Test Cases

```bash
# 1. Invalid limit (too high)
curl -X GET "http://localhost:4321/api/rest/v1/transactions?limit=100" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 2. Invalid limit (too low)
curl -X GET "http://localhost:4321/api/rest/v1/transactions?limit=0" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 3. Invalid offset (negative)
curl -X GET "http://localhost:4321/api/rest/v1/transactions?offset=-1" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 4. Non-numeric limit
curl -X GET "http://localhost:4321/api/rest/v1/transactions?limit=abc" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 5. Non-numeric offset
curl -X GET "http://localhost:4321/api/rest/v1/transactions?offset=xyz" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 6. Missing authorization header
curl -X GET "http://localhost:4321/api/rest/v1/transactions"

# 7. Invalid token
curl -X GET "http://localhost:4321/api/rest/v1/transactions" \
  -H "Authorization: Bearer invalid_token"
```

## Security Features

### Authentication & Authorization
- **JWT Token Validation**: All requests must include a valid Supabase Auth JWT token
- **User Isolation**: Queries are automatically filtered by authenticated user ID
- **Data Ownership**: Users can only access their own transactions
- **Account/Category Filtering**: Embedded data is also filtered by user ownership

### Input Validation
- **Parameter Bounds**: Limit parameter is capped at 50 to prevent resource abuse
- **Type Safety**: Query parameters are validated and coerced to correct types
- **SQL Injection Protection**: Supabase query builder prevents injection attacks

### Response Security
- **No Internal Fields**: Response excludes `user_id` and other internal columns
- **Consistent Error Format**: Error messages don't leak sensitive system information
- **Rate Limiting Ready**: Architecture supports rate limiting implementation

## Notes

- **Authentication Required**: This endpoint requires a valid Supabase Auth JWT token
- **User Isolation**: Users can only see their own transactions
- **Ordering**: Transactions are returned in descending order by creation date (newest first)
- **Embedded Data**: Account and category names are included in the response to reduce additional API calls
- **Pagination Limits**: Maximum 50 transactions per request to ensure good performance
- **Response Time**: Typical response time is under 200ms for requests with default pagination
- **Token Expiry**: JWT tokens have expiration times - refresh them periodically
- **Amount Format**: Amounts are returned in cents as integers (e.g., $12.50 = 1250 cents)
- **Category Handling**: Transactions without categories have `categories: null`
- **Account Required**: All transactions must have an associated account, so `accounts` is never null

## Related Endpoints

This endpoint works well with other transaction management endpoints:

- [Create Transaction](./create-transaction.md) - Create new transactions that will appear in these lists
- [Create Account](./create-account.md) - Manage accounts that transactions reference
- [Create Category](./create-category.md) - Manage categories for transaction organization
- [Authentication Guide](./authentication-guide.md) - How to obtain JWT tokens for API access

## Database Performance

### Query Optimization
- The endpoint uses database indexes on `(user_id, created_at)` for efficient filtering and sorting
- Account and category joins are optimized with proper indexing
- Total count is calculated efficiently using Supabase's built-in count functionality

### Recommended Indexes
Ensure these indexes exist for optimal performance:
```sql
-- Primary filtering and sorting index
CREATE INDEX idx_transactions_user_created 
ON transactions(user_id, created_at DESC);

-- Account join optimization
CREATE INDEX idx_accounts_id ON accounts(id);

-- Category join optimization  
CREATE INDEX idx_categories_id ON categories(id);
```

### Large Dataset Considerations
- For users with thousands of transactions, consider implementing cursor-based pagination in future versions
- Current offset-based pagination works well for typical users with hundreds to low thousands of transactions
- Monitor query performance and consider adding database-level pagination optimizations for large datasets