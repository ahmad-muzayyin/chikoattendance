import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getShifts, createShift, updateShift, deleteShift } from '../controllers/shiftController';

const router = Router();

router.use(authenticateToken);
router.get('/', getShifts);
router.post('/', createShift);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);

export default router;
