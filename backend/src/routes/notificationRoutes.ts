import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead, deleteNotification, sendTestNotification } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.post('/test', authenticateToken, sendTestNotification);
router.put('/:id/read', authenticateToken, markAsRead);
router.put('/read-all', authenticateToken, markAllRead);
router.delete('/:id', authenticateToken, deleteNotification);

export default router;
