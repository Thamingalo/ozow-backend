
# Ozow Backend v5

A fully compliant integration of Ozow's Legacy API (Feb 2023, v3.5).  
Includes hash validation, webhook, and transaction verification routes.

## Endpoints
- `POST /api/payments/create` → Create Ozow payment
- `POST /api/payments/webhook` → Receive Ozow notifications
- `GET /api/payments/status/:reference` → Check transaction status
- `GET /api/health` → Health check

## Run locally
```bash
npm install
npm start
```

## Environment variables
```
OZOW_SITE_CODE=TSTSTE0001
OZOW_API_KEY=EB5758F2C3B4DF3FF4F2669D5FF5B
OZOW_PRIVATE_KEY=215114531AFF7134A94C88CEEA48E
OZOW_API_URL=https://api.ozow.com
WEBHOOK_BASE_URL=https://ozow-backend.onrender.com
REDIRECT_BASE_URL=https://ozow-backend.onrender.com
PORT=10000
```

Switch to live mode by setting `OZOW_INTEGRATION_MODE=live`.
