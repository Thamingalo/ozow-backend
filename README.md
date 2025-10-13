# Ozow Backend (Test-ready)

Minimal Node.js + Express backend that demonstrates Ozow transaction initiation for testing.

## Features
- Validates amount and reference
- Generates correct SHA512 HashCheck
- Sends request to Ozow with `apiKey` header
- Webhook endpoint for NotifyUrl

## Quick start (local)
1. Copy `.env.example` to `.env` and fill values or set environment variables.
2. Install dependencies:
   ```
   npm install
   ```
3. Run:
   ```
   npm start
   ```
4. POST to `/api/payments/initiate` with JSON:
   ```json
   {
     "amount": 25.00,
     "reference": "INV-TEST-005"
   }
   ```

## Deploy to Render
1. Create a GitHub repo and push this project.
2. In Render, create a new Web Service pointing to your repo.
3. Set environment variables in Render (copy from `.env.example`).
   - **Do not commit real secrets** to the repo.
4. Set the Build Command to: `npm install`
   Start Command: `npm start`

## Test Credentials (provided)
- SiteCode: `TSTSTE0001`
- CountryCode: `ZA`
- CurrencyCode: `ZAR`
- PrivateKey: `215114531AFF7134A94C88CEEA48E` (test)
- APIKey: `EB5758F2C3B4DF3FF4F2669D5FF5B` (test)

## Notes
- The app expects the Ozow `apiKey` as a header on outbound calls.
- For security, configure secrets via Render's environment variable UI.

