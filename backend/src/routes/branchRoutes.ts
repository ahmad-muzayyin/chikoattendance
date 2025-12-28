// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\routes\branchRoutes.ts
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { createBranch, getBranches, updateBranch, deleteBranch } from '../controllers/branchController';

const router = Router();

// Only OWNER can manage branches
router.post('/', authenticateToken, requireRole(['OWNER']), createBranch);
router.post('/add', authenticateToken, requireRole(['OWNER']), createBranch); // Alias
router.get('/', authenticateToken, getBranches);
router.put('/:id', authenticateToken, requireRole(['OWNER']), updateBranch);
router.delete('/:id', authenticateToken, requireRole(['OWNER']), deleteBranch);

export default router;
