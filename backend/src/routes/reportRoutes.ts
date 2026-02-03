
import express from 'express';
import { authenticateToken as authenticate, requireRole as authorize } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';
import { exportBranchExcel, exportBranchPDF } from '../controllers/reportController';

const router = express.Router();

// Allow OWNER and maybe SUPERVISOR/HEAD to export
router.get('/branch/:branchId/excel', authenticate, authorize([UserRole.OWNER, UserRole.SUPERVISOR, UserRole.HEAD]), exportBranchExcel);
router.get('/branch/:branchId/pdf', authenticate, authorize([UserRole.OWNER, UserRole.SUPERVISOR, UserRole.HEAD]), exportBranchPDF);

export default router;
