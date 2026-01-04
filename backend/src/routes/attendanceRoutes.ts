import { Router } from 'express';
import { checkIn, checkOut, getCalendar, getRecap, getPoints, getDashboardStats, submitPermit, cancelPermit, getMonthlyHistory } from '../controllers/attendanceController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/checkin', authenticateToken, checkIn);
router.post('/checkout', authenticateToken, checkOut);
router.post('/permit', authenticateToken, submitPermit);
router.delete('/permit/:date', authenticateToken, cancelPermit);
router.get('/calendar', authenticateToken, getCalendar);
router.get('/recap', authenticateToken, getRecap);
router.get('/history', authenticateToken, getMonthlyHistory);
router.get('/points', authenticateToken, getPoints);
router.get('/stats', authenticateToken, getDashboardStats);

export default router;

