import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getShifts, createShift } from '../controllers/shiftController';

const router = Router();

router.use(authenticateToken);
router.get('/', getShifts);
router.post('/', createShift); // Optional: if we want to add UI to create shifts later

export default router;
