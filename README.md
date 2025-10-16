# Ozow Backend (Test Environment)

This backend integrates with **Ozow's Test Environment** to simulate Instant EFT payments.

## 🚀 How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Test using Postman:
   ```bash
   POST /api/payments/initiate
   Content-Type: application/json

   {
     "amount": "25.00",
     "transactionReference": "INV-TEST-001",
     "bankReference": "INV-TEST-001"
   }
   ```

Server runs by default on port **10000**.
