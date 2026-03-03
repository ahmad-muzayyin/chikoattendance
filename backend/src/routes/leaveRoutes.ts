import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { submitLeaveRequest, getMyLeaves, getAllLeaveRequests, updateLeaveStatus } from '../controllers/leaveController';

const router = Router();

router.use(authenticateToken);

// Employee routes
router.post('/', submitLeaveRequest);
router.get('/my', getMyLeaves);

// Admin / Owner routes
router.get('/admin', requireRole(['OWNER', 'HEAD']), getAllLeaveRequests);
router.put('/admin/:id', requireRole(['OWNER', 'HEAD']), updateLeaveStatus);

export default router;
