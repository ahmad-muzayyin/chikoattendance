import express from 'express';
import { verifyIntegrityToken } from '../controllers/integrityController';

const router = express.Router();

router.post('/verify-integrity', verifyIntegrityToken);

export default router;
