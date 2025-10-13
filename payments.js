// Simple route file (optional). The server.js currently contains the logic.
// Left here for extensibility.
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'Ozow backend is alive' }));

export default router;
