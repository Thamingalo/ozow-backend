# Ozow Test Backend (v3)

This Node.js backend integrates with the Ozow **Test Environment** for payment initiation.

## 🚀 Setup Instructions

1. Deploy to Render or any Node.js host.
2. Add the following environment variables:

```
OZOW_SITE_CODE=TSTSTE0001
OZOW_COUNTRY_CODE=ZA
OZOW_CURRENCY_CODE=ZAR
OZOW_PRIVATE_KEY=215114531AFF7134A94C88CEEA48E
OZOW_API_KEY=EB5758F2C3B4DF3FF4F2669D5FF5B
OZOW_API_URL=https://pay.ozow.com/
```

3. POST a test payment request to:
```
POST /api/payments/create
```
Example JSON body:
```json
{
  "Amount": "25.00",
  "TransactionReference": "INV-TEST-001",
  "BankReference": "INV-TEST-001"
}
```

The backend will calculate the SHA512 hash and forward the request to Ozow’s test API.
