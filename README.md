# Ozow Payment Backend (v2)

This is a ready-to-deploy Express.js backend for integrating Ozow OneAPI payments (staging).

## Features
- OAuth2 token retrieval (client credentials)
- Create payment endpoint: `POST /api/payments/create`
- Webhook endpoint: `POST /api/payments/webhook` (logs payload for testing)
- CORS restricted to your frontend domain
- Health endpoint: `GET /health`

## Setup (local)
1. Install dependencies
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your credentials.

3. Start the server
   ```bash
   npm start
   ```

## Deployment (Render)
1. Push the repo to GitHub.
2. Create a **Web Service** in Render connected to this repo.
3. Set build command: `npm install` and start command: `npm start`.
4. Add Environment Variables in Render (copy from `.env.example` values).
5. Deploy and test.

## Testing
Use curl or Postman to call payment creation:
```bash
curl -X POST https://<your-render-service>.onrender.com/api/payments/create \
 -H "Content-Type: application/json" \
 -d '{
   "amount": 150.00,
   "email": "learner@example.com",
   "firstName": "Test",
   "lastName": "User",
   "reference": "INV-TEST-001"
 }'
```

Open the returned `paymentUrl` to complete a staged payment on Ozow.

## Notes
- This package logs webhooks for testing. For production, implement signature verification and persist transactions to a database.
- Never commit your `.env` file.
