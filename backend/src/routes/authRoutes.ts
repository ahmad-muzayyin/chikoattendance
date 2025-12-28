// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\routes\authRoutes.ts
import { Router } from 'express';
import { login, getMe, updateProfile, updatePushToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.post('/push-token', authenticateToken, updatePushToken);

export default router;
