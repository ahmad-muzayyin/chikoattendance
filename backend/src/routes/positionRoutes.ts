import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { getPositions, createPosition, updatePosition, deletePosition } from '../controllers/positionController';

const router = express.Router();

// Public/Employee read access? Maybe need token.
router.use(authenticateToken);

router.get('/', getPositions);
router.post('/', requireRole(['OWNER', 'HEAD']), createPosition);
router.put('/:id', requireRole(['OWNER', 'HEAD']), updatePosition);
router.delete('/:id', requireRole(['OWNER', 'HEAD']), deletePosition);

export default router;
