// d:\AHMAD MUZAYYIN\ChikoAttendance\backend\src\routes\authRoutes.ts
import { Router } from 'express';
import { login, getMe, updateProfile, updatePushToken } from '../controllers/authController';
import { linkGoogleAccount, googleLogin } from '../controllers/googleAuthController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.post('/push-token', authenticateToken, updatePushToken);

// Google Auth
router.post('/google/link', authenticateToken, linkGoogleAccount);
router.post('/google/login', googleLogin);

export default router;
