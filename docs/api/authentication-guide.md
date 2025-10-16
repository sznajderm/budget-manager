# Authentication Guide

This guide explains how to obtain JWT tokens for testing the Budget Manager API endpoints.

## Prerequisites

- Supabase project set up with authentication enabled
- A user account created in your Supabase project
- Access to the Supabase client configuration

## Methods to Obtain JWT Tokens

### Method 1: Using Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard
   - Go to Authentication > Users
   - Find or create a test user

2. **Generate a JWT Token**
   - Click on a user in the users list
   - Copy the JWT token from the user details (this may not always be available)

### Method 2: Using JavaScript/Browser Console

1. **Set up Supabase client in browser console:**
   ```javascript
   // First, you need to load the Supabase client
   // If testing on your app's domain, the client should already be available
   
   // Sign in a user
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'your-test-user@example.com',
     password: 'your-password'
   });
   
   if (data.session) {
     console.log('JWT Token:', data.session.access_token);
     
     // You can also copy it to clipboard
     navigator.clipboard.writeText(data.session.access_token);
     console.log('Token copied to clipboard!');
   }
   ```

2. **Use the token immediately:**
   ```javascript
   // Test the API with the token
   const token = data.session.access_token;
   
   const response = await fetch('/api/rest/v1/accounts', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({
       name: 'Test Account',
       account_type: 'savings'
     })
   });
   
   const result = await response.json();
   console.log(result);
   ```

### Method 3: Using a Node.js Script

Create a simple script to get tokens:

```javascript
// get-token.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAuthToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'your-test-user@example.com',
    password: 'your-password'
  });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data.session) {
    console.log('Access Token:', data.session.access_token);
    console.log('Expires at:', new Date(data.session.expires_at * 1000));
    
    // Set environment variable for curl commands
    console.log('\nFor curl commands, run:');
    console.log(`export JWT_TOKEN="${data.session.access_token}"`);
  }
}

getAuthToken();
```

Run with: `node get-token.js`

### Method 4: Creating a Test User

If you don't have a test user yet:

```javascript
// Create a new user
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'secure-password-123'
});

// You may need to confirm the email depending on your Supabase settings
// Check your email or disable email confirmation in Supabase settings

// Then sign in to get the token
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'secure-password-123'
});

if (signInData.session) {
  console.log('JWT Token:', signInData.session.access_token);
}
```

## Using the Token

Once you have a JWT token, you can use it in your API requests:

### With curl:
```bash
export JWT_TOKEN="your_jwt_token_here"
curl -X POST http://localhost:4321/api/rest/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"name": "Test Account", "account_type": "savings"}'
```

### With Postman:
1. Add a new header: `Authorization`
2. Set the value to: `Bearer your_jwt_token_here`

### With JavaScript fetch:
```javascript
const response = await fetch('/api/rest/v1/accounts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${your_jwt_token}`
  },
  body: JSON.stringify({
    name: 'Test Account',
    account_type: 'savings'
  })
});
```

## Token Expiration

- JWT tokens have expiration times (usually 1 hour by default)
- When a token expires, you'll get a 401 Unauthorized response
- You need to sign in again or refresh the token to get a new one

## Security Notes

- **Never commit JWT tokens to version control**
- **Don't share tokens in public forums or logs**
- **Use environment variables for storing tokens in scripts**
- **Tokens give full access to the authenticated user's data**

## Troubleshooting

### "Unauthorized" Error
- Check that the token is correctly formatted in the Authorization header
- Verify the token hasn't expired
- Ensure you're using the correct token (access_token, not refresh_token)

### "Invalid JWT" Error
- The token format is incorrect
- The token might be corrupted during copy/paste
- Try generating a fresh token

### User Not Found
- Make sure your test user exists in Supabase
- Check that email confirmation is not required (or that the email is confirmed)
- Verify your Supabase project settings